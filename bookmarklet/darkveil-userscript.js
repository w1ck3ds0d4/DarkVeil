// ==UserScript==
// @name         DarkVeil
// @namespace    https://github.com/WickedSoda/DarkVeil
// @version      1.0.0
// @description  Apply dark mode to any webpage
// @author       WickedSoda
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @license      GPL-3.0
// ==/UserScript==

(function () {
  'use strict';

  var CSS_CLASS = 'darkveil-active';
  var STYLE_ID = 'darkveil-us-style';

  var CSS = [
    'html.' + CSS_CLASS + ' {',
    '  filter: invert(1) hue-rotate(180deg) !important;',
    '  background-color: #111 !important;',
    '}',
    'html.' + CSS_CLASS + ' img,',
    'html.' + CSS_CLASS + ' video,',
    'html.' + CSS_CLASS + ' canvas,',
    'html.' + CSS_CLASS + ' svg image,',
    'html.' + CSS_CLASS + ' picture,',
    'html.' + CSS_CLASS + ' [style*="background-image"],',
    'html.' + CSS_CLASS + ' embed,',
    'html.' + CSS_CLASS + ' object,',
    'html.' + CSS_CLASS + ' [role="img"],',
    'html.' + CSS_CLASS + ' input[type="color"] {',
    '  filter: invert(1) hue-rotate(180deg) !important;',
    '}',
    '@media print {',
    '  html.' + CSS_CLASS + ',',
    '  html.' + CSS_CLASS + ' img,',
    '  html.' + CSS_CLASS + ' video,',
    '  html.' + CSS_CLASS + ' canvas {',
    '    filter: none !important;',
    '    background-color: unset !important;',
    '  }',
    '}'
  ].join('\n');

  /**
   * Inject the dark mode stylesheet.
   */
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  /**
   * Enable dark mode.
   */
  function enable() {
    injectStyle();
    document.documentElement.classList.add(CSS_CLASS);
  }

  /**
   * Disable dark mode.
   */
  function disable() {
    document.documentElement.classList.remove(CSS_CLASS);
  }

  /**
   * Check if dark mode is active.
   */
  function isActive() {
    return document.documentElement.classList.contains(CSS_CLASS);
  }

  /**
   * Toggle dark mode and persist the state.
   */
  function toggle() {
    if (isActive()) {
      disable();
      GM_setValue('enabled_' + location.hostname, false);
    } else {
      enable();
      GM_setValue('enabled_' + location.hostname, true);
    }
  }

  // Register menu command for Tampermonkey/Greasemonkey dropdown
  GM_registerMenuCommand('Toggle DarkVeil', toggle);

  // Inject style immediately (before first paint)
  injectStyle();

  // Check stored preference for this domain
  var domainEnabled = GM_getValue('enabled_' + location.hostname);
  var globalEnabled = GM_getValue('globalEnabled', true);

  if (domainEnabled === true || (domainEnabled === undefined && globalEnabled)) {
    enable();
  }

  // Create a small floating toggle button
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('div');
    btn.id = 'darkveil-toggle-btn';
    btn.title = 'Toggle DarkVeil';
    btn.textContent = isActive() ? '☀' : '☾';
    btn.setAttribute('style', [
      'position: fixed',
      'bottom: 16px',
      'right: 16px',
      'width: 36px',
      'height: 36px',
      'border-radius: 50%',
      'background: #7c3aed',
      'color: white',
      'font-size: 18px',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'cursor: pointer',
      'z-index: 2147483647',
      'box-shadow: 0 2px 8px rgba(0,0,0,0.3)',
      'border: none',
      'user-select: none',
      'transition: transform 0.15s'
    ].join('; '));

    btn.addEventListener('click', function () {
      toggle();
      btn.textContent = isActive() ? '☀' : '☾';
    });

    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'scale(1)';
    });

    document.body.appendChild(btn);
  });
})();
