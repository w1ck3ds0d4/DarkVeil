/**
 * DarkVeil storage abstraction over chrome.storage.sync / local.
 */
const DarkVeil = window.DarkVeil || {};

DarkVeil.storage = {
  /**
   * Get all settings, merged with defaults.
   */
  async getSettings() {
    try {
      const data = await chrome.storage.sync.get('darkveil');
      return { ...DarkVeil.DEFAULTS, ...(data.darkveil || {}) };
    } catch {
      const data = await chrome.storage.local.get('darkveil');
      return { ...DarkVeil.DEFAULTS, ...(data.darkveil || {}) };
    }
  },

  /**
   * Get settings resolved for a specific domain (merges site overrides).
   */
  async getSettingsForDomain(domain) {
    const settings = await DarkVeil.storage.getSettings();
    const siteOverrides = settings.siteSettings[domain] || {};
    return {
      ...settings,
      ...siteOverrides,
      enabled: DarkVeil.storage.isDomainEnabled(settings, domain)
    };
  },

  /**
   * Determine if dark mode is enabled for a domain, considering
   * global state, whitelist, blacklist, and per-site settings.
   */
  isDomainEnabled(settings, domain) {
    if (settings.whitelist.includes(domain)) return false;
    if (settings.blacklist.includes(domain)) return true;
    const siteOverride = settings.siteSettings[domain];
    if (siteOverride && typeof siteOverride.enabled === 'boolean') {
      return siteOverride.enabled;
    }
    return settings.globalEnabled;
  },

  /**
   * Update a single top-level setting.
   */
  async setSetting(key, value) {
    const settings = await DarkVeil.storage.getSettings();
    settings[key] = value;
    await DarkVeil.storage._save(settings);
  },

  /**
   * Update a per-site setting.
   */
  async setSiteSetting(domain, key, value) {
    const settings = await DarkVeil.storage.getSettings();
    if (!settings.siteSettings[domain]) {
      settings.siteSettings[domain] = {};
    }
    settings.siteSettings[domain][key] = value;
    await DarkVeil.storage._save(settings);
  },

  /**
   * Add a domain to the whitelist (never darken).
   */
  async addToWhitelist(domain) {
    const settings = await DarkVeil.storage.getSettings();
    if (!settings.whitelist.includes(domain)) {
      settings.whitelist.push(domain);
      settings.blacklist = settings.blacklist.filter(d => d !== domain);
      await DarkVeil.storage._save(settings);
    }
  },

  /**
   * Remove a domain from the whitelist.
   */
  async removeFromWhitelist(domain) {
    const settings = await DarkVeil.storage.getSettings();
    settings.whitelist = settings.whitelist.filter(d => d !== domain);
    await DarkVeil.storage._save(settings);
  },

  /**
   * Add a domain to the blacklist (always darken).
   */
  async addToBlacklist(domain) {
    const settings = await DarkVeil.storage.getSettings();
    if (!settings.blacklist.includes(domain)) {
      settings.blacklist.push(domain);
      settings.whitelist = settings.whitelist.filter(d => d !== domain);
      await DarkVeil.storage._save(settings);
    }
  },

  /**
   * Listen for settings changes.
   */
  onChanged(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (changes.darkveil) {
        callback(changes.darkveil.newValue, changes.darkveil.oldValue);
      }
    });
  },

  /**
   * Internal: persist settings.
   */
  async _save(settings) {
    try {
      await chrome.storage.sync.set({ darkveil: settings });
    } catch {
      await chrome.storage.local.set({ darkveil: settings });
    }
  }
};

window.DarkVeil = DarkVeil;
