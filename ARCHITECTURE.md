# DarkVeil - Architecture

This document maps every source file in the project.

---

## Overview

DarkVeil is a Manifest V3 browser extension that applies dark mode via CSS filters. Content scripts run at `document_start` on every page. A background service worker handles commands, messaging, and state. The popup and options page provide user controls.

```
manifest.json              MV3 entry point
src/
  background/              Service worker (extension lifecycle)
  content/                 Injected into every page/frame
  popup/                   Toolbar popup UI
  options/                 Full settings page
  shared/                  Modules shared across all contexts
bookmarklet/               Standalone fallbacks for non-extension browsers
icons/                     Extension icons (16, 48, 128px + SVG)
```

---

## Data Flow

```
User clicks toggle / presses Alt+Shift+D
        |
        v
  service-worker.js  (background)
        |
        v  chrome.tabs.sendMessage
  darkveil-engine.js (content script, every frame)
        |
        v
  Adds/removes .darkveil-active class on <html>
        |
        v
  CSS filter: invert(1) hue-rotate(180deg)
  Media counter-inverted (images, video, canvas)
```

Settings flow: popup.js -> service-worker.js -> storage.js (chrome.storage.sync) -> darkveil-engine.js reads on load.

---

## File Reference

### Background

**src/background/service-worker.js** (~190 lines)
- Handles `chrome.commands.onCommand` for keyboard shortcut
- Routes messages between popup and content scripts
- Manages badge icon state (on/off per tab)
- Initializes defaults on `chrome.runtime.onInstalled`
- Domain whitelist/blacklist logic

### Content Scripts

**src/content/darkveil-engine.js** (~180 lines)
- Core dark mode engine injected at `document_start`
- Generates CSS filter rules with brightness/contrast/sepia variables
- Toggles `.darkveil-active` class on `<html>`
- Listens for messages from popup/background for real-time updates

**src/content/detection.js** (~80 lines)
- Samples background-color luminance of `<html>` and `<body>`
- Uses WCAG relative luminance formula
- Skips activation on already-dark pages (threshold: 0.2)
- Caches detection result per domain

**src/content/mutation-observer.js** (~125 lines)
- MutationObserver on `document.body` for dynamic content
- Monkey-patches `Element.prototype.attachShadow` to inject styles into shadow roots
- Counter-inverts newly added media elements
- Debounces at 100ms to avoid layout thrashing

### Shared Modules

**src/shared/defaults.js** (~20 lines)
- Default settings constants (brightness: 100, contrast: 100, sepia: 0)

**src/shared/storage.js** (~125 lines)
- Wraps `chrome.storage.sync` with `.local` fallback
- Domain-aware settings resolution (global + per-site overrides)
- Whitelist/blacklist management
- Change listeners via `chrome.storage.onChanged`

**src/shared/messaging.js** (~50 lines)
- `sendToBackground()` and `sendToActiveTab()` helpers
- Message type constants for type safety

**src/shared/utils.js** (~60 lines)
- `getDomain()` - extracts hostname from current page
- `rgbToLuminance()` - sRGB linearization + WCAG luminance
- `parseColor()` - CSS color string to RGB

### Popup

**src/popup/popup.html** (~70 lines)
- 320px wide popup with toggle switches and sliders

**src/popup/popup.js** (~235 lines)
- Loads state from background on open
- Sliders update CSS variables in real time via `chrome.tabs.sendMessage`
- Persists on slider `change` (not `input`) to avoid storage thrashing

### Options Page

**src/options/options.html** (~120 lines)
- Full settings page: global defaults, site lists, import/export

**src/options/options.js** (~265 lines)
- Renders per-domain override list with edit/delete
- Whitelist/blacklist editors
- JSON import/export with validation
- XSS-safe HTML escaping

### Bookmarklet / Userscript

**bookmarklet/darkveil-bookmarklet.js** (~50 lines)
- Stateless toggle: injects `<style>` on first click, toggles class after

**bookmarklet/darkveil-userscript.js** (~150 lines)
- Tampermonkey/Greasemonkey compatible
- Floating toggle button (sun/moon)
- Per-domain persistence via `GM_setValue`/`GM_getValue`
- Registers menu command
