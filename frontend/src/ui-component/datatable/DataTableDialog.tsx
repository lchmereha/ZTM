import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useMemo, useRef } from 'react';

import { Form, Formik, type FormikProps } from 'formik';
import * as yup from 'yup';

export interface DataTableDialogProps<T> {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: T) => Promise<void> | void;
  item: T | null;
  validationSchema: yup.AnyObjectSchema;
  initialValues: T;
  renderForm: (props: FormikProps<T>) => React.ReactNode;
  title: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  isLoading?: boolean;
}

const DataTableDialog = <T extends object>({
  open,
  onClose,
  onSubmit,
  item,
  validationSchema,
  initialValues,
  renderForm,
  title,
  maxWidth = false
}: DataTableDialogProps<T>) => {
  const formikRef = useRef<FormikProps<T>>(null);

  const handleSubmit = async (values: T, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  const currentInitialValues = useMemo(() => {
    return item ? { ...initialValues, ...item } : initialValues;
  }, [item, initialValues]);

  return (
    <Formik
      innerRef={formikRef}
      initialValues={currentInitialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {(formikProps) => (
        <Dialog
          open={open}
          onClose={(_, reason) => {
            if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
            onClose();
          }}
          maxWidth={maxWidth}
          fullWidth
          scroll="paper"
        >
          <DialogTitle>{title}</DialogTitle>
          <DialogContent dividers>
            <Form>{renderForm(formikProps)}</Form>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={formikProps.isSubmitting}>
              Cancelar
            </Button>
            <Button
              disabled={formikProps.isSubmitting}
              onClick={() => {
                formikRef.current?.submitForm();
              }}
              variant="contained"
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Formik>
  );
};

export default DataTableDialog;
