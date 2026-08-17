import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Icons
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import SearchIcon from '@mui/icons-material/Search';

// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { useAuth } from 'contexts/AuthContext';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import type { EntradaSaidaRow, MovimentacaoComboOption, PosicaoEstoqueComboOption, ProdutoComboOption } from 'interfaces';
import { jsPDF } from 'jspdf';
import autoTable, { type RowInput } from 'jspdf-autotable';
import { movimentacaoEndpoint, posicaoEstoqueEndpoint, produtoEndpoint, relatorioEndpoint } from 'store/endpoints/rfidEndpoints';
import MainCard from 'ui-component/cards/MainCard';
import { DataTable, type DTFilter } from 'ui-component/datatable';
import AutocompleteMulti from 'ui-component/extended/AutocompleteMulti';
import axios from 'utils/axios';

// ── Helpers ─────────────────────────────────────────────────

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const getDefaultInicio = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const getToday = () => new Date().toISOString().split('T')[0];

const TIPO_OPCAO_LABELS: Record<string, string> = {
  IMPRESSAO: 'Impressão',
  ASSOCIACAO: 'Associação',
  CONFERENCIA: 'Conferência',
  LEITURA: 'Leitura'
};

const TIPOS_ENTRADA = ['IMPRESSAO', 'ASSOCIACAO'];
const TIPOS_SAIDA = ['CONFERENCIA', 'LEITURA'];

// ── Component ───────────────────────────────────────────────

const EntradaSaidaPage = () => {
  const { activeFilial } = useAuth();
  const handleError = useErrorHandler();
  const { showSnackbar } = useSnackbar();
  const tableRef = useRef<{ reload: () => void }>(null);

  // ── Filter state ────────────────────────────────────────
  const [tipo, setTipo] = useState('ENTRADA');
  const [selectedTipoMov, setSelectedTipoMov] = useState('');
  const [exportarTags, setExportarTags] = useState(false);

  // Reset selectedTipoMov when tipo changes
  const handleTipoChange = useCallback((newTipo: string) => {
    setTipo(newTipo);
    setSelectedTipoMov('');
  }, []);

  const [selectedPosicoes, setSelectedPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [posicoes, setPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [posicaoLoading, setPosicaoLoading] = useState(false);

  const [selectedProdutos, setSelectedProdutos] = useState<ProdutoComboOption[]>([]);
  const [produtos, setProdutos] = useState<ProdutoComboOption[]>([]);
  const [produtoLoading, setProdutoLoading] = useState(false);

  const [dataInicio, setDataInicio] = useState(getDefaultInicio);
  const [dataFim, setDataFim] = useState(getToday);

  const [selectedMovimentacoes, setSelectedMovimentacoes] = useState<MovimentacaoComboOption[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoComboOption[]>([]);
  const [movimentacaoLoading, setMovimentacaoLoading] = useState(false);

  const [descricao, setDescricao] = useState('');

  // ── Applied state (snapshot at generation time) ─────────
  const [hasGenerated, setHasGenerated] = useState(false);
  const [appliedTipo, setAppliedTipo] = useState('ENTRADA');
  const [appliedTipoMov, setAppliedTipoMov] = useState('');
  const [appliedPosicoes, setAppliedPosicoes] = useState<PosicaoEstoqueComboOption[]>([]);
  const [appliedProdutos, setAppliedProdutos] = useState<ProdutoComboOption[]>([]);
  const [appliedDataInicio, setAppliedDataInicio] = useState('');
  const [appliedDataFim, setAppliedDataFim] = useState('');
  const [appliedMovimentacoes, setAppliedMovimentacoes] = useState<MovimentacaoComboOption[]>([]);
  const [appliedDescricao, setAppliedDescricao] = useState('');

  // Available TipoOpcaoMovimentacao values based on current tipo
  const tipoMovOpcoes = useMemo(() => (tipo === 'ENTRADA' ? TIPOS_ENTRADA : TIPOS_SAIDA), [tipo]);

  // ── Load Produtos (on focus, cached) ────────────────────

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

  const hasLoadedProdutosRef = useRef(false);

  const loadProdutos = useCallback(async () => {
    if (hasLoadedProdutosRef.current || !activeFilial) return;
    hasLoadedProdutosRef.current = true;
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
      hasLoadedProdutosRef.current = false;
    } finally {
      setProdutoLoading(false);
    }
  }, [activeFilial, handleError]);

  // ── Load Movimentacoes (on focus, cached) ───────────────

  const hasLoadedMovimentacoesRef = useRef(false);

  const loadMovimentacoes = useCallback(async () => {
    if (hasLoadedMovimentacoesRef.current || !activeFilial) return;
    hasLoadedMovimentacoesRef.current = true;
    try {
      setMovimentacaoLoading(true);
      const { data } = await axios.get(movimentacaoEndpoint);
      setMovimentacoes(
        (data || []).map((m: { id: number; descricao: string | null; codigoIntegracao: string | null }) => ({
          id: m.id,
          descricao: m.descricao,
          codigoIntegracao: m.codigoIntegracao
        }))
      );
    } catch (err) {
      handleError(err);
      hasLoadedMovimentacoesRef.current = false;
    } finally {
      setMovimentacaoLoading(false);
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
    hasLoadedProdutosRef.current = false;
    setMovimentacoes([]);
    setSelectedMovimentacoes([]);
    hasLoadedMovimentacoesRef.current = false;
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [activeFilial?.idFilial]);

  // ── Filters for DataTable ───────────────────────────────

  const filters = useMemo<DTFilter[]>(() => {
    if (!hasGenerated || !activeFilial) return [];
    const result: DTFilter[] = [
      { field: 'tipo', type: 'equals', value: appliedTipo },
      { field: 'idFilial', type: 'equals', value: activeFilial.idFilial },
      { field: 'dataInicio', type: 'equals', value: appliedDataInicio },
      { field: 'dataFim', type: 'equals', value: appliedDataFim }
    ];
    if (appliedTipoMov) {
      result.push({ field: 'tipoMovimentacao', type: 'equals', value: appliedTipoMov });
    }
    if (appliedPosicoes.length > 0) {
      result.push({ field: 'idPosicaoEstoque', type: 'in', value: appliedPosicoes.map((p) => p.id) });
    }
    if (appliedProdutos.length > 0) {
      result.push({ field: 'idProduto', type: 'in', value: appliedProdutos.map((p) => p.id) });
    }
    if (appliedMovimentacoes.length > 0) {
      result.push({ field: 'idMovimentacao', type: 'in', value: appliedMovimentacoes.map((m) => m.id) });
    }
    if (appliedDescricao) {
      result.push({ field: 'descricao', type: 'equals', value: appliedDescricao });
    }
    return result;
  }, [
    hasGenerated,
    activeFilial?.idFilial,
    appliedTipo,
    appliedDataInicio,
    appliedDataFim,
    appliedTipoMov,
    appliedPosicoes,
    appliedProdutos,
    appliedMovimentacoes,
    appliedDescricao
  ]);

  // ── Generate report ─────────────────────────────────────

  const handleGenerate = () => {
    if (!tipo) {
      showSnackbar({ message: 'Selecione o tipo (Entrada ou Saída).', severity: 'warning' });
      return;
    }
    if (!dataInicio || !dataFim) {
      showSnackbar({ message: 'Data início e data fim são obrigatórias.', severity: 'warning' });
      return;
    }
    if (!activeFilial) {
      showSnackbar({ message: 'Selecione uma filial ativa.', severity: 'warning' });
      return;
    }

    setAppliedTipo(tipo);
    setAppliedTipoMov(selectedTipoMov);
    setAppliedPosicoes([...selectedPosicoes]);
    setAppliedProdutos([...selectedProdutos]);
    setAppliedDataInicio(dataInicio);
    setAppliedDataFim(dataFim);
    setAppliedMovimentacoes([...selectedMovimentacoes]);
    setAppliedDescricao(descricao);
    setHasGenerated(true);

    setTimeout(() => tableRef.current?.reload(), 0);
  };

  // ── DataTable fetch ─────────────────────────────────────

  const handleFetchData = useCallback(async (data: Record<string, unknown>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${relatorioEndpoint}/entrada-saida/datatables`, payload);
    return response.data;
  }, []);

  // ── Build export filters ────────────────────────────────

  const buildExportFilters = useCallback((): DTFilter[] => {
    if (!activeFilial) return [];
    const result: DTFilter[] = [
      { field: 'tipo', type: 'equals', value: appliedTipo },
      { field: 'idFilial', type: 'equals', value: activeFilial.idFilial },
      { field: 'dataInicio', type: 'equals', value: appliedDataInicio },
      { field: 'dataFim', type: 'equals', value: appliedDataFim }
    ];
    if (appliedTipoMov) {
      result.push({ field: 'tipoMovimentacao', type: 'equals', value: appliedTipoMov });
    }
    if (appliedPosicoes.length > 0) {
      result.push({ field: 'idPosicaoEstoque', type: 'in', value: appliedPosicoes.map((p) => p.id) });
    }
    if (appliedProdutos.length > 0) {
      result.push({ field: 'idProduto', type: 'in', value: appliedProdutos.map((p) => p.id) });
    }
    if (appliedMovimentacoes.length > 0) {
      result.push({ field: 'idMovimentacao', type: 'in', value: appliedMovimentacoes.map((m) => m.id) });
    }
    if (appliedDescricao) {
      result.push({ field: 'descricao', type: 'equals', value: appliedDescricao });
    }
    return result;
  }, [
    activeFilial?.idFilial,
    appliedTipo,
    appliedDataInicio,
    appliedDataFim,
    appliedTipoMov,
    appliedPosicoes,
    appliedProdutos,
    appliedMovimentacoes,
    appliedDescricao
  ]);

  // ── Export CSV ──────────────────────────────────────────

  const handleExportCSV = useCallback(async () => {
    if (!activeFilial || !appliedDataInicio || !appliedDataFim) return;

    try {
      const payload = {
        draw: 1,
        start: 0,
        length: -1,
        filters: buildExportFilters()
      };
      const { data } = await axios.post(`${relatorioEndpoint}/entrada-saida/datatables`, payload);
      const rows: EntradaSaidaRow[] = data.data || [];

      if (rows.length === 0) {
        showSnackbar({ message: 'Nenhum dado para exportar.', severity: 'warning' });
        return;
      }

      const header = exportarTags
        ? 'Data;Código;Descrição;Tipo Mov.;Cód. Produto;Produto;Qtd.;Tags'
        : 'Data;Código;Descrição;Tipo Mov.;Cód. Produto;Produto;Qtd.';
      const csvRows = rows.map((r) => {
        const base = `${formatDate(r.data)};${r.codigo};${r.descricao || ''};${r.tipoMovimentacao};${r.codigoProduto};${r.nomeProduto};${r.quantidade}`;
        return exportarTags ? `${base};${r.tags?.join(', ') || ''}` : base;
      });
      const csv = [header, ...csvRows].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `entrada-saida_${appliedDataInicio}_${appliedDataFim}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      showSnackbar({ message: 'CSV exportado com sucesso!', severity: 'success' });
    } catch (err) {
      handleError(err);
    }
  }, [activeFilial, appliedDataInicio, appliedDataFim, buildExportFilters, showSnackbar, handleError, exportarTags]);

  // ── Print PDF ──────────────────────────────────────────

  const handlePrintPDF = useCallback(async () => {
    if (!activeFilial || !appliedDataInicio || !appliedDataFim) return;

    try {
      const payload = {
        draw: 1,
        start: 0,
        length: -1,
        filters: buildExportFilters()
      };
      const { data } = await axios.post(`${relatorioEndpoint}/entrada-saida/datatables`, payload);
      const rows: EntradaSaidaRow[] = data.data || [];

      if (rows.length === 0) {
        showSnackbar({ message: 'Nenhum dado para imprimir.', severity: 'warning' });
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const fmtInicio = formatDate(appliedDataInicio + 'T00:00:00Z');
      const fmtFim = formatDate(appliedDataFim + 'T00:00:00Z');

      // Header
      doc.setFontSize(16);
      doc.text('Relatório — Entrada/Saída', 14, 20);
      doc.setFontSize(10);
      doc.text(`Tipo: ${appliedTipo === 'ENTRADA' ? 'Entrada' : 'Saída'}`, 14, 28);
      doc.text(`Período: ${fmtInicio} a ${fmtFim}`, 14, 34);
      doc.text(`Filial: ${activeFilial.nome ?? ''}`, 14, 40);

      let tableStartY = 46;
      if (appliedPosicoes.length > 0) {
        const posicaoNames = appliedPosicoes.map((p) => p.nome).join(', ');
        const lines = doc.splitTextToSize(`Posições: ${posicaoNames}`, 260);
        doc.text(lines, 14, tableStartY);
        tableStartY += lines.length * 5 + 4;
      }
      if (appliedProdutos.length > 0) {
        const produtoNames = appliedProdutos.map((p) => `${p.codigo} — ${p.nome}`).join(', ');
        const lines = doc.splitTextToSize(`Produtos: ${produtoNames}`, 260);
        doc.text(lines, 14, tableStartY);
        tableStartY += lines.length * 5 + 4;
      }

      // Table Body
      const finalBody: RowInput[] = [];
      if (exportarTags) {
        rows.forEach((r) => {
          finalBody.push([
            formatDate(r.data),
            String(r.codigo),
            r.descricao || '—',
            r.tipoMovimentacao,
            r.codigoProduto,
            r.nomeProduto,
            String(r.quantidade)
          ]);
          if (r.tags && r.tags.length > 0) {
            finalBody.push([
              {
                content: `Tags: ${r.tags.join(', ')}`,
                colSpan: 7,
                styles: { textColor: [100, 100, 100], fontStyle: 'italic' }
              }
            ]);
          }
        });
      } else {
        rows.forEach((r) => {
          finalBody.push([
            formatDate(r.data),
            String(r.codigo),
            r.descricao || '—',
            r.tipoMovimentacao,
            r.codigoProduto,
            r.nomeProduto,
            String(r.quantidade)
          ]);
        });
      }

      // Table
      autoTable(doc, {
        startY: tableStartY,
        head: [['Data', 'Código', 'Descrição', 'Tipo Mov.', 'Cód. Produto', 'Produto', 'Quantidade']],
        body: finalBody,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [66, 66, 66] },
        columnStyles: {
          1: { cellWidth: 25 },
          6: { cellWidth: 25, halign: 'right' }
        }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      }

      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } catch (err) {
      handleError(err);
    }
  }, [
    activeFilial,
    appliedTipo,
    appliedDataInicio,
    appliedDataFim,
    appliedPosicoes,
    appliedProdutos,
    buildExportFilters,
    showSnackbar,
    handleError,
    exportarTags
  ]);

  // ── Columns ────────────────────────────────────────────

  const columns = useMemo(
    () => [
      { title: 'Data', data: 'data', width: '1px', render: (d: string) => formatDate(d) },
      { title: 'Código', data: 'codigo', width: '1px' },
      { title: 'Descrição', data: 'descricao', render: (d: string | null) => d || '—' },
      { title: 'Tipo Mov.', data: 'tipoMovimentacao', width: '200px' },
      { title: 'Cód. Produto', data: 'codigoProduto', width: '1px' },
      { title: 'Produto', data: 'nomeProduto' },
      { title: 'Qtd.', data: 'quantidade', width: '1px' }
    ],
    []
  );

  const renderRowDetails = useCallback(
    (row: EntradaSaidaRow) => (
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
      title="Entrada e Saída"
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
      {/* ── Filters Row 1 ─────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2, alignItems: 'flex-end' }}>
        <Grid size={4}>
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

        <Grid size={4}>
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

        <Grid size={4}>
          <FormControl fullWidth size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="tipo-label">Tipo *</InputLabel>
            <Select labelId="tipo-label" value={tipo} label="Tipo *" onChange={(e) => handleTipoChange(e.target.value)}>
              <MenuItem value="ENTRADA">Entrada</MenuItem>
              <MenuItem value="SAIDA">Saída</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={8}>
          <TextField fullWidth size="small" label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Grid>

        <Grid size={4}>
          <FormControl fullWidth size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="tipo-mov-label" shrink>
              Tipo de Movimentação
            </InputLabel>
            <Select
              labelId="tipo-mov-label"
              value={selectedTipoMov}
              label="Tipo de Movimentação"
              displayEmpty
              onChange={(e) => setSelectedTipoMov(e.target.value)}
              renderValue={(val) => (val ? TIPO_OPCAO_LABELS[val] : 'Todos')}
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {tipoMovOpcoes.map((t) => (
                <MenuItem key={t} value={t}>
                  {TIPO_OPCAO_LABELS[t]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid container size={12}>
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

          <Grid size="grow">
            <AutocompleteMulti<ProdutoComboOption>
              selectAll={false}
              options={produtos}
              getOptionLabel={(opt) => `${opt.codigo} — ${opt.nome}`}
              getOptionKey={(opt) => opt.id}
              value={selectedProdutos}
              onChange={(_, newValue) => setSelectedProdutos(newValue)}
              onFocus={loadProdutos}
              loading={produtoLoading}
              loadingText="Carregando..."
              noOptionsText={produtoLoading ? 'Carregando...' : 'Nenhum produto encontrado'}
              label="Produto"
              textFieldProps={{ placeholder: 'Buscar por código ou nome...' }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              filterSelectedOptions
            />
          </Grid>

          <Grid size="grow">
            <AutocompleteMulti<MovimentacaoComboOption>
              selectAll={false}
              options={movimentacoes}
              getOptionLabel={(opt) => `#${opt.id} — ${opt.descricao || opt.codigoIntegracao || 'Sem descrição'}`}
              getOptionKey={(opt) => opt.id}
              value={selectedMovimentacoes}
              onChange={(_, newValue) => setSelectedMovimentacoes(newValue)}
              onFocus={loadMovimentacoes}
              loading={movimentacaoLoading}
              loadingText="Carregando..."
              noOptionsText={movimentacaoLoading ? 'Carregando...' : 'Nenhuma movimentação encontrada'}
              label="Movimentação"
              textFieldProps={{ placeholder: 'Buscar movimentação...' }}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              filterSelectedOptions
            />
          </Grid>

          <Grid size="auto">
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleGenerate}
              disabled={!tipo || !dataInicio || !dataFim}
            >
              Gerar
            </Button>
          </Grid>
        </Grid>
      </Grid>

      {/* ── Results Table ────────────────────────────────── */}
      {hasGenerated && (
        <DataTable<EntradaSaidaRow>
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

export default EntradaSaidaPage;
