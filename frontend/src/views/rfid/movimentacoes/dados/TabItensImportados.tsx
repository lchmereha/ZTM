import { useMemo } from 'react';

// Icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

// MUI
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';

// MUI X
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

// Local
import { dataGridActionsSx, fmtDate, type ImportacaoItem } from './types';

// ── Props ───────────────────────────────────────────────────

interface Props {
  rows: ImportacaoItem[];
  loading: boolean;
  mode?: 'impressao' | 'associacao' | 'conferencia';
  readOnly?: boolean;
  /** For conferência: maps product codigo → total active tags in the system */
  tagCountByCode?: Map<string, number>;
  onEdit: (item: ImportacaoItem) => void;
  onDelete: (item: ImportacaoItem) => void;
}

// ── Component ───────────────────────────────────────────────

const TabItensImportados = ({ rows, loading, mode = 'impressao', readOnly = false, tagCountByCode, onEdit, onDelete }: Props) => {
  const theme = useTheme();

  const columns: GridColDef[] = useMemo(() => {
    const isAssociacao = mode === 'associacao';
    const isConferencia = mode === 'conferencia';

    const base: GridColDef[] = [
      { field: 'codigo', headerName: 'Código', minWidth: 100, width: 180 },
      { field: 'nome', headerName: 'Nome', flex: 1.5, minWidth: 120 },
      { field: 'unidadeMedida', headerName: 'U.M.', width: 80 }
    ];

    if (!isAssociacao) {
      base.push({ field: 'codigoUnico', headerName: 'Cód. Único', minWidth: 125 });
    }

    if (!isAssociacao && !isConferencia) {
      base.push(
        { field: 'lote', headerName: 'Lote', width: 180 },
        {
          field: 'dataValidade',
          headerName: 'Validade',
          width: 125,
          renderCell: (params) => fmtDate(params.value)
        }
      );
    }

    base.push({ field: 'quantidade', headerName: 'Qtde.', width: 75, type: 'number' });
    base.push({ field: 'qtdeUMVolume', headerName: 'Qtde. UM/Vol.', width: 120, type: 'number' });

    if (!readOnly) {
      base.push({
        field: 'actions',
        headerName: '',
        width: 80,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(params.row)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => onDelete(params.row)}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )
      });
    }

    return base;
  }, [mode, readOnly, onEdit, onDelete]);

  // Build warning sx for rows where quantity > available active tags
  const warningSx = useMemo((): Record<string, unknown> => {
    if (!tagCountByCode || tagCountByCode.size === 0) return {};

    return {
      '& .row-insufficient': {
        bgcolor: `${theme.palette.warning.main} !important`,
        color: `${theme.palette.warning.contrastText} !important`,
        '&:hover': {
          bgcolor: `${theme.palette.warning.dark} !important`
        },
        '& .MuiDataGrid-cell': {
          color: `${theme.palette.warning.contrastText} !important`
        }
      },
      '& .row-insufficient:nth-of-type(even)': {
        bgcolor: `${theme.palette.warning.dark} !important`
      }
    };
  }, [tagCountByCode, theme]);

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      autoHeight
      pageSizeOptions={[10, 25, 50]}
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      disableRowSelectionOnClick
      density="compact"
      getRowClassName={(params) => {
        if (!tagCountByCode) return '';
        const available = tagCountByCode.get(params.row.codigo);
        if (available !== undefined && params.row.quantidade > available) {
          return 'row-insufficient';
        }
        return '';
      }}
      sx={[dataGridActionsSx, warningSx] as const}
    />
  );
};

export default TabItensImportados;
