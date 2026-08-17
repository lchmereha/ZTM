import { type ElementType } from 'react';

// ==============================|| MENU ITEM TYPES ||============================== //

export interface MenuChip {
  label: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
  avatar?: string;
}

export interface MenuItem {
  id: string;
  title?: string;
  type?: 'group' | 'collapse' | 'item';
  url?: string;
  link?: string;
  icon?: ElementType;
  children?: MenuItem[];
  breadcrumbs?: boolean;
  caption?: string;
  chip?: MenuChip;
  disabled?: boolean;
  external?: boolean;
  target?: boolean;
  permissionKey?: string;
  roles?: string[];
  expanded?: boolean;
  defaultExpand?: boolean;
}

/** Wrapper used by NavGroup when merging remaining overflow items */
export interface MenuGroupRemainder {
  elements: MenuItem[];
}

export interface MenuGroup {
  items: MenuItem[];
}
