import {
  argbFromHex,
  Hct,
  hexFromArgb,
  MaterialDynamicColors,
  SchemeTonalSpot,
  TonalPalette,
  type Theme
} from '@material/material-color-utilities';
import { grey } from '@mui/material/colors';
import { tenant } from 'config/tenants';
import { darken, lighten, type Theme as MuiTheme, type Palette, type PaletteMode, type PaletteOptions } from '@mui/material/styles';

// project imports
import { extendPaletteWithChannels } from 'utils/colorUtils';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

declare module '@mui/material/styles' {
  interface Palette {
    orange: Palette['primary'];
    md3: Md3Palette;
  }

  interface PaletteOptions {
    orange?: PaletteOptions['primary'];
    md3?: Md3Palette;
  }

  interface PaletteColor {
    200?: string;
    800?: string;
  }

  interface SimplePaletteColorOptions {
    200?: string;
    800?: string;
  }

  interface TypeText {
    dark?: string;
    hint?: string;
    heading?: string;
  }

  interface CommonColors {
    source: PaletteColor;
  }
}

export interface Md3Palette {
  primaryPaletteKeyColor: string;
  secondaryPaletteKeyColor: string;
  tertiaryPaletteKeyColor: string;
  neutralPaletteKeyColor: string;
  neutralVariantPaletteKeyColor: string;
  errorPaletteKeyColor: string;
  background: string;
  onBackground: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  surfaceTint: string;
  primary: string;
  primaryDim: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  inversePrimary: string;
  secondary: string;
  secondaryDim: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryDim: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  errorDim: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;
  highestSurface: string;
}

const MD3_STANDARD_ROLES: (keyof Omit<Md3Palette, 'highestSurface'>)[] = [
  'primaryPaletteKeyColor',
  'secondaryPaletteKeyColor',
  'tertiaryPaletteKeyColor',
  'neutralPaletteKeyColor',
  'neutralVariantPaletteKeyColor',
  'errorPaletteKeyColor',
  'background',
  'onBackground',
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'shadow',
  'scrim',
  'surfaceTint',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
  'primary',
  'primaryDim',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'secondary',
  'secondaryDim',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'tertiary',
  'tertiaryDim',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'error',
  'errorDim',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'primaryFixed',
  'primaryFixedDim',
  'onPrimaryFixed',
  'onPrimaryFixedVariant',
  'secondaryFixed',
  'secondaryFixedDim',
  'onSecondaryFixed',
  'onSecondaryFixedVariant',
  'tertiaryFixed',
  'tertiaryFixedDim',
  'onTertiaryFixed',
  'onTertiaryFixedVariant'
];

export function buildPalette(mode: PaletteMode, theme: Theme, muiTheme: MuiTheme): Palette {
  const isDark = mode === 'dark';
  const dark = tenant.darkOverrides;
  const hct = Hct.fromInt(theme.source);

  const scheme = new SchemeTonalSpot(hct, isDark, 0.0);
  const mdc = new MaterialDynamicColors();

  const hexScheme = {} as Md3Palette;

  // Processamento automático dos papéis padrão
  MD3_STANDARD_ROLES.forEach((role) => {
    try {
      const dynamicColor = mdc[role]();
      if (dynamicColor) {
        hexScheme[role] = hexFromArgb(dynamicColor.getArgb(scheme));
      }
    } catch (e) {
      // eslint-disable-next-line no-console -- MD3 palette fallback: log unresolvable color roles
      console.warn(`[MD3] Failed to resolve role: ${role}`, e);
    }
  });

  // Processamento especial do highestSurface (requer scheme como argumento)
  try {
    hexScheme.highestSurface = hexFromArgb(mdc.highestSurface(scheme).getArgb(scheme));
  } catch (e) {
    // eslint-disable-next-line no-console -- MD3 palette fallback: log unresolvable color roles
    console.warn('[MD3] Failed to resolve role: highestSurface', e);
  }

  const primary = muiTheme.palette.augmentColor({
    color: {
      main: hexScheme.primary
    }
  });

  const secondary = muiTheme.palette.augmentColor({
    color: {
      main: hexScheme.secondary
    }
  });

  const paletteOptions: PaletteOptions = {
    mode,
    primary: {
      ...primary,
      200: lighten(primary.main, 0.4),
      800: darken(primary.main, 0.4)
    },
    secondary: {
      ...secondary,
      200: lighten(secondary.main, 0.4),
      800: darken(secondary.main, 0.4)
    },
    error: muiTheme.palette.augmentColor({ color: { main: hexScheme.error } }),
    orange: muiTheme.palette.augmentColor({ color: { main: '#ffab91' } }),
    warning: muiTheme.palette.augmentColor({ color: { main: '#ffe57f' } }),
    success: muiTheme.palette.augmentColor({ color: { main: '#00e676' } }),
    grey,
    text: {
      primary: hexScheme.onSurface,
      secondary: hexScheme.onSurfaceVariant,
      dark: darken(hexScheme.onSurface, 0.2),
      hint: hexScheme.onSecondaryContainer,
      heading: hexScheme.onSurface,
      disabled: hexScheme.outlineVariant
    },
    divider: hexScheme.outline,
    background: {
      paper: (isDark && dark?.backgroundPaper) || hexScheme.surfaceContainer || hexScheme.surface || '#ffffff',
      default: (isDark && dark?.backgroundDefault) || hexScheme.surface || '#f8fafc'
    },
    md3: hexScheme,
    common: {
      black: '#000',
      white: '#fff',
      source: muiTheme.palette.augmentColor({
        color: {
          main: hexFromArgb(theme.source)
        }
      })
    }
  };

  // Ajustes de marca no modo escuro. O esquema gerado a partir de uma única
  // semente não cobre paletas que misturam superfícies neutras com um acento
  // de cor diferente — por isso a variante declara isso explicitamente.
  if (isDark && dark) {
    const md3 = paletteOptions.md3 as Md3Palette;

    if (dark.surfaces) {
      Object.assign(md3, dark.surfaces);
    }

    if (dark.secondarySeed) {
      const seedHct = Hct.fromInt(argbFromHex(dark.secondarySeed));
      const tonal = TonalPalette.fromHueAndChroma(seedHct.hue, seedHct.chroma);

      md3.secondary = hexFromArgb(tonal.tone(80));
      md3.onSecondary = hexFromArgb(tonal.tone(20));
      md3.secondaryContainer = hexFromArgb(tonal.tone(30));
      md3.onSecondaryContainer = hexFromArgb(tonal.tone(90));
      md3.secondaryDim = hexFromArgb(tonal.tone(70));
      md3.secondaryPaletteKeyColor = hexFromArgb(tonal.tone(50));
      md3.secondaryFixed = hexFromArgb(tonal.tone(90));
      md3.secondaryFixedDim = hexFromArgb(tonal.tone(80));
      md3.onSecondaryFixed = hexFromArgb(tonal.tone(10));
      md3.onSecondaryFixedVariant = hexFromArgb(tonal.tone(30));

      // Mantém a paleta `secondary` do MUI em sincronia com a do MD3.
      const augmented = muiTheme.palette.augmentColor({ color: { main: md3.secondary } });
      paletteOptions.secondary = {
        ...augmented,
        200: lighten(augmented.main, 0.4),
        800: darken(augmented.main, 0.4)
      };
    }
  }

  return extendPaletteWithChannels(paletteOptions as Record<string, unknown>) as unknown as Palette;
}
