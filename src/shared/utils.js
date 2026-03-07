/**
 * DarkVeil shared utilities.
 */
const DarkVeil = window.DarkVeil || {};

DarkVeil.utils = {
  /**
   * Extract the domain from a URL string.
   */
  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  },

  /**
   * Linearize an sRGB channel value (0-255) to linear RGB (0-1).
   */
  srgbToLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  },

  /**
   * Compute relative luminance from an RGB color string like "rgb(r, g, b)".
   * Returns a value between 0 (black) and 1 (white).
   */
  rgbToLuminance(rgbString) {
    if (!rgbString || rgbString === 'transparent' || rgbString === 'rgba(0, 0, 0, 0)') {
      return null;
    }
    const match = rgbString.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;

    const r = DarkVeil.utils.srgbToLinear(parseInt(match[1], 10));
    const g = DarkVeil.utils.srgbToLinear(parseInt(match[2], 10));
    const b = DarkVeil.utils.srgbToLinear(parseInt(match[3], 10));

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Parse a CSS color string to an {r, g, b} object.
   */
  parseColor(colorString) {
    const match = colorString.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }
};

window.DarkVeil = DarkVeil;
