import { Activity, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { useGetMenuMaster } from 'api/menu';
import { tenant } from 'config/tenants';
import { useAuth } from 'contexts/AuthContext';

const ACCENT_MAIN = `${tenant.accentRole}.main`;
const ACCENT_LIGHT = `${tenant.accentRole}.light`;
import useConfig from 'hooks/useConfig';
import useMenuCollapse from 'hooks/useMenuCollapse';
import type { MenuItem } from 'menu-items/types';
import Transitions from 'ui-component/extended/Transitions';
import NavItem from '../NavItem';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { IconChevronDown, IconChevronRight, IconChevronUp } from '@tabler/icons-react';

interface NavCollapseProps {
  menu: MenuItem;
  level: number;
  parentId: string;
}

export default function NavCollapse({ menu, level, parentId }: NavCollapseProps) {
  const theme = useTheme();
  const ref = useRef<HTMLElement | null>(null);
  const { user } = useAuth();

  const {
    state: { borderRadius }
  } = useConfig();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClickMini = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setAnchorEl(null);
    if (drawerOpen) {
      setOpen(!open);
      setSelected(!selected ? menu.id : null);
    } else {
      setAnchorEl(event?.currentTarget);
    }
  };

  const openMini = Boolean(anchorEl);

  const handleMiniClose = () => {
    setAnchorEl(null);
  };

  const handleClosePopper = () => {
    setOpen(false);
    if (!openMini) {
      if (!menu.url) {
        setSelected(null);
      }
    }
    setAnchorEl(null);
  };

  const { pathname } = useLocation();

  // menu collapse for sub-levels
  useMenuCollapse(menu, pathname, openMini, setSelected, setOpen, setAnchorEl);

  const [hoverStatus, setHover] = useState(false);

  const compareSize = () => {
    const compare = !!(ref.current && ref.current.scrollWidth > ref.current.clientWidth);
    setHover(compare);
  };

  useLayoutEffect(() => {
    compareSize();
    window.addEventListener('resize', compareSize);
    return () => window.removeEventListener('resize', compareSize);
  }, []);

  useEffect(() => {
    if (menu.url === pathname) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing state with URL (external system)
      setSelected(menu.id);
      setAnchorEl(null);
      setOpen(true);
    }
  }, [pathname, menu]);

  // ── Permission filtering (mirrors NavGroup logic) ──
  const userRegra = user?.regra || 'OPERADOR';

  const visibleChildren = menu.children?.filter((child) => {
    if (userRegra === 'ADMIN') return true;
    if (child.permissionKey) {
      const hasPermission = user?.permissoes?.find((p) => p.chave === child.permissionKey && p.podeVisualizar);
      if (!hasPermission) return false;
    }
    if (!child.roles || child.roles.length === 0) return true;
    return child.roles.includes(userRegra);
  });

  // Hide entire collapse group when no children are visible
  if (!visibleChildren || visibleChildren.length === 0) return null;

  // menu collapse & item
  const menus = visibleChildren.map((item) => {
    switch (item.type) {
      case 'collapse':
        return <NavCollapse key={item.id} menu={item} level={level + 1} parentId={parentId} />;
      case 'item':
        return <NavItem key={item.id} item={item} level={level + 1} />;
      default:
        return (
          <Typography key={item.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
            Menu Items Error
          </Typography>
        );
    }
  });

  const isSelected = selected === menu.id;

  const Icon = menu.icon;
  const menuIcon = Icon ? (
    <Icon strokeWidth={1.5} size={drawerOpen ? '20px' : '24px'} />
  ) : (
    <FiberManualRecordIcon
      sx={{
        width: isSelected ? 8 : 6,
        height: isSelected ? 8 : 6
      }}
      fontSize={level > 0 ? 'inherit' : 'medium'}
    />
  );

  const collapseIcon = drawerOpen ? (
    <IconChevronUp stroke={1.5} size="16px" style={{ marginTop: 'auto', marginBottom: 'auto' }} />
  ) : (
    <IconChevronRight stroke={1.5} size="16px" style={{ marginTop: 'auto', marginBottom: 'auto' }} />
  );

  return (
    <>
      <ListItemButton
        sx={{
          zIndex: 1201,
          borderRadius: `${borderRadius}px`,
          mb: 0.5,
          ...(drawerOpen && level !== 1 && { ml: `${level * 18}px` }),
          ...(!drawerOpen && { pl: 1.25 }),
          ...((!drawerOpen || level !== 1) && {
            py: level === 1 ? 0 : 1,
            '&:hover': { bgcolor: 'transparent' },
            '&.Mui-selected': { '&:hover': { bgcolor: 'transparent' }, bgcolor: 'transparent' }
          })
        }}
        selected={isSelected}
        {...(!drawerOpen && { onMouseEnter: handleClickMini, onMouseLeave: handleMiniClose })}
        className={anchorEl ? 'Mui-selected' : ''}
        onClick={handleClickMini}
      >
        <Activity mode={menuIcon ? 'visible' : 'hidden'}>
          <ListItemIcon
            sx={{
              minWidth: level === 1 ? 36 : 24,
              color: isSelected ? ACCENT_MAIN : 'text.primary',
              ...(!drawerOpen &&
                level === 1 && {
                  borderRadius: `${borderRadius}px`,
                  width: 46,
                  height: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': { bgcolor: ACCENT_LIGHT },

                  ...((isSelected || anchorEl) && {
                    bgcolor: ACCENT_LIGHT,
                    '&:hover': { bgcolor: ACCENT_LIGHT }
                  })
                })
            }}
          >
            {menuIcon}
          </ListItemIcon>
        </Activity>
        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          <Tooltip title={menu.title} disableHoverListener={!hoverStatus}>
            <ListItemText
              primary={
                <Typography
                  ref={ref}
                  noWrap
                  variant={isSelected || anchorEl ? 'h5' : 'body1'}
                  sx={{
                    color: 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: 120
                  }}
                >
                  {menu.title}
                </Typography>
              }
              secondary={
                menu.caption && (
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
                    {menu.caption}
                  </Typography>
                )
              }
            />
          </Tooltip>
        )}

        {openMini || open ? collapseIcon : <IconChevronDown stroke={1.5} size="16px" style={{ marginTop: 'auto', marginBottom: 'auto' }} />}

        <Activity mode={!drawerOpen ? 'visible' : 'hidden'}>
          <Popper
            open={openMini}
            anchorEl={anchorEl}
            placement="right-start"
            modifiers={[
              {
                name: 'offset',
                options: {
                  offset: [-12, 0]
                }
              }
            ]}
            sx={{
              overflow: 'visible',
              zIndex: 2001,
              minWidth: 180,
              '&:before': {
                content: '""',
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 120,
                borderLeft: `1px solid`,
                borderBottom: `1px solid`,
                borderColor: 'divider'
              }
            }}
          >
            {({ TransitionProps }) => (
              <Transitions in={openMini} {...TransitionProps}>
                <Paper
                  sx={{
                    overflow: 'hidden',
                    boxShadow: theme.shadows[8],
                    backgroundImage: 'none'
                  }}
                >
                  <ClickAwayListener onClickAway={handleClosePopper}>
                    <Box>{menus}</Box>
                  </ClickAwayListener>
                </Paper>
              </Transitions>
            )}
          </Popper>
        </Activity>
      </ListItemButton>
      <Activity mode={drawerOpen ? 'visible' : 'hidden'}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Activity mode={open ? 'visible' : 'hidden'}>
            <List
              disablePadding
              sx={{
                position: 'relative',
                '&:after': {
                  content: "''",
                  position: 'absolute',
                  left: '25px',
                  top: 0,
                  height: '100%',
                  width: '1px',
                  opacity: 1,
                  bgcolor: 'primary.light'
                }
              }}
            >
              {menus}
            </List>
          </Activity>
        </Collapse>
      </Activity>
    </>
  );
}
