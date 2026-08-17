import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DisabledByDefaultRoundedIcon from '@mui/icons-material/DisabledByDefaultRounded';
import { type ConfigColumns } from 'datatables.net-dt';

export const dtColumnAtivo = (options: { title?: string; data?: string; width?: string } = {}): ConfigColumns => {
  const { title = 'Ativo', data = 'ativo', width = '1px' } = options;

  return {
    title,
    data,
    width,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DataTables.net render callback receives untyped row data
    render: (row: any) =>
      row?.[data] ? <CheckBoxIcon sx={{ color: 'success.main' }} /> : <DisabledByDefaultRoundedIcon sx={{ color: 'error.main' }} />
  };
};
