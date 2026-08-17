import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import AuthGuard from './AuthGuard';
import PermissionGuard from './PermissionGuard';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// ── Configurações ──
const RfidUsuario = Loadable(lazy(() => import('views/rfid/configuracoes/usuario')));
const RfidEmpresa = Loadable(lazy(() => import('views/rfid/configuracoes/empresa')));
const RfidFilial = Loadable(lazy(() => import('views/rfid/configuracoes/filial')));
const RfidEquipamento = Loadable(lazy(() => import('views/rfid/configuracoes/equipamento')));
const RfidTipoMovimentacao = Loadable(lazy(() => import('views/rfid/configuracoes/tipo-movimentacao')));
const RfidApiKey = Loadable(lazy(() => import('views/rfid/configuracoes/api-key')));
const RfidCadastroPosicaoEstoque = Loadable(lazy(() => import('views/rfid/configuracoes/posicao-estoque')));

// ── Produtos ──
const RfidCategoria = Loadable(lazy(() => import('views/rfid/produtos/categoria')));
const RfidProduto = Loadable(lazy(() => import('views/rfid/produtos/produto')));
const RfidModeloEtiqueta = Loadable(lazy(() => import('views/rfid/produtos/modelo-etiqueta')));
const RfidTagRfid = Loadable(lazy(() => import('views/rfid/produtos/tag-rfid')));

// ── Movimentações ──
const RfidMovimentacao = Loadable(lazy(() => import('views/rfid/movimentacoes')));

// ── Consultas ──
const RfidPosicaoEstoque = Loadable(lazy(() => import('views/rfid/consultas/posicao-estoque')));
const RfidExtratoMovimentacao = Loadable(lazy(() => import('views/rfid/consultas/extrato-movimentacao')));
const RfidEntradaSaida = Loadable(lazy(() => import('views/rfid/consultas/entrada-saida')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  ),
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },

    // ── Configurações ──
    {
      path: '/rfid/usuario',
      element: (
        <PermissionGuard permissionKey="CAD_USUARIO" roles={['ADMIN']}>
          <RfidUsuario />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/empresa',
      element: (
        <PermissionGuard permissionKey="CAD_EMPRESA" roles={['ADMIN']}>
          <RfidEmpresa />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/filial',
      element: (
        <PermissionGuard permissionKey="CAD_FILIAL">
          <RfidFilial />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/equipamento',
      element: (
        <PermissionGuard permissionKey="CAD_EQUIPAMENTO">
          <RfidEquipamento />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/tipo-movimentacao',
      element: (
        <PermissionGuard permissionKey="CAD_TIPO_MOVIMENTACAO">
          <RfidTipoMovimentacao />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/api-key',
      element: (
        <PermissionGuard permissionKey="CAD_API_KEY" roles={['ADMIN']}>
          <RfidApiKey />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/cadastro-posicao-estoque',
      element: (
        <PermissionGuard permissionKey="CAD_POSICAO_ESTOQUE">
          <RfidCadastroPosicaoEstoque />
        </PermissionGuard>
      )
    },

    // ── Produtos ──
    {
      path: '/rfid/categoria',
      element: (
        <PermissionGuard permissionKey="CAD_CATEGORIA">
          <RfidCategoria />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/produto',
      element: (
        <PermissionGuard permissionKey="CAD_PRODUTO">
          <RfidProduto />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/modelo-etiqueta',
      element: (
        <PermissionGuard permissionKey="CAD_ETIQUETA_MODELO">
          <RfidModeloEtiqueta />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/tag-rfid',
      element: (
        <PermissionGuard permissionKey="CAD_TAG_RFID">
          <RfidTagRfid />
        </PermissionGuard>
      )
    },

    // ── Movimentações ──
    {
      path: '/rfid/movimentacao',
      element: (
        <PermissionGuard permissionKey="MOV_RFID">
          <RfidMovimentacao />
        </PermissionGuard>
      )
    },

    // ── Consultas ──
    {
      path: '/rfid/posicao-estoque',
      element: (
        <PermissionGuard permissionKey="CON_POSICAO_ESTOQUE">
          <RfidPosicaoEstoque />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/extrato-movimentacao',
      element: (
        <PermissionGuard permissionKey="CON_EXTRATO_MOVIMENTACAO">
          <RfidExtratoMovimentacao />
        </PermissionGuard>
      )
    },
    {
      path: '/rfid/entrada-saida',
      element: (
        <PermissionGuard permissionKey="CON_ENTRADA_SAIDA">
          <RfidEntradaSaida />
        </PermissionGuard>
      )
    }
  ]
};

export default MainRoutes;
