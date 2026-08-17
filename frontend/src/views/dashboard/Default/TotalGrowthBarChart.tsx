import { useMemo } from 'react';

// material-ui
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// third party
import Chart from 'react-apexcharts';

// project imports
import useConfig from 'hooks/useConfig';
import type { MovimentacaoPorMes } from 'interfaces';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';

// ==============================|| MOVIMENTAÇÕES POR MÊS CHART ||============================== //

const periodOptions = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 }
];

interface MovimentacoesPorMesChartProps {
  data: MovimentacaoPorMes[];
  isLoading: boolean;
  meses: number;
  onMesesChange: (meses: number) => void;
}

/**
 * Converts 'YYYY-MM' to 'MMM/YY' in Portuguese.
 */
function formatMonth(yyyyMm: string): string {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [year, month] = yyyyMm.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${monthNames[monthIndex] ?? month}/${year.slice(2)}`;
}

export default function MovimentacoesPorMesChart({ data, isLoading, meses, onMesesChange }: MovimentacoesPorMesChartProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    state: { fontFamily }
  } = useConfig();

  const textPrimary = theme.vars?.palette.text.primary;
  const divider = theme.vars?.palette.divider;
  const grey500 = theme.vars?.palette.grey[500];

  const categories = useMemo(() => data.map((item) => formatMonth(item.mes)), [data]);

  const series = useMemo(
    () => [
      { data: data.map((item) => item.impressao), name: 'Impressão' },
      { data: data.map((item) => item.associacao), name: 'Associação' },
      { data: data.map((item) => item.leitura), name: 'Leitura' },
      { data: data.map((item) => item.conferencia), name: 'Conferência' },
      { data: data.map((item) => item.transferencia), name: 'Transferência' }
    ],
    [data]
  );

  const chartOptions = useMemo(
    (): ApexCharts.ApexOptions => ({
      chart: {
        fontFamily,
        id: 'movimentacoes-por-mes',
        stacked: true,
        toolbar: { show: true },
        type: 'bar'
      },
      colors: ['#1565c0', '#7b1fa2', '#2e7d32', '#e65100', '#0288d1'],
      dataLabels: { enabled: false },
      grid: { borderColor: divider },
      legend: {
        labels: { colors: grey500 },
        show: true
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '50%',
          horizontal: false
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              fontSize: '10px',
              position: 'bottom'
            }
          }
        }
      ],
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (val: number) => val.toLocaleString('pt-BR') }
      },
      xaxis: {
        categories,
        labels: { style: { colors: textPrimary } }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => val.toLocaleString('pt-BR'),
          style: { colors: textPrimary as unknown as string[] }
        }
      }
    }),
    [categories, divider, fontFamily, grey500, isDark, textPrimary]
  );

  if (isLoading) {
    return <SkeletonTotalGrowthBarChart />;
  }

  return (
    <MainCard>
      <Stack sx={{ gap: gridSpacing }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h4">Movimentações por Mês</Typography>
            <Typography variant="h3">
              {data
                .reduce((acc, item) => acc + item.associacao + item.conferencia + item.impressao + item.leitura + item.transferencia, 0)
                .toLocaleString('pt-BR')}
            </Typography>
          </Stack>
          <TextField id="dashboard-period-select" select value={meses} onChange={(e) => onMesesChange(Number(e.target.value))}>
            {periodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {data.length === 0 ? (
          <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <Typography color="text.secondary" variant="body2">
              Nenhuma movimentação encontrada
            </Typography>
          </Stack>
        ) : (
          <Chart height={480} options={chartOptions} series={series} type="bar" />
        )}
      </Stack>
    </MainCard>
  );
}
