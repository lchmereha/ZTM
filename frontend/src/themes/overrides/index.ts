import type { Theme } from '@mui/material/styles';

// third party
import { merge } from 'lodash-es';

// project imports
import { tenant } from 'config/tenants';
import Alert from './Alert';
import Card from './Card';
import Autocomplete from './Autocomplete';
import Avatar from './Avatar';
import Button from './Button';
import CardActions from './CardActions';
import CardContent from './CardContent';
import CardHeader from './CardHeader';
import Checkbox from './Checkbox';
import Chip from './Chip';
import DataGrid from './DataGrid';
import DatePicker from './DatePicker';
import DateTimePickerToolbar from './DateTimePickerToolbar';
import Dialog from './Dialog';
import DialogActions from './DialogActions';
import DialogTitle from './DialogTitle';
import Divider from './Divider';
import InputBase from './InputBase';
import ListItemButton from './ListItemButton';
import ListItemIcon from './ListItemIcon';
import ListItemText from './ListItemText';
import Paper from './Paper';
import Select from './Select';
import Slider from './Slider';
import TableCell from './TableCell';
import Tabs from './Tabs';
import Typography from './Typography';

// ===============================||  OVERRIDES - MAIN  ||=============================== //

export default function ComponentsOverrides(theme: Theme, borderRadius: number) {
  return merge(
    Alert(theme),
    Autocomplete(theme),
    Avatar(theme),
    Button(theme),
    // Variantes que usam `surfaceBright` como superfície de chrome precisam do
    // Card acompanhando; no tema padrão o Card usa o default do MUI.
    tenant.chromeSurface === 'surfaceBright' ? Card(theme) : {},
    CardActions,
    CardContent(),
    CardHeader(theme),
    Checkbox(),
    Chip(theme),
    DataGrid(theme),
    DatePicker(),
    DateTimePickerToolbar(),
    Dialog(),
    DialogActions(),
    DialogTitle(),
    Divider(theme),
    InputBase(theme),
    ListItemButton(theme),
    ListItemIcon(theme),
    ListItemText(theme),
    Paper(borderRadius),
    Select(),
    Slider(theme),
    TableCell(theme),
    Tabs(theme),
    Typography(theme)
  );
}
