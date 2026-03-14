/**
 * DarkVeil popup controller.
 */
(function () {
  const DEFAULTS = { brightness: 100, contrast: 100, sepia: 0 };

  // DOM elements
  const globalToggle = document.getElementById('globalToggle');
  const siteToggle = document.getElementById('siteToggle');
  const siteDomain = document.getElementById('siteDomain');
  const whitelistBtn = document.getElementById('whitelistBtn');
  const brightness = document.getElementById('brightness');
  const contrast = document.getElementById('contrast');
  const sepia = document.getElementById('sepia');
  const brightnessValue = document.getElementById('brightnessValue');
  const contrastValue = document.getElementById('contrastValue');
  const sepiaValue = document.getElementById('sepiaValue');
  const resetBtn = document.getElementById('resetBtn');
  const optionsBtn = document.getElementById('optionsBtn');

  let currentDomain = '';
  let currentSettings = {};
  let isWhitelisted = false;

  /**
   * Load current state from background/storage.
   */
  async function loadState() {
    // Get state from the active tab's content script
    try {
      const state = await chrome.runtime.sendMessage({ type: 'darkveil-get-state' });
      if (state?.domain) {
        currentDomain = state.domain;
        siteDomain.textContent = currentDomain || '—';
        siteToggle.checked = state.active;
      }
    } catch {
      siteDomain.textContent = '—';
    }

    // Load settings from storage
    try {
      const data = await chrome.storage.sync.get('darkveil');
      currentSettings = data.darkveil || {};
    } catch {
      const data = await chrome.storage.local.get('darkveil');
      currentSettings = data.darkveil || {};
    }

    // Set global toggle
    globalToggle.checked = currentSettings.globalEnabled !== false;

    // Set slider values
    const siteOverrides = currentSettings.siteSettings?.[currentDomain] || {};
    brightness.value = siteOverrides.brightness || currentSettings.brightness || DEFAULTS.brightness;
    contrast.value = siteOverrides.contrast || currentSettings.contrast || DEFAULTS.contrast;
    sepia.value = siteOverrides.sepia ?? currentSettings.sepia ?? DEFAULTS.sepia;

    updateSliderLabels();

    // Check whitelist state
    isWhitelisted = (currentSettings.whitelist || []).includes(currentDomain);
    whitelistBtn.classList.toggle('active', isWhitelisted);
  }

  /**
   * Update slider value labels.
   */
  function updateSliderLabels() {
    brightnessValue.textContent = brightness.value + '%';
    contrastValue.textContent = contrast.value + '%';
    sepiaValue.textContent = sepia.value + '%';
  }

  /**
   * Send updated filter settings to the content script in real time.
   */
  function sendSettingsToTab() {
    const settings = {
      brightness: parseInt(brightness.value, 10),
      contrast: parseInt(contrast.value, 10),
      sepia: parseInt(sepia.value, 10)
    };
    chrome.runtime.sendMessage({
      type: 'darkveil-update-settings',
      settings
    });
  }

  /**
   * Persist slider settings to storage.
   */
  async function saveSliderSettings() {
    const values = {
      brightness: parseInt(brightness.value, 10),
      contrast: parseInt(contrast.value, 10),
      sepia: parseInt(sepia.value, 10)
    };

    try {
      const data = await chrome.storage.sync.get('darkveil');
      const settings = data.darkveil || {};

      if (currentDomain) {
        if (!settings.siteSettings) settings.siteSettings = {};
        if (!settings.siteSettings[currentDomain]) settings.siteSettings[currentDomain] = {};
        Object.assign(settings.siteSettings[currentDomain], values);
      } else {
        Object.assign(settings, values);
      }

      await chrome.storage.sync.set({ darkveil: settings });
    } catch {
      // Fallback to local
      const data = await chrome.storage.local.get('darkveil');
      const settings = data.darkveil || {};
      Object.assign(settings, values);
      await chrome.storage.local.set({ darkveil: settings });
    }
  }

  // --- Event Listeners ---

  // Global toggle
  globalToggle.addEventListener('change', async () => {
    const enabled = globalToggle.checked;
    try {
      const data = await chrome.storage.sync.get('darkveil');
      const settings = data.darkveil || {};
      settings.globalEnabled = enabled;
      await chrome.storage.sync.set({ darkveil: settings });
    } catch {
      const data = await chrome.storage.local.get('darkveil');
      const settings = data.darkveil || {};
      settings.globalEnabled = enabled;
      await chrome.storage.local.set({ darkveil: settings });
    }

    // Toggle the active tab
    chrome.runtime.sendMessage({ type: 'darkveil-toggle' });
    siteToggle.checked = enabled;
  });

  // Site toggle
  siteToggle.addEventListener('change', async () => {
    const enabled = siteToggle.checked;
    if (currentDomain) {
      try {
        const data = await chrome.storage.sync.get('darkveil');
        const settings = data.darkveil || {};
        if (!settings.siteSettings) settings.siteSettings = {};
        if (!settings.siteSettings[currentDomain]) settings.siteSettings[currentDomain] = {};
        settings.siteSettings[currentDomain].enabled = enabled;

        // Remove from whitelist if enabling
        if (enabled) {
          settings.whitelist = (settings.whitelist || []).filter(d => d !== currentDomain);
          isWhitelisted = false;
          whitelistBtn.classList.remove('active');
        }

        await chrome.storage.sync.set({ darkveil: settings });
      } catch {
        // Ignore
      }
    }

    chrome.runtime.sendMessage({
      type: 'darkveil-set-state',
      enabled,
      settings: {
        brightness: parseInt(brightness.value, 10),
        contrast: parseInt(contrast.value, 10),
        sepia: parseInt(sepia.value, 10)
      }
    });
  });

  // Whitelist button
  whitelistBtn.addEventListener('click', async () => {
    if (!currentDomain) return;

    isWhitelisted = !isWhitelisted;
    whitelistBtn.classList.toggle('active', isWhitelisted);

    try {
      const data = await chrome.storage.sync.get('darkveil');
      const settings = data.darkveil || {};
      if (!settings.whitelist) settings.whitelist = [];

      if (isWhitelisted) {
        if (!settings.whitelist.includes(currentDomain)) {
          settings.whitelist.push(currentDomain);
        }
        // Disable for this site
        siteToggle.checked = false;
        chrome.runtime.sendMessage({ type: 'darkveil-set-state', enabled: false });
      } else {
        settings.whitelist = settings.whitelist.filter(d => d !== currentDomain);
      }

      await chrome.storage.sync.set({ darkveil: settings });
    } catch {
      // Ignore
    }
  });

  // Sliders — live preview on input, persist on change
  [brightness, contrast, sepia].forEach(slider => {
    slider.addEventListener('input', () => {
      updateSliderLabels();
      sendSettingsToTab();
    });
    slider.addEventListener('change', saveSliderSettings);
  });

  // Reset button
  resetBtn.addEventListener('click', () => {
    brightness.value = DEFAULTS.brightness;
    contrast.value = DEFAULTS.contrast;
    sepia.value = DEFAULTS.sepia;
    updateSliderLabels();
    sendSettingsToTab();
    saveSliderSettings();
  });

  // Options button
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Initialize
  loadState();
})();
