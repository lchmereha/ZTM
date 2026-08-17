import { Activity, useEffect, useMemo, useRef, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

// material-ui
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

// project imports
import { useGetMenuMaster } from 'api/menu';
import { useAuth } from 'contexts/AuthContext';
import type { MenuGroupRemainder, MenuItem } from 'menu-items/types';
import NavCollapse from '../NavCollapse';
import NavItem from '../NavItem';

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //

interface NavGroupProps {
  item: MenuItem;
  lastItem?: number;
  remItems?: MenuGroupRemainder[];
  lastItemId?: string;
  selectedID?: string | null;
  setSelectedID?: (id: string) => void;
}

export default function NavGroup({ item, lastItem, remItems, lastItemId, setSelectedID }: NavGroupProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;

  const [anchorEl, setAnchorEl] = useState(null);

  // Derived state — replaces useEffect+setState pattern
  const currentItem = useMemo(() => {
    if (lastItem && item.id === lastItemId && remItems) {
      const localItem = { ...item };
      const elements = remItems.map((ele) => ele.elements);
      localItem.children = elements.flat(1);
      return localItem;
    }
    return item;
  }, [item, lastItem, remItems, lastItemId]);

  const openMini = Boolean(anchorEl);

  const checkOpenForParent = (child: MenuItem[], id: string) => {
    child.forEach((ele) => {
      if (ele.children?.length) {
        checkOpenForParent(ele.children, currentItem.id);
      }
      if (ele?.url && !!matchPath({ path: ele?.link ? ele.link : ele.url, end: true }, pathname)) {
        setSelectedID?.(id);
      }
    });
  };

  const checkSelectedOnload = (data: MenuItem) => {
    const childrens = data.children ? data.children : [];
    childrens.forEach((itemCheck) => {
      if (itemCheck?.children?.length) {
        checkOpenForParent(itemCheck.children, currentItem.id);
      }
      if (itemCheck?.url && !!matchPath({ path: itemCheck?.link ? itemCheck.link : itemCheck.url, end: true }, pathname)) {
        setSelectedID?.(currentItem.id);
      }
    });

    if (data?.url && !!matchPath({ path: data?.link ? data.link : data.url, end: true }, pathname)) {
      setSelectedID?.(currentItem.id);
    }
  };

  // Track previous pathname to reset anchorEl on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    checkSelectedOnload(currentItem);
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: reset popper on navigation
      if (openMini) setAnchorEl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentItem]);

  const userRegra = user?.regra || 'OPERADOR';

  // menu list collapse & items
  const items = currentItem.children
    ?.filter((menu) => {
      // Admin always has access to everything
      if (userRegra === 'ADMIN') return true;

      // Check specific permissions if defined
      if (menu.permissionKey) {
        const hasPermission = user?.permissoes?.find((p) => p.chave === menu.permissionKey && p.podeVisualizar);
        if (!hasPermission) return false;
      }

      // Fallback to role-based filtering if no permissionKey
      if (!menu.roles || menu.roles.length === 0) return true;
      return menu.roles.includes(userRegra);
    })
    .map((menu) => {
      switch (menu?.type) {
        case 'collapse':
          return <NavCollapse key={menu.id} menu={menu} level={1} parentId={currentItem.id} />;
        case 'item':
          return <NavItem key={menu.id} item={menu} level={1} />;
        default:
          return (
            <Typography key={menu?.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
              Menu Items Error
            </Typography>
          );
      }
    });

  return (
    <>
      <List
        disablePadding={!drawerOpen}
        subheader={
          currentItem.title &&
          drawerOpen && (
            <Typography
              variant="caption"
              gutterBottom
              sx={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'text.heading',
                padding: 0.75,
                textTransform: 'capitalize',
                marginTop: 1.25
              }}
            >
              {currentItem.title}
              {currentItem.caption && (
                <Typography
                  gutterBottom
                  sx={{
                    display: 'block',
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    textTransform: 'capitalize',
                    lineHeight: 1.66
                  }}
                >
                  {currentItem.caption}
                </Typography>
              )}
            </Typography>
          )
        }
      >
        {items}
      </List>

      {/* group divider */}
      <Activity mode={drawerOpen ? 'visible' : 'hidden'}>
        <Divider sx={{ mt: 0.25, mb: 1.25 }} />
      </Activity>
    </>
  );
}
