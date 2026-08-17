import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useAuth } from 'contexts/AuthContext';
import { Field, useFormikContext } from 'formik';
import { useErrorHandler } from 'hooks/useErrorHandler';
import type { CreateTagRfidDto } from 'interfaces';
import type { PosicaoEstoque } from 'models/posicao-estoque';
import type { Produto } from 'models/produto';
import { useEffect, useState } from 'react';
import { produtoEndpoint, posicaoEstoqueEndpoint } from 'store/endpoints/rfidEndpoints';
import axios from 'utils/axios';

export interface ITagRfidForm extends Omit<CreateTagRfidDto, 'idFilial'> {
  id: number;
}

const TagRfidForm = () => {
  const { setFieldValue, errors, touched } = useFormikContext<ITagRfidForm>();
  const { activeFilial } = useAuth();
  const handleError = useErrorHandler();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [posicoesEstoque, setPosicoesEstoque] = useState<PosicaoEstoque[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = activeFilial ? { idEmpresa: activeFilial.idEmpresa } : {};
        const prodRes = await axios.get(produtoEndpoint, { params });
        setProdutos(prodRes.data);
        const posRes = await axios.get(posicaoEstoqueEndpoint, { params });
        setPosicoesEstoque(posRes.data);
      } catch (err) {
        handleError(err);
      }
    };
    fetchData();
  }, [handleError, activeFilial]);

  return (
    <Grid container columnSpacing={2} rowSpacing={1} sx={{ marginTop: 0.5 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Field
          as={TextField}
          name="codigoRfid"
          label="Código RFID (EPC)"
          fullWidth
          margin="dense"
          size="small"
          error={touched.codigoRfid && Boolean(errors.codigoRfid)}
          helperText={touched.codigoRfid && errors.codigoRfid}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('codigoRfid', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          select
          name="idProduto"
          label="Produto"
          fullWidth
          margin="dense"
          size="small"
          error={touched.idProduto && Boolean(errors.idProduto)}
          helperText={touched.idProduto && errors.idProduto}
        >
          {produtos.map((option: Produto) => (
            <MenuItem key={option.id} value={option.id}>
              {option.nome}
            </MenuItem>
          ))}
        </Field>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="codigoUnico"
          label="Código Único"
          fullWidth
          margin="dense"
          size="small"
          error={touched.codigoUnico && Boolean(errors.codigoUnico)}
          helperText={touched.codigoUnico && errors.codigoUnico}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('codigoUnico', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          select
          name="idPosicaoEstoque"
          label="Posição de Estoque"
          fullWidth
          margin="dense"
          size="small"
          error={touched.idPosicaoEstoque && Boolean(errors.idPosicaoEstoque)}
          helperText={touched.idPosicaoEstoque && errors.idPosicaoEstoque}
        >
          <MenuItem value="">
            <em>Nenhuma</em>
          </MenuItem>
          {posicoesEstoque.map((option: PosicaoEstoque) => (
            <MenuItem key={option.id} value={option.id}>
              {option.nome}
            </MenuItem>
          ))}
        </Field>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="lote"
          label="Lote"
          fullWidth
          margin="dense"
          size="small"
          error={touched.lote && Boolean(errors.lote)}
          helperText={touched.lote && errors.lote}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('lote', e.target.value.toUpperCase())}
          slotProps={{ input: { style: { textTransform: 'uppercase' } } }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="qtdeUMVolume"
          label="Qtde. UM/Volume"
          type="number"
          fullWidth
          margin="dense"
          size="small"
          error={touched.qtdeUMVolume && Boolean(errors.qtdeUMVolume)}
          helperText={touched.qtdeUMVolume && errors.qtdeUMVolume}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="dataValidade"
          label="Data de Validade"
          type="date"
          fullWidth
          margin="dense"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          error={touched.dataValidade && Boolean(errors.dataValidade)}
          helperText={touched.dataValidade && errors.dataValidade}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="dataFabricacao"
          label="Data de Fabricação"
          type="date"
          fullWidth
          margin="dense"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          error={touched.dataFabricacao && Boolean(errors.dataFabricacao)}
          helperText={touched.dataFabricacao && errors.dataFabricacao}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Field
          as={TextField}
          name="dataBaixa"
          label="Data de Baixa"
          type="date"
          fullWidth
          margin="dense"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          error={touched.dataBaixa && Boolean(errors.dataBaixa)}
          helperText={touched.dataBaixa && errors.dataBaixa}
        />
      </Grid>
    </Grid>
  );
};

export default TagRfidForm;
