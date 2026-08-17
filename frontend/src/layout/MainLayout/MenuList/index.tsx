import { Activity, memo, useState } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

// project imports
import menuItems from 'menu-items';
import NavGroup from './NavGroup';
import NavItem from './NavItem';

import { useGetMenuMaster } from 'api/menu';
import { type MenuGroupRemainder, type MenuItem as MenuItemType } from 'menu-items/types';
import { useAuth } from 'contexts/AuthContext';
export type { MenuItemType };

// ==============================|| SIDEBAR MENU LIST ||============================== //

function MenuList() {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;
  const { user } = useAuth();

  const [selectedID, setSelectedID] = useState('');

  const lastItem: number | undefined = undefined;

  // Função recursiva para filtrar os itens do menu
  const filterMenuItems = (menuItemsToFilter: MenuItemType[]): MenuItemType[] => {
    return menuItemsToFilter
      .map((item) => {
        // Se for um grupo ou collapse, filtramos os filhos recursivamente
        if (item.type === 'group' || item.type === 'collapse') {
          const filteredChildren = item.children ? filterMenuItems(item.children) : [];
          return { ...item, children: filteredChildren };
        }
        return item;
      })
      .filter((item) => {
        // Validação de permissão específica (podeVisualizar)
        if (item.permissionKey) {
          if (user?.regra !== 'ADMIN') {
            const perm = user?.permissoes?.find((p) => p.chave === item.permissionKey);
            if (!perm || !perm.podeVisualizar) {
              return false;
            }
          }
        }
        // Validação de roles estáticas legadas (se houver)
        if (item.roles && user?.regra && !item.roles.includes(user.regra)) {
          return false;
        }

        // Se for grupo ou collapse, só exibir se tiver pelo menos um filho visível após o filtro
        if (item.type === 'group' || item.type === 'collapse') {
          return item.children && item.children.length > 0;
        }

        return true;
      });
  };

  const rawItems = menuItems.items as MenuItemType[];
  const items = filterMenuItems(rawItems);

  let lastItemIndex = items.length - 1;
  let remItems: MenuGroupRemainder[] = [];
  let lastItemId = '';

  if (lastItem && lastItem < items.length) {
    lastItemId = items[lastItem - 1].id;
    lastItemIndex = lastItem - 1;
    remItems = items.slice(lastItem - 1, items.length).map((item) => ({
      title: item.title,
      elements: item.children ?? [],
      icon: item.icon,
      ...(item.url && {
        url: item.url
      })
    }));
  }

  const navItems = items.slice(0, lastItemIndex + 1).map((item, index) => {
    switch (item.type) {
      case 'group':
        if (item.url && item.id !== lastItemId) {
          return (
            <List key={item.id}>
              <NavItem item={item} level={1} isParents setSelectedID={() => setSelectedID('')} />
              <Activity mode={index !== 0 ? 'visible' : 'hidden'}>
                <Divider sx={{ py: 0.5 }} />
              </Activity>
            </List>
          );
        }

        return (
          <NavGroup
            key={item.id}
            setSelectedID={setSelectedID}
            selectedID={selectedID}
            item={item}
            lastItem={lastItem}
            remItems={remItems}
            lastItemId={lastItemId}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
            Menu Items Error
          </Typography>
        );
    }
  });

  return <Box {...(drawerOpen && { sx: { mt: 1.5 } })}>{navItems}</Box>;
}

export default memo(MenuList);
