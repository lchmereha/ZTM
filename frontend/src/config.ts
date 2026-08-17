import { tenant } from 'config/tenants';

export const DASHBOARD_PATH = '/';
export const DEFAULT_THEME_MODE = tenant.defaultThemeMode;
export const DEFAULT_APP_COLOR = tenant.seedColor;

export const CSS_VAR_PREFIX = '';

const config = {
  fontFamily: `'Poppins', sans-serif`,
  borderRadius: 8,
  miniDrawer: false,
  container: false
};

export default config;
