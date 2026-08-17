import { useCallback, useEffect, useState } from 'react';

// MUI
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// Project
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import type { IAssociacaoItemForm, IConferenciaItemForm } from 'interfaces/movimentacao';
import { movimentacaoEndpoint, produtoEndpoint, tagRfidEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// Reuse existing forms
import type { IProdutoForm } from 'views/rfid/produtos/produto/Form';
import type { ITagRfidForm } from 'views/rfid/produtos/tag-rfid/Form';

// Local
import type { EditDialogType, ImportacaoItem, ProdutoRow, TagRfidRow } from './types';

// ── Edit Dialog State ───────────────────────────────────────

export interface EditDialogState {
  open: boolean;
  title: string;
  type: EditDialogType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
  values: any;
}

// ── Hook ────────────────────────────────────────────────────

interface UseMovimentacaoDadosOptions {
  movimentacaoId: number;
  isAssociacao: boolean;
  isConferencia: boolean;
  tagsEnabled: boolean;
  dialogOpen: boolean;
}

export function useMovimentacaoDados({
  movimentacaoId,
  isAssociacao,
  isConferencia,
  tagsEnabled,
  dialogOpen
}: UseMovimentacaoDadosOptions) {
  const handleError = useErrorHandler();
  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();

  // ── Data State ────────────────────────────────────────────

  const [importItems, setImportItems] = useState<ImportacaoItem[]>([]);
  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [tags, setTags] = useState<TagRfidRow[]>([]);
  const [tagCountByCode, setTagCountByCode] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  // ── Edit Dialog State ─────────────────────────────────────

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    title: '',
    type: 'importItem',
    values: null
  });

  const closeEditDialog = useCallback(() => {
    setEditDialog((prev) => ({ ...prev, open: false }));
  }, []);

  // ── Data Loading ──────────────────────────────────────────

  const loadImportItems = useCallback(async () => {
    try {
      const { data } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/importacao-items`);
      setImportItems(Array.isArray(data) ? data : []);
    } catch (err) {
      handleError(err);
    }
  }, [movimentacaoId, handleError]);

  const loadProdutos = useCallback(async () => {
    if (isAssociacao || isConferencia) return;
    try {
      const { data } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/produtos`);
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      handleError(err);
    }
  }, [movimentacaoId, isAssociacao, isConferencia, handleError]);

  const loadTags = useCallback(async () => {
    if (!tagsEnabled) return;
    try {
      const { data } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/tags-processadas`);
      const flatTags: TagRfidRow[] = [];
      if (data?.produtos) {
        for (const prod of data.produtos) {
          for (const tag of prod.tags) {
            flatTags.push({ ...tag, idProduto: 0, produto: { codigo: prod.codigo, nome: prod.nome || '' } });
          }
        }
      }
      setTags(flatTags);
    } catch (err) {
      handleError(err);
    }
  }, [movimentacaoId, tagsEnabled, handleError]);

  const loadTagCounts = useCallback(async () => {
    if (!isConferencia) return;
    try {
      const { data } = await axios.get(`${movimentacaoEndpoint}/${movimentacaoId}/conferencia/produtos`);
      const map = new Map<string, number>();
      if (Array.isArray(data)) {
        for (const p of data) {
          map.set(p.codigo, p.totalTagsAtivas ?? p.tagsAtivas?.length ?? 0);
        }
      }
      setTagCountByCode(map);
    } catch {
      // Non-critical — warning highlights won't show
    }
  }, [isConferencia, movimentacaoId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadImportItems(), loadProdutos(), loadTags(), loadTagCounts()]);
    setLoading(false);
  }, [loadImportItems, loadProdutos, loadTags, loadTagCounts]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Legitimate: data fetching triggered by dialog visibility change
    if (dialogOpen) loadAll();
  }, [dialogOpen, loadAll]);

  // ── Delete ImportacaoItem ─────────────────────────────────

  const handleDeleteImportItem = useCallback(
    (item: ImportacaoItem) => {
      showDialog({
        dividers: false,
        title: 'Excluir Item',
        content: (
          <Stack spacing={1}>
            <Typography>
              Deseja excluir o item <strong>{item.codigo}</strong>?
            </Typography>
            {!isAssociacao && (
              <Typography variant="caption">
                O produto já criado será mantido, porém não serão mais geradas tags RFID para o mesmo.
              </Typography>
            )}
          </Stack>
        ),
        actions: [
          <Button key="cancel" color="inherit" onClick={closeDialog}>
            Cancelar
          </Button>,
          <Button
            key="confirm"
            variant="contained"
            color="error"
            onClick={async () => {
              closeDialog();
              try {
                await axios.delete(`${movimentacaoEndpoint}/importacao-item/${item.id}`);
                showSnackbar({ message: 'Item excluído!', severity: 'success' });
                await loadImportItems();
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Excluir
          </Button>
        ]
      });
    },
    [isAssociacao, showDialog, closeDialog, showSnackbar, handleError, loadImportItems]
  );

  // ── Open Edit Dialogs ─────────────────────────────────────

  const openEditImportItem = useCallback(
    (item: ImportacaoItem) => {
      if (isAssociacao) {
        setEditDialog({
          open: true,
          type: 'associacaoItem',
          title: `Editar Item: ${item.codigo}`,
          values: {
            id: item.id,
            idMovimentacao: movimentacaoId,
            codigo: item.codigo || '',
            nome: item.nome || '',
            unidadeMedida: item.unidadeMedida || '',
            quantidade: item.quantidade || 1,
            categoria: item.categoria || ''
          } as IAssociacaoItemForm
        });
      } else if (isConferencia) {
        setEditDialog({
          open: true,
          type: 'conferenciaItem',
          title: `Editar Item: ${item.codigo}`,
          values: {
            id: item.id,
            idMovimentacao: movimentacaoId,
            codigo: item.codigo || '',
            nome: item.nome || '',
            unidadeMedida: item.unidadeMedida || '',
            quantidade: item.quantidade || 1,
            categoria: item.categoria || '',
            codigoUnico: item.codigoUnico || ''
          } as IConferenciaItemForm
        });
      } else {
        setEditDialog({
          open: true,
          type: 'importItem',
          title: `Editar Item: ${item.codigo}`,
          values: {
            id: item.id,
            codigo: item.codigo || '',
            nome: item.nome || '',
            unidadeMedida: item.unidadeMedida || '',
            quantidade: item.quantidade || 1,
            categoria: item.categoria || '',
            codigoUnico: item.codigoUnico || '',
            posicaoEstoque: item.posicaoEstoque || '',
            dataValidade: item.dataValidade ? item.dataValidade.substring(0, 10) : '',
            lote: item.lote || '',
            dataFabricacao: item.dataFabricacao ? item.dataFabricacao.substring(0, 10) : ''
          }
        });
      }
    },
    [isAssociacao, isConferencia, movimentacaoId]
  );

  const openCreateAssociacaoItem = useCallback(() => {
    setEditDialog({
      open: true,
      type: 'associacaoItem',
      title: 'Adicionar Item',
      values: {
        idMovimentacao: movimentacaoId,
        codigo: '',
        nome: '',
        unidadeMedida: '',
        quantidade: 1,
        categoria: ''
      } as IAssociacaoItemForm
    });
  }, [movimentacaoId]);

  const openEditProduto = useCallback((item: ProdutoRow) => {
    setEditDialog({
      open: true,
      type: 'produto',
      title: `Editar Produto: ${item.codigo}`,
      values: {
        id: item.id,
        codigo: item.codigo || '',
        nome: item.nome || '',
        unidadeMedida: item.unidadeMedida || '',
        idCategoria: item.idCategoria || '',
        idModeloEtiqueta: item.idModeloEtiqueta || ''
      } as IProdutoForm
    });
  }, []);

  const openEditTag = useCallback(
    async (row: TagRfidRow) => {
      try {
        const { data } = await axios.get(`${tagRfidEndpoint}/${row.id}`);
        const record = Array.isArray(data) ? data[0] : data;
        setEditDialog({
          open: true,
          type: 'tagRfid',
          title: `Editar Tag: ${row.codigoRfid}`,
          values: {
            id: record.id,
            idProduto: record.idProduto || 0,
            codigoRfid: record.codigoRfid || '',
            codigoUnico: record.codigoUnico || '',
            dataValidade: record.dataValidade ? record.dataValidade.substring(0, 10) : '',
            lote: record.lote || '',
            dataFabricacao: record.dataFabricacao ? record.dataFabricacao.substring(0, 10) : '',
            dataBaixa: record.dataBaixa ? record.dataBaixa.substring(0, 10) : ''
          } as ITagRfidForm
        });
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  // ── Save Edit ─────────────────────────────────────────────

  const handleSaveEdit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
    async (values: any) => {
      try {
        const { id, idMovimentacao, ...payload } = values;

        // Convert empty strings to null (e.g. cleared date inputs, optional text fields)
        for (const key of Object.keys(payload)) {
          if (payload[key] === '') payload[key] = null;
        }

        if (editDialog.type === 'associacaoItem' || editDialog.type === 'conferenciaItem') {
          if (id) {
            await axios.patch(`${movimentacaoEndpoint}/importacao-item/${id}`, {
              codigo: payload.codigo,
              nome: payload.nome,
              unidadeMedida: payload.unidadeMedida,
              quantidade: payload.quantidade,
              categoria: payload.categoria,
              ...(editDialog.type === 'conferenciaItem' && { codigoUnico: payload.codigoUnico })
            });
            showSnackbar({ message: 'Item atualizado!', severity: 'success' });
          } else {
            await axios.post(`${movimentacaoEndpoint}/${idMovimentacao}/importacao-item`, {
              codigo: payload.codigo,
              nome: payload.nome,
              unidadeMedida: payload.unidadeMedida,
              quantidade: payload.quantidade,
              categoria: payload.categoria,
              ...(editDialog.type === 'conferenciaItem' && { codigoUnico: payload.codigoUnico })
            });
            showSnackbar({ message: 'Item adicionado!', severity: 'success' });
          }
          await loadImportItems();
        } else if (editDialog.type === 'importItem') {
          await axios.patch(`${movimentacaoEndpoint}/importacao-item/${id}`, payload);
          showSnackbar({ message: 'Item atualizado!', severity: 'success' });
          await loadImportItems();
        } else if (editDialog.type === 'produto') {
          await axios.patch(`${produtoEndpoint}/${id}`, payload);
          showSnackbar({ message: 'Produto atualizado!', severity: 'success' });
          await loadProdutos();
        } else if (editDialog.type === 'tagRfid') {
          await axios.patch(`${tagRfidEndpoint}/${id}`, payload);
          showSnackbar({ message: 'Tag atualizada!', severity: 'success' });
          await loadTags();
        }
        closeEditDialog();
      } catch (err) {
        handleError(err);
      }
    },
    [editDialog.type, showSnackbar, handleError, loadImportItems, loadProdutos, loadTags, closeEditDialog]
  );

  return {
    // Data
    importItems,
    produtos,
    tags,
    tagCountByCode,
    loading,

    // Edit Dialog
    editDialog,
    closeEditDialog,
    handleSaveEdit,

    // Actions
    handleDeleteImportItem,
    openEditImportItem,
    openCreateAssociacaoItem,
    openEditProduto,
    openEditTag
  };
}
