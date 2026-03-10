/**
 * DarkVeil core engine — injects CSS filter dark mode at document_start.
 */
(function () {
  const DV = window.DarkVeil || {};
  const CSS_CLASS = DV.CSS_CLASS || 'darkveil-active';
  const STYLE_ID = DV.STYLE_ID || 'darkveil-style';

  /**
   * Build the dark mode stylesheet string from settings.
   */
  function buildCSS(settings = {}) {
    const brightness = (settings.brightness || 100) / 100;
    const contrast = (settings.contrast || 100) / 100;
    const sepia = (settings.sepia || 0) / 100;

    return `
      html.${CSS_CLASS} {
        filter: invert(1) hue-rotate(180deg)
                brightness(${brightness})
                contrast(${contrast})
                sepia(${sepia}) !important;
        background-color: #111 !important;
      }

      html.${CSS_CLASS} img,
      html.${CSS_CLASS} video,
      html.${CSS_CLASS} canvas,
      html.${CSS_CLASS} svg image,
      html.${CSS_CLASS} picture,
      html.${CSS_CLASS} [style*="background-image"],
      html.${CSS_CLASS} .darkveil-preserve,
      html.${CSS_CLASS} [role="img"],
      html.${CSS_CLASS} figure img,
      html.${CSS_CLASS} input[type="color"],
      html.${CSS_CLASS} embed,
      html.${CSS_CLASS} object {
        filter: invert(1) hue-rotate(180deg) !important;
      }

      @media print {
        html.${CSS_CLASS} {
          filter: none !important;
          background-color: unset !important;
        }
        html.${CSS_CLASS} img,
        html.${CSS_CLASS} video,
        html.${CSS_CLASS} canvas,
        html.${CSS_CLASS} svg image,
        html.${CSS_CLASS} picture,
        html.${CSS_CLASS} [style*="background-image"],
        html.${CSS_CLASS} .darkveil-preserve,
        html.${CSS_CLASS} [role="img"],
        html.${CSS_CLASS} figure img,
        html.${CSS_CLASS} input[type="color"],
        html.${CSS_CLASS} embed,
        html.${CSS_CLASS} object {
          filter: none !important;
        }
      }
    `;
  }

  /**
   * Inject or update the DarkVeil <style> element.
   */
  function injectStyle(settings) {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.setAttribute('data-darkveil', 'true');
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = buildCSS(settings);
  }

  /**
   * Enable dark mode on the page.
   */
  function enable(settings) {
    injectStyle(settings);
    document.documentElement.classList.add(CSS_CLASS);
  }

  /**
   * Disable dark mode on the page.
   */
  function disable() {
    document.documentElement.classList.remove(CSS_CLASS);
  }

  /**
   * Update filter settings without toggling state.
   */
  function updateSettings(settings) {
    injectStyle(settings);
  }

  /**
   * Check if dark mode is currently active.
   */
  function isActive() {
    return document.documentElement.classList.contains(CSS_CLASS);
  }

  // Expose the engine API
  DV.engine = { enable, disable, updateSettings, isActive, buildCSS, injectStyle };
  window.DarkVeil = DV;

  // --- Initialization ---

  // Immediately inject the style so it's ready before first paint.
  injectStyle();

  // Load stored settings and apply if enabled for this domain.
  const domain = DV.utils ? DV.utils.getDomain(location.href) : location.hostname;

  chrome.storage.local.get('darkveil_cache', (cache) => {
    const cached = cache?.darkveil_cache?.[domain];
    if (cached && cached.enabled !== false) {
      enable(cached);
    } else if (!cached) {
      // No cache — read from sync storage
      DV.storage?.getSettingsForDomain(domain).then((settings) => {
        if (settings.enabled) {
          enable(settings);
        }
      });
    }
  });

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'darkveil-toggle':
        if (isActive()) {
          disable();
        } else {
          enable(message.settings || {});
        }
        sendResponse({ active: isActive() });
        break;

      case 'darkveil-set-state':
        if (message.enabled) {
          enable(message.settings || {});
        } else {
          disable();
        }
        sendResponse({ active: isActive() });
        break;

      case 'darkveil-update-settings':
        updateSettings(message.settings || {});
        sendResponse({ active: isActive() });
        break;

      case 'darkveil-get-state':
        sendResponse({ active: isActive(), domain });
        break;
    }
  });

  // Listen for storage changes to react to settings updates from other tabs/popup
  DV.storage?.onChanged((newSettings) => {
    if (!newSettings) return;
    const siteEnabled = DV.storage.isDomainEnabled(newSettings, domain);
    if (siteEnabled && !isActive()) {
      enable(newSettings);
    } else if (!siteEnabled && isActive()) {
      disable();
    } else if (isActive()) {
      updateSettings(newSettings);
    }
  });
})();
