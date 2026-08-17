import { useMemo } from 'react';

// material-ui
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// third party
import Chart from 'react-apexcharts';

// project imports
import type { TopProduto } from 'interfaces';
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';
import SkeletonTotalGrowthBarChart from 'ui-component/cards/Skeleton/TotalGrowthBarChart';

// ==============================|| TOP PRODUTOS CARD ||============================== //

interface TopProdutosCardProps {
  data: TopProduto[];
  isLoading: boolean;
}

export default function TopProdutosCard({ data, isLoading }: TopProdutosCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    state: { fontFamily }
  } = useConfig();

  const textPrimary = theme.vars?.palette.text.primary;
  const divider = theme.vars?.palette.divider;
  const primaryColor = '#1565c0';

  const categories = useMemo(() => data.map((item) => (item.nomeProduto.length > 30 ? item.codigoProduto : item.nomeProduto)), [data]);

  const series = useMemo(() => [{ data: data.map((item) => item.quantidade), name: 'Quantidade' }], [data]);

  const chartOptions = useMemo(
    (): ApexCharts.ApexOptions => ({
      chart: {
        fontFamily,
        toolbar: { show: true },
        type: 'bar'
      },
      colors: [primaryColor],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toLocaleString('pt-BR'),
        style: { fontSize: '12px' }
      },
      grid: { borderColor: divider },
      plotOptions: {
        bar: {
          barHeight: '60%',
          borderRadius: 4,
          horizontal: true
        }
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (val: number) => val.toLocaleString('pt-BR') }
      },
      xaxis: {
        categories,
        labels: {
          formatter: (val: string) => Number(val).toLocaleString('pt-BR'),
          style: { colors: textPrimary as unknown as string[] }
        }
      },
      yaxis: {
        labels: { style: { colors: textPrimary as unknown as string[] } }
      }
    }),
    [categories, divider, fontFamily, isDark, primaryColor, textPrimary]
  );

  if (isLoading) {
    return <SkeletonTotalGrowthBarChart />;
  }

  return (
    <MainCard>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="h4">Top Produtos em Estoque</Typography>

        {data.length === 0 ? (
          <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <Typography color="text.secondary" variant="body2">
              Nenhum produto encontrado
            </Typography>
          </Stack>
        ) : (
          <Chart height={Math.max(300, data.length * 40)} options={chartOptions} series={series} type="bar" />
        )}
      </Stack>
    </MainCard>
  );
}
