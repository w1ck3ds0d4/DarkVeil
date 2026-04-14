/**
 * DarkVeil MutationObserver - handles dynamic content, shadow DOM, and iframes.
 */
(function () {
  const DV = window.DarkVeil || {};
  const STYLE_ID = DV.STYLE_ID || 'darkveil-style';

  /** Selectors for elements that need counter-inversion. */
  const MEDIA_SELECTOR = [
    'img', 'video', 'canvas', 'picture', 'embed', 'object',
    'svg image', '[role="img"]', 'input[type="color"]'
  ].join(',');

  /** Set of shadow roots we've already injected styles into. */
  const processedShadowRoots = new WeakSet();

  /**
   * Inject DarkVeil styles into an open shadow root.
   */
  function injectIntoShadowRoot(shadowRoot) {
    if (processedShadowRoots.has(shadowRoot)) return;
    processedShadowRoots.add(shadowRoot);

    const engine = DV.engine;
    if (!engine) return;

    const style = document.createElement('style');
    style.setAttribute('data-darkveil', 'shadow');
    style.textContent = engine.buildCSS();
    shadowRoot.appendChild(style);
  }

  /**
   * Check an element for a shadow root and inject if found.
   */
  function processShadowDOM(element) {
    if (element.shadowRoot) {
      injectIntoShadowRoot(element.shadowRoot);
    }
  }

  /**
   * Monkey-patch attachShadow to automatically inject styles into new shadow roots.
   */
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const shadowRoot = originalAttachShadow.call(this, init);
    if (init.mode === 'open') {
      injectIntoShadowRoot(shadowRoot);
    }
    return shadowRoot;
  };

  /**
   * Process newly added nodes for media elements and shadow DOMs.
   */
  function processAddedNodes(nodes) {
    for (const node of nodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;

      // Check the node itself
      processShadowDOM(node);

      // Check descendants for shadow roots
      if (node.querySelectorAll) {
        const elements = node.querySelectorAll('*');
        for (const el of elements) {
          processShadowDOM(el);
        }
      }
    }
  }

  /** Debounce timer for batch processing mutations. */
  let debounceTimer = null;
  let pendingNodes = [];

  /**
   * Debounced mutation handler - batches DOM changes every 100ms.
   */
  function handleMutations(mutations) {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        pendingNodes.push(...mutation.addedNodes);
      }
    }

    if (debounceTimer) return;
    debounceTimer = setTimeout(() => {
      processAddedNodes(pendingNodes);
      pendingNodes = [];
      debounceTimer = null;
    }, 100);
  }

  /**
   * Start observing the DOM for dynamic changes.
   */
  function startObserving() {
    const observer = new MutationObserver(handleMutations);

    const target = document.body || document.documentElement;
    observer.observe(target, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Expose observer API
  DV.observer = {
    startObserving,
    injectIntoShadowRoot,
    processAddedNodes
  };
  window.DarkVeil = DV;

  // Start observing once the DOM is ready
  if (document.body) {
    startObserving();
  } else {
    document.addEventListener('DOMContentLoaded', startObserving, { once: true });
  }
})();
