import { Form, Formik } from 'formik';

// MUI
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

// Reuse existing forms
import ProdutoForm from 'views/rfid/produtos/produto/Form';
import TagRfidForm from 'views/rfid/produtos/tag-rfid/Form';

// Local
import AssociacaoItemForm from './AssociacaoItemForm';
import ConferenciaItemForm from './ConferenciaItemForm';
import ImportItemForm from './ImportItemForm';
import type { EditDialogState } from './useMovimentacaoDados';

// ── Props ───────────────────────────────────────────────────

interface Props {
  editDialog: EditDialogState;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
  onSave: (values: any) => Promise<void>;
}

// ── Component ───────────────────────────────────────────────

const EditItemDialog = ({ editDialog, onClose, onSave }: Props) => {
  if (!editDialog.open || !editDialog.values) return null;

  return (
    <Formik initialValues={editDialog.values} onSubmit={onSave} enableReinitialize>
      {(formikProps) => (
        <Dialog
          open={editDialog.open}
          onClose={(_, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            onClose();
          }}
          maxWidth="md"
          fullWidth
          scroll="paper"
        >
          <DialogTitle>{editDialog.title}</DialogTitle>
          <DialogContent dividers>
            <Form>
              {editDialog.type === 'associacaoItem' && <AssociacaoItemForm />}
              {editDialog.type === 'conferenciaItem' && <ConferenciaItemForm />}
              {editDialog.type === 'importItem' && <ImportItemForm />}
              {editDialog.type === 'produto' && <ProdutoForm />}
              {editDialog.type === 'tagRfid' && <TagRfidForm />}
            </Form>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button variant="contained" disabled={formikProps.isSubmitting} onClick={() => formikProps.submitForm()}>
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Formik>
  );
};

export default EditItemDialog;
