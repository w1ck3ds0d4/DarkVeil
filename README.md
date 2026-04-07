# DarkVeil

Universal dark mode browser extension - works on any page, any browser.

---

## Features

- **Universal dark mode** - CSS filter inversion with smart media preservation (images, videos, canvas stay normal)
- **Per-site settings** - toggle, brightness, contrast, and sepia controls per domain
- **Whitelist / Blacklist** - never darken or always darken specific sites
- **Auto-detection** - skips pages that are already dark-themed
- **Keyboard shortcut** - `Alt+Shift+D` to toggle
- **Cross-browser** - single codebase works on Chrome, Edge, Firefox, Brave, Vivaldi, Opera, Arc
- **Custom browser support** - bookmarklet and userscript for browsers without extension support
- **Print-safe** - filters are disabled automatically when printing

---

## Install

### Browser Extension (Chrome, Edge, Brave, Vivaldi, Opera, Arc)

1. Clone or download this repo
2. Open your browser's extension page (`chrome://extensions` or equivalent)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `DarkVeil` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the `manifest.json` file

### Bookmarklet (any browser)

Create a new bookmark with this as the URL:

```
javascript:(function(){var s=document.getElementById('darkveil-bm-style');if(s){document.documentElement.classList.toggle('darkveil-active');return}s=document.createElement('style');s.id='darkveil-bm-style';s.textContent='html.darkveil-active{filter:invert(1) hue-rotate(180deg)!important;background-color:#111!important}html.darkveil-active img,html.darkveil-active video,html.darkveil-active canvas,html.darkveil-active svg image,html.darkveil-active picture,html.darkveil-active [style*="background-image"],html.darkveil-active embed,html.darkveil-active object,html.darkveil-active [role="img"],html.darkveil-active input[type="color"]{filter:invert(1) hue-rotate(180deg)!important}@media print{html.darkveil-active,html.darkveil-active img,html.darkveil-active video,html.darkveil-active canvas{filter:none!important;background-color:unset!important}}';document.head.appendChild(s);document.documentElement.classList.add('darkveil-active')})();
```

### Userscript (Tampermonkey / Greasemonkey)

Install `bookmarklet/darkveil-userscript.js` via your userscript manager.

---

## Usage

### Keyboard Shortcut

| Action | Key |
|---|---|
| Toggle dark mode | Alt+Shift+D |

### Popup Controls

Click the DarkVeil icon in the toolbar to open the popup:

- **Global toggle** - enable/disable dark mode everywhere
- **Site toggle** - enable/disable for the current site only
- **Brightness** - adjust brightness (50–150%)
- **Contrast** - adjust contrast (50–150%)
- **Sepia** - apply sepia tone (0–100%)
- **Whitelist** - add current site to whitelist (never darken)

### Options Page

Right-click the DarkVeil icon → "Options" for advanced settings:

- Global default values for brightness, contrast, sepia
- Whitelist and blacklist management
- Per-site override list with individual controls
- Import/export settings as JSON

---

## Project Structure

```
DarkVeil/
  manifest.json                   MV3 extension manifest
  icons/                          Extension icons (16, 48, 128px + SVG source)
  src/
    background/
      service-worker.js           Commands, messaging, badge state
    content/
      darkveil-engine.js          Core CSS filter dark mode engine
      mutation-observer.js        Dynamic content & shadow DOM handler
      detection.js                Already-dark page detection
    popup/
      popup.html                  Popup shell
      popup.css                   Popup styles (dark-themed)
      popup.js                    Toggle, sliders, whitelist controls
    options/
      options.html                Full settings page
      options.css                 Options styles
      options.js                  Site lists, import/export, global defaults
    shared/
      defaults.js                 Default settings constants
      storage.js                  chrome.storage.sync wrapper
      messaging.js                Message passing helpers
      utils.js                    Domain extraction, color analysis
  bookmarklet/
    darkveil-bookmarklet.js       Standalone toggle for any browser
    darkveil-userscript.js        Tampermonkey/Greasemonkey version
```

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
