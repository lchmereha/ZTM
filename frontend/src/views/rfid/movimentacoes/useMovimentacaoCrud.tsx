import type { ConfigColumns } from 'datatables.net';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as yup from 'yup';

// MUI
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

// Project
import { useAuth } from 'contexts/AuthContext';
import { useDialog } from 'hooks/useDialog';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useSnackbar } from 'hooks/useSnackbar';
import type { CreateMovimentacaoDto, UpdateMovimentacaoDto } from 'interfaces';
import type { Equipamento } from 'models/equipamento';
import type { TipoMovimentacao } from 'models/tipo-movimentacao';
import { dataTablesParam, equipamentoEndpoint, movimentacaoEndpoint, tipoMovimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import type { DTFilter } from 'ui-component/datatable';
import axios from 'utils/axios';
import type { IMovimentacaoForm } from './Form';

// ── Situação color mapping ──────────────────────────────────

const situacaoChipColor: Record<string, 'secondary' | 'info' | 'warning' | 'success' | 'error'> = {
  CRIADO: 'secondary',
  IMPORTADO: 'info',
  PROCESSADO: 'warning',
  FINALIZADO: 'success',
  CANCELADO: 'error'
};

// ── Hook ────────────────────────────────────────────────────

export function useMovimentacaoCrud(reloadTable: () => void) {
  const { activeFilial } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { showDialog, closeDialog } = useDialog();
  const handleError = useErrorHandler();

  // Form dialog state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IMovimentacaoForm | null>(null);
  const [selectedItemMeta, setSelectedItemMeta] = useState<{ situacao: string; tipoOpcao: string } | null>(null);
  const [tiposMovimentacao, setTiposMovimentacao] = useState<TipoMovimentacao[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);

  // Fetch tipos de movimentação e equipamentos
  useEffect(() => {
    const fetchDados = async () => {
      try {
        const [tiposRes, equipRes] = await Promise.all([
          axios.get(tipoMovimentacaoEndpoint, { params: activeFilial ? { idEmpresa: activeFilial.idEmpresa } : {} }),
          axios.get(equipamentoEndpoint, { params: activeFilial ? { idFilial: activeFilial.idFilial } : {} })
        ]);
        setTiposMovimentacao(Array.isArray(tiposRes.data) ? tiposRes.data.filter((t: TipoMovimentacao) => t.ativo) : []);
        setEquipamentos(Array.isArray(equipRes.data) ? equipRes.data.filter((e: Equipamento) => e.ativo) : []);
      } catch {
        /* ignore */
      }
    };
    fetchDados();
  }, [activeFilial]);

  // ── DataTable ─────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables.net request format is untyped
  const handleFetchData = useCallback(async (data: Record<string, any>, activeFilters?: DTFilter[]) => {
    const payload = { ...data, filters: activeFilters };
    const response = await axios.post(`${movimentacaoEndpoint}${dataTablesParam}`, payload);
    return response.data;
  }, []);

  const columns = useMemo<ConfigColumns[]>(
    () => [
      { title: 'ID', data: 'id', width: '0px' },
      { title: 'Tipo', data: 'tipo.descricao' },
      { title: 'Descrição', data: 'descricao', render: (data: string) => (data ? data : '-') },
      { title: 'Filial', data: 'filial.nome' },
      {
        title: 'Situação',
        data: 'situacao',
        width: '0px',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTable row type is generic
        render: (item: Record<string, any>) => (
          <Chip label={item?.situacao} color={situacaoChipColor[item?.situacao] || 'default'} size="small" variant="filled" />
        )
      }
    ],
    []
  );

  // ── CRUD handlers ─────────────────────────────────────────

  const handleOpenAdd = useCallback(() => {
    setSelectedItem(null);
    setSelectedItemMeta(null);
    setFormDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTable row type is generic
    async (item: Record<string, any>) => {
      try {
        const { data } = await axios.get(`${movimentacaoEndpoint}/${item.id}`);
        const record = Array.isArray(data) ? data[0] : data;
        setSelectedItem({
          id: record.id,
          idTipoMovimentacao: record.idTipoMovimentacao,
          idEquipamento: record.idEquipamento || null,
          idFilialDestino: record.idFilialDestino || null,
          descricao: record.descricao || ''
        });
        setSelectedItemMeta({
          situacao: record.situacao || 'CRIADO',
          tipoOpcao: record.tipo?.tipo || ''
        });
        setFormDialogOpen(true);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  const handleCancel = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTable row type is generic
    (item: Record<string, any>) => {
      showDialog({
        dividers: false,
        title: 'Confirmar Cancelamento',
        content: `Tem certeza que deseja cancelar a movimentação #${item.id}?`,
        actions: [
          <Button key="cancel" onClick={closeDialog} color="inherit">
            Voltar
          </Button>,
          <Button
            key="confirm"
            onClick={async () => {
              try {
                await axios.patch(`${movimentacaoEndpoint}/${item.id}/cancelar`);
                reloadTable();
                showSnackbar({ message: 'Movimentação cancelada com sucesso!', severity: 'success' });
                closeDialog();
              } catch (err) {
                handleError(err);
              }
            }}
            color="error"
            variant="contained"
          >
            Confirmar Cancelamento
          </Button>
        ]
      });
    },
    [showDialog, closeDialog, showSnackbar, handleError, reloadTable]
  );

  /**
   * Saves (create or update) a movimentação.
   * Returns the created record for new items, or undefined for updates.
   */
  const saveMovimentacao = useCallback(
    async (values: IMovimentacaoForm): Promise<{ id: number } | undefined> => {
      if (selectedItem) {
        const updatePayload: UpdateMovimentacaoDto = {
          idTipoMovimentacao: values.idTipoMovimentacao,
          idEquipamento: values.idEquipamento || undefined,
          descricao: values.descricao || undefined
        };
        await axios.patch(`${movimentacaoEndpoint}/${selectedItem.id}`, updatePayload);
        showSnackbar({ message: 'Movimentação atualizada!', severity: 'success' });
        return undefined;
      } else {
        const createPayload: CreateMovimentacaoDto = {
          idFilial: activeFilial?.idFilial ?? 0,
          idTipoMovimentacao: values.idTipoMovimentacao,
          idEquipamento: values.idEquipamento || undefined,
          idFilialDestino: values.idFilialDestino || undefined,
          descricao: values.descricao || undefined
        };
        const { data: created } = await axios.post(movimentacaoEndpoint, createPayload);
        showSnackbar({ message: 'Movimentação criada!', severity: 'success' });
        return created;
      }
    },
    [selectedItem, activeFilial, showSnackbar]
  );

  // ── Form config ───────────────────────────────────────────

  const validationSchema = useMemo(
    () =>
      yup.object({
        idTipoMovimentacao: yup.number().min(1, 'Selecione o tipo').required('Tipo é obrigatório'),
        idFilialDestino: yup
          .number()
          .nullable()
          .when('idTipoMovimentacao', (idTipoMovimentacao, schema) => {
            const idTipo = Array.isArray(idTipoMovimentacao) ? idTipoMovimentacao[0] : idTipoMovimentacao;
            const tipoSel = tiposMovimentacao.find((t) => t.id === idTipo)?.tipo;
            if (tipoSel === 'TRANSFERENCIA') {
              return schema.required('Filial Destino é obrigatória para Transferência').min(1, 'Selecione a Filial Destino');
            }
            return schema;
          })
      }),
    [tiposMovimentacao]
  );

  const initialValues: IMovimentacaoForm = useMemo(
    () => ({
      id: 0,
      idTipoMovimentacao: 0,
      idEquipamento: null,
      idFilialDestino: null,
      descricao: ''
    }),
    []
  );

  const currentInitialValues = useMemo(() => {
    return selectedItem ? { ...initialValues, ...selectedItem } : initialValues;
  }, [selectedItem, initialValues]);

  return {
    handleFetchData,
    columns,
    formDialogOpen,
    setFormDialogOpen,
    selectedItem,
    selectedItemMeta,
    tiposMovimentacao,
    handleOpenAdd,
    handleOpenEdit,
    handleCancel,
    saveMovimentacao,
    handleError,
    validationSchema,
    currentInitialValues,
    equipamentos
  };
}
