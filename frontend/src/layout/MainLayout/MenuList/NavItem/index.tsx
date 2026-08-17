import { Activity, useLayoutEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

// material-ui
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

// project imports
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { tenant } from 'config/tenants';
import useConfig from 'hooks/useConfig';
import type { MenuItem } from 'menu-items/types';

// Cor de realce do item de menu em hover. O item selecionado usa sempre
// `md3.primary`; o hover é o que varia entre as variantes.
const HOVER_ACCENT = `md3.${tenant.accentRole}`;
const HOVER_ON_ACCENT = tenant.accentRole === 'primary' ? 'md3.onPrimary' : 'md3.onSecondary';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface NavItemProps {
  item: MenuItem;
  level: number;
  isParents?: boolean;
  setSelectedID?: () => void;
}

export default function NavItem({ item, level, isParents = false, setSelectedID }: NavItemProps) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef<HTMLElement | null>(null);

  const { pathname } = useLocation();
  const {
    state: { borderRadius }
  } = useConfig();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened ?? false;
  const isSelected = !!matchPath({ path: item?.link ? item.link : (item.url ?? ''), end: true }, pathname);

  const [hoverStatus, setHover] = useState(false);

  const compareSize = () => {
    const compare = ref.current ? ref.current.scrollWidth > ref.current.clientWidth : false;
    setHover(compare);
  };

  useLayoutEffect(() => {
    compareSize();
    window.addEventListener('resize', compareSize);
    return () => window.removeEventListener('resize', compareSize);
  }, []);

  const Icon = item?.icon;
  const itemIcon = Icon ? (
    <Icon stroke={1.5} size={drawerOpen ? '20px' : '24px'} style={{ ...(isParents && { fontSize: 20, stroke: '1.5' }) }} />
  ) : (
    <FiberManualRecordIcon sx={{ width: isSelected ? 8 : 6, height: isSelected ? 8 : 6 }} fontSize={level > 0 ? 'inherit' : 'medium'} />
  );

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const itemHandler = () => {
    if (downMD) handlerDrawerOpen(false);

    if (isParents && setSelectedID) {
      setSelectedID();
    }
  };

  return (
    <>
      <ListItemButton
        {...{ component: Link, to: item.url ?? '' }}
        target={itemTarget}
        disabled={item.disabled}
        disableRipple={!drawerOpen}
        sx={{
          zIndex: 1201,
          borderRadius: `${borderRadius}px`,
          mb: 0.5,
          ...(drawerOpen && level !== 1 && { ml: `${level * 18}px` }),
          ...(!drawerOpen && { pl: 1.25 }),
          // Mantendo EXATAMENTE a estrutura do Berry
          ...((!drawerOpen || level !== 1) && {
            py: level === 1 ? 0 : 1,
            '&:hover': {
              bgcolor: 'md3.surfaceContainerHigh',
              color: HOVER_ACCENT,
              '& .MuiListItemIcon-root': { color: HOVER_ACCENT }
            },
            '&.Mui-selected': {
              '&:hover': { bgcolor: 'md3.surfaceContainerHigh' },
              bgcolor: 'transparent',
              color: 'md3.primary',
              '& .MuiListItemIcon-root': { color: 'md3.primary' }
            }
          }),
          // Cores exclusivas para o modo ABERTO e NÍVEL 1 (no Berry, isso estava em global css/overrides)
          ...(drawerOpen &&
            level === 1 && {
              color: 'md3.onSurface',
              '&:hover': {
                bgcolor: HOVER_ACCENT,
                color: HOVER_ON_ACCENT,
                '& .MuiListItemIcon-root': { color: 'inherit' }
              },
              '&.Mui-selected': {
                bgcolor: 'md3.primary',
                color: 'md3.onPrimary',
                '&:hover': {
                  bgcolor: 'md3.primary',
                  color: 'md3.onPrimary'
                },
                '& .MuiListItemIcon-root': { color: 'inherit' }
              }
            })
        }}
        selected={isSelected}
        onClick={() => itemHandler()}
      >
        <ButtonBase aria-label="theme-icon" sx={{ borderRadius: `${borderRadius}px` }} disableRipple={drawerOpen}>
          <ListItemIcon
            sx={{
              minWidth: level === 1 ? 36 : drawerOpen ? 28 : 36,
              // Cor base para "drawer aberto" ou itens não-nível 1
              color: isSelected ? 'md3.onPrimary' : 'md3.onSurface',
              ...(!drawerOpen &&
                level === 1 && {
                  borderRadius: `${borderRadius}px`,
                  width: 46,
                  height: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Cor base quando "fechado" (Rail style)
                  color: isSelected ? 'md3.onPrimary' : 'md3.onSurface',
                  '& svg': {
                    color: isSelected ? 'md3.onPrimary' : 'inherit'
                  },
                  '&:hover': {
                    bgcolor: isSelected ? 'md3.primary' : HOVER_ACCENT,
                    color: isSelected ? 'md3.onPrimary' : HOVER_ON_ACCENT,
                    '& svg': {
                      color: isSelected ? 'md3.onPrimary' : HOVER_ON_ACCENT
                    }
                  },
                  ...(isSelected && {
                    bgcolor: 'md3.primary',
                    '&:hover': {
                      bgcolor: 'md3.primary',
                      color: 'md3.onPrimary',
                      '& svg': { color: 'md3.onPrimary' }
                    }
                  })
                })
            }}
          >
            {itemIcon}
          </ListItemIcon>
        </ButtonBase>

        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          <Tooltip title={item.title} disableHoverListener={!hoverStatus}>
            <ListItemText
              primary={
                <Typography
                  ref={ref}
                  noWrap
                  variant={isSelected ? 'h5' : 'body1'}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: 102,
                    color: 'inherit'
                  }}
                >
                  {item.title}
                </Typography>
              }
              secondary={
                item.caption && (
                  <Typography
                    variant="caption"
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
                    {item.caption}
                  </Typography>
                )
              }
            />
          </Tooltip>
        )}

        <Activity mode={drawerOpen && item.chip ? 'visible' : 'hidden'}>
          <Chip
            color={item.chip?.color}
            variant={item.chip?.variant}
            size={item.chip?.size}
            label={item.chip?.label}
            avatar={
              <Activity mode={item.chip?.avatar ? 'visible' : 'hidden'}>
                <Avatar>{item.chip?.avatar}</Avatar>
              </Activity>
            }
          />
        </Activity>
      </ListItemButton>
    </>
  );
}
