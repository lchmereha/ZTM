import { useMemo } from 'react';

// Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

// MUI
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// MUI X
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

// Local
import { dataGridActionsSx, type ProdutoRow } from './types';

// ── Props ───────────────────────────────────────────────────

interface Props {
  rows: ProdutoRow[];
  loading: boolean;
  onEdit: (item: ProdutoRow) => void;
}

// ── Component ───────────────────────────────────────────────

const TabProdutos = ({ rows, loading, onEdit }: Props) => {
  const columns: GridColDef[] = useMemo(
    () => [
      { field: 'codigo', headerName: 'Código', minWidth: 100, width: 180 },
      { field: 'nome', headerName: 'Nome', flex: 1.5, minWidth: 120 },
      { field: 'unidadeMedida', headerName: 'U.M.', width: 80 },
      {
        field: 'categoria',
        headerName: 'Categoria',
        flex: 1,
        minWidth: 100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
        valueGetter: (_value: any, row: any) => row.categoria?.nome || ''
      },
      {
        field: 'modeloEtiqueta',
        headerName: 'Etiqueta',
        flex: 1,
        minWidth: 100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
        valueGetter: (_value: any, row: any) => row.modeloEtiqueta?.nome || ''
      },
      {
        field: 'actions',
        headerName: '',
        width: 50,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(params.row)}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )
      }
    ],
    [onEdit]
  );

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
      sx={dataGridActionsSx}
    />
  );
};

export default TabProdutos;
