import { useFormikContext } from 'formik';
import { useEffect, useState } from 'react';

// MUI
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// Project
import { useErrorHandler } from 'hooks/useErrorHandler';
import type { IConferenciaItemForm } from 'interfaces/movimentacao';
import { tagRfidEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

// Local
import { useProdutoOptions } from './useProdutoOptions';

// ── Types ───────────────────────────────────────────────────

interface TagRfidOption {
  id: number;
  codigoRfid: string;
  codigoUnico: string | null;
}

// ── Component ───────────────────────────────────────────────

const ConferenciaItemForm = () => {
  const { values, setFieldValue, errors, touched } = useFormikContext<IConferenciaItemForm>();
  const handleError = useErrorHandler();
  const { produtos, loading: loadingProdutos } = useProdutoOptions();

  const [tagsAtivas, setTagsAtivas] = useState<TagRfidOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const selectedProduto = produtos.find((p) => p.codigo === values.codigo) || null;
  const selectedProdutoId = selectedProduto?.id ?? null;

  // Load active tags when product changes
  useEffect(() => {
    // Skip fetch when no product is selected — tagsAtivas stays empty from initial state
    // or gets cleared by the next render cycle when selectedProdutoId becomes null
    if (!selectedProdutoId) return;

    let cancelled = false;
    const loadTags = async () => {
      setLoadingTags(true);
      try {
        const { data } = await axios.get(`${tagRfidEndpoint}/produto/${selectedProdutoId}/ativas`);
        if (!cancelled) setTagsAtivas(Array.isArray(data) ? data : []);
      } catch (err) {
        handleError(err);
        if (!cancelled) setTagsAtivas([]);
      } finally {
        if (!cancelled) setLoadingTags(false);
      }
    };
    loadTags();

    return () => {
      cancelled = true;
      setTagsAtivas([]);
    };
  }, [selectedProdutoId, handleError]);

  const selectedTag = tagsAtivas.find((t) => t.codigoUnico === values.codigoUnico) || null;
  const showQuantidade = !selectedTag;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          size="small"
          options={produtos}
          loading={loadingProdutos}
          getOptionLabel={(option) => `${option.codigo} — ${option.nome}`}
          value={selectedProduto}
          onChange={(_e, newValue) => {
            if (newValue) {
              setFieldValue('codigo', newValue.codigo);
              setFieldValue('nome', newValue.nome);
              setFieldValue('unidadeMedida', newValue.unidadeMedida);
              setFieldValue('categoria', newValue.categoria?.nome || '');
            } else {
              setFieldValue('codigo', '');
              setFieldValue('nome', '');
              setFieldValue('unidadeMedida', '');
              setFieldValue('categoria', '');
              setFieldValue('codigoUnico', '');
            }
          }}
          isOptionEqualToValue={(option, val) => option.codigo === val.codigo}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Produto"
              size="small"
              error={touched.codigo && Boolean(errors.codigo)}
              helperText={touched.codigo && errors.codigo}
            />
          )}
        />
      </Grid>

      {/* Tag RFID autocomplete — only show when product is selected */}
      {selectedProduto && (
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            size="small"
            options={tagsAtivas}
            loading={loadingTags}
            getOptionLabel={(option) => (option.codigoUnico ? `${option.codigoRfid} (${option.codigoUnico})` : option.codigoRfid)}
            value={selectedTag}
            onChange={(_e, newValue) => {
              if (newValue) {
                setFieldValue('codigoUnico', newValue.codigoUnico || '');
                setFieldValue('quantidade', 1);
              } else {
                setFieldValue('codigoUnico', '');
              }
            }}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tag RFID (opcional)"
                size="small"
                helperText={tagsAtivas.length === 0 && !loadingTags ? 'Nenhuma tag ativa para este produto' : undefined}
              />
            )}
          />
        </Grid>
      )}

      {showQuantidade && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            name="quantidade"
            label="Quantidade"
            type="number"
            fullWidth
            size="small"
            value={values.quantidade}
            onChange={(e) => setFieldValue('quantidade', Math.max(1, Number(e.target.value)))}
            error={touched.quantidade && Boolean(errors.quantidade)}
            helperText={touched.quantidade && errors.quantidade}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Grid>
      )}

      {/* Read-only info fields */}
      {selectedProduto && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Unidade de Medida" value={values.unidadeMedida} size="small" fullWidth disabled />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Categoria" value={values.categoria} size="small" fullWidth disabled />
          </Grid>
        </>
      )}
    </Grid>
  );
};

export default ConferenciaItemForm;
