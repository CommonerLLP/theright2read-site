/* ============================================================================
   RTR core — DOMAIN (WS2). Pure functions only: no DOM, no styling, no globals
   read directly. Everything the campaign "computes" lives here so it can be
   unit-tested and reused by the site, briefs, and games identically.
   Exposed as window.RTR.domain (browser) and module.exports (node test).
   ============================================================================ */
(function (root) {
  "use strict";

  // ₹ per person per year, given a rupee total and a population in millions.
  function perCapita(totalRupees, popMillions) {
    if (!popMillions) return 0;
    return totalRupees / (popMillions * 1e6);
  }

  // Same, when the total is in ₹ crore (1 crore = 1e7).
  function crorePerCapita(crore, popMillions) {
    return perCapita(crore * 1e7, popMillions);
  }

  // RRRLF/state series are reported in ₹ lakh; convert a lakh figure to per-capita.
  function lakhPerCapita(lakh, popMillions) {
    return perCapita(lakh * 1e5, popMillions);
  }

  // A ratio A:B as a single multiplier (e.g. statue cost ÷ library budget).
  function ratio(a, b) {
    if (!b) return null;
    return a / b;
  }

  // How many units of `unitCostRupees` a ₹-crore sum buys (e.g. books at ₹250).
  function buys(crore, unitCostRupees) {
    if (!unitCostRupees) return 0;
    return Math.floor((crore * 1e7) / unitCostRupees);
  }

  // "What else this crore amount equals" — N years of a recurring budget.
  function yearsOf(crore, annualCrore) {
    if (!annualCrore) return null;
    return crore / annualCrore;
  }

  // Rank a {name: value} map high→low into [{name, value, rank}].
  function rank(map) {
    return Object.keys(map)
      .map(function (name) { return { name: name, value: map[name] }; })
      .sort(function (a, b) { return b.value - a.value; })
      .map(function (o, i) { return { name: o.name, value: o.value, rank: i + 1 }; });
  }

  // Indian-format a number (lakh/crore grouping), e.g. 124052 -> "1,24,052".
  function inLakhCr(n) {
    var s = String(Math.round(n));
    if (s.length <= 3) return s;
    var last3 = s.slice(-3), rest = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }

  // Round a multiplier for display ("about N×").
  function timesText(mult) {
    if (mult == null) return "—";
    if (mult >= 100) return Math.round(mult / 10) * 10 + "×";
    return Math.round(mult) + "×";
  }

  // A publication's accession line — the catalogue spine: "RTR-WP-001 · 2026-06 · v0.1.0 · Draft".
  function accession(p) {
    return [p.id, p.date, p.version, p.status].filter(Boolean).join(" · ");
  }

  // Catalogue order: papers first by ascending number, then everything else newest-first.
  function sortPublications(list) {
    return (list || []).slice().sort(function (a, b) {
      var ap = a.kind === "paper", bp = b.kind === "paper";
      if (ap && bp) return String(a.number || "").localeCompare(String(b.number || ""));
      if (ap !== bp) return ap ? -1 : 1;
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
  }

  var domain = {
    perCapita: perCapita,
    crorePerCapita: crorePerCapita,
    lakhPerCapita: lakhPerCapita,
    ratio: ratio,
    buys: buys,
    yearsOf: yearsOf,
    rank: rank,
    inLakhCr: inLakhCr,
    timesText: timesText,
    accession: accession,
    sortPublications: sortPublications
  };

  if (typeof module !== "undefined" && module.exports) module.exports = domain;
  root.RTR = root.RTR || {};
  root.RTR.domain = domain;
})(typeof window !== "undefined" ? window : globalThis);
