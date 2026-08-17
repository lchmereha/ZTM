import { type ElementType, type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Card, { type CardProps } from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// project imports
import navigation from 'menu-items';
import type { MenuItem } from 'menu-items/types';

// assets
import AccountTreeTwoToneIcon from '@mui/icons-material/AccountTreeTwoTone';
import HomeIcon from '@mui/icons-material/Home';
import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone';
import { IconChevronRight, IconTallymark1 } from '@tabler/icons-react';

// ==============================|| BREADCRUMBS TITLE ||============================== //

interface BTitleProps {
  title?: string;
}

function BTitle({ title }: BTitleProps) {
  return (
    <Grid>
      <Typography variant="h4" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
    </Grid>
  );
}

// ==============================|| BREADCRUMBS ||============================== //
interface BreadcrumbLink {
  title?: string;
  to?: string;
  icon?: ElementType;
}

interface BreadcrumbsProps extends Omit<CardProps, 'title'> {
  card?: boolean;
  custom?: boolean;
  divider?: boolean;
  heading?: string;
  icon?: boolean;
  icons?: boolean;
  links?: BreadcrumbLink[];
  maxItems?: number;
  rightAlign?: boolean;
  separator?: ElementType;
  title?: boolean;
  titleBottom?: boolean;
  sx?: SxProps<Theme>;
}

const Breadcrumbs = ({
  card,
  custom = false,
  divider = false,
  heading,
  icon = true,
  icons,
  links,
  maxItems,
  rightAlign = true,
  separator = IconChevronRight,
  title = true,
  titleBottom,
  sx,
  ...others
}: BreadcrumbsProps) => {
  const theme = useTheme();
  const location = useLocation();
  const [main, setMain] = useState<MenuItem | undefined>();
  const [item, setItem] = useState<MenuItem | undefined>();

  const iconSX = {
    marginRight: 6,
    marginTop: -2,
    width: '1rem',
    height: '1rem',
    color: theme.vars?.palette.secondary.main
  };

  const linkSX = {
    display: 'flex',
    textDecoration: 'none',
    alignContent: 'center',
    alignItems: 'center'
  };

  const customLocation = location.pathname;

  // set active item state
  const getCollapse = (menu: MenuItem) => {
    if (!custom && menu.children) {
      menu.children.filter((collapse) => {
        if (collapse.type && collapse.type === 'collapse') {
          getCollapse(collapse);
          if (collapse.url === customLocation) {
            setMain(collapse);
            setItem(collapse);
          }
        } else if (collapse.type && collapse.type === 'item') {
          if (customLocation === collapse.url) {
            setMain(menu);
            setItem(collapse);
          }
        }
        return false;
      });
    }
  };

  useEffect(() => {
    navigation?.items?.map((menu: MenuItem) => {
      if (menu.type && menu.type === 'group') {
        if (menu?.url && menu.url === customLocation) {
          setMain(menu);
          setItem(menu);
        } else {
          getCollapse(menu);
        }
      }
      return false;
    });
  });

  // item separator
  const SeparatorIcon = separator;
  const separatorIcon = separator ? <SeparatorIcon stroke={1.5} size="16px" /> : <IconTallymark1 stroke={1.5} size="16px" />;

  let mainContent: ReactNode;
  let itemContent: ReactNode;
  let breadcrumbContent: ReactNode = <Typography />;
  let itemTitle = '';
  let CollapseIcon: ElementType;
  let ItemIcon: ElementType;

  // collapse item
  if (main && main.type === 'collapse') {
    CollapseIcon = main.icon ? main.icon : AccountTreeTwoToneIcon;
    mainContent = (
      <Typography
        {...(main.url && { component: Link, to: main.url })}
        variant="h6"
        noWrap
        sx={{
          overflow: 'hidden',
          lineHeight: 1.5,
          mb: -0.625,
          textOverflow: 'ellipsis',
          maxWidth: { xs: 102, sm: 'unset' },
          display: 'inline-block'
        }}
        color={window.location.pathname === main.url ? 'text.primary' : 'text.secondary'}
      >
        {icons && <CollapseIcon style={{ ...iconSX }} />}
        {main.title}
      </Typography>
    );
  }

  if (!custom && main && main.type === 'collapse' && main.breadcrumbs === true) {
    breadcrumbContent = (
      <Card sx={card === false ? { mb: 3, bgcolor: 'transparent', ...sx } : { mb: 3, bgcolor: 'background.default', ...sx }} {...others}>
        <Box sx={{ p: 1.25, px: card === false ? 0 : 2 }}>
          <Grid
            container
            sx={{
              flexDirection: rightAlign ? 'row' : 'column',
              justifyContent: rightAlign ? 'space-between' : 'flex-start',
              alignItems: rightAlign ? 'center' : 'flex-start'
            }}
            spacing={1}
          >
            {title && !titleBottom && <BTitle title={main.title} />}
            <Grid>
              <MuiBreadcrumbs
                aria-label="breadcrumb"
                maxItems={maxItems || 8}
                separator={separatorIcon}
                sx={{ '& .MuiBreadcrumbs-separator': { width: 16, ml: 1.25, mr: 1.25 } }}
              >
                <Typography component={Link} to="/" variant="h6" sx={{ ...linkSX, color: 'text.secondary' }}>
                  {icons && <HomeTwoToneIcon style={iconSX} />}
                  {icon && !icons && <HomeIcon style={{ ...iconSX, marginRight: 0 }} />}
                  {(!icon || icons) && 'Dashboard'}
                </Typography>
                {mainContent}
              </MuiBreadcrumbs>
            </Grid>
            {title && titleBottom && <BTitle title={main.title} />}
          </Grid>
        </Box>
        {card === false && divider !== false && <Divider sx={{ mt: 2 }} />}
      </Card>
    );
  }

  // items
  if ((item && item.type === 'item') || (item?.type === 'group' && item?.url) || custom) {
    itemTitle = item?.title || '';

    ItemIcon = item?.icon ? item.icon : AccountTreeTwoToneIcon;
    itemContent = (
      <Typography
        variant="h6"
        noWrap
        sx={{
          ...linkSX,
          color: 'text.secondary',
          display: 'inline-block',
          overflow: 'hidden',
          lineHeight: 1.5,
          mb: -0.625,
          textOverflow: 'ellipsis',
          maxWidth: { xs: 102, sm: 'unset' }
        }}
      >
        {icons && <ItemIcon style={{ ...iconSX }} />}
        {itemTitle}
      </Typography>
    );

    let tempContent = (
      <MuiBreadcrumbs
        aria-label="breadcrumb"
        maxItems={maxItems || 8}
        separator={separatorIcon}
        sx={{ '& .MuiBreadcrumbs-separator': { width: 16, mx: 0.75 } }}
      >
        <Typography component={Link} to="/" variant="h6" sx={{ ...linkSX, color: 'text.secondary' }}>
          {icons && <HomeTwoToneIcon style={{ ...iconSX }} />}
          {icon && !icons && <HomeIcon style={{ ...iconSX, marginRight: 0 }} />}
          {(!icon || icons) && 'Dashboard'}
        </Typography>
        {mainContent}
        {itemContent}
      </MuiBreadcrumbs>
    );

    if (custom && links && links?.length > 0) {
      tempContent = (
        <MuiBreadcrumbs
          aria-label="breadcrumb"
          maxItems={maxItems || 8}
          separator={separatorIcon}
          sx={{ '& .MuiBreadcrumbs-separator': { width: 16, ml: 1.25, mr: 1.25 } }}
        >
          {links?.map((link) => {
            CollapseIcon = link.icon ? link.icon : AccountTreeTwoToneIcon;

            return (
              <Typography
                key={link.to || link.title}
                {...(link.to && { component: Link, to: link.to })}
                variant="h6"
                sx={{ ...linkSX, color: 'text.secondary' }}
              >
                {link.icon && <CollapseIcon style={iconSX} />}
                {link.title}
              </Typography>
            );
          })}
        </MuiBreadcrumbs>
      );
    }

    // main
    if (item?.breadcrumbs !== false || custom) {
      breadcrumbContent = (
        <Card
          sx={
            card === false
              ? { mb: 3, bgcolor: 'transparent', ...sx }
              : {
                  mb: 3,
                  bgcolor: 'background.default',
                  ...sx
                }
          }
          {...others}
        >
          <Box sx={{ p: 1.25, px: card === false ? 0 : 2 }}>
            <Grid
              container
              sx={{
                flexDirection: rightAlign ? 'row' : 'column',
                justifyContent: rightAlign ? 'space-between' : 'flex-start',
                alignItems: rightAlign ? 'center' : 'flex-start'
              }}
              spacing={1}
            >
              {title && !titleBottom && <BTitle title={custom ? heading : item?.title} />}
              <Grid>{tempContent}</Grid>
              {title && titleBottom && <BTitle title={custom ? heading : item?.title} />}
            </Grid>
          </Box>
          {card === false && divider !== false && <Divider sx={{ mt: 2 }} />}
        </Card>
      );
    }
  }

  return breadcrumbContent;
};

export default Breadcrumbs;
