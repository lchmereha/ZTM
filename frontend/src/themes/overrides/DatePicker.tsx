// assets
import CalendarTodayTwoToneIcon from '@mui/icons-material/CalendarTodayTwoTone';

// ==============================|| OVERRIDES - DATE PICKER ||============================== //

export default function DatePicker() {
  return {
    MuiDatePicker: {
      defaultProps: {
        slots: { openPickerIcon: () => <CalendarTodayTwoToneIcon /> }
      }
    }
  };
}
