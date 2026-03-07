/**
 * DarkVeil message passing helpers.
 */
const DarkVeil = window.DarkVeil || {};

DarkVeil.MSG = {
  TOGGLE: 'darkveil-toggle',
  GET_STATE: 'darkveil-get-state',
  SET_STATE: 'darkveil-set-state',
  UPDATE_SETTINGS: 'darkveil-update-settings',
  SETTINGS_CHANGED: 'darkveil-settings-changed'
};

DarkVeil.messaging = {
  /**
   * Send a message to the background service worker.
   */
  sendToBackground(type, data = {}) {
    return chrome.runtime.sendMessage({ type, ...data });
  },

  /**
   * Send a message to the content script in the active tab.
   */
  async sendToActiveTab(type, data = {}) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    return chrome.tabs.sendMessage(tab.id, { type, ...data });
  },

  /**
   * Listen for messages of a specific type.
   */
  on(type, handler) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === type) {
        const result = handler(message, sender);
        if (result instanceof Promise) {
          result.then(sendResponse);
          return true;
        }
        sendResponse(result);
      }
    });
  }
};

window.DarkVeil = DarkVeil;
