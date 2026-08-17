import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SearchIcon from '@mui/icons-material/Search';

// MUI
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { useAuth } from 'contexts/AuthContext';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ExtratoMovimentacaoResponse, ExtratoMovimentacaoRow, PosicaoEstoqueComboOption, ProdutoComboOption } from 'interfaces';
import { jsPDF } from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import { posicaoEstoqueEndpoint, produtoEndpoint, relatorioEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import AutocompleteMulti from 'ui-component/extended/AutocompleteMulti';
import axios from 'utils/axios';

// ── Helpers ─────────────────────────────────────────────────

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const getDefaultInicio = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const getToday = () => new Date().toISOString().split('T')[0];

// ── Component ───────────────────────────────────────────────

const ExtratoMovimentacaoPage = () => {
  const { activeFilial } = useAuth();
  const handleError = useErrorHandler();
  const { showSnackbar } = useSnackbar();

  // Filters
  const [dataInicio, setDataInicio] = useState(getDefaultInicio);
  const [dataFim, setDataFim] = useState(getToday);
  const [selectedProduto, setSelectedProduto] = useState<ProdutoComboOption | null>(null);
  const [produtos, setProdutos] = useState<ProdutoComboOption[]>([]);
  const [produtoLoading, setProdutoLoading] = useState(false);

  const [selectedPosicoes, setSelectedPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [posicoes, setPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [posicaoLoading, setPosicaoLoading] = useState(false);

  // Report data
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [rows, setRows] = useState<ExtratoMovimentacaoRow[]>([]);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [saldoFinal, setSaldoFinal] = useState(0);
  const [exportarTags, setExportarTags] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Applied filter values (snapshot at report generation time)
  const [appliedInicio, setAppliedInicio] = useState('');
  const [appliedFim, setAppliedFim] = useState('');
  const [appliedProduto, setAppliedProduto] = useState<ProdutoComboOption | null>(null);
  const [appliedPosicoes, setAppliedPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);

  // ── Produto combo (client-side filtering) ───────────────

  const hasLoadedRef = useRef(false);
  const hasLoadedPosicoesRef = useRef(false);

  const loadPosicoes = useCallback(async () => {
    if (hasLoadedPosicoesRef.current || !activeFilial) return;
    hasLoadedPosicoesRef.current = true;
    try {
      setPosicaoLoading(true);
      const { data } = await axios.get(`${posicaoEstoqueEndpoint}?idFilial=${activeFilial.idFilial}`);
      setPosicoes(
        (data || []).map((p: { id: number; nome: string }) => ({
          id: p.id,
          nome: p.nome
        }))
      );
    } catch (err) {
      handleError(err);
      hasLoadedPosicoesRef.current = false;
    } finally {
      setPosicaoLoading(false);
    }
  }, [activeFilial, handleError]);

  const loadProdutos = useCallback(async () => {
    if (hasLoadedRef.current || !activeFilial) return;
    hasLoadedRef.current = true;
    try {
      setProdutoLoading(true);
      const { data } = await axios.get(`${produtoEndpoint}/combo?idEmpresa=${activeFilial.idEmpresa}`);
      setProdutos(
        (data || []).map((p: { id: number; codigo: string; nome: string }) => ({
          id: p.id,
          codigo: p.codigo,
          nome: p.nome
        }))
      );
    } catch (err) {
      handleError(err);
      hasLoadedRef.current = false;
    } finally {
      setProdutoLoading(false);
    }
  }, [activeFilial, handleError]);

  // Reset when filial changes
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Legitimate: resetting cached data on context change */
    setPosicoes([]);
    setSelectedPosicoes([]);
    hasLoadedPosicoesRef.current = false;
    setProdutos([]);
    setSelectedProduto(null);
    hasLoadedRef.current = false;
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeFilial?.idFilial]);

  // ── Fetch report ───────────────────────────────────────

  const fetchReport = useCallback(
    async (inicio: string, fim: string, produto: ProdutoComboOption, posicoesFilter: PosicaoEstoqueComboOption[]) => {
      if (!activeFilial) return;

      setLoading(true);
      try {
        const payload: { draw: number; start: number; length: number; filters: Record<string, unknown>[] } = {
          draw: 1,
          start: 0,
          length: -1,
          filters: [
            { field: 'dataInicio', type: 'equals', value: inicio },
            { field: 'dataFim', type: 'equals', value: fim },
            { field: 'idProduto', type: 'equals', value: produto.id },
            { field: 'idFilial', type: 'equals', value: activeFilial.idFilial }
          ]
        };
        if (posicoesFilter.length > 0) {
          payload.filters.push({ field: 'idPosicaoEstoque', type: 'in', value: posicoesFilter.map((p) => p.id) });
        }
        const { data } = await axios.post<ExtratoMovimentacaoResponse>(`${relatorioEndpoint}/extrato-movimentacao/datatables`, payload);
        setRows(data.data || []);
        setSaldoInicial(data.saldoInicial);
        setSaldoFinal(data.saldoFinal);
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [activeFilial, handleError]
  );

  // ── Generate report ────────────────────────────────────

  const handleGenerate = () => {
    if (!dataInicio || !dataFim) {
      showSnackbar({ message: 'Data início e data fim são obrigatórias.', severity: 'warning' });
      return;
    }
    if (!selectedProduto) {
      showSnackbar({ message: 'Selecione um produto.', severity: 'warning' });
      return;
    }
    if (!activeFilial) {
      showSnackbar({ message: 'Selecione uma filial ativa.', severity: 'warning' });
      return;
    }

    setAppliedInicio(dataInicio);
    setAppliedFim(dataFim);
    setAppliedProduto(selectedProduto);
    setAppliedPosicoes([...selectedPosicoes]);
    setHasGenerated(true);
    fetchReport(dataInicio, dataFim, selectedProduto, selectedPosicoes);
  };

  // ── Export CSV ─────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    if (rows.length === 0) {
      showSnackbar({ message: 'Nenhum dado para exportar.', severity: 'warning' });
      return;
    }

    const header = exportarTags
      ? 'Data Movimentação;Tipo de Movimentação;Qtd. Entrada;Qtd. Saída;Saldo;Tags Entrada;Tags Saída'
      : 'Data Movimentação;Tipo de Movimentação;Qtd. Entrada;Qtd. Saída;Saldo';
    const saldoInicialLine = exportarTags ? `;;;Saldo Inicial;${saldoInicial};;` : `;;;Saldo Inicial;${saldoInicial}`;
    const csvRows = rows.map((r) => {
      const base = `${formatDate(r.dataMovimentacao)};${r.tipoMovimentacao};${r.quantidadeEntrada};${r.quantidadeSaida};${r.saldo}`;
      return exportarTags ? `${base};${r.tagsEntrada?.join(', ') || ''};${r.tagsSaida?.join(', ') || ''}` : base;
    });
    const saldoFinalLine = exportarTags ? `;;;Saldo Final;${saldoFinal};;` : `;;;Saldo Final;${saldoFinal}`;
    const csv = [header, saldoInicialLine, ...csvRows, saldoFinalLine].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extrato-movimentacao_${appliedInicio}_${appliedFim}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showSnackbar({ message: 'CSV exportado com sucesso!', severity: 'success' });
  }, [rows, saldoInicial, saldoFinal, appliedInicio, appliedFim, showSnackbar, exportarTags]);

  // ── Print PDF ──────────────────────────────────────────

  const handlePrintPDF = useCallback(() => {
    if (rows.length === 0) {
      showSnackbar({ message: 'Nenhum dado para imprimir.', severity: 'warning' });
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const fmtInicio = formatDate(appliedInicio + 'T00:00:00Z');
    const fmtFim = formatDate(appliedFim + 'T00:00:00Z');

    // Header
    doc.setFontSize(16);
    doc.text('Relatório — Extrato de Movimentação', 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${fmtInicio} a ${fmtFim}`, 14, 28);
    if (appliedProduto) {
      doc.text(`Produto: ${appliedProduto.codigo} — ${appliedProduto.nome}`, 14, 34);
    }
    if (appliedPosicoes.length > 0) {
      const posicaoNames = appliedPosicoes.map((p) => p.nome).join(', ');
      doc.text(`Posições: ${posicaoNames}`, 14, 40);
      doc.text(`Saldo Inicial: ${saldoInicial}`, 14, 46);
    } else {
      doc.text(`Saldo Inicial: ${saldoInicial}`, 14, 40);
    }

    // Table Body
    const finalBody: RowInput[] = [];
    if (exportarTags) {
      rows.forEach((r) => {
        finalBody.push([formatDate(r.dataMovimentacao), r.tipoMovimentacao, r.quantidadeEntrada, r.quantidadeSaida, r.saldo]);
        if ((r.tagsEntrada && r.tagsEntrada.length > 0) || (r.tagsSaida && r.tagsSaida.length > 0)) {
          let tagsStr = '';
          if (r.tagsEntrada && r.tagsEntrada.length > 0) tagsStr += `Entrada: ${r.tagsEntrada.join(', ')} `;
          if (r.tagsSaida && r.tagsSaida.length > 0) tagsStr += `Saída: ${r.tagsSaida.join(', ')}`;
          finalBody.push([{ content: `Tags: ${tagsStr.trim()}`, colSpan: 5, styles: { textColor: [100, 100, 100], fontStyle: 'italic' } }]);
        }
      });
    } else {
      rows.forEach((r) => {
        finalBody.push([formatDate(r.dataMovimentacao), r.tipoMovimentacao, r.quantidadeEntrada, r.quantidadeSaida, r.saldo]);
      });
    }

    // Table
    autoTable(doc, {
      startY: appliedPosicoes.length > 0 ? 52 : 46,
      head: [['Data Mov.', 'Tipo de Movimentação', 'Entrada', 'Saída', 'Saldo']],
      body: finalBody,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        2: { halign: 'right', cellWidth: 22 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 22 }
      }
    });

    // Saldo Final after table
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Final: ${saldoFinal}`, 14, finalY + 10);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    }

    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }, [rows, saldoInicial, saldoFinal, appliedInicio, appliedFim, appliedProduto, appliedPosicoes, showSnackbar, exportarTags]);

  // ── Table styles ───────────────────────────────────────

  const tableStyles = useMemo(
    () => ({
      table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '0.875rem'
      },
      th: {
        p: 1.5,
        borderBottom: 2,
        borderColor: 'divider',
        textAlign: 'left' as const,
        fontWeight: 600,
        whiteSpace: 'nowrap' as const
      },
      td: {
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider'
      },
      numTd: {
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        textAlign: 'right' as const,
        fontVariantNumeric: 'tabular-nums'
      },
      saldoIndicator: {
        p: 1.5,
        textAlign: 'right' as const,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        fontSize: '0.875rem'
      }
    }),
    []
  );

  // ── Render ─────────────────────────────────────────────

  const canGenerate = Boolean(dataInicio && dataFim && selectedProduto);

  return (
    <Box sx={{ height: 'calc(100vh - 112px)', minHeight: 500, display: 'flex', flexDirection: 'column' }}>
      <MainCard
        title="Extrato de Movimentação"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        contentSX={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        secondary={
          hasGenerated && rows.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={exportarTags} onChange={(e) => setExportarTags(e.target.checked)} />}
                label="Incluir Tags"
                sx={{ mr: 1 }}
              />
              <Tooltip title="Exportar CSV">
                <Button variant="outlined" size="small" startIcon={<FileDownloadOutlinedIcon />} onClick={handleExportCSV}>
                  CSV
                </Button>
              </Tooltip>
              <Tooltip title="Imprimir relatório">
                <Button variant="outlined" size="small" startIcon={<PrintOutlinedIcon />} onClick={handlePrintPDF}>
                  Imprimir
                </Button>
              </Tooltip>
            </Stack>
          ) : undefined
        }
      >
        {/* ── Filters ──────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'flex-end' }}>
          <Grid size="auto">
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data início"
              required
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size="auto">
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data fim"
              required
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size="grow">
            <Autocomplete<ProdutoComboOption, false, false, false>
              size="small"
              options={produtos}
              getOptionLabel={(opt) => `${opt.codigo} — ${opt.nome}`}
              getOptionKey={(opt) => opt.id}
              value={selectedProduto}
              onChange={(_, newValue) => setSelectedProduto(newValue)}
              onFocus={loadProdutos}
              loading={produtoLoading}
              loadingText="Carregando..."
              noOptionsText={produtoLoading ? 'Carregando...' : 'Nenhum produto encontrado'}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              renderInput={(params) => <TextField {...params} label="Produto *" placeholder="Buscar por código ou nome..." />}
            />
          </Grid>

          <Grid size="grow">
            <AutocompleteMulti<PosicaoEstoqueComboOption>
              selectAll={false}
              options={posicoes}
              getOptionLabel={(opt) => opt.nome}
              getOptionKey={(opt) => opt.id}
              value={selectedPosicoes}
              onChange={(_, newValue) => setSelectedPosicoes(newValue)}
              onFocus={loadPosicoes}
              loading={posicaoLoading}
              loadingText="Carregando..."
              noOptionsText={posicaoLoading ? 'Carregando...' : 'Nenhuma posição encontrada'}
              label="Posição de Estoque"
              textFieldProps={{ placeholder: 'Buscar posição...' }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              filterSelectedOptions
            />
          </Grid>

          <Grid size="auto">
            <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={handleGenerate} disabled={!canGenerate || loading}>
              Gerar
            </Button>
          </Grid>
        </Grid>

        {/* ── Results ──────────────────────────────────────── */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {hasGenerated && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {rows.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography color="text.secondary">Nenhuma movimentação encontrada no período.</Typography>
              </Box>
            ) : (
              <>
                {/* ── Saldo Inicial (acima da tabela) ────── */}
                <Box
                  sx={{
                    display: 'flex',
                    borderBottom: 2,
                    borderColor: 'divider',
                    bgcolor: 'action.hover'
                  }}
                >
                  <Box sx={{ flex: 1 }} />
                  <Box sx={tableStyles.saldoIndicator}>Saldo Inicial: {saldoInicial}</Box>
                </Box>

                {/* ── Tabela com scroll interno ─────────── */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0
                  }}
                >
                  <Box component="table" sx={tableStyles.table}>
                    <Box component="thead" sx={{ position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Box component="tr">
                        <Box component="th" sx={{ ...tableStyles.th, width: '40px', p: 0 }} />
                        <Box component="th" sx={tableStyles.th}>
                          Data da Movimentação
                        </Box>
                        <Box component="th" sx={tableStyles.th}>
                          Tipo de Movimentação
                        </Box>
                        <Box component="th" sx={{ ...tableStyles.th, textAlign: 'right' }}>
                          Qtd. Entrada
                        </Box>
                        <Box component="th" sx={{ ...tableStyles.th, textAlign: 'right' }}>
                          Qtd. Saída
                        </Box>
                        <Box component="th" sx={{ ...tableStyles.th, textAlign: 'right' }}>
                          Saldo
                        </Box>
                      </Box>
                    </Box>
                    <Box component="tbody">
                      {rows.map((row) => {
                        const rowKey = `${row.dataMovimentacao}-${row.tipoMovimentacao}-${row.quantidadeEntrada}-${row.quantidadeSaida}-${row.saldo}`;
                        const isExpanded = !!expandedRows[rowKey];
                        return (
                          <Fragment key={rowKey}>
                            <Box component="tr" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <Box component="td" sx={{ ...tableStyles.td, p: 0, textAlign: 'center' }}>
                                <IconButton
                                  size="small"
                                  color="inherit"
                                  onClick={() => setExpandedRows((prev) => ({ ...prev, [rowKey]: !isExpanded }))}
                                >
                                  {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                              </Box>
                              <Box component="td" sx={tableStyles.td}>
                                {formatDate(row.dataMovimentacao)}
                              </Box>
                              <Box component="td" sx={tableStyles.td}>
                                {row.tipoMovimentacao}
                              </Box>
                              <Box component="td" sx={tableStyles.numTd}>
                                {row.quantidadeEntrada > 0 ? row.quantidadeEntrada : '—'}
                              </Box>
                              <Box component="td" sx={tableStyles.numTd}>
                                {row.quantidadeSaida > 0 ? row.quantidadeSaida : '—'}
                              </Box>
                              <Box component="td" sx={{ ...tableStyles.numTd, fontWeight: 600 }}>
                                {row.saldo}
                              </Box>
                            </Box>
                            <Box component="tr">
                              <Box component="td" sx={{ p: 0, borderBottom: isExpanded ? 1 : 0, borderColor: 'divider' }} colSpan={6}>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                  <Box
                                    sx={{
                                      p: 2,
                                      bgcolor: 'action.hover',
                                      borderLeft: '4px solid',
                                      borderColor: 'primary.main',
                                      borderRadius: 1,
                                      my: 1,
                                      mx: 2
                                    }}
                                  >
                                    <Grid container spacing={2}>
                                      <Grid size={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                                          Tags Entrada ({row.tagsEntrada?.length || 0})
                                        </Typography>
                                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                                          {row.tagsEntrada?.map((t) => (
                                            <Box
                                              key={t}
                                              sx={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                px: 1,
                                                py: 0.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderLeft: '3px solid',
                                                borderLeftColor: 'success.main',
                                                borderRadius: 1,
                                                bgcolor: 'action.selected',
                                                color: 'inherit'
                                              }}
                                            >
                                              {t}
                                            </Box>
                                          ))}
                                        </Stack>
                                      </Grid>
                                      <Grid size={6}>
                                        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                                          Tags Saída ({row.tagsSaida?.length || 0})
                                        </Typography>
                                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                                          {row.tagsSaida?.map((t) => (
                                            <Box
                                              key={t}
                                              sx={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.75rem',
                                                px: 1,
                                                py: 0.5,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderLeft: '3px solid',
                                                borderLeftColor: 'error.main',
                                                borderRadius: 1,
                                                bgcolor: 'action.selected',
                                                color: 'inherit'
                                              }}
                                            >
                                              {t}
                                            </Box>
                                          ))}
                                        </Stack>
                                      </Grid>
                                    </Grid>
                                  </Box>
                                </Collapse>
                              </Box>
                            </Box>
                          </Fragment>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>

                {/* ── Saldo Final (abaixo da tabela) ────── */}
                <Box
                  sx={{
                    display: 'flex',
                    borderTop: 2,
                    borderColor: 'divider',
                    bgcolor: 'action.hover'
                  }}
                >
                  <Box sx={{ flex: 1 }} />
                  <Box sx={tableStyles.saldoIndicator}>Saldo Final: {saldoFinal}</Box>
                </Box>
              </>
            )}
          </Box>
        )}
      </MainCard>
    </Box>
  );
};

export default ExtratoMovimentacaoPage;
