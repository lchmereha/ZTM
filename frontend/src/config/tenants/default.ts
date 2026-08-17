import type { TenantConfig } from './types';

/**
 * ZTM padrão: identidade da ZZTech, com branding por empresa vindo do banco.
 */
const defaultTenant: TenantConfig = {
  id: 'default',
  name: 'ZTM',
  seedColor: '#F07E23',
  defaultThemeMode: 'system',
  useDatabaseBranding: true,
  logo: null,
  logoAlt: 'ZTM',
  allowThemeToggle: true,
  accentRole: 'secondary',
  chromeSurface: 'surfaceContainer'
};

export default defaultTenant;
