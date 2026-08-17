import { argbFromHex, themeFromSourceColor } from '@material/material-color-utilities';

import { useMemo } from 'react';

// material-ui
import CssBaseline from '@mui/material/CssBaseline';
import { ptBR } from '@mui/material/locale';
import { createTheme, StyledEngineProvider, ThemeProvider, type Direction, type Palette } from '@mui/material/styles';

import type { CustomShadowsType } from './custom-shadows';

declare module '@mui/material/styles' {
  interface ThemeVars {
    customShadows: CustomShadowsType;
  }
  interface Theme {
    customShadows: CustomShadowsType;
  }
  interface ThemeOptions {
    customShadows?: CustomShadowsType;
  }
}

// project imports
import { DEFAULT_APP_COLOR, DEFAULT_THEME_MODE } from 'config';
import { tenant } from 'config/tenants';
import { useAuth } from 'contexts/AuthContext';
import useConfig from 'hooks/useConfig';
import CustomShadows from './custom-shadows';
import componentsOverrides from './overrides';
import { buildPalette } from './palette';
import Typography from './typography';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

interface ThemeCustomizationProps {
  children: React.ReactNode;
}

export default function ThemeCustomization({ children }: ThemeCustomizationProps) {
  const { branding } = useAuth();
  const {
    state: { borderRadius, fontFamily }
  } = useConfig();

  // Motores de cores independentes para augmentColor funcionar corretamente em cada modo
  // Eles não devem depender do 'mode' reativo para evitar cross-contamination nas paletas geradas
  const lightBase = useMemo(() => createTheme({ palette: { mode: 'light', contrastThreshold: 3, tonalOffset: 0.2 } }), []);
  const darkBase = useMemo(() => createTheme({ palette: { mode: 'dark', contrastThreshold: 3, tonalOffset: 0.2 } }), []);

  const m3Theme = useMemo(() => {
    // Variantes white-label ignoram o branding por empresa: a marca é fixa.
    const seed = argbFromHex((tenant.useDatabaseBranding && branding?.primaryColor) || DEFAULT_APP_COLOR);
    return themeFromSourceColor(seed);
  }, [branding]);

  const colorSchemes = useMemo(() => {
    const lightPalette = buildPalette('light', m3Theme, lightBase);
    const darkPalette = buildPalette('dark', m3Theme, darkBase);
    return {
      light: {
        palette: lightPalette,
        customShadows: CustomShadows(lightPalette, 'light')
      },
      dark: {
        palette: darkPalette,
        customShadows: CustomShadows(darkPalette, 'dark')
      }
    };
  }, [m3Theme, lightBase, darkBase]);

  const themeTypography = useMemo(() => Typography(fontFamily), [fontFamily]);

  const themeOptions = useMemo(
    () => ({
      ptBR,
      direction: 'ltr' as Direction,
      mixins: {
        toolbar: {
          minHeight: '48px',
          padding: '16px',
          '@media (min-width: 600px)': {
            minHeight: '48px'
          }
        }
      },
      typography: themeTypography,
      colorSchemes,
      customShadows: CustomShadows(colorSchemes.light.palette as Palette, 'light'),
      cssVariables: {
        cssVarPrefix: '',
        colorSchemeSelector: 'data-color-scheme'
      }
    }),
    [themeTypography, colorSchemes]
  );

  const themes = useMemo(() => {
    const t = createTheme(themeOptions);
    t.components = componentsOverrides(t, borderRadius);
    return t;
  }, [themeOptions, borderRadius]);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider disableTransitionOnChange theme={themes} defaultMode={DEFAULT_THEME_MODE}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
