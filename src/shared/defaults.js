/**
 * DarkVeil default settings and constants.
 */
const DarkVeil = window.DarkVeil || {};

DarkVeil.DEFAULTS = {
  globalEnabled: true,
  brightness: 100,
  contrast: 100,
  sepia: 0,
  mode: 'filter',
  siteSettings: {},
  whitelist: [],
  blacklist: []
};

DarkVeil.CSS_CLASS = 'darkveil-active';
DarkVeil.STYLE_ID = 'darkveil-style';
DarkVeil.LUMINANCE_THRESHOLD = 0.2;

window.DarkVeil = DarkVeil;
