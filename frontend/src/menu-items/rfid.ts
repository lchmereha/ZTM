import {
  IconArrowsExchange,
  IconBox,
  IconBuildingFactory,
  IconBuildingStore,
  IconCategory,
  IconChartBar,
  IconClipboardList,
  IconDeviceAirtag,
  IconDeviceDesktopAnalytics,
  IconKey,
  IconPackage,
  IconSettings,
  IconTags,
  IconTransfer,
  IconUsers
} from '@tabler/icons-react';

import type { MenuItem } from './types';

// constant
const icons = {
  IconArrowsExchange,
  IconBox,
  IconBuildingFactory,
  IconBuildingStore,
  IconCategory,
  IconChartBar,
  IconClipboardList,
  IconDeviceAirtag,
  IconDeviceDesktopAnalytics,
  IconKey,
  IconPackage,
  IconSettings,
  IconTags,
  IconTransfer,
  IconUsers
};

// ==============================|| RFID MENU ITEMS ||============================== //

const rfid: MenuItem = {
  id: 'rfid-menu',
  title: 'Operação RFID',
  type: 'group',
  children: [
    // ── 1. Configurações ──
    {
      id: 'configuracoes',
      title: 'Configurações',
      type: 'collapse',
      icon: icons.IconSettings,
      children: [
        {
          id: 'usuario',
          title: 'Usuários',
          type: 'item',
          url: '/rfid/usuario',
          icon: icons.IconUsers,
          breadcrumbs: false,
          permissionKey: 'CAD_USUARIO',
          roles: ['ADMIN']
        },
        {
          id: 'empresa',
          title: 'Empresas',
          type: 'item',
          url: '/rfid/empresa',
          icon: icons.IconBuildingFactory,
          breadcrumbs: false,
          permissionKey: 'CAD_EMPRESA',
          roles: ['ADMIN']
        },
        {
          id: 'filial',
          title: 'Filiais',
          type: 'item',
          url: '/rfid/filial',
          icon: icons.IconBuildingStore,
          breadcrumbs: false,
          permissionKey: 'CAD_FILIAL'
        },
        {
          id: 'equipamento',
          title: 'Equipamentos',
          type: 'item',
          url: '/rfid/equipamento',
          icon: icons.IconDeviceDesktopAnalytics,
          breadcrumbs: false,
          permissionKey: 'CAD_EQUIPAMENTO'
        },
        {
          id: 'tipo-movimentacao',
          title: 'Tipos de Movimentação',
          type: 'item',
          url: '/rfid/tipo-movimentacao',
          icon: icons.IconCategory,
          breadcrumbs: false,
          permissionKey: 'CAD_TIPO_MOVIMENTACAO'
        },
        {
          id: 'api-key',
          title: 'API Keys',
          type: 'item',
          url: '/rfid/api-key',
          icon: icons.IconKey,
          breadcrumbs: false,
          permissionKey: 'CAD_API_KEY',
          roles: ['ADMIN']
        },
        {
          id: 'cadastro-posicao-estoque',
          title: 'Posição de Estoque',
          type: 'item',
          url: '/rfid/cadastro-posicao-estoque',
          icon: icons.IconCategory,
          breadcrumbs: false,
          permissionKey: 'CAD_POSICAO_ESTOQUE'
        }
      ]
    },

    // ── 2. Produtos ──
    {
      id: 'produtos',
      title: 'Produtos',
      type: 'collapse',
      icon: icons.IconPackage,
      children: [
        {
          id: 'categoria',
          title: 'Categorias',
          type: 'item',
          url: '/rfid/categoria',
          icon: icons.IconCategory,
          breadcrumbs: false,
          permissionKey: 'CAD_CATEGORIA'
        },
        {
          id: 'produto',
          title: 'Produtos',
          type: 'item',
          url: '/rfid/produto',
          icon: icons.IconBox,
          breadcrumbs: false,
          permissionKey: 'CAD_PRODUTO'
        },
        {
          id: 'etiqueta',
          title: 'Etiquetas',
          type: 'item',
          url: '/rfid/modelo-etiqueta',
          icon: icons.IconTags,
          breadcrumbs: false,
          permissionKey: 'CAD_ETIQUETA_MODELO'
        },
        {
          id: 'tag-rfid',
          title: 'Tags RFID',
          type: 'item',
          url: '/rfid/tag-rfid',
          icon: icons.IconDeviceAirtag,
          breadcrumbs: false,
          permissionKey: 'CAD_TAG_RFID'
        }
      ]
    },

    // ── 3. Movimentações ──
    {
      id: 'movimentacoes',
      title: 'Movimentações',
      type: 'collapse',
      icon: icons.IconTransfer,
      children: [
        {
          id: 'movimentacao',
          title: 'Movimentações',
          type: 'item',
          url: '/rfid/movimentacao',
          icon: icons.IconTransfer,
          breadcrumbs: false,
          permissionKey: 'MOV_RFID'
        }
      ]
    },

    // ── 4. Consultas (TBA) ──
    {
      id: 'consultas',
      title: 'Consultas',
      type: 'collapse',
      icon: icons.IconClipboardList,
      children: [
        {
          id: 'posicao-estoque',
          title: 'Posição de Estoque',
          type: 'item',
          url: '/rfid/posicao-estoque',
          icon: icons.IconChartBar,
          breadcrumbs: false,
          permissionKey: 'CON_POSICAO_ESTOQUE'
        },
        {
          id: 'extrato-movimentacao',
          title: 'Extrato de Movimentação',
          type: 'item',
          url: '/rfid/extrato-movimentacao',
          icon: icons.IconClipboardList,
          breadcrumbs: false,
          permissionKey: 'CON_EXTRATO_MOVIMENTACAO'
        },
        {
          id: 'entrada-saida',
          title: 'Entrada e Saída',
          type: 'item',
          url: '/rfid/entrada-saida',
          icon: icons.IconArrowsExchange,
          breadcrumbs: false,
          permissionKey: 'CON_ENTRADA_SAIDA'
        }
      ]
    }
  ]
};

export default rfid;
