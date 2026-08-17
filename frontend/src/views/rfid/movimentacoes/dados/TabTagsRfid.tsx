import { useMemo } from 'react';

// Icons
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

// MUI
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// MUI X
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

// Local
import { dataGridActionsSx, type TagRfidRow } from './types';

// ── Props ───────────────────────────────────────────────────

interface Props {
  rows: TagRfidRow[];
  loading: boolean;
  onEdit: (row: TagRfidRow) => void;
}

// ── Component ───────────────────────────────────────────────

const TabTagsRfid = ({ rows, loading, onEdit }: Props) => {
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'codigoRfid',
        headerName: 'Código RFID',
        width: 290,
        renderCell: (params) => <span style={{ fontFamily: 'monospace' }}>{params.value}</span>
      },
      {
        field: 'produto',
        flex: 1,
        headerName: 'Produto',
        minWidth: 100,
        resizable: false,
        width: 200,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party or dynamic API boundary requires any
        valueGetter: (_value: any, row: any) => row.produto?.nome || ''
      },
      {
        disableColumnMenu: true,
        field: 'actions',
        filterable: false,
        headerName: '',
        resizable: false,
        sortable: false,
        width: 1,
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

export default TabTagsRfid;
