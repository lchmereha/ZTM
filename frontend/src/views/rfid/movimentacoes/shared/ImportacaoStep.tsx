import ExcelJS from 'exceljs';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

// Icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// MUI X
import {
  DataGrid,
  useGridApiRef,
  type GridCellParams,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowsProp
} from '@mui/x-data-grid';

// Project
import { useAuth } from 'contexts/AuthContext';
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import { movimentacaoEndpoint, tagRfidEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// Local
import { formatDateValue, normalizeColumnName, parseCSVLine, resolveColumnMapping } from './helpers';
import type { ImportItem, MovimentacaoStepHandler } from './types';

// ── Props ───────────────────────────────────────────────────

interface ImportacaoStepProps {
  movimentacaoId: number;
  /** Controls validation behavior:
   * - 'impressao' (default): products must NOT exist (new product creation)
   * - 'associacao': products MUST exist (tag association to existing products)
   * - 'conferencia': products MUST exist (tag verification against existing products)
   */
  mode?: 'impressao' | 'associacao' | 'conferencia' | 'transferencia';
  onComplete?: () => void;
  onStateChange?: () => void;
  onSituacaoChange?: (situacao: string) => void;
}

// ── Component ───────────────────────────────────────────────

const ImportacaoStep = forwardRef<MovimentacaoStepHandler, ImportacaoStepProps>(
  ({ movimentacaoId, mode = 'impressao', onComplete, onStateChange, onSituacaoChange }, ref) => {
    const { user, activeFilial } = useAuth();
    const { showDialog, closeDialog } = useDialog();
    const { showSnackbar } = useSnackbar();
    const handleError = useErrorHandler();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [rows, setRows] = useState<GridRowsProp<ImportItem>>([]);
    const rowsRef = useRef<GridRowsProp<ImportItem>>(rows);
    rowsRef.current = rows;
    const [fileName, setFileName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [equipamentoIsSled, setEquipamentoIsSled] = useState(false);
    const apiRef = useGridApiRef();

    // Fetch movimentacao to check equipment type
    useEffect(() => {
      if (!movimentacaoId) return;
      axios
        .get(`${movimentacaoEndpoint}/${movimentacaoId}`)
        .then(({ data }) => {
          const record = Array.isArray(data) ? data[0] : data;
          if (record?.equipamento?.tipo === 'SLED') {
            setEquipamentoIsSled(true);
          }
        })
        .catch(() => {
          /* ignore */
        });
    }, [movimentacaoId]);

    // ── Editable columns (for Tab/Enter navigation) ───────────

    // In associacao mode, only codigo and quantidade are editable
    const isAssociacao = mode === 'associacao';
    const isConferencia = mode === 'conferencia';
    const isTransferencia = mode === 'transferencia';
    const requiresExistingProduct = isAssociacao || isConferencia || isTransferencia;

    const editableFields = isAssociacao
      ? ['codigo', 'quantidade', 'qtdeUMVolume']
      : isConferencia
        ? ['codigo', 'quantidade', 'qtdeUMVolume', 'codigoUnico']
        : isTransferencia
          ? ['codigo', 'quantidade', 'qtdeUMVolume', 'codigoUnico', 'posicaoEstoque']
          : [
              'codigo',
              'nome',
              'unidadeMedida',
              'categoria',
              'quantidade',
              'qtdeUMVolume',
              'codigoUnico',
              'lote',
              'dataValidade',
              'dataFabricacao'
            ];

    // ── DataGrid Columns ──────────────────────────────────────

    const readonlyField = isAssociacao || isConferencia;

    const columns: GridColDef<ImportItem>[] = [
      { field: 'codigo', headerName: 'Código', flex: 1, minWidth: 100, editable: true, cellClassName: 'uppercase-cell' },
      { field: 'nome', headerName: 'Nome', flex: 2, minWidth: 160, editable: !readonlyField, cellClassName: 'uppercase-cell' },
      { field: 'unidadeMedida', headerName: 'U.M.', width: 100, editable: !readonlyField },
      { field: 'categoria', headerName: 'Categoria', flex: 1.5, minWidth: 120, editable: !readonlyField, cellClassName: 'uppercase-cell' },
      { field: 'quantidade', headerName: 'Qtde.', width: 70, type: 'number', editable: true },
      { field: 'qtdeUMVolume', headerName: 'Qtde. UM/Vol.', width: 120, type: 'number', editable: true },
      ...(isConferencia || isTransferencia
        ? [
            {
              field: 'totalTagsAtivas',
              headerName: 'Ativas',
              width: 70,
              type: 'number' as const,
              editable: false
            }
          ]
        : []),
      ...(isTransferencia
        ? [
            {
              field: 'posicaoEstoque',
              headerName: 'Posição de Estoque',
              width: 120,
              editable: true,
              cellClassName: 'uppercase-cell'
            }
          ]
        : []),
      { field: 'codigoUnico', headerName: 'Cód. Único', width: 120, editable: !isAssociacao, cellClassName: 'uppercase-cell' },
      { field: 'lote', headerName: 'Lote', width: 120, editable: !readonlyField, cellClassName: 'uppercase-cell' },
      { field: 'dataValidade', headerName: 'Validade', width: 130, editable: !readonlyField },
      { field: 'dataFabricacao', headerName: 'Fabricação', width: 130, editable: !readonlyField },
      {
        field: 'actions',
        headerName: '',
        width: 1,
        resizable: false,
        sortable: true,
        filterable: false,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MUI DataGrid sortComparator has untyped params
        sortComparator: (_v1: any, _v2: any, p1: any, p2: any) => {
          const row1 = apiRef.current!.getRow(p1.id) as ImportItem | null;
          const row2 = apiRef.current!.getRow(p2.id) as ImportItem | null;
          const e1 = row1?.hasError ? 1 : 0;
          const e2 = row2?.hasError ? 1 : 0;
          return e1 - e2;
        },
        renderCell: (params: GridRenderCellParams<ImportItem>) => (
          <IconButton size="small" color="error" onClick={() => setRows((prev) => prev.filter((r) => r.id !== params.row.id))}>
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        )
      }
    ];

    // ── File Import + Auto-validate ───────────────────────────

    const handleFileSelect = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
          const buffer = await file.arrayBuffer();

          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parsed spreadsheet rows have dynamic shape
          const jsonData: Record<string, any>[] = [];
          const ext = file.name.split('.').pop()?.toLowerCase();

          if (ext === 'csv') {
            const text = new TextDecoder().decode(buffer);
            const lines = text.split(/\r?\n/).filter((l) => l.trim());
            if (lines.length < 2) {
              showSnackbar({ message: 'A planilha está vazia.', severity: 'warning' });
              return;
            }
            const headers = parseCSVLine(lines[0]);
            for (let i = 1; i < lines.length; i++) {
              const values = parseCSVLine(lines[i]);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parsed spreadsheet rows have dynamic shape
              const row: Record<string, any> = {};
              headers.forEach((h, idx) => {
                row[h] = values[idx] || '';
              });
              jsonData.push(row);
            }
          } else {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet || worksheet.rowCount < 2) {
              showSnackbar({ message: 'A planilha está vazia.', severity: 'warning' });
              return;
            }

            const headers: string[] = [];
            worksheet.getRow(1).eachCell((cell, colNumber) => {
              headers[colNumber - 1] = String(cell.value || '');
            });

            worksheet.eachRow((row, rowNumber) => {
              if (rowNumber === 1) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parsed spreadsheet rows have dynamic shape
              const rowData: Record<string, any> = {};
              row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                  rowData[header] = cell.value instanceof Date ? cell.value.toISOString().split('T')[0] : cell.value;
                }
              });
              jsonData.push(rowData);
            });
          }

          if (jsonData.length === 0) {
            showSnackbar({ message: 'A planilha está vazia.', severity: 'warning' });
            return;
          }

          // Map columns
          const rawHeaders = Object.keys(jsonData[0]);
          const headerMap: Record<string, string> = {};
          for (const rawHeader of rawHeaders) {
            const normalized = normalizeColumnName(rawHeader);
            const mapped = resolveColumnMapping(normalized);
            if (mapped) {
              headerMap[rawHeader] = mapped;
            }
          }

          // Validate required columns — apenas 'codigo' é obrigatório
          const mappedFields = new Set(Object.values(headerMap));
          if (!mappedFields.has('codigo')) {
            showSnackbar({
              title: 'Coluna obrigatória ausente',
              message: 'A planilha deve ter uma coluna "Código".',
              severity: 'error'
            });
            return;
          }

          // Parse rows
          const parsed: ImportItem[] = jsonData.map((row, idx) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Parsed spreadsheet rows have dynamic shape
            const mapped: Record<string, any> = {};
            for (const [rawKey, mappedKey] of Object.entries(headerMap)) {
              mapped[mappedKey] = row[rawKey];
            }

            const quantidade = Math.max(1, parseInt(String(mapped.quantidade || '1'), 10) || 1);

            const rawQtdeUM = mapped.qtdeUMVolume;
            const qtdeUMVolume = rawQtdeUM != null && String(rawQtdeUM).trim() !== '' ? parseFloat(String(rawQtdeUM)) || null : null;

            return {
              id: idx + 1,
              codigo: String(mapped.codigo || '').trim(),
              nome: String(mapped.nome || '').trim(),
              unidadeMedida: String(mapped.unidadeMedida || '').trim(),
              categoria: String(mapped.categoria || '').trim(),
              quantidade,
              qtdeUMVolume,
              codigoUnico: String(mapped.codigoUnico || '').trim(),
              dataValidade: mapped.dataValidade ? formatDateValue(mapped.dataValidade) : '',
              lote: String(mapped.lote || '').trim(),
              dataFabricacao: mapped.dataFabricacao ? formatDateValue(mapped.dataFabricacao) : '',
              posicaoEstoque: mapped.posicaoEstoque ? String(mapped.posicaoEstoque).trim() : null,
              exists: false
            };
          });

          setFileName(file.name);

          // Auto-validar produtos contra o banco
          if (activeFilial && user) {
            try {
              const { data } = await axios.post(`${movimentacaoEndpoint}/impressao/validate`, {
                idFilial: activeFilial.idFilial,
                idUsuario: user.id,
                codigos: parsed.map((p) => p.codigo)
              });

              const validated = parsed.map((item) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response array has untyped elements
                const result = data.results.find((r: any) => r.codigo === item.codigo);
                const exists = result?.exists ?? false;
                const updated = { ...item, exists };
                // In associacao/conferencia mode, auto-fill product details from database
                if (requiresExistingProduct && result?.exists && result.existing) {
                  updated.nome = result.existing.nome || item.nome;
                  updated.unidadeMedida = result.existing.unidadeMedida || item.unidadeMedida;
                  updated.categoria = result.existing.categoria || item.categoria;
                }
                // Set error state based on mode
                if (requiresExistingProduct && !exists) {
                  updated.hasError = true;
                  updated.errorMessage = 'Produto não encontrado no sistema';
                } else if (!requiresExistingProduct && exists) {
                  updated.hasError = true;
                  updated.errorMessage = 'Produto já cadastrado no sistema';
                } else {
                  updated.hasError = false;
                  updated.errorMessage = undefined;
                }
                return updated;
              });

              // In conferencia or transferencia mode, fetch active tag counts
              if (isConferencia || isTransferencia) {
                const existingCodigos = validated.filter((v) => v.exists).map((v) => v.codigo);
                if (existingCodigos.length > 0) {
                  try {
                    const { data: ativasData } = await axios.post(`${tagRfidEndpoint}/produto/ativas-batch`, {
                      codigos: existingCodigos,
                      idFilial: activeFilial?.idFilial
                    });
                    for (const item of validated) {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response has dynamic shape
                      const match = ativasData.find((a: any) => a.codigo === item.codigo);
                      item.totalTagsAtivas = match?.totalAtivas ?? 0;
                      if (item.exists) {
                        if (item.quantidade > (item.totalTagsAtivas ?? 0)) {
                          // Superior: block
                          item.hasError = true;
                          item.errorMessage = `Quantidade (${item.quantidade}) excede tags ativas (${item.totalTagsAtivas})`;
                        } else if (item.quantidade < (item.totalTagsAtivas ?? 0)) {
                          // Inferior: warn
                          item.hasWarning = true;
                          item.warningMessage = `Movimentando ${item.quantidade} de ${item.totalTagsAtivas} tags ativas`;
                        }
                      }
                    }
                  } catch {
                    // Silently ignore — tags count is informational
                  }
                }
              }

              setRows(validated);
            } catch {
              setRows(parsed);
            }
          } else {
            setRows(parsed);
          }

          showSnackbar({
            title: 'Planilha importada',
            message: `${parsed.length} ${parsed.length === 1 ? 'item carregado' : 'itens carregados'} com sucesso.`,
            severity: 'success'
          });
        } catch (err) {
          handleError(err);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      [activeFilial, user, isConferencia, isTransferencia, requiresExistingProduct, showSnackbar, handleError]
    );

    // ── Submit (Salvar ou Processar) ──────────────────────────

    const executeSubmit = useCallback(
      async (action: 'save' | 'process', currentRows: GridRowsProp<ImportItem>) => {
        setIsSubmitting(true);
        try {
          const payload = {
            idMovimentacao: movimentacaoId,
            items: currentRows.map((r) => ({
              codigo: r.codigo,
              nome: r.nome || undefined,
              unidadeMedida: r.unidadeMedida || undefined,
              quantidade: r.quantidade,
              categoria: r.categoria || undefined,
              qtdeUMVolume: r.qtdeUMVolume ?? undefined,
              codigoUnico: r.codigoUnico || undefined,
              posicaoEstoque: r.posicaoEstoque || undefined,
              dataValidade: r.dataValidade || undefined,
              lote: r.lote || undefined,
              dataFabricacao: r.dataFabricacao || undefined
            }))
          };

          await axios.post(`${movimentacaoEndpoint}/importacao`, payload);

          if (action === 'process') {
            showSnackbar({
              title: 'Importação salva!',
              message: 'Avançando para o processamento de tags...',
              severity: 'success'
            });
            setRows([]);
            setFileName('');
            if (onSituacaoChange) onSituacaoChange('IMPORTADO');
          } else {
            showSnackbar({
              title: 'Importação salva!',
              message: `${currentRows.length} ${currentRows.length === 1 ? 'item salvo' : 'itens salvos'} com sucesso.`,
              severity: 'success'
            });
            setRows([]);
            setFileName('');
            if (onComplete) onComplete();
          }
        } catch (err: unknown) {
          const axiosErr = err as { detalhes?: { campo: string; erros: string[]; index: number }[] } | undefined;
          const detalhes = axiosErr?.detalhes;
          if (Array.isArray(detalhes) && detalhes.some((d) => typeof d.index === 'number')) {
            const errorIndices = new Set(detalhes.map((d) => d.index));
            setRows((prev) =>
              prev.map((r, idx) => ({
                ...r,
                hasError: errorIndices.has(idx),
                errorMessage: detalhes.find((d) => d.index === idx)?.erros?.join('; ')
              }))
            );
          }
          handleError(err);
        } finally {
          setIsSubmitting(false);
        }
      },
      [movimentacaoId, showSnackbar, handleError, onComplete, onSituacaoChange]
    );

    const handleSubmit = useCallback(
      async (action: 'save' | 'process') => {
        const currentRows = rowsRef.current;
        if (currentRows.length === 0) return;

        const emptyCode = currentRows.some((r) => !r.codigo.trim());
        if (emptyCode) {
          showSnackbar({ message: 'Todos os itens devem ter um código.', severity: 'warning' });
          return;
        }

        // Block submit based on mode
        if (mode === 'impressao') {
          const existingItems = currentRows.filter((r) => r.exists);
          if (existingItems.length > 0) {
            setRows((prev) => prev.map((r) => (r.exists ? { ...r, hasError: true, errorMessage: 'Produto já cadastrado no sistema' } : r)));
            showSnackbar({
              message: `${existingItems.length} ${existingItems.length === 1 ? 'item possui' : 'itens possuem'} código de produto já cadastrado. Corrija os itens destacados.`,
              severity: 'error'
            });
            return;
          }
        } else {
          const missingItems = currentRows.filter((r) => !r.exists);
          if (missingItems.length > 0) {
            setRows((prev) =>
              prev.map((r) => (!r.exists ? { ...r, hasError: true, errorMessage: 'Produto não encontrado no sistema' } : r))
            );
            const modeLabel = isConferencia ? 'conferência' : 'associação';
            showSnackbar({
              message: `${missingItems.length} ${missingItems.length === 1 ? 'item não possui' : 'itens não possuem'} produto cadastrado. Todos os produtos devem existir para ${modeLabel}.`,
              severity: 'error'
            });
            return;
          }
        }

        // Block submit if any item still has unresolved errors
        if (currentRows.some((r) => r.hasError)) {
          showSnackbar({ message: 'Corrija os itens com erro antes de continuar.', severity: 'error' });
          return;
        }

        // Confirm if any item has warnings (inferior quantity)
        const warningRows = currentRows.filter((r) => r.hasWarning);
        if (warningRows.length > 0) {
          showDialog({
            dividers: false,
            title: 'Confirmar importação',
            content: (
              <>
                <Typography sx={{ mb: 1 }}>
                  {warningRows.length === 1
                    ? 'Existe 1 produto com quantidade inferior às tags ativas disponíveis:'
                    : `Existem ${warningRows.length} produtos com quantidade inferior às tags ativas disponíveis:`}
                </Typography>
                {warningRows.map((r) => (
                  <Typography key={r.id} variant="body2" sx={{ ml: 1 }}>
                    • <strong>{r.codigo}</strong> — {r.warningMessage}
                  </Typography>
                ))}
                <Typography sx={{ mt: 1.5 }}>Deseja continuar mesmo assim?</Typography>
              </>
            ),
            actions: [
              <Button key="cancel" color="inherit" onClick={closeDialog}>
                Cancelar
              </Button>,
              <Button
                key="confirm"
                variant="contained"
                onClick={() => {
                  closeDialog();
                  executeSubmit(action, currentRows);
                }}
              >
                Continuar
              </Button>
            ]
          });
          return;
        }

        await executeSubmit(action, currentRows);
      },
      [mode, isConferencia, showSnackbar, showDialog, closeDialog, executeSubmit]
    );

    // ── Imperative Handle ─────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        handleSave: () => handleSubmit('save'),
        handleProcess: equipamentoIsSled ? undefined : () => handleSubmit('process'),
        processLabel: requiresExistingProduct ? 'Processar' : undefined,
        processTooltip: isConferencia || isTransferencia || isAssociacao ? 'Salvar e avançar para leitura de tags' : undefined,
        hasData: rows.length > 0 && fileName !== '',
        isSubmitting,
        showHelp: rows.length > 0 && fileName !== ''
      }),
      [
        handleSubmit,
        rows.length,
        fileName,
        isSubmitting,
        requiresExistingProduct,
        isAssociacao,
        isConferencia,
        isTransferencia,
        equipamentoIsSled
      ]
    );

    // Notify parent when reactive state changes
    const stateKey = `${rows.length}-${fileName}-${isSubmitting}`;
    const prevStateKey = useRef(stateKey);
    useEffect(() => {
      if (prevStateKey.current !== stateKey) {
        prevStateKey.current = stateKey;
        onStateChange?.();
      }
    }, [stateKey, onStateChange]);

    // ── Clear ─────────────────────────────────────────────────

    const handleClear = useCallback(() => {
      setRows([]);
      setFileName('');
    }, []);

    // ── Process row update (DataGrid edit) ────────────────────

    const processRowUpdate = useCallback(
      async (newRow: ImportItem, oldRow: ImportItem) => {
        // Force uppercase on non-case-sensitive fields
        const upperFields = new Set(['codigo', 'nome', 'categoria', 'codigoUnico', 'lote']);
        for (const field of upperFields) {
          const key = field as keyof ImportItem;
          const val = newRow[key];
          if (typeof val === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Dynamic key access requires type assertion
            (newRow as any)[key] = val.toUpperCase();
          }
        }

        // codigoUnico → quantidade=1 is now enforced server-side (ImportacaoService)

        const codigoChanged = newRow.codigo !== oldRow.codigo;

        // Se o código mudou, re-validar contra o banco
        if (codigoChanged && newRow.codigo.trim() && activeFilial && user) {
          try {
            const { data } = await axios.post(`${movimentacaoEndpoint}/impressao/validate`, {
              idFilial: activeFilial.idFilial,
              idUsuario: user.id,
              codigos: [newRow.codigo]
            });
            const result = data.results?.[0];
            newRow.exists = result?.exists ?? false;
            // In associacao/conferencia mode, auto-fill product details from database
            if (requiresExistingProduct && result?.exists && result.existing) {
              newRow.nome = result.existing.nome || '';
              newRow.unidadeMedida = result.existing.unidadeMedida || '';
              newRow.categoria = result.existing.categoria || '';
            } else if (requiresExistingProduct && !result?.exists) {
              newRow.nome = '';
              newRow.unidadeMedida = '';
              newRow.categoria = '';
            }
            // Set error state based on mode
            if (requiresExistingProduct && !newRow.exists) {
              newRow.hasError = true;
              newRow.errorMessage = 'Produto não encontrado no sistema';
            } else if (!requiresExistingProduct && newRow.exists) {
              newRow.hasError = true;
              newRow.errorMessage = 'Produto já cadastrado no sistema';
            } else {
              newRow.hasError = false;
              newRow.errorMessage = undefined;
            }

            // In conferencia or transferencia mode, also fetch active tags count
            if ((isConferencia || isTransferencia) && newRow.exists) {
              try {
                const { data: ativasData } = await axios.post(`${tagRfidEndpoint}/produto/ativas-batch`, {
                  codigos: [newRow.codigo],
                  idFilial: activeFilial?.idFilial
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- API response has dynamic shape
                const match = ativasData.find((a: any) => a.codigo === newRow.codigo);
                newRow.totalTagsAtivas = match?.totalAtivas ?? 0;
              } catch {
                newRow.totalTagsAtivas = 0;
              }
            }
          } catch {
            newRow.exists = false;
            if (requiresExistingProduct) {
              newRow.hasError = true;
              newRow.errorMessage = 'Erro ao validar produto';
            }
          }
        }

        // Conferência/Transferência: validate quantity vs active tags (runs on any edit, not just codigo change)
        if ((isConferencia || isTransferencia) && newRow.exists && newRow.totalTagsAtivas !== undefined) {
          if (newRow.quantidade > newRow.totalTagsAtivas) {
            // Superior: block
            newRow.hasError = true;
            newRow.errorMessage = `Quantidade (${newRow.quantidade}) excede tags ativas (${newRow.totalTagsAtivas})`;
            newRow.hasWarning = false;
            newRow.warningMessage = undefined;
          } else if (newRow.quantidade < newRow.totalTagsAtivas) {
            // Inferior: warn
            newRow.hasError = false;
            newRow.errorMessage = undefined;
            newRow.hasWarning = true;
            newRow.warningMessage = `Movimentando ${newRow.quantidade} de ${newRow.totalTagsAtivas} tags ativas`;
          } else {
            // Equal: all good
            newRow.hasError = false;
            newRow.errorMessage = undefined;
            newRow.hasWarning = false;
            newRow.warningMessage = undefined;
          }
        }

        setRows((prev) => prev.map((r) => (r.id === newRow.id ? { ...newRow } : r)));
        return newRow;
      },
      [activeFilial, user, isConferencia, isTransferencia, requiresExistingProduct]
    );

    // ── Render ────────────────────────────────────────────────

    return (
      <Box>
        {/* ── Toolbar ──────────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.csv,.ods" hidden onChange={handleFileSelect} />
          <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
            Importar Planilha
          </Button>

          {fileName && <Chip icon={<DescriptionOutlinedIcon />} label={fileName} variant="outlined" onDelete={handleClear} />}
        </Box>

        {/* ── Loading ──────────────────────────────────────── */}
        {isSubmitting && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* ── Empty State ──────────────────────────────────── */}
        {rows.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              gap: 1,
              borderStyle: 'dashed'
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">
              Importe uma planilha para começar
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Formatos aceitos: .xlsx, .csv, .ods
            </Typography>
          </Paper>
        )}

        {/* ── DataGrid ─────────────────────────────────────── */}
        {rows.length > 0 && (
          <Box sx={{ width: '100%' }}>
            <DataGrid<ImportItem>
              rows={rows}
              columns={columns}
              processRowUpdate={processRowUpdate}
              apiRef={apiRef}
              editMode="cell"
              disableRowSelectionOnClick
              hideFooterPagination
              hideFooter
              autoHeight
              density="compact"
              getRowClassName={(params) => {
                if (params.row.hasError) return 'row-error';
                if (params.row.hasWarning) return 'row-warning';
                if (params.row.exists) return 'row-exists';
                return '';
              }}
              sx={{
                '& .row-error': {
                  bgcolor: 'md3.errorContainer',
                  color: 'md3.onErrorContainer'
                },
                '& .row-error:hover': {
                  bgcolor: 'md3.errorContainer',
                  filter: 'brightness(1.15)'
                },
                '& .MuiDataGrid-row:nth-of-type(even).row-error': {
                  filter: 'brightness(1.5)'
                },
                '& .MuiDataGrid-row:nth-of-type(even).row-error:hover': {
                  filter: 'brightness(1.65)'
                },
                '& .row-warning': {
                  bgcolor: 'warning.main',
                  color: 'warning.contrastText',
                  '& .MuiDataGrid-cell': { color: 'warning.contrastText' }
                },
                '& .row-warning:hover': {
                  bgcolor: 'warning.dark'
                },
                '& .MuiDataGrid-row:nth-of-type(even).row-warning': {
                  bgcolor: 'warning.dark'
                },
                '& .MuiDataGrid-row:nth-of-type(even).row-warning:hover': {
                  bgcolor: 'warning.dark',
                  filter: 'brightness(1.15)'
                },
                '& .MuiDataGrid-row:nth-of-type(even):not(.row-exists):not(.row-error):not(.row-warning)': {
                  bgcolor: 'md3.surfaceContainerHighest'
                },
                '& .MuiDataGrid-row:nth-of-type(even):not(.row-exists):not(.row-error):not(.row-warning):hover': {
                  bgcolor: 'md3.surfaceContainerHighest',
                  filter: 'brightness(1.15)'
                },
                '& .MuiDataGrid-cell[data-field="actions"]': {
                  p: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                },
                '& .MuiDataGrid-columnHeader[data-field="actions"]': {
                  p: 0,
                  minWidth: '0 !important'
                },
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: -2
                },
                '& .uppercase-cell': { textTransform: 'uppercase' },
                '& .uppercase-cell input': { textTransform: 'uppercase' }
              }}
              onCellKeyDown={(params: GridCellParams, event) => {
                if (event.key !== 'Tab' && event.key !== 'Enter') return;
                // Only act when cell is in edit mode
                const cellMode = apiRef.current!.getCellMode(params.id, params.field);
                if (cellMode !== 'edit') return;

                event.preventDefault();
                event.stopPropagation();

                const currentFieldIdx = editableFields.indexOf(params.field);
                const allRowIds = apiRef.current!.getAllRowIds();
                const currentRowIdx = allRowIds.indexOf(params.id);

                let nextFieldIdx = currentFieldIdx + 1;
                let nextRowIdx = currentRowIdx;

                if (nextFieldIdx >= editableFields.length) {
                  nextFieldIdx = 0;
                  nextRowIdx += 1;
                }

                // Stop current edit
                apiRef.current!.stopCellEditMode({ id: params.id, field: params.field });

                if (nextRowIdx < allRowIds.length) {
                  const nextId = allRowIds[nextRowIdx];
                  const nextField = editableFields[nextFieldIdx];
                  setTimeout(() => {
                    apiRef.current!.startCellEditMode({ id: nextId, field: nextField });
                  }, 50);
                }
              }}
            />
          </Box>
        )}
      </Box>
    );
  }
);

export default ImportacaoStep;
