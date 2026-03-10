/**
 * DarkVeil dark page detection — avoids double-darkening already-dark pages.
 */
(function () {
  const DV = window.DarkVeil || {};
  const THRESHOLD = DV.LUMINANCE_THRESHOLD || 0.2;

  /**
   * Sample the background luminance of the page.
   * Returns a luminance value (0-1) or null if unable to determine.
   */
  function samplePageLuminance() {
    const utils = DV.utils;
    if (!utils) return null;

    // Sample <html> and <body> background colors
    const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
    const bodyBg = document.body ? getComputedStyle(document.body).backgroundColor : null;

    const htmlLum = utils.rgbToLuminance(htmlBg);
    const bodyLum = bodyBg ? utils.rgbToLuminance(bodyBg) : null;

    // Prefer body luminance if available (more likely to be explicitly set)
    if (bodyLum !== null) return bodyLum;
    if (htmlLum !== null) return htmlLum;

    // Try sampling prominent content elements
    const contentSelectors = ['main', 'article', '[role="main"]', '#content', '.content'];
    for (const selector of contentSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const bg = getComputedStyle(el).backgroundColor;
        const lum = utils.rgbToLuminance(bg);
        if (lum !== null) return lum;
      }
    }

    return null;
  }

  /**
   * Detect if the current page is already dark-themed.
   */
  function isPageDark() {
    const luminance = samplePageLuminance();
    if (luminance === null) return false;
    return luminance < THRESHOLD;
  }

  /**
   * Run detection and cache the result for this domain.
   * If the page is already dark, disable DarkVeil automatically.
   */
  function runDetection() {
    const domain = DV.utils ? DV.utils.getDomain(location.href) : location.hostname;
    const dark = isPageDark();

    if (dark && DV.engine?.isActive()) {
      // Page is already dark — disable to avoid double-inversion
      DV.engine.disable();

      // Cache the detection so we skip this domain next time
      DV.storage?.setSiteSetting(domain, 'autoDetected', true);
      DV.storage?.setSiteSetting(domain, 'enabled', false);
    }

    return dark;
  }

  // Expose detection API
  DV.detection = { samplePageLuminance, isPageDark, runDetection };
  window.DarkVeil = DV;

  // Run detection after DOM is loaded (need computed styles)
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let page styles settle
    setTimeout(runDetection, 300);
  }, { once: true });
})();
