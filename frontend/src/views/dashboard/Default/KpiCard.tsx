// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from 'ui-component/cards/MainCard';
import SkeletonEarningCard from 'ui-component/cards/Skeleton/EarningCard';

// ==============================|| KPI CARD ||============================== //

/**
 * Fixed vibrant colors that look good in both light and dark themes.
 * Using HSL-based colors for visual consistency regardless of palette seed.
 */
const CARD_PRESETS: Record<string, { bg: string; circle: string }> = {
  'primary.dark': { bg: '#1565c0', circle: '#0d47a1' },
  'secondary.dark': { bg: '#7b1fa2', circle: '#4a148c' },
  'success.dark': { bg: '#2e7d32', circle: '#1b5e20' },
  'warning.dark': { bg: '#e65100', circle: '#bf360c' }
};

interface KpiCardProps {
  color: string;
  icon: React.ReactNode;
  isLoading: boolean;
  subtitle?: string;
  title: string;
  value: number | string;
}

export default function KpiCard({ color, icon, isLoading, subtitle, title, value }: KpiCardProps) {
  const theme = useTheme();
  const preset = CARD_PRESETS[color] ?? { bg: '#1565c0', circle: '#0d47a1' };

  if (isLoading) {
    return <SkeletonEarningCard />;
  }

  return (
    <MainCard
      border={false}
      content={false}
      sx={{
        bgcolor: preset.bg,
        color: '#fff',
        overflow: 'hidden',
        position: 'relative',
        '&:after': {
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          content: '""',
          height: 210,
          position: 'absolute',
          right: { xs: -95 },
          top: { xs: -85 },
          width: 210
        },
        '&:before': {
          background: 'rgba(255, 255, 255, 0.10)',
          borderRadius: '50%',
          content: '""',
          height: 210,
          position: 'absolute',
          right: { xs: -15 },
          top: { xs: -125 },
          width: 210
        }
      }}
    >
      <Box sx={{ p: 2.25 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
          <Avatar
            variant="rounded"
            sx={{
              ...theme.typography.largeAvatar,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              color: '#fff',
              mt: 1
            }}
          >
            {icon}
          </Avatar>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <Typography sx={{ color: '#fff', fontSize: '2.125rem', fontWeight: 500, mb: 0.75, mr: 1, mt: 1.75 }}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </Typography>
        </Stack>
        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '1rem',
            fontWeight: 500,
            mb: 1.25
          }}
        >
          {title}
        </Typography>
        {subtitle && <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>{subtitle}</Typography>}
      </Box>
    </MainCard>
  );
}
