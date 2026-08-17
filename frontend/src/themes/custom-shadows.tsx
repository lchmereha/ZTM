import type { Palette, PaletteMode } from '@mui/material/styles';

// project imports
import { withAlpha } from 'utils/colorUtils';

// ==============================|| DEFAULT THEME - CUSTOM SHADOWS ||============================== //

export interface CustomShadowsType {
  z1: string;
  z8: string;
  z12: string;
  z16: string;
  z20: string;
  z24: string;
  primary: string;
  secondary: string;
  orange: string;
  success: string;
  warning: string;
  error: string;
}

function createCustomShadow(palette: Palette, baseColor: string) {
  const transparent = withAlpha(baseColor, 0.24);
  const commonShadow = (color: string) => `0px 12px 14px 0px ${withAlpha(color, 0.3)}`;

  return {
    z1: `0 1px 2px 0 ${transparent}`,
    z8: `0 8px 16px 0 ${transparent}`,
    z12: `0 12px 24px 0 ${transparent}, 0 10px 20px 0 ${transparent}`,
    z16: `0 0 3px 0 ${transparent}, 0 14px 28px -5px ${transparent}`,
    z20: `0 0 3px 0 ${transparent}, 0 18px 36px -5px ${transparent}`,
    z24: `0 0 6px 0 ${transparent}, 0 21px 44px 0 ${transparent}`,

    primary: commonShadow(palette.primary.main),
    secondary: commonShadow(palette.secondary.main),
    orange: commonShadow(palette.orange.main),
    success: commonShadow(palette.success.main),
    warning: commonShadow(palette.warning.main),
    error: commonShadow(palette.error.main)
  };
}

export default function CustomShadows(palette: Palette, _mode: PaletteMode) {
  const baseColor = palette.grey[900];
  return createCustomShadow(palette, baseColor);
}
