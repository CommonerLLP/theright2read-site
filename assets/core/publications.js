/* ============================================================================
   RTR core — PUBLICATIONS render adapter. Paints the working-paper / brief
   catalogue into any `[data-publications]` slot from PublicationsPort.list()
   (single source: generated assets/publications.js ← papers.toml). Optional
   `data-kind="paper"` filters the slot. Page side of the hexagon: reads the
   port, owns no content. Load AFTER data.js → domain.js → ports.js.
   ============================================================================ */
(function (root) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function actions(p) {
    var out = [];
    if (p.pdf) out.push('<a class="pub-act" href="' + esc(p.pdf) + '">Read the PDF</a>');
    if (p.citation) out.push('<button type="button" class="pub-act pub-act-soft" ' +
      'data-cite="' + esc(p.citation) + '">Cite</button>');
    return out.length ? '<div class="pub-actions">' + out.join("") + "</div>" : "";
  }

  // copy the citation to the clipboard, with a brief "Copied" confirmation
  function wireCite(slot) {
    slot.querySelectorAll("button[data-cite]").forEach(function (b) {
      b.addEventListener("click", function () {
        var text = b.getAttribute("data-cite");
        var done = function () {
          var was = b.textContent; b.textContent = "Copied";
          setTimeout(function () { b.textContent = was; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else { done(); }
      });
    });
  }

  function card(p, D) {
    var title = esc(p.title) + (p.subtitle ? '<span class="pub-sub">' + esc(p.subtitle) + "</span>" : "");
    return '<article class="pub-card">' +
      (p.kicker ? '<div class="pub-kicker">' + esc(p.kicker) + "</div>" : "") +
      '<h3 class="pub-title">' + title + "</h3>" +
      (p.standfirst ? '<p class="pub-standfirst">' + esc(p.standfirst) + "</p>" : "") +
      '<div class="pub-accession">' + esc(D.accession(p)) + "</div>" +
      actions(p) +
      "</article>";
  }

  function render() {
    var slots = document.querySelectorAll("[data-publications]");
    if (!slots.length) return;
    var ports = root.RTR && root.RTR.ports;
    var D = (root.RTR && root.RTR.domain) || {};
    if (!ports || !ports.publications) return;
    Array.prototype.forEach.call(slots, function (slot) {
      var kind = slot.getAttribute("data-kind") || null;
      var list = D.sortPublications(ports.publications.list(kind));
      slot.innerHTML = list.length
        ? list.map(function (p) { return card(p, D); }).join("")
        : '<p class="pub-empty">More working papers and briefs are in preparation, and will be posted here as they are published.</p>';
      wireCite(slot);
    });
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})(typeof window !== "undefined" ? window : globalThis);
