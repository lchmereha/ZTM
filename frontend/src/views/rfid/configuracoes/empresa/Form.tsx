// packages
import { Field, useFormikContext } from 'formik';
import { useRef, useState, type ChangeEvent } from 'react';

// icons
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import LinkIcon from '@mui/icons-material/Link';

// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// project imports
import { useSnackbar } from 'hooks/useSnackbar';
import type { CreateEmpresaDto } from 'interfaces';
import { getLegibleContrastColor } from 'utils/colorUtils';
import { fileToBase64, isValidImageFile } from 'utils/imageUtils';

export interface IEmpresaForm extends CreateEmpresaDto {
  id: number;
}

const EmpresaForm = () => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { values, errors, touched, setFieldValue } = useFormikContext<IEmpresaForm>();
  const { showSnackbar } = useSnackbar();

  const [logoMode, setLogoMode] = useState<'url' | 'file'>(values.logo?.startsWith('data:image/') ? 'file' : 'url');

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (isValidImageFile(file)) {
        try {
          const base64 = await fileToBase64(file);
          setFieldValue('logo', base64);
        } catch {
          showSnackbar({ message: 'Erro ao processar imagem', severity: 'error' });
        }
      } else {
        showSnackbar({ message: 'Formato de arquivo inválido. Use JPG, PNG ou SVG.', severity: 'warning' });
      }
    }
  };

  const currentColor = values.corEsquema || '#2196f3';
  const contrastColor = getLegibleContrastColor(currentColor);

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 'grow' }}>
        <Field
          as={TextField}
          name="nome"
          label="Nome da Empresa"
          fullWidth
          size="small"
          error={touched.nome && Boolean(errors.nome)}
          helperText={touched.nome && errors.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('nome', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 'auto' }}>
        <Box>
          <Stack
            direction="row"
            onClick={() => colorInputRef.current?.click()}
            spacing={1.5}
            sx={{
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            <FormLabel sx={{ cursor: 'pointer', mb: 0 }}>Cor do Esquema</FormLabel>
            <Box
              sx={{
                backgroundColor: currentColor,
                color: contrastColor,
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.1s',
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              <ColorLensIcon fontSize="small" />
            </Box>
            <input
              ref={colorInputRef}
              type="color"
              style={{ display: 'none' }}
              value={currentColor}
              onChange={(e) => setFieldValue('corEsquema', e.target.value)}
            />
          </Stack>
        </Box>
      </Grid>

      <Grid size={12}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'stretch' }}>
          <Stack spacing={0.5} sx={{ flex: 1 }}>
            <FormLabel>Logo da Empresa:</FormLabel>
            <Tabs
              value={logoMode}
              onChange={(_, newValue) => setLogoMode(newValue)}
              sx={{ minHeight: 0, '& .MuiTab-root': { py: 0.5, minHeight: 0, typography: 'caption' } }}
            >
              <Tab icon={<LinkIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" label="Link" value="url" />
              <Tab icon={<CloudUploadIcon sx={{ fontSize: '0.9rem' }} />} iconPosition="start" label="Upload" value="file" />
            </Tabs>

            <Stack direction="row" sx={{ mt: 1, alignItems: 'center', flex: 1 }}>
              {logoMode === 'url' ? (
                <Field
                  as={TextField}
                  name="logo"
                  label="URL da Logo"
                  fullWidth
                  size="small"
                  placeholder="https://exemplo.com/logo.png"
                  error={touched.logo && Boolean(errors.logo)}
                  helperText={touched.logo && errors.logo}
                />
              ) : (
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />} size="small" sx={{ flexShrink: 0 }}>
                    Fazer Upload
                    <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileUpload} />
                  </Button>
                  <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                    {values.logo?.startsWith('data:image/') ? 'Imagem carregada' : 'Selecione um arquivo'}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>

          {values.logo && (
            <Avatar
              src={values.logo}
              variant="rounded"
              sx={{
                width: 110,
                height: 'auto',
                aspectRatio: '1/1',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                p: 0.5,
                '& img': {
                  objectFit: 'contain'
                }
              }}
            />
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};

export default EmpresaForm;
