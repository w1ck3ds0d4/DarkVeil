/**
 * DarkVeil options page controller.
 */
(function () {
  const DEFAULTS = {
    globalEnabled: true,
    brightness: 100,
    contrast: 100,
    sepia: 0,
    siteSettings: {},
    whitelist: [],
    blacklist: []
  };

  // DOM elements
  const globalEnabled = document.getElementById('globalEnabled');
  const defBrightness = document.getElementById('defBrightness');
  const defContrast = document.getElementById('defContrast');
  const defSepia = document.getElementById('defSepia');
  const defBrightnessVal = document.getElementById('defBrightnessVal');
  const defContrastVal = document.getElementById('defContrastVal');
  const defSepiaVal = document.getElementById('defSepiaVal');
  const lumThreshold = document.getElementById('lumThreshold');
  const lumThresholdVal = document.getElementById('lumThresholdVal');
  const whitelistInput = document.getElementById('whitelistInput');
  const whitelistAdd = document.getElementById('whitelistAdd');
  const whitelistList = document.getElementById('whitelistList');
  const blacklistInput = document.getElementById('blacklistInput');
  const blacklistAdd = document.getElementById('blacklistAdd');
  const blacklistList = document.getElementById('blacklistList');
  const siteOverridesList = document.getElementById('siteOverridesList');
  const noOverrides = document.getElementById('noOverrides');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  /**
   * Get settings from storage.
   */
  async function getSettings() {
    try {
      const data = await chrome.storage.sync.get('darkveil');
      return { ...DEFAULTS, ...(data.darkveil || {}) };
    } catch {
      const data = await chrome.storage.local.get('darkveil');
      return { ...DEFAULTS, ...(data.darkveil || {}) };
    }
  }

  /**
   * Save settings to storage.
   */
  async function saveSettings(settings) {
    try {
      await chrome.storage.sync.set({ darkveil: settings });
    } catch {
      await chrome.storage.local.set({ darkveil: settings });
    }
  }

  /**
   * Render a domain list (whitelist or blacklist).
   */
  function renderDomainList(listEl, domains, removeCallback) {
    listEl.innerHTML = '';
    domains.forEach(domain => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="domain-name">${escapeHTML(domain)}</span>
        <button class="remove-btn" title="Remove">&times;</button>
      `;
      li.querySelector('.remove-btn').addEventListener('click', () => removeCallback(domain));
      listEl.appendChild(li);
    });
  }

  /**
   * Render per-site overrides list.
   */
  function renderSiteOverrides(siteSettings) {
    siteOverridesList.innerHTML = '';
    const domains = Object.keys(siteSettings || {});

    noOverrides.style.display = domains.length ? 'none' : 'block';

    domains.forEach(domain => {
      const overrides = siteSettings[domain];
      const details = Object.entries(overrides)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      const li = document.createElement('li');
      li.innerHTML = `
        <span class="domain-name">${escapeHTML(domain)} <span class="hint">(${escapeHTML(details)})</span></span>
        <button class="remove-btn" title="Remove override">&times;</button>
      `;
      li.querySelector('.remove-btn').addEventListener('click', async () => {
        const settings = await getSettings();
        delete settings.siteSettings[domain];
        await saveSettings(settings);
        loadAll();
      });
      siteOverridesList.appendChild(li);
    });
  }

  /**
   * Load all settings and render the page.
   */
  async function loadAll() {
    const settings = await getSettings();

    globalEnabled.checked = settings.globalEnabled !== false;
    defBrightness.value = settings.brightness || 100;
    defContrast.value = settings.contrast || 100;
    defSepia.value = settings.sepia ?? 0;
    lumThreshold.value = (settings.luminanceThreshold || 0.2) * 100;

    updateLabels();
    renderDomainList(whitelistList, settings.whitelist || [], removeFromWhitelist);
    renderDomainList(blacklistList, settings.blacklist || [], removeFromBlacklist);
    renderSiteOverrides(settings.siteSettings);
  }

  /**
   * Update slider labels.
   */
  function updateLabels() {
    defBrightnessVal.textContent = defBrightness.value + '%';
    defContrastVal.textContent = defContrast.value + '%';
    defSepiaVal.textContent = defSepia.value + '%';
    lumThresholdVal.textContent = (lumThreshold.value / 100).toFixed(2);
  }

  /**
   * Save global slider values.
   */
  async function saveGlobals() {
    const settings = await getSettings();
    settings.globalEnabled = globalEnabled.checked;
    settings.brightness = parseInt(defBrightness.value, 10);
    settings.contrast = parseInt(defContrast.value, 10);
    settings.sepia = parseInt(defSepia.value, 10);
    settings.luminanceThreshold = parseInt(lumThreshold.value, 10) / 100;
    await saveSettings(settings);
  }

  /**
   * Add a domain to the whitelist.
   */
  async function addToWhitelist() {
    const domain = whitelistInput.value.trim().toLowerCase();
    if (!domain) return;

    const settings = await getSettings();
    if (!settings.whitelist.includes(domain)) {
      settings.whitelist.push(domain);
      settings.blacklist = settings.blacklist.filter(d => d !== domain);
      await saveSettings(settings);
    }
    whitelistInput.value = '';
    loadAll();
  }

  /**
   * Remove a domain from the whitelist.
   */
  async function removeFromWhitelist(domain) {
    const settings = await getSettings();
    settings.whitelist = settings.whitelist.filter(d => d !== domain);
    await saveSettings(settings);
    loadAll();
  }

  /**
   * Add a domain to the blacklist.
   */
  async function addToBlacklist() {
    const domain = blacklistInput.value.trim().toLowerCase();
    if (!domain) return;

    const settings = await getSettings();
    if (!settings.blacklist.includes(domain)) {
      settings.blacklist.push(domain);
      settings.whitelist = settings.whitelist.filter(d => d !== domain);
      await saveSettings(settings);
    }
    blacklistInput.value = '';
    loadAll();
  }

  /**
   * Remove a domain from the blacklist.
   */
  async function removeFromBlacklist(domain) {
    const settings = await getSettings();
    settings.blacklist = settings.blacklist.filter(d => d !== domain);
    await saveSettings(settings);
    loadAll();
  }

  /**
   * Export settings as JSON file download.
   */
  async function exportSettings() {
    const settings = await getSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'darkveil-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import settings from a JSON file.
   */
  async function importSettings(file) {
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      const settings = { ...DEFAULTS, ...imported };
      await saveSettings(settings);
      loadAll();
    } catch {
      alert('Failed to import settings. Please check the file format.');
    }
  }

  /**
   * Escape HTML to prevent XSS in rendered domain names.
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Event Listeners ---

  globalEnabled.addEventListener('change', saveGlobals);

  [defBrightness, defContrast, defSepia, lumThreshold].forEach(slider => {
    slider.addEventListener('input', updateLabels);
    slider.addEventListener('change', saveGlobals);
  });

  whitelistAdd.addEventListener('click', addToWhitelist);
  whitelistInput.addEventListener('keydown', e => { if (e.key === 'Enter') addToWhitelist(); });

  blacklistAdd.addEventListener('click', addToBlacklist);
  blacklistInput.addEventListener('keydown', e => { if (e.key === 'Enter') addToBlacklist(); });

  exportBtn.addEventListener('click', exportSettings);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    if (e.target.files[0]) importSettings(e.target.files[0]);
  });

  // Initialize
  loadAll();
})();
