/* ============================================================================
   RTR core — PORTS + static adapters (WS3). Thin contracts between the pages
   (driving side) and the outside world (driven side). Swap an adapter without
   touching pages: e.g. DatasetPort static→public-finance later, ChartPort
   Chart.js→SVG later. Load order: data.js → tokens.css → theme.js → domain.js
   → ports.js → page controller.
   Exposed as window.RTR.ports.
   ============================================================================ */
(function (root) {
  "use strict";
  var D = (root.RTR && root.RTR.domain) || {};
  // data.js top-level `const`s are global LEXICAL bindings — NOT properties of
  // window. They must be read as bare identifiers (typeof-guarded), not off root.
  function G(getter, fb) { try { var v = getter(); return (v == null) ? fb : v; } catch (e) { return fb; } }

  /* ---- DesignPort: the design system (tokens), the only place pages read colour ---- */
  var DesignPort = {
    token: function (name) {
      if (typeof getComputedStyle === "undefined") return "";
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },
    theme: function () { return (root.RTRTheme && root.RTRTheme.current()) || "light"; },
    // palette a chart adapter consumes — re-read after a theme change
    chartPalette: function () {
      return {
        accent:  this.token("--accent")  || "#BD3341",
        accent2: this.token("--accent-2")|| "#28427B",
        text:    this.token("--text")    || "#1A1A1A",
        muted:   this.token("--text-muted") || "#66737A",
        grid:    this.token("--rule")    || "#d7d7d7",
        font:    "Source Serif 4, Georgia, serif"
      };
    }
  };

  /* ---- ContentPort: narrative content (lead + deep), from data.js ---- */
  var ContentPort = {
    constants:   function () { return G(function () { return CONSTANTS; }, {}); },
    quotes:      function () { return G(function () { return QUOTES; }, []); },
    history:     function () { return G(function () { return HISTORY; }, []); },
    actions:     function () { return G(function () { return ACTIONS; }, []); },
    legislation: function (state) { var L = G(function () { return LEGISLATION; }, {}); return state ? L[state] : L; },
    contacts:    function () { return G(function () { return JURISDICTION_CONTACTS; }, {}); },
    ruralCoverage: function () { return G(function () { return RURAL_COVERAGE; }, {}); },
    // campaign channels for the site-wide footer; only the enabled ones
    channels:    function () { return G(function () { return CHANNELS; }, []).filter(function (c) { return c && c.enabled; }); }
  };

  /* ---- DatasetPort: numeric series for charts (static now; public-finance later) ---- */
  var DatasetPort = {
    constants:   function () { return G(function () { return CONSTANTS; }, {}); },
    statePop:    function () { return G(function () { return STATE_POP_MN; }, {}); },
    stateSpend:  function () { return G(function () { return STATE_DATA; }, {}); },
    years:       function () { return G(function () { return YEARS; }, []); },
    world:       function () { return G(function () { return WORLD; }, []); },
    standards:   function () { return G(function () { return STANDARDS; }, []); },
    // RRRLF disbursement (₹ lakh) → per-capita series via the domain
    rrrlfReleased: function () { return G(function () { return RRRLF_RELEASED; }, {}); }
  };

  /* ---- ChartPort: themed charts. Wraps Chart.js now; swap to SVG later.
         Every chart reads DesignPort so light/dark + brand colours are automatic. ---- */
  var _charts = [];
  var ChartPort = {
    available: function () { return typeof root.Chart !== "undefined"; },
    _baseOptions: function () {
      var p = DesignPort.chartPalette();
      return {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: p.text, font: { family: p.font } } } },
        scales: {
          x: { ticks: { color: p.muted }, grid: { color: p.grid } },
          y: { ticks: { color: p.muted }, grid: { color: p.grid } }
        }
      };
    },
    make: function (canvas, type, data, options) {
      if (!this.available()) return null;
      var merged = Object.assign(this._baseOptions(), options || {});
      var c = new root.Chart(canvas, { type: type, data: data, options: merged });
      _charts.push(c);
      return c;
    },
    // re-theme all live charts after a light/dark switch
    retheme: function () {
      var self = this;
      _charts.forEach(function (c) {
        if (!c || !c.options) return;
        Object.assign(c.options, self._baseOptions());
        c.update();
      });
    }
  };

  /* ---- PublicationsPort: WPs + Briefs + blog for /library/ and /blog/.
         Reads window.RTR_PUBLICATIONS (a generated metadata list) if present;
         otherwise an empty list. Later: generated from data.toml/papers.toml. ---- */
  var PublicationsPort = {
    list: function (kind) {
      var all = root.RTR_PUBLICATIONS || [];
      return kind ? all.filter(function (p) { return p.kind === kind; }) : all;
    }
  };

  /* ---- LibraryPort: the rights2reads Zotero group as curated shelves, from the
         generated assets/library.js (window.RTR_LIBRARY). Driven adapter is the
         Zotero Web API at build time (curated by library.toml); the page only
         ever sees static data. ---- */
  var LibraryPort = {
    shelves: function () { return (root.RTR_LIBRARY && root.RTR_LIBRARY.shelves) || []; },
    groupUrl: function () {
      var g = root.RTR_LIBRARY && root.RTR_LIBRARY.group;
      return g ? "https://www.zotero.org/groups/" + g + "/rights2reads" : "";
    }
  };

  root.RTR = root.RTR || {};
  root.RTR.ports = {
    design: DesignPort, content: ContentPort, dataset: DatasetPort,
    chart: ChartPort, publications: PublicationsPort, library: LibraryPort
  };

  // keep charts correct across theme toggles
  if (typeof document !== "undefined") {
    document.addEventListener("rtr:themechange", function () { ChartPort.retheme(); });
  }
})(typeof window !== "undefined" ? window : globalThis);
