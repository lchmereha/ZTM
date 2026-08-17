// material-ui
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import type { UltimaMovimentacao } from 'interfaces';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import SkeletonPopularCard from 'ui-component/cards/Skeleton/PopularCard';

// ==============================|| ÚLTIMAS MOVIMENTAÇÕES CARD ||============================== //

const chipStyleMap: Record<string, { bgcolor: string; color: string }> = {
  ASSOCIACAO: { bgcolor: 'rgba(123, 31, 162, 0.15)', color: '#ce93d8' },
  CONFERENCIA: { bgcolor: 'rgba(255, 152, 0, 0.15)', color: '#ffb74d' },
  IMPRESSAO: { bgcolor: 'rgba(21, 101, 192, 0.15)', color: '#64b5f6' },
  LEITURA: { bgcolor: 'rgba(46, 125, 50, 0.15)', color: '#81c784' },
  TRANSFERENCIA: { bgcolor: 'rgba(2, 136, 209, 0.15)', color: '#4fc3f7' }
};

const tipoLabelMap: Record<string, string> = {
  ASSOCIACAO: 'Associação',
  CONFERENCIA: 'Conferência',
  IMPRESSAO: 'Impressão',
  LEITURA: 'Leitura',
  TRANSFERENCIA: 'Transferência'
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

interface UltimasMovimentacoesCardProps {
  data: UltimaMovimentacao[];
  isLoading: boolean;
}

export default function UltimasMovimentacoesCard({ data, isLoading }: UltimasMovimentacoesCardProps) {
  if (isLoading) {
    return <SkeletonPopularCard />;
  }

  return (
    <MainCard content={false} sx={{ height: '100%', width: '100%' }}>
      <CardContent>
        <Stack sx={{ gap: gridSpacing }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4">Últimas Movimentações</Typography>
          </Stack>

          {data.length === 0 ? (
            <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
              <Typography color="text.secondary" variant="body2">
                Nenhuma movimentação encontrada
              </Typography>
            </Stack>
          ) : (
            <List disablePadding>
              {data.map((mov, index) => (
                <div key={mov.id}>
                  <ListItem disableGutters sx={{ py: 1 }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: 500 }} variant="subtitle1">
                            {mov.tipoMovimentacao}
                          </Typography>
                          <Chip
                            label={tipoLabelMap[mov.tipoOpcao] ?? mov.tipoOpcao}
                            size="small"
                            sx={chipStyleMap[mov.tipoOpcao] ?? { bgcolor: 'action.selected', color: 'text.primary' }}
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack sx={{ gap: 0.25, mt: 0.5 }}>
                          <Typography color="text.secondary" variant="body2">
                            {mov.descricao || 'Sem descrição'}
                          </Typography>
                          <Typography color="text.disabled" variant="caption">
                            {formatDate(mov.createdAt)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                  {index < data.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
        </Stack>
      </CardContent>
    </MainCard>
  );
}
