/**
 * DarkVeil Bookmarklet
 *
 * Drag to your bookmarks bar or create a bookmark with this as the URL:
 * javascript:(function(){var s=document.getElementById('darkveil-bm-style');if(s){document.documentElement.classList.toggle('darkveil-active');return}s=document.createElement('style');s.id='darkveil-bm-style';s.textContent='html.darkveil-active{filter:invert(1) hue-rotate(180deg)!important;background-color:#111!important}html.darkveil-active img,html.darkveil-active video,html.darkveil-active canvas,html.darkveil-active svg image,html.darkveil-active picture,html.darkveil-active [style*="background-image"],html.darkveil-active embed,html.darkveil-active object,html.darkveil-active [role="img"],html.darkveil-active input[type="color"]{filter:invert(1) hue-rotate(180deg)!important}@media print{html.darkveil-active,html.darkveil-active img,html.darkveil-active video,html.darkveil-active canvas{filter:none!important;background-color:unset!important}}';document.head.appendChild(s);document.documentElement.classList.add('darkveil-active')})();
 */
(function () {
  var STYLE_ID = 'darkveil-bm-style';
  var CSS_CLASS = 'darkveil-active';

  var existing = document.getElementById(STYLE_ID);
  if (existing) {
    document.documentElement.classList.toggle(CSS_CLASS);
    return;
  }

  var style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    'html.' + CSS_CLASS + '{',
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
    'html.' + CSS_CLASS + ' input[type="color"]{',
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

  document.head.appendChild(style);
  document.documentElement.classList.add(CSS_CLASS);
})();
