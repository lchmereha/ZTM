// material-ui
import { alpha, darken, getContrastRatio, getLuminance, lighten } from '@mui/material/styles';

/**
 * Converts a hex color string to an RGB channel string ("r g b").
 *
 * @param hex - The hex color string (e.g. "#C8FAD6", "#FFF", "#FF00FFAA").
 * @returns The RGB channel string (e.g. "200 250 214").
 * @throws {Error} If the input is not a valid hex color.
 */
export function hexToRgbChannel(hex: string): string {
  let cleaned = hex.replace(/^#/, '');

  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (cleaned.length === 4) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (cleaned.length !== 6 && cleaned.length !== 8) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  return `${r} ${g} ${b}`;
}

/**
 * Extends a palette object by adding RGB channel strings for each hex color.
 *
 * @param palette - The palette object.
 * @returns The extended palette object.
 */
export function extendPaletteWithChannels(palette: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...palette };

  Object.entries(palette).forEach(([k, v]) => {
    if (typeof v === 'string' && v.startsWith('#')) {
      result[`${k}Channel`] = hexToRgbChannel(v);
    } else if (typeof v === 'object' && v !== null) {
      result[k] = extendPaletteWithChannels(v as Record<string, unknown>);
    }
  });

  return result;
}

/**
 * Applies opacity to a color string, supporting normal colors and CSS variables.
 *
 * @param color - The color string.
 * @param opacity - The opacity value (0 to 1).
 * @returns The color string with opacity.
 */
export function withAlpha(color: string, opacity: number): string {
  // Case 1: normal color (hex, rgb, hsl…)
  if (/^#|rgb|hsl|color/i.test(color)) {
    return alpha(color, opacity);
  }

  // Case 2: CSS Var: var(--mui-palette-xxx) or var(--palette-xxx, #hex)
  if (color && typeof color === 'string' && color.startsWith('var(')) {
    // inject "Channel" *before the closing parenthesis of the var name only*
    return color.replace(/(--[a-zA-Z0-9-]+)(.*)\)/, `$1Channel$2)`).replace(/^var\((.+)\)$/, `rgba(var($1) / ${opacity})`);
  }

  // Fallback
  return color;
}

/**
 * Generates a color that provides at least a specified contrast ratio against the base color.
 *
 * @param baseColor - The background color (hex, rgb, etc.)
 * @param contrastRatio - The target contrast ratio (default is 3 for MD3 non-textual guidelines)
 * @returns A legible contrast color
 */
export function getLegibleContrastColor(baseColor: string, contrastRatio: number = 3): string {
  if (!baseColor) return '#000000';

  try {
    const luminance = getLuminance(baseColor);
    const isLight = luminance > 0.5;

    // Iteratively darken/lighten to reach target contrast ratio
    for (let i = 1; i <= 10; i++) {
      const step = i * 0.1;
      const candidate = isLight ? darken(baseColor, step) : lighten(baseColor, step);
      const ratio = getContrastRatio(baseColor, candidate);

      if (ratio >= contrastRatio) return candidate;
    }

    // Fallback if loop doesn't satisfy (should rarely happen as 1.0 step is black/white)
    return isLight ? '#000000' : '#ffffff';
  } catch (err) {
    // eslint-disable-next-line no-console -- Fallback error reporting for color generation failures
    console.error('Error generating contrast color:', err);
    return '#000000';
  }
}
