import { useEffect, useReducer, useState } from 'react';

// material-ui
import Grid from '@mui/material/Grid';

// project imports
import { useAuth } from 'contexts/AuthContext';
import { useErrorHandler } from 'hooks/useErrorHandler';
import type { DashboardResumoResponse } from 'interfaces';
import { gridSpacing } from 'store/constant';
import { dashboardEndpoint } from 'store/endpoints/dashboardEndpoints';
import axios from 'utils/axios';
import KpiCard from './KpiCard';
import UltimasMovimentacoesCard from './PopularCard';
import TopProdutosCard from './TopProdutosCard';
import MovimentacoesPorMesChart from './TotalGrowthBarChart';

// assets
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';

// ── Reducer for fetch state ─────────────────────────────────

interface FetchState {
  data: DashboardResumoResponse | null;
  isLoading: boolean;
}

type FetchAction = { type: 'FETCH_INIT' } | { type: 'FETCH_FAILURE' } | { type: 'FETCH_SUCCESS'; payload: DashboardResumoResponse | null };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'FETCH_INIT':
      return { ...state, isLoading: true };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false };
    case 'FETCH_SUCCESS':
      return { data: action.payload, isLoading: false };
  }
}

// ==============================|| DEFAULT DASHBOARD ||============================== //

export default function Dashboard() {
  const { activeFilial } = useAuth();
  const handleError = useErrorHandler();

  const [{ data, isLoading }, dispatch] = useReducer(fetchReducer, { data: null, isLoading: false });
  const [meses, setMeses] = useState(6);

  useEffect(() => {
    if (!activeFilial?.idFilial) {
      dispatch({ type: 'FETCH_SUCCESS', payload: null });
      return;
    }

    let ignore = false;
    dispatch({ type: 'FETCH_INIT' });

    axios
      .get<DashboardResumoResponse>(dashboardEndpoint + '/resumo', {
        params: { idFilial: activeFilial.idFilial, meses }
      })
      .then((response) => {
        if (!ignore) dispatch({ type: 'FETCH_SUCCESS', payload: response.data });
      })
      .catch((error) => {
        if (!ignore) {
          handleError(error);
          dispatch({ type: 'FETCH_FAILURE' });
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeFilial?.idFilial, handleError, meses]);

  return (
    <Grid container spacing={gridSpacing}>
      {/* Row 1 — KPI Cards */}
      <Grid size={12}>
        <Grid container spacing={gridSpacing}>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <KpiCard
              color="secondary.dark"
              icon={<LocalOfferOutlinedIcon fontSize="inherit" />}
              isLoading={isLoading}
              title="Tags Ativas"
              value={data?.totalTagsAtivas ?? 0}
            />
          </Grid>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <KpiCard
              color="primary.dark"
              icon={<Inventory2OutlinedIcon fontSize="inherit" />}
              isLoading={isLoading}
              title="Produtos em Estoque"
              value={data?.totalProdutosComEstoque ?? 0}
            />
          </Grid>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <KpiCard
              color="success.dark"
              icon={<TodayOutlinedIcon fontSize="inherit" />}
              isLoading={isLoading}
              title="Movimentações Hoje"
              value={data?.movimentacoesHoje ?? 0}
            />
          </Grid>
          <Grid size={{ md: 3, sm: 6, xs: 12 }}>
            <KpiCard
              color="warning.dark"
              icon={<PendingActionsOutlinedIcon fontSize="inherit" />}
              isLoading={isLoading}
              title="Pendentes"
              value={data?.movimentacoesPendentes ?? 0}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Row 2 — Chart + Recent Movements */}
      <Grid size={12}>
        <Grid container spacing={gridSpacing} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ md: 8, xs: 12 }}>
            <MovimentacoesPorMesChart data={data?.movimentacoesPorMes ?? []} isLoading={isLoading} meses={meses} onMesesChange={setMeses} />
          </Grid>
          <Grid size={{ md: 4, xs: 12 }} sx={{ display: 'flex' }}>
            <UltimasMovimentacoesCard data={data?.ultimasMovimentacoes ?? []} isLoading={isLoading} />
          </Grid>
        </Grid>
      </Grid>

      {/* Row 3 — Top Products */}
      <Grid size={12}>
        <TopProdutosCard data={data?.topProdutos ?? []} isLoading={isLoading} />
      </Grid>
    </Grid>
  );
}
