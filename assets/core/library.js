/* ============================================================================
   RTR core — LIBRARY render adapter. Paints the rights2reads reading room into
   any `[data-library]` slot from LibraryPort.shelves() (single source: generated
   assets/library.js ← the curated X-Public Zotero collection). Two views: by
   type (the curated shelves) and by year (flat, newest first). Page side of the
   hexagon: reads the port, owns no content. External values are escaped and
   hrefs scheme-checked. Load AFTER ports.js.
   ============================================================================ */
(function (root) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // only http(s) and root-relative URLs reach an href — blocks javascript:/data:
  function safeUrl(u) {
    u = String(u || "");
    return (/^https?:\/\//i.test(u) || u.charAt(0) === "/") ? u : "";
  }

  function entry(it) {
    var href = safeUrl(it.url);
    var byline = [it.creator, it.year].filter(Boolean).join(", ");
    var inner =
      '<span class="lib-item-title">' + esc(it.title) + "</span>" +
      (byline ? '<span class="lib-item-by">' + esc(byline) + "</span>" : "");
    return '<li class="lib-item">' +
      (href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + inner + "</a>" : inner) +
      "</li>";
  }

  function shelf(s) {
    var more = safeUrl(s.collectionUrl);
    return '<section class="lib-shelf">' +
      '<header class="lib-shelf-head">' +
      '<h3 class="lib-shelf-label">' + esc(s.label) + "</h3>" +
      (s.blurb ? '<p class="lib-shelf-blurb">' + esc(s.blurb) + "</p>" : "") +
      "</header>" +
      '<ul class="lib-items">' + (s.items || []).map(entry).join("") + "</ul>" +
      (more ? '<a class="lib-more" href="' + esc(more) + '" target="_blank" rel="noopener">' +
        "See all " + (s.count || (s.items || []).length) + " on Zotero →</a>" : "") +
      "</section>";
  }

  function byType(shelves) { return shelves.map(shelf).join(""); }

  function flatten(shelves) {
    return shelves.reduce(function (a, s) { return a.concat(s.items || []); }, []);
  }

  function hasTags(shelves) {
    return flatten(shelves).some(function (it) { return it.tags && it.tags.length; });
  }

  function byTag(shelves) {
    var groups = {};
    flatten(shelves).forEach(function (it) {
      (it.tags || []).forEach(function (t) { (groups[t] = groups[t] || []).push(it); });
    });
    var tags = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b); });
    if (!tags.length) return '<p class="pub-empty">No tags on the curated items yet.</p>';
    return tags.map(function (t) {
      return '<section class="lib-shelf">' +
        '<header class="lib-shelf-head"><h3 class="lib-shelf-label">' + esc(t) + "</h3></header>" +
        '<ul class="lib-items">' + groups[t].map(entry).join("") + "</ul></section>";
    }).join("");
  }

  function byYear(shelves) {
    var all = shelves.reduce(function (a, s) { return a.concat(s.items || []); }, []);
    var groups = {};
    all.forEach(function (it) {
      var y = /^\d{4}$/.test(it.year) ? it.year : "Undated";
      (groups[y] = groups[y] || []).push(it);
    });
    var years = Object.keys(groups).sort(function (a, b) {
      if (a === "Undated") return 1; if (b === "Undated") return -1;
      return b.localeCompare(a);            // newest first
    });
    return years.map(function (y) {
      return '<section class="lib-shelf">' +
        '<header class="lib-shelf-head"><h3 class="lib-shelf-label">' + esc(y) + "</h3></header>" +
        '<ul class="lib-items">' + groups[y].map(entry).join("") + "</ul></section>";
    }).join("");
  }

  function controls(active, showTags) {
    function btn(view, label) {
      return '<button type="button" class="lib-view-btn" data-view="' + view +
        '" aria-pressed="' + (active === view) + '">' + label + "</button>";
    }
    return '<div class="lib-views" role="group" aria-label="Sort the library">' +
      btn("type", "By type") + btn("year", "By year") +
      (showTags ? btn("tag", "By tag") : "") + "</div>";
  }

  function render() {
    var slots = document.querySelectorAll("[data-library]");
    if (!slots.length) return;
    var ports = root.RTR && root.RTR.ports;
    if (!ports || !ports.library) return;
    var shelves = ports.library.shelves();

    var showTags = hasTags(shelves);
    Array.prototype.forEach.call(slots, function (slot) {
      function paint(view) {
        if (!shelves.length) {
          slot.innerHTML = '<p class="pub-empty">The reading room is being catalogued. ' +
            "Browse the full library on Zotero.</p>";
          return;
        }
        var body = view === "year" ? byYear(shelves)
                 : view === "tag" ? byTag(shelves)
                 : byType(shelves);
        slot.innerHTML = controls(view, showTags) + '<div class="lib-shelves">' + body + "</div>";
        slot.querySelectorAll(".lib-view-btn").forEach(function (b) {
          b.addEventListener("click", function () { paint(b.getAttribute("data-view")); });
        });
      }
      paint("type");
    });
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})(typeof window !== "undefined" ? window : globalThis);
