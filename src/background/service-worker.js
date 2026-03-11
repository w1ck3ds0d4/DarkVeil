/**
 * DarkVeil background service worker.
 * Handles commands, messaging, and badge state.
 */

const DEFAULTS = {
  globalEnabled: true,
  brightness: 100,
  contrast: 100,
  sepia: 0,
  mode: 'filter',
  siteSettings: {},
  whitelist: [],
  blacklist: []
};

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
 * Check if domain is enabled given current settings.
 */
function isDomainEnabled(settings, domain) {
  if (settings.whitelist.includes(domain)) return false;
  if (settings.blacklist.includes(domain)) return true;
  const siteOverride = settings.siteSettings[domain];
  if (siteOverride && typeof siteOverride.enabled === 'boolean') {
    return siteOverride.enabled;
  }
  return settings.globalEnabled;
}

/**
 * Update the extension badge/icon for a specific tab.
 */
async function updateBadge(tabId, active) {
  try {
    await chrome.action.setBadgeText({
      tabId,
      text: active ? 'ON' : ''
    });
    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: active ? '#7c3aed' : '#666666'
    });
  } catch {
    // Tab may have been closed
  }
}

/**
 * Toggle dark mode for a specific tab.
 */
async function toggleTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'darkveil-toggle' });
    if (response) {
      await updateBadge(tabId, response.active);
    }
    return response;
  } catch {
    // Content script not loaded in this tab
    return null;
  }
}

/**
 * Send current settings to a tab's content script.
 */
async function syncTabState(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('chrome-extension://')) {
    return;
  }

  try {
    const domain = new URL(url).hostname;
    const settings = await getSettings();
    const enabled = isDomainEnabled(settings, domain);

    await chrome.tabs.sendMessage(tabId, {
      type: 'darkveil-set-state',
      enabled,
      settings: {
        brightness: settings.brightness,
        contrast: settings.contrast,
        sepia: settings.sepia,
        ...(settings.siteSettings[domain] || {})
      }
    });

    await updateBadge(tabId, enabled);
  } catch {
    // Content script not yet loaded
  }
}

// --- Event Listeners ---

// Handle keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-darkveil') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await toggleTab(tab.id);
    }
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      case 'darkveil-toggle': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          return await toggleTab(tab.id);
        }
        return null;
      }

      case 'darkveil-get-state': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          try {
            return await chrome.tabs.sendMessage(tab.id, { type: 'darkveil-get-state' });
          } catch {
            return { active: false, domain: '' };
          }
        }
        return { active: false, domain: '' };
      }

      case 'darkveil-update-settings': {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          try {
            return await chrome.tabs.sendMessage(tab.id, {
              type: 'darkveil-update-settings',
              settings: message.settings
            });
          } catch {
            return null;
          }
        }
        return null;
      }

      default:
        return null;
    }
  };

  handle().then(sendResponse);
  return true; // Keep message channel open for async response
});

// Sync state when a tab finishes loading
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    syncTabState(tabId, tab.url);
  }
});

// Set defaults on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await saveSettings(DEFAULTS);
  }
});
