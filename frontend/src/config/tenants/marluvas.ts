import marluvasLogo from 'assets/images/marluvas-logo.png';
import type { TenantConfig } from './types';

/**
 * Variante white-label da Marluvas: identidade fixa, sempre no escuro, com
 * superfícies próprias e acento laranja da marca.
 */
const marluvasTenant: TenantConfig = {
  id: 'marluvas',
  name: 'Marluvas',
  seedColor: '#4A90D9',
  defaultThemeMode: 'dark',
  // A marca é da Marluvas em qualquer empresa cadastrada — o branding por
  // empresa do banco não se aplica a esta variante.
  useDatabaseBranding: false,
  logo: marluvasLogo,
  logoAlt: 'Marluvas',
  allowThemeToggle: false,
  accentRole: 'primary',
  chromeSurface: 'surfaceBright',
  darkOverrides: {
    surfaces: {
      surface: '#1C1C1C',
      surfaceDim: '#151515',
      surfaceBright: '#2A2A2A',
      surfaceContainerLowest: '#121212',
      surfaceContainerLow: '#162030',
      surfaceContainer: '#0D2137',
      surfaceContainerHigh: '#132B42',
      surfaceContainerHighest: '#19354D',
      background: '#1C1C1C'
    },
    backgroundPaper: '#0D2137',
    backgroundDefault: '#1C1C1C',
    secondarySeed: '#F09A00'
  }
};

export default marluvasTenant;
