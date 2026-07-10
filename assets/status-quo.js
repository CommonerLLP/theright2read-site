/* ============================================================================
   /spend/ controller — renders the token-themed bar charts from the verified
   data layer via the hexagonal ports (RTR.ports.dataset) + domain (RTR.domain).
   No data or computation lives here; it only binds data → DOM. (First page to
   consume the WS3 ports; the legacy main.js migration follows in v2.1.)
   ============================================================================ */
(function () {
  "use strict";
  var ds = window.RTR && window.RTR.ports && window.RTR.ports.dataset;
  if (!ds) return;

  function fmt(n) { return n.toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
  function bar(rows, mountId, opts) {
    var el = document.getElementById(mountId);
    if (!el) return;
    var max = rows.reduce(function (m, r) { return Math.max(m, r.v); }, 0) || 1;
    el.innerHTML = rows.map(function (r) {
      var pct = Math.max(0.6, (r.v / max) * 100).toFixed(1);
      var cls = "bar-row" + (r.hi ? " hi" : "") + (r.india ? " india" : "");
      return '<div class="' + cls + '"><div class="bar-name">' + r.name + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="bar-val">' + opts.prefix + fmt(r.v) + '</div></div>';
    }).join("");
  }

  // 1) Per-capita library spend by state, 2020-21 (latest column in STATE_DATA)
  var spend = ds.stateSpend(), years = ds.years();
  var last = years.length - 1;
  var excl = window.RANKING_EXCLUDE || []; // J&K stays in the data (for /act/) but off this ranking
  var stateRows = Object.keys(spend)
    .filter(function (s) { return excl.indexOf(s) === -1; })
    .map(function (s) { return { name: s, v: spend[s][last] }; })
    .filter(function (r) { return r.v != null; })
    .sort(function (a, b) { return a.v - b.v; }); // worst performers up top (ascending)
  if (stateRows.length) { stateRows[0].hi = true; stateRows[stateRows.length - 1].hi = true; }
  bar(stateRows, "chart-states", { prefix: "₹" });

  // 2) Per-capita library spend, India vs the world (₹/person/year)
  var world = ds.world().map(function (w) { return { name: w.name, v: w.value, india: !!w.india }; });
  bar(world, "chart-world", { prefix: "₹" });
})();
