import { Form, Formik, type FormikProps } from 'formik';
import { useRef } from 'react';
import type { ObjectSchema } from 'yup';

// Icons
import LinkIcon from '@mui/icons-material/Link';
import PublishIcon from '@mui/icons-material/Publish';
import SaveIcon from '@mui/icons-material/Save';
import SensorsIcon from '@mui/icons-material/Sensors';

// MUI
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';

// Local
import MovimentacaoForm, { type IMovimentacaoForm } from './Form';

// Models
import type { Equipamento } from 'models/equipamento';
import type { TipoMovimentacao } from 'models/tipo-movimentacao';

// ── Props ───────────────────────────────────────────────────

interface MovimentacaoFormDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItem: IMovimentacaoForm | null;
  selectedItemMeta: { situacao: string; tipoOpcao: string } | null;
  tiposMovimentacao: TipoMovimentacao[];
  equipamentos: Equipamento[];
  currentInitialValues: IMovimentacaoForm;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- yup ObjectSchema generic is complex
  validationSchema: ObjectSchema<any>;
  onSubmit: (
    values: IMovimentacaoForm,
    action: 'save' | 'import' | 'leitura' | 'associacao' | 'conferencia' | 'transferencia'
  ) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────

const MovimentacaoFormDialog = ({
  open,
  onClose,
  selectedItem,
  selectedItemMeta,
  tiposMovimentacao,
  equipamentos,
  currentInitialValues,
  validationSchema,
  onSubmit
}: MovimentacaoFormDialogProps) => {
  const formikRef = useRef<FormikProps<IMovimentacaoForm>>(null);

  const validateAndSubmit = async (
    formikProps: FormikProps<IMovimentacaoForm>,
    action: 'save' | 'import' | 'leitura' | 'associacao' | 'conferencia' | 'transferencia'
  ) => {
    const errs = await formikProps.validateForm();
    if (Object.keys(errs).length === 0) {
      await onSubmit(formikProps.values, action);
    } else {
      formikProps.setTouched(Object.fromEntries(Object.keys(errs).map((k) => [k, true])));
    }
  };

  return (
    <Formik
      innerRef={formikRef}
      initialValues={currentInitialValues}
      validationSchema={validationSchema}
      onSubmit={() => {}}
      enableReinitialize
    >
      {(formikProps) => (
        <Dialog
          open={open}
          onClose={(_, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            onClose();
          }}
          maxWidth="sm"
          fullWidth
          scroll="paper"
        >
          <DialogTitle>{selectedItem ? 'Editar Movimentação' : 'Nova Movimentação'}</DialogTitle>
          <DialogContent dividers>
            <Form>
              <MovimentacaoForm situacao={selectedItemMeta?.situacao} movimentacaoId={selectedItem?.id} />
            </Form>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={formikProps.isSubmitting}>
              Cancelar
            </Button>

            <Tooltip title="Salvar e sair">
              <Button
                disabled={formikProps.isSubmitting}
                endIcon={<SaveIcon />}
                onClick={() => validateAndSubmit(formikProps, 'save')}
                variant={selectedItem ? 'contained' : 'outlined'}
              >
                Salvar
              </Button>
            </Tooltip>

            {!selectedItem &&
              (() => {
                const tipoOpcao = tiposMovimentacao.find((t) => t.id === formikProps.values.idTipoMovimentacao)?.tipo;
                if (tipoOpcao === 'IMPRESSAO') {
                  return (
                    <Tooltip title="Salvar e importar dados">
                      <Button
                        disabled={formikProps.isSubmitting}
                        onClick={() => validateAndSubmit(formikProps, 'import')}
                        variant="contained"
                        endIcon={<PublishIcon />}
                      >
                        Importar
                      </Button>
                    </Tooltip>
                  );
                }
                if (tipoOpcao === 'LEITURA') {
                  const equipamentoSel = equipamentos.find((e) => e.id === formikProps.values.idEquipamento);
                  if (equipamentoSel?.tipo === 'SLED') {
                    return null; // SLED reads only on mobile app
                  }
                  return (
                    <Tooltip title="Salvar e iniciar leitura">
                      <Button
                        disabled={formikProps.isSubmitting}
                        onClick={() => validateAndSubmit(formikProps, 'leitura')}
                        variant="contained"
                        endIcon={<SensorsIcon />}
                      >
                        Iniciar Leitura
                      </Button>
                    </Tooltip>
                  );
                }
                if (tipoOpcao === 'ASSOCIACAO') {
                  return (
                    <Tooltip title="Salvar e importar para associação">
                      <Button
                        disabled={formikProps.isSubmitting}
                        onClick={() => validateAndSubmit(formikProps, 'associacao')}
                        variant="contained"
                        endIcon={<LinkIcon />}
                      >
                        Importar
                      </Button>
                    </Tooltip>
                  );
                }
                if (tipoOpcao === 'CONFERENCIA') {
                  return (
                    <Tooltip title="Salvar e importar para conferência">
                      <Button
                        disabled={formikProps.isSubmitting}
                        onClick={() => validateAndSubmit(formikProps, 'conferencia')}
                        variant="contained"
                        endIcon={<PublishIcon />}
                      >
                        Importar
                      </Button>
                    </Tooltip>
                  );
                }
                if (tipoOpcao === 'TRANSFERENCIA') {
                  return (
                    <Tooltip title="Salvar e importar para transferência">
                      <Button
                        disabled={formikProps.isSubmitting}
                        onClick={() => validateAndSubmit(formikProps, 'transferencia')}
                        variant="contained"
                        endIcon={<PublishIcon />}
                      >
                        Importar
                      </Button>
                    </Tooltip>
                  );
                }
                return null;
              })()}
          </DialogActions>
        </Dialog>
      )}
    </Formik>
  );
};

export default MovimentacaoFormDialog;
