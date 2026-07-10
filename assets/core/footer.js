/* ============================================================================
   RTR core — FOOTER render adapter. Paints the site-wide channel row into any
   `[data-channels]` slot from ContentPort.channels() (single source: CHANNELS
   in data.js). Driving adapter on the page side of the hexagon: it reads the
   port, it does not own the content. Load AFTER data.js → domain.js → ports.js.
   ============================================================================ */
(function (root) {
  "use strict";

  function iconSpan(c) {
    var svg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + c.icon + '"/></svg>';
    // a live url ⇒ link; empty url ⇒ non-clickable icon (accessible name via aria-label)
    return c.url
      ? '<a class="channel" href="' + c.url + '" aria-label="' + c.label + '" target="_blank" rel="noopener">' + svg + '</a>'
      : '<span class="channel" role="img" aria-label="' + c.label + '">' + svg + '</span>';
  }

  function render() {
    var slots = document.querySelectorAll("[data-channels]");
    if (!slots.length) return;
    var ports = root.RTR && root.RTR.ports;
    var list = (ports && ports.content && ports.content.channels()) || [];
    var html = list.map(iconSpan).join("");
    Array.prototype.forEach.call(slots, function (slot) { slot.innerHTML = html; });
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})(typeof window !== "undefined" ? window : globalThis);
