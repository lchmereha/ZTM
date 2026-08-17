import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SearchIcon from '@mui/icons-material/Search';

// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { useAuth } from 'contexts/AuthContext';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { usePermissions } from 'hooks/usePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PosicaoEstoqueComboOption, PosicaoEstoqueRow, ProdutoComboOption } from 'interfaces';
import { jsPDF } from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import { posicaoEstoqueEndpoint, produtoEndpoint, relatorioEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, type DTFilter } from 'ui-component/datatable';
import AutocompleteMulti from 'ui-component/extended/AutocompleteMulti';
import axios from 'utils/axios';

// ── Component ───────────────────────────────────────────────

const PosicaoEstoquePage = () => {
  usePermissions('CON_POSICAO_ESTOQUE');

  const { activeFilial } = useAuth();
  const handleError = useErrorHandler();
  const { showSnackbar } = useSnackbar();
  const tableRef = useRef<{ reload: () => void }>(null);

  // Filters
  const today = new Date().toISOString().split('T')[0];
  const [dataBase, setDataBase] = useState(today);
  const [selectedPosicoes, setSelectedPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [posicoes, setPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [posicaoLoading, setPosicaoLoading] = useState(false);

  const [selectedProdutos, setSelectedProdutos] = useState<ProdutoComboOption[]>([]);
  const [produtos, setProdutos] = useState<ProdutoComboOption[]>([]);
  const [produtoLoading, setProdutoLoading] = useState(false);
  const [exportarTags, setExportarTags] = useState(false);

  // Track applied filters (only update when user clicks "Gerar")
  const [appliedDataBase, setAppliedDataBase] = useState(today);
  const [appliedPosicoes, setAppliedPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [appliedProdutos, setAppliedProdutos] = useState<ProdutoComboOption[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

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
    setSelectedProdutos([]);
    hasLoadedRef.current = false;
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeFilial?.idFilial]);

  // ── Filters for DataTable ───────────────────────────────

  const filters = useMemo<DTFilter[]>(() => {
    if (!hasGenerated || !activeFilial) return [];
    const result: DTFilter[] = [
      { field: 'dataBase', type: 'equals', value: appliedDataBase },
      { field: 'idFilial', type: 'equals', value: activeFilial.idFilial }
    ];
    if (appliedPosicoes.length > 0) {
      result.push({ field: 'idPosicaoEstoque', type: 'in', value: appliedPosicoes.map((p) => p.id) });
    }
    if (appliedProdutos.length > 0) {
      result.push({ field: 'idProduto', type: 'in', value: appliedProdutos.map((p) => p.id) });
    }
    return result;
  }, [hasGenerated, appliedDataBase, appliedPosicoes, appliedProdutos, activeFilial]);

  // ── Generate report ─────────────────────────────────────

  const handleGenerate = () => {
    if (!dataBase) {
      showSnackbar({ message: 'Data base é obrigatória.', severity: 'warning' });
      return;
    }
    if (!activeFilial) {
      showSnackbar({ message: 'Selecione uma filial ativa.', severity: 'warning' });
      return;
    }
    setAppliedDataBase(dataBase);
    setAppliedPosicoes([...selectedPosicoes]);
    setAppliedProdutos([...selectedProdutos]);
    setHasGenerated(true);

    // If already generated, reload the table
    setTimeout(() => tableRef.current?.reload(), 0);
  };

  // ── DataTable fetch ─────────────────────────────────────

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${relatorioEndpoint}/posicao-estoque/datatables`, payload);
    return response.data;
  }, []);

  // ── Build export filters ────────────────────────────────

  const buildExportFilters = useCallback((): DTFilter[] => {
    if (!activeFilial) return [];
    const result: DTFilter[] = [
      { field: 'dataBase', type: 'equals', value: appliedDataBase },
      { field: 'idFilial', type: 'equals', value: activeFilial.idFilial }
    ];
    if (appliedPosicoes.length > 0) {
      result.push({ field: 'idPosicaoEstoque', type: 'in', value: appliedPosicoes.map((p) => p.id) });
    }
    if (appliedProdutos.length > 0) {
      result.push({ field: 'idProduto', type: 'in', value: appliedProdutos.map((p) => p.id) });
    }
    return result;
  }, [activeFilial, appliedDataBase, appliedPosicoes, appliedProdutos]);

  // ── Export CSV ──────────────────────────────────────────

  const handleExportCSV = useCallback(async () => {
    if (!activeFilial || !appliedDataBase) return;

    try {
      const payload = {
        draw: 1,
        start: 0,
        length: -1,
        filters: buildExportFilters()
      };
      const { data } = await axios.post(`${relatorioEndpoint}/posicao-estoque/datatables`, payload);
      const rows: PosicaoEstoqueRow[] = data.data || [];

      if (rows.length === 0) {
        showSnackbar({ message: 'Nenhum dado para exportar.', severity: 'warning' });
        return;
      }

      const header = exportarTags
        ? 'Cód. Produto;Produto;Posição de Estoque;Quantidade;Tags'
        : 'Cód. Produto;Produto;Posição de Estoque;Quantidade';
      const csvRows = rows.map((r) => {
        const posicao = r.nomePosicaoEstoque || 'Não informada';
        const base = `${r.codigoProduto};${r.nomeProduto};${posicao};${r.quantidade}`;
        return exportarTags ? `${base};${r.tags?.join(', ') || ''}` : base;
      });
      const csv = [header, ...csvRows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `posicao-estoque_${appliedDataBase}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showSnackbar({ message: 'CSV exportado com sucesso!', severity: 'success' });
    } catch (err) {
      handleError(err);
    }
  }, [activeFilial, appliedDataBase, buildExportFilters, showSnackbar, handleError, exportarTags]);

  // ── Print PDF ──────────────────────────────────────────

  const handlePrintPDF = useCallback(async () => {
    if (!activeFilial || !appliedDataBase) return;

    try {
      const payload = {
        draw: 1,
        start: 0,
        length: -1,
        filters: buildExportFilters()
      };
      const { data } = await axios.post(`${relatorioEndpoint}/posicao-estoque/datatables`, payload);
      const rows: PosicaoEstoqueRow[] = data.data || [];

      if (rows.length === 0) {
        showSnackbar({ message: 'Nenhum dado para imprimir.', severity: 'warning' });
        return;
      }

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header
      const formattedDate = new Date(appliedDataBase + 'T00:00:00').toLocaleDateString('pt-BR');
      doc.setFontSize(16);
      doc.text('Relatório — Posição de Estoque', 14, 20);
      doc.setFontSize(10);
      doc.text(`Filial: ${activeFilial.nome ?? ''}`, 14, 28);
      doc.text(`Data base: ${formattedDate}`, 14, 34);

      let tableStartY = 40;
      if (appliedPosicoes.length > 0) {
        const posicaoNames = appliedPosicoes.map((p) => p.nome).join(', ');
        const lines = doc.splitTextToSize(`Posições: ${posicaoNames}`, 180);
        doc.text(lines, 14, tableStartY);
        tableStartY += lines.length * 5 + 4;
      }
      if (appliedProdutos.length > 0) {
        const produtoNames = appliedProdutos.map((p) => `${p.codigo} — ${p.nome}`).join(', ');
        const lines = doc.splitTextToSize(`Produtos: ${produtoNames}`, 180);
        doc.text(lines, 14, tableStartY);
        tableStartY += lines.length * 5 + 4;
      }

      // Table Body
      const finalBody: RowInput[] = [];
      if (exportarTags) {
        rows.forEach((r) => {
          finalBody.push([r.codigoProduto, r.nomeProduto, r.nomePosicaoEstoque || 'Não informada', String(r.quantidade)]);
          if (r.tags && r.tags.length > 0) {
            finalBody.push([
              {
                content: `Tags: ${r.tags.join(', ')}`,
                colSpan: 4,
                styles: { textColor: [100, 100, 100], fontStyle: 'italic' }
              }
            ]);
          }
        });
      } else {
        rows.forEach((r) => {
          finalBody.push([r.codigoProduto, r.nomeProduto, r.nomePosicaoEstoque || 'Não informada', String(r.quantidade)]);
        });
      }

      // Table
      autoTable(doc, {
        startY: tableStartY,
        head: [['Cód. Produto', 'Produto', 'Posição de Estoque', 'Quantidade']],
        body: finalBody,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          0: { cellWidth: 40 },
          3: { cellWidth: 30, halign: 'right' }
        }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      }

      // Open print dialog
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      handleError(err);
    }
  }, [appliedDataBase, activeFilial, buildExportFilters, showSnackbar, handleError, appliedPosicoes, appliedProdutos, exportarTags]);

  // ── Columns ────────────────────────────────────────────

  const columns = useMemo(
    () => [
      { title: 'Cód. Produto', data: 'codigoProduto', width: '150px' },
      { title: 'Produto', data: 'nomeProduto' },
      {
        title: 'Posição de Estoque',
        data: 'nomePosicaoEstoque',
        render: (val: string | null) => val || <span style={{ opacity: 0.5 }}>Não informada</span>
      },
      { title: 'Quantidade', data: 'quantidade', width: '120px' }
    ],
    []
  );

  const renderRowDetails = useCallback(
    (row: PosicaoEstoqueRow) => (
      <Box sx={{ p: 2, bgcolor: 'action.hover', borderLeft: '4px solid', borderColor: 'primary.main', borderRadius: 1, my: 1, mx: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'inherit', opacity: 0.7 }}>
          Tags ({row.tags?.length || 0})
        </Typography>
        {row.tags && row.tags.length > 0 ? (
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {row.tags.map((tag) => (
              <Box
                key={tag}
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  px: 1,
                  py: 0.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'action.selected',
                  color: 'inherit'
                }}
              >
                {tag}
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.7 }}>
            Nenhuma tag identificada.
          </Typography>
        )}
      </Box>
    ),
    []
  );

  // ── Render ─────────────────────────────────────────────

  return (
    <MainCard
      title="Posição de Estoque"
      secondary={
        hasGenerated ? (
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
        <Grid container size={{ xs: 12, md: 6 }}>
          <Grid size="auto" sx={{ order: { xs: 2, md: 1 } }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Data base"
              required
              value={dataBase}
              onChange={(e) => setDataBase(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size="grow" sx={{ order: { xs: 1, md: 2 } }}>
            <AutocompleteMulti<PosicaoEstoqueComboOption>
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
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              filterSelectedOptions
            />
          </Grid>
        </Grid>

        <Grid container size={{ xs: 12, md: 6 }}>
          <Grid size="grow">
            <AutocompleteMulti<ProdutoComboOption>
              options={produtos}
              getOptionLabel={(opt) => `${opt.codigo} — ${opt.nome}`}
              getOptionKey={(opt) => opt.id}
              value={selectedProdutos}
              onChange={(_, newValue) => setSelectedProdutos(newValue)}
              onFocus={loadProdutos}
              loading={produtoLoading}
              loadingText="Carregando..."
              noOptionsText={produtoLoading ? 'Carregando...' : 'Nenhum produto encontrado'}
              label="Produtos"
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              filterSelectedOptions
            />
          </Grid>

          <Grid size="auto">
            <Button fullWidth variant="contained" startIcon={<SearchIcon />} onClick={handleGenerate} disabled={!dataBase}>
              Gerar
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* ── Results Table ────────────────────────────────── */}
      {hasGenerated && (
        <DataTable<PosicaoEstoqueRow>
          ref={tableRef}
          columns={columns}
          filters={filters}
          onFetchData={handleFetchData}
          onError={handleError}
          actionColumnWidth={null}
          renderRowDetails={renderRowDetails}
        />
      )}
    </MainCard>
  );
};

export default PosicaoEstoquePage;
