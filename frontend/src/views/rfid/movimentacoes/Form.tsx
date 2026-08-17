import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Field, useFormikContext } from 'formik';
import { useAuth } from 'contexts/AuthContext';
import { useErrorHandler } from 'hooks/useErrorHandler';
import { useEffect, useState } from 'react';
import { equipamentoEndpoint, filialEndpoint, tipoMovimentacaoEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';
import MovimentacaoDadosDialog from './dados';

// ── Types ───────────────────────────────────────────────────

interface TipoMovimentacaoOption {
  id: number;
  descricao: string;
  tipo: string; // TipoOpcaoMovimentacao enum value
}

interface EquipamentoOption {
  id: number;
  nome: string;
  tipo: string; // TipoEquipamento enum value
}

export interface IMovimentacaoForm {
  id: number;
  idTipoMovimentacao: number;
  idEquipamento: number | null;
  idFilialDestino: number | null;
  descricao: string;
}

interface MovimentacaoFormProps {
  situacao?: string;
  movimentacaoId?: number;
}

// ── Component ───────────────────────────────────────────────

const MovimentacaoForm = ({ situacao, movimentacaoId }: MovimentacaoFormProps) => {
  const { values, setFieldValue, errors, touched } = useFormikContext<IMovimentacaoForm>();
  const { activeFilial } = useAuth();
  const handleError = useErrorHandler();

  const [tiposMovimentacao, setTiposMovimentacao] = useState<TipoMovimentacaoOption[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoOption[]>([]);
  const [filiais, setFiliais] = useState<{ id: number; nome: string }[]>([]);
  const [dadosDialogOpen, setDadosDialogOpen] = useState(false);

  // Carregar tipos de movimentação
  useEffect(() => {
    const load = async () => {
      try {
        const params = activeFilial ? { idEmpresa: activeFilial.idEmpresa } : {};
        const { data } = await axios.get(tipoMovimentacaoEndpoint, { params });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
        setTiposMovimentacao(Array.isArray(data) ? data.filter((t: any) => t.ativo) : []);
      } catch (err) {
        handleError(err);
      }
    };
    load();
  }, [handleError, activeFilial]);

  // Carregar equipamentos
  useEffect(() => {
    const load = async () => {
      try {
        const params = activeFilial ? { idFilial: activeFilial.idFilial } : {};
        const { data } = await axios.get(equipamentoEndpoint, { params });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
        setEquipamentos(Array.isArray(data) ? data.filter((e: any) => e.ativo) : []);
      } catch (err) {
        handleError(err);
      }
    };
    load();
  }, [handleError, activeFilial]);

  // Carregar filiais
  useEffect(() => {
    const load = async () => {
      try {
        const params = activeFilial ? { idEmpresa: activeFilial.idEmpresa } : {};
        const { data } = await axios.get(filialEndpoint, { params });

        setFiliais(Array.isArray(data) ? data : []);
      } catch (err) {
        handleError(err);
      }
    };
    load();
  }, [handleError, activeFilial]);

  // Tipo selecionado
  const selectedTipo = tiposMovimentacao.find((t) => t.id === values.idTipoMovimentacao) || null;

  // Filtrar equipamentos baseado no tipo de movimentação
  const filteredEquipamentos = (() => {
    if (!selectedTipo) return [];
    if (selectedTipo.tipo === 'IMPRESSAO') {
      return equipamentos.filter((e) => e.tipo === 'IMPRESSORA');
    }
    if (selectedTipo.tipo === 'LEITURA' || selectedTipo.tipo === 'ASSOCIACAO' || selectedTipo.tipo === 'CONFERENCIA') {
      return equipamentos.filter((e) => e.tipo === 'ANTENA' || e.tipo === 'SLED');
    }
    return equipamentos.filter((e) => e.tipo !== 'IMPRESSORA');
  })();

  // Limpar equipamento quando o tipo mudar e o equipamento selecionado não estiver mais na lista filtrada
  useEffect(() => {
    if (values.idEquipamento && equipamentos.length > 0) {
      const stillValid = filteredEquipamentos.some((e) => e.id === values.idEquipamento);
      if (!stillValid) {
        setFieldValue('idEquipamento', null);
      }
    }
  }, [selectedTipo, filteredEquipamentos, values.idEquipamento, setFieldValue, equipamentos.length]);

  // Show "Dados da Movimentação" button when situacao is IMPORTADO or beyond
  const showDadosButton = movimentacaoId != null && situacao != null && ['IMPORTADO', 'PROCESSADO', 'FINALIZADO'].includes(situacao);

  return (
    <>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            size="small"
            options={tiposMovimentacao}
            getOptionLabel={(option) => option.descricao || ''}
            value={selectedTipo}
            onChange={(_e, newValue) => setFieldValue('idTipoMovimentacao', newValue ? newValue.id : 0)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tipo de Movimentação"
                size="small"
                error={touched.idTipoMovimentacao && Boolean(errors.idTipoMovimentacao)}
                helperText={touched.idTipoMovimentacao && errors.idTipoMovimentacao}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Autocomplete
            options={filteredEquipamentos}
            getOptionLabel={(option) => option.nome || ''}
            value={filteredEquipamentos.find((e) => e.id === values.idEquipamento) || null}
            onChange={(_e, newValue) => setFieldValue('idEquipamento', newValue ? newValue.id : null)}
            disabled={!selectedTipo}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Equipamento"
                size="small"
                error={touched.idEquipamento && Boolean(errors.idEquipamento)}
                helperText={
                  touched.idEquipamento && errors.idEquipamento
                    ? errors.idEquipamento
                    : !selectedTipo
                      ? 'Selecione o tipo de movimentação primeiro'
                      : undefined
                }
              />
            )}
          />
        </Grid>

        {selectedTipo?.tipo === 'TRANSFERENCIA' && (
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              options={filiais}
              getOptionLabel={(option) => option.nome || ''}
              value={filiais.find((f) => f.id === values.idFilialDestino) || null}
              onChange={(_e, newValue) => setFieldValue('idFilialDestino', newValue ? newValue.id : null)}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filial Destino"
                  size="small"
                  error={touched.idFilialDestino && Boolean(errors.idFilialDestino)}
                  helperText={touched.idFilialDestino && errors.idFilialDestino}
                />
              )}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <Field
            as={TextField}
            name="descricao"
            label="Descrição"
            fullWidth
            size="small"
            multiline
            minRows={2}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('descricao', e.target.value.toUpperCase())}
            slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
          />
        </Grid>

        {showDadosButton && (
          <>
            <Grid size={12}>
              <Divider />
            </Grid>
            <Grid size={12}>
              <Button
                color="secondary"
                fullWidth
                startIcon={<StorageOutlinedIcon />}
                onClick={() => setDadosDialogOpen(true)}
                variant="contained"
              >
                Dados da Movimentação
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      {/* Dados da Movimentação Dialog */}
      {showDadosButton && dadosDialogOpen && (
        <MovimentacaoDadosDialog
          open={dadosDialogOpen}
          onClose={() => setDadosDialogOpen(false)}
          movimentacaoId={movimentacaoId!}
          situacao={situacao!}
          tipoOpcao={selectedTipo?.tipo}
        />
      )}
    </>
  );
};

export default MovimentacaoForm;
