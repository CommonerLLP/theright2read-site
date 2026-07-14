/* RTR charts — vanilla SVG/Canvas renderers.
   Seeded from the WP-008 dissemination build; the design *is* the argument, so
   these signature pamphlet charts stay hand-made (no library). Each renderer
   takes (host, chart) and draws chart.data into host. Theme-aware via tokens.css
   CSS vars (cssv); re-run on theme/resize by the app. NO green (game-signal only).
*/
(function () {
  var RTR = (window.RTR = window.RTR || {});
  var SVGNS = "http://www.w3.org/2000/svg";
  var doc = document, root = doc.documentElement;
  var UI = '"Inter Tight",system-ui,sans-serif';
  var MONO = '"PT Mono","Menlo",monospace';

  function cssv(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function mk(tag, attrs) { var e = doc.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function svgFor(host, w, h) {
    host.innerHTML = "";
    var s = mk("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "xMidYMid meet", role: "presentation" });
    s.style.width = "100%"; s.style.height = "auto"; s.style.display = "block";
    host.appendChild(s); return s;
  }
  function txt(str, x, y, fill, size, anchor, weight, ls, font, rot) {
    var a = { x: x, y: y, fill: fill, "font-size": size, "text-anchor": anchor || "start", "font-family": font || UI };
    if (weight) a["font-weight"] = weight;
    if (ls && ls !== "0") a["letter-spacing"] = ls;
    if (rot) a.transform = "rotate(" + rot + " " + x + " " + y + ")";
    var e = mk("text", a); e.textContent = str; return e;
  }

  // shared tooltip (the app mounts #rtr-tip)
  function tipEl() { return doc.getElementById("rtr-tip"); }
  function showTip(html, x, y) { var t = tipEl(); if (!t) return; t.innerHTML = html; t.style.left = x + "px"; t.style.top = y + "px"; t.classList.add("on"); }
  function hideTip() { var t = tipEl(); if (t) t.classList.remove("on"); }
  var tipTimer;
  function bindTip(el, html) {
    el.setAttribute("tabindex", "0"); el.setAttribute("role", "img");
    el.setAttribute("aria-label", html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    function at(ev) {
      var r = (ev.touches && ev.touches[0]) || ev, b = el.getBoundingClientRect();
      showTip(html, r.clientX || (b.left + b.width / 2), r.clientY || b.top);
    }
    el.addEventListener("mouseenter", at); el.addEventListener("mousemove", at);
    el.addEventListener("mouseleave", hideTip);
    el.addEventListener("focus", function () { var b = el.getBoundingClientRect(); showTip(html, b.left + b.width / 2, b.top); });
    el.addEventListener("blur", hideTip);
    el.addEventListener("touchstart", function (ev) { at(ev); clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 2600); }, { passive: true });
  }

  /* FIG — RECURRENCE WITHOUT ENACTMENT (four tiers) */
  function oscillation(host, chart) {
    var OSC = chart.data;
    var W = 680, H = 372, padL = 104, padR = 22;
    var acc = cssv("--accent"), blue = cssv("--blue"), red2 = cssv("--red-2"),
        muted = cssv("--text-muted"), rule = cssv("--rule"), surf = cssv("--surface");
    var TIER = { demand: { y: 60, color: blue }, deferral: { y: 196, color: acc }, refusal: { y: 256, color: acc }, inversion: { y: 316, color: red2 } };
    var targetY = 120, s = svgFor(host, W, H);
    var n = OSC.length, step = (W - padL - padR) / (n - 1);
    var xs = OSC.map(function (_, i) { return padL + i * step; });
    [["demand", "DEMAND"], ["deferral", "DEFERRAL"], ["refusal", "REFUSAL"], ["inversion", "INVERSION"]].forEach(function (r) {
      var ty = TIER[r[0]].y;
      s.appendChild(mk("line", { x1: padL - 8, y1: ty, x2: W - padR, y2: ty, stroke: rule, "stroke-width": .6, "stroke-dasharray": "1 5" }));
      s.appendChild(txt(r[1], padL - 16, ty + 3.5, r[0] === "demand" ? blue : (r[0] === "inversion" ? red2 : acc), 11, "end", 700, ".02em", MONO));
    });
    s.appendChild(mk("line", { x1: padL - 8, y1: targetY, x2: W - padR, y2: targetY, stroke: muted, "stroke-width": 1.3, "stroke-dasharray": "2 4" }));
    s.appendChild(txt("A BINDING CENTRAL ACT — NEVER REACHED", padL - 8, targetY - 8, muted, 10.5, "start", 700, ".05em", MONO));
    var d = "M" + xs[0] + "," + TIER[OSC[0].kind].y;
    for (var i = 1; i < n; i++) { d += " L" + xs[i] + "," + TIER[OSC[i].kind].y; }
    s.appendChild(mk("path", { d: d, fill: "none", stroke: muted, "stroke-width": 1.3, "stroke-opacity": ".5", "stroke-linejoin": "round", "stroke-linecap": "round" }));
    OSC.forEach(function (dp, i) {
      var tier = TIER[dp.kind], x = xs[i], y = tier.y, g = mk("g", { class: "hit" });
      if (dp.kind === "demand") { g.appendChild(mk("circle", { cx: x, cy: y, r: 6.5, fill: blue, stroke: blue, "stroke-width": 1.6 })); }
      else if (dp.kind === "deferral") { g.appendChild(mk("circle", { cx: x, cy: y, r: 6.2, fill: surf, stroke: acc, "stroke-width": 1.9 })); }
      else if (dp.kind === "refusal") { g.appendChild(mk("circle", { cx: x, cy: y, r: 6.5, fill: acc, stroke: acc, "stroke-width": 1.6 })); }
      else { g.appendChild(mk("circle", { cx: x, cy: y, r: 9.5, fill: "none", stroke: red2, "stroke-width": 1.2 })); g.appendChild(mk("circle", { cx: x, cy: y, r: 6.2, fill: red2, stroke: red2, "stroke-width": 1.4 })); }
      var above = dp.kind === "demand";
      g.appendChild(txt(String(dp.yr), x, above ? y - 12 : y + 18, tier.color, 11.5, "middle", 700, "0", MONO));
      bindTip(g, "<b>" + dp.yr + " — " + dp.kind + "</b><br>" + dp.t);
      s.appendChild(g);
    });
  }

  /* FIG — THE SUBSTITUTION (slope / arrow) — generic two-point-per-series comparison.
     config: maxV, unit (axis caption), leftLabel/rightLabel (axis-end captions),
     valPrefix/valSuffix/valDecimals (value formatting — defaults match the
     original per-10k-words WP-008 chart so it renders unchanged). */
  function substitution(host, chart) {
    var SUB = chart.data, cfg = chart.config || {};
    var maxV = cfg.maxV || 50;
    var valDecimals = cfg.valDecimals != null ? cfg.valDecimals : 1;
    var valPrefix = cfg.valPrefix || "", valSuffix = cfg.valSuffix || "";
    function fmt(v) { return valPrefix + v.toFixed(valDecimals) + valSuffix; }
    var W = 680, H = 326, left = 152, right = W - 150, top = 36, bot = 274;
    var ink = cssv("--text"), acc = cssv("--accent"), blue = cssv("--blue"), muted = cssv("--text-muted"), rule = cssv("--rule");
    var s = svgFor(host, W, H);
    function y(v) { return bot - (v / maxV) * (bot - top); }
    s.appendChild(mk("line", { x1: left, y1: top - 6, x2: left, y2: bot, stroke: rule, "stroke-width": 1 }));
    s.appendChild(mk("line", { x1: right, y1: top - 6, x2: right, y2: bot, stroke: rule, "stroke-width": 1 }));
    s.appendChild(mk("line", { x1: left, y1: bot, x2: right, y2: bot, stroke: rule, "stroke-width": 1 }));
    [.2, .4, .6, .8].forEach(function (f) { var v = maxV * f; s.appendChild(mk("line", { x1: left, y1: y(v), x2: right, y2: y(v), stroke: rule, "stroke-width": .6, "stroke-opacity": ".6" })); });
    var unit = cfg.unit || "per 10,000 words";
    var leftLabel = cfg.leftLabel || "MID-CENTURY";
    var rightLabel = cfg.rightLabel || "TODAY";
    s.appendChild(txt(unit, left - 13, top - 14, muted, 9.5, "start", 400, "0", MONO));
    s.appendChild(txt(leftLabel, left, bot + 18, muted, 9.5, "middle", 700, ".05em", MONO));
    s.appendChild(txt(rightLabel, right, bot + 18, muted, 9.5, "middle", 700, ".05em", MONO));
    SUB.forEach(function (d) {
      var col = d.role === "loss" ? acc : (d.role === "rise" ? ink : blue);
      var y1 = y(d.from), y2 = y(d.to), g = mk("g", { class: "hit" });
      g.appendChild(mk("line", { x1: left, y1: y1, x2: right, y2: y2, stroke: col, "stroke-width": 3.4, "stroke-linecap": "round", "stroke-opacity": d.role === "loss" ? ".95" : ".9" }));
      var ang = Math.atan2(y2 - y1, right - left), ah = 8, a1 = ang + 2.7, a2 = ang - 2.7;
      g.appendChild(mk("path", { d: "M" + right + "," + y2 + " L" + (right + ah * Math.cos(a1)) + "," + (y2 + ah * Math.sin(a1)) + " L" + (right + ah * Math.cos(a2)) + "," + (y2 + ah * Math.sin(a2)) + " Z", fill: col }));
      g.appendChild(mk("circle", { cx: left, cy: y1, r: 4, fill: col }));
      g.appendChild(txt(d.label, left - 13, y1 + 3.5, col, 12.5, "end", 700, "0", UI));
      g.appendChild(txt(fmt(d.from), left - 13, y1 + 17, muted, 9.5, "end", 400, "0", MONO));
      g.appendChild(txt(d.label, right + 13, y2 + 3.5, col, 12.5, "start", 700, "0", UI));
      g.appendChild(txt(fmt(d.to), right + 13, y2 + 17, muted, 9.5, "start", 400, "0", MONO));
      bindTip(g, "<b>" + d.label + "</b><br>" + d.fromP + ": " + fmt(d.from) + " → " + d.toP + ": " + fmt(d.to) + " " + unit + ".<br>" + d.note);
      s.appendChild(g);
    });
  }

  /* FIG — THE CESS, DRAINED (droplet timeline) */
  function cess(host, chart) {
    var ACTS = chart.data, TIERTXT = (chart.config && chart.config.tierText) || {};
    var starNote = (chart.config && chart.config.starNote) || "";
    var W = 680, H = 250, padL = 66, padR = 20, top = 56, rowY = { 2: 98, 1: 150, 0: 202 };
    var ink = cssv("--text"), acc = cssv("--accent"), blue = cssv("--blue"), muted = cssv("--text-muted"), rule = cssv("--rule"), surf = cssv("--surface");
    var s = svgFor(host, W, H);
    // 19 acts with repeated years cram/duplicate the rotated axis labels at 360;
    // let the plot scroll rather than shrink the ticks into an illegible smear.
    host.style.overflowX = "auto"; s.style.minWidth = "560px";
    var acts = ACTS.slice().sort(function (a, b) { return a.yr - b.yr || b.t - a.t; });
    var n = acts.length, step = (W - padL - padR) / (n - 1);
    var lastPre = 0; acts.forEach(function (a, i) { if (a.yr <= 1993) lastPre = i; });
    var bandX1 = padL - 12, bandX2 = padL + (lastPre + 0.5) * step;
    s.appendChild(mk("rect", { x: bandX1, y: top, width: (bandX2 - bandX1), height: 168, fill: acc, "fill-opacity": ".07", rx: 2 }));
    s.appendChild(txt("THE CESS ERA · 1948–1993", bandX1 + 2, top - 8, acc, 10, "start", 700, ".05em", MONO));
    [2, 1, 0].forEach(function (t) { s.appendChild(mk("line", { x1: bandX1, y1: rowY[t], x2: W - padR + 8, y2: rowY[t], stroke: rule, "stroke-width": .6, "stroke-dasharray": "1 4" })); });
    s.appendChild(txt("operative", padL - 16, rowY[2] - 9, ink, 9.5, "end", 700, "0", MONO));
    s.appendChild(txt("cess", padL - 16, rowY[2] + 3, ink, 9.5, "end", 700, "0", MONO));
    s.appendChild(txt("nominal", padL - 16, rowY[1] + 3, muted, 9.5, "end", 400, "0", MONO));
    s.appendChild(txt("no cess", padL - 16, rowY[0] + 3, muted, 9.5, "end", 400, "0", MONO));
    var prevYr = null;
    acts.forEach(function (a, i) {
      var x = padL + i * step, cy = rowY[a.t], col = a.t === 2 ? ink : (a.t === 1 ? acc : muted);
      var g = mk("g", { class: "hit" });
      g.appendChild(mk("circle", { cx: x, cy: cy, r: 6.5, fill: a.t === 2 ? ink : surf, stroke: col, "stroke-width": 1.8 }));
      if (a.star) { g.appendChild(mk("circle", { cx: x, cy: cy, r: 10.5, fill: "none", stroke: blue, "stroke-width": 1.4, "stroke-dasharray": "1.5 2" })); }
      // dedupe: label a year once even when several Acts share it
      if (a.yr !== prevYr) g.appendChild(txt(String(a.yr), x, H - 16, muted, 9.5, "middle", 400, "0", MONO, 90));
      prevYr = a.yr;
      bindTip(g, "<b>" + a.c + " — " + a.yr + "</b><br>" + (TIERTXT[a.t] || "") + (a.star ? "<br>" + starNote : ""));
      s.appendChild(g);
    });
  }

  /* FIG — THE SILENCE (two 10k grids on canvas) */
  function silence(host, chart) {
    host.innerHTML = "";
    var ink = cssv("--text"), acc = cssv("--accent"), muted = cssv("--text-muted"), off = cssv("--grid-off"), rule = cssv("--rule");
    var palette = { accent: acc, ink: ink };
    var wrap = doc.createElement("div");
    wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:1.2rem;justify-content:center";
    host.appendChild(wrap);
    function grid(term, rate, colorLit, litCount, fade) {
      var cell = doc.createElement("div");
      cell.style.cssText = "flex:1 1 220px;min-width:0;max-width:300px;text-align:center";
      var lab = doc.createElement("div");
      lab.style.cssText = "font-family:" + UI + ";font-size:.8rem;font-weight:700;color:" + colorLit + ";margin-bottom:.45rem";
      lab.innerHTML = "&ldquo;" + term + "&rdquo; &middot; " + rate + " / 10,000";
      cell.appendChild(lab);
      var side = Math.min(280, host.clientWidth > 560 ? 260 : host.clientWidth - 40); side = Math.max(200, side);
      var dpr = window.devicePixelRatio || 1, cv = doc.createElement("canvas");
      cv.width = side * dpr; cv.height = side * dpr; cv.style.width = side + "px"; cv.style.height = side + "px";
      cv.setAttribute("role", "img");
      cv.setAttribute("aria-label", term + ": " + rate + " occurrences per ten thousand words; " + (litCount < 1 ? "less than one square lit in ten thousand." : litCount + " squares lit."));
      var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
      var N = 100, g = side / N, r = g * 0.34, seed = term.length * 7 + 3, lit = {};
      var count = Math.floor(litCount), k = 0, guard = 0;
      while (k < count && guard < 9000) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; var idx = seed % (N * N); if (!lit[idx]) { lit[idx] = 1; k++; } guard++; }
      for (var i = 0; i < N * N; i++) { var cx = (i % N) * g + g / 2, cy = Math.floor(i / N) * g + g / 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = lit[i] ? colorLit : off; ctx.fill(); }
      if (litCount > 0 && litCount < 1) { ctx.globalAlpha = fade || 0.45; ctx.beginPath(); ctx.arc(g / 2, g / 2, r, 0, 6.2832); ctx.fillStyle = colorLit; ctx.fill(); ctx.globalAlpha = 1; }
      ctx.strokeStyle = rule; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, side - 1, side - 1);
      cell.appendChild(cv);
      var cap = doc.createElement("div");
      cap.style.cssText = "font-family:" + MONO + ";font-size:.68rem;color:" + muted + ";margin-top:.4rem;text-transform:uppercase;letter-spacing:.04em";
      cap.innerHTML = (litCount < 1 ? "not one full square" : Math.round(litCount) + " squares") + " lit";
      cell.appendChild(cap);
      wrap.appendChild(cell);
    }
    chart.data.forEach(function (d) { grid(d.term, d.rate, palette[d.color] || ink, d.litCount, d.fade); });
  }

  /* TOOL — STATE-ACT LOOKUP (select → detail card; not a chart but shares the app) */
  var lookupSel = {}; // slug -> selected index, preserved across theme redraws
  function mean(a) { for (var i = 0, s = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
  function lookup(host, chart) {
    host.innerHTML = "";
    var rows = chart.data, labels = (chart.config && chart.config.cessLabels) || {};
    var slug = chart.slug || "lookup";
    var years = (chart.config && chart.config.spendYears) || [];
    var spendLabel = (chart.config && chart.config.spendLabel) || "Per-capita spend";
    var spendCaveat = (chart.config && chart.config.spendCaveat) || "";
    var tierVar = { operative: "var(--blue)", none: "var(--red-2)", provision: "var(--accent)", renamed: "var(--accent)" };

    // pre-compute the 7-year average per State once, and the ranking (desc), so the
    // "where does my State sit" bars are stable across theme/resize redraws.
    var avg = rows.map(function (r) { return (r.spend && r.spend.length) ? mean(r.spend) : 0; });
    var ranked = rows.map(function (_, i) { return i; })
      .sort(function (a, b) { return avg[b] - avg[a] || rows[a].state.localeCompare(rows[b].state); });
    var maxAvg = avg[ranked[0]] || 1;
    var yr0 = years[0] || "", yr1 = years[years.length - 1] || "";

    // per-State spending sparkline (₹/person/yr, 2205-105) — reads live CSS vars
    function spark(series) {
      var W = 320, H = 66, padL = 6, padR = 6, padT = 16, padB = 15;
      var acc = cssv("--accent"), muted = cssv("--text-muted"), text = cssv("--text"), surf = cssv("--surface"), rule = cssv("--rule");
      var vals = series.slice(), n = vals.length;
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), rng = (mx - mn) || 1;
      var stepX = (W - padL - padR) / (n - 1);
      function X(i) { return padL + i * stepX; }
      function Y(v) { return padT + (1 - (v - mn) / rng) * (H - padT - padB); }
      var s = mk("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", role: "img" });
      s.style.width = "100%"; s.style.height = "auto"; s.style.display = "block";
      s.setAttribute("aria-label", spendLabel + ": " + years[0] + " ₹" + vals[0].toFixed(2) + " to " + years[n - 1] + " ₹" + vals[n - 1].toFixed(2) + " (peak ₹" + mx.toFixed(2) + ").");
      var d = "M" + X(0) + "," + Y(vals[0]);
      for (var i = 1; i < n; i++) d += " L" + X(i) + "," + Y(vals[i]);
      s.appendChild(mk("path", { d: d, fill: "none", stroke: acc, "stroke-width": 1.6, "stroke-linejoin": "round", "stroke-linecap": "round" }));
      for (var j = 0; j < n; j++) s.appendChild(mk("circle", { cx: X(j), cy: Y(vals[j]), r: j === n - 1 ? 3 : 1.7, fill: j === n - 1 ? acc : surf, stroke: acc, "stroke-width": 1.1 }));
      s.appendChild(txt("₹" + vals[0].toFixed(2), X(0), Y(vals[0]) - 6, muted, 8.5, "start", 400, "0", MONO));
      s.appendChild(txt("₹" + vals[n - 1].toFixed(2), X(n - 1), Y(vals[n - 1]) - 6, text, 9.5, "end", 700, "0", MONO));
      s.appendChild(txt(years[0], X(0), H - 3, muted, 7.5, "start", 400, "0", MONO));
      s.appendChild(txt(years[n - 1], X(n - 1), H - 3, muted, 7.5, "end", 400, "0", MONO));
      return s;
    }
    // a lookup leads with the SELECT: one short framing line up top; the full
    // argument (chart.caption) renders below the card, not above the control
    if (chart.config && chart.config.intro) {
      var intro = doc.createElement("p");
      intro.style.cssText = "font-family:var(--font-serif);font-size:.92rem;line-height:1.5;color:var(--text-muted);margin:0 0 .85rem";
      intro.innerHTML = chart.config.intro;
      host.appendChild(intro);
    }
    var ctl = doc.createElement("div");
    ctl.style.cssText = "display:flex;flex-wrap:wrap;gap:.5rem .7rem;align-items:center;margin-bottom:1rem";
    var lab = doc.createElement("label"); lab.setAttribute("for", slug + "-sel"); lab.textContent = "Your State";
    lab.style.cssText = "font-family:var(--font-mono);font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted)";
    var sel = doc.createElement("select"); sel.id = slug + "-sel";
    sel.style.cssText = "font-family:var(--font-ui);font-size:.95rem;font-weight:700;color:var(--text);background:var(--surface);border:1px solid var(--rule);border-radius:var(--radius);padding:.5rem .7rem;min-width:200px;flex:1 1 200px";
    // alphabetical so a reader can find their State fast (the ranked bars below carry
    // the enactment-year / cess-era story); option value stays the original data index.
    rows.map(function (_, i) { return i; })
      .sort(function (a, b) { return rows[a].state.localeCompare(rows[b].state); })
      .forEach(function (i) { var o = doc.createElement("option"); o.value = String(i); o.textContent = rows[i].state + " · " + rows[i].year; sel.appendChild(o); });
    ctl.appendChild(lab); ctl.appendChild(sel); host.appendChild(ctl);
    var card = doc.createElement("div"); card.setAttribute("aria-live", "polite");
    card.style.cssText = "background:var(--surface);border:1px solid var(--rule);border-left:3px solid var(--accent);border-radius:var(--radius);padding:1rem 1.05rem";
    host.appendChild(card);
    // the full caption argument sits between the card and the ranked bars — it
    // explains the bars the reader is about to hit (app.js suppresses its own
    // figcaption for the lookup renderer)
    if (chart.caption) {
      var capP = doc.createElement("p");
      capP.style.cssText = "font-family:var(--font-serif);font-size:.92rem;line-height:1.5;color:var(--text-muted);margin:.95rem 0 0";
      capP.innerHTML = chart.caption;
      host.appendChild(capP);
    }
    var cmpWrap = doc.createElement("div"); cmpWrap.style.cssText = "margin-top:1.15rem";
    host.appendChild(cmpWrap);
    function draw(i) {
      var r = rows[i], tv = tierVar[r.cess] || "var(--accent)";
      card.style.borderLeftColor = tv.replace(/^var\(|\)$/g, "") ? tv : "var(--accent)";
      card.innerHTML = "";
      var h = doc.createElement("div");
      h.style.cssText = "display:flex;justify-content:space-between;align-items:baseline;gap:1rem;border-bottom:1px solid var(--rule);padding-bottom:.5rem;margin-bottom:.7rem";
      var hn = doc.createElement("div"); hn.style.cssText = "font-family:var(--font-ui);font-weight:700;font-size:1.15rem;color:var(--text)"; hn.textContent = r.state;
      var hy = doc.createElement("div"); hy.style.cssText = "font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted);white-space:nowrap"; hy.textContent = "Act of " + r.year;
      h.appendChild(hn); h.appendChild(hy); card.appendChild(h);
      var badge = doc.createElement("div");
      badge.style.cssText = "display:inline-block;font-family:var(--font-mono);font-size:.64rem;text-transform:uppercase;letter-spacing:.06em;color:" + tv + ";border:1px solid " + tv + ";border-radius:var(--radius);padding:.26rem .55rem;margin-bottom:.7rem";
      badge.textContent = labels[r.cess] || r.cess; card.appendChild(badge);
      var p = doc.createElement("p"); p.style.cssText = "font-family:var(--font-serif);font-size:.95rem;line-height:1.5;color:var(--text);margin:0"; p.textContent = r.rate; card.appendChild(p);
      if (r.rep && r.repNote) {
        var rep = doc.createElement("p");
        rep.style.cssText = "font-family:var(--font-serif);font-size:.9rem;line-height:1.45;color:var(--text);border-left:3px solid var(--blue);padding-left:.7rem;margin:.7rem 0 0";
        rep.textContent = "★ " + r.repNote; card.appendChild(rep);
      }
      if (r.spend && r.spend.length) {
        var sp = doc.createElement("div");
        sp.style.cssText = "margin-top:.9rem;padding-top:.7rem;border-top:1px solid var(--rule)";
        var spl = doc.createElement("div");
        spl.style.cssText = "font-family:var(--font-mono);font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.4rem";
        spl.textContent = spendLabel;
        // honest scale note: each sparkline auto-scales to THIS State's own range, so
        // slope steepness is not comparable across States — the ranked bars below carry
        // the absolute magnitude. (Bihar's ₹0.11–0.41 and Goa's ₹68–140 would otherwise
        // draw as identical wiggles.)
        var splNote = doc.createElement("span");
        splNote.style.cssText = "text-transform:none;letter-spacing:0;opacity:.72";
        splNote.textContent = " · trend only — scaled to this State";
        spl.appendChild(splNote);
        sp.appendChild(spl); sp.appendChild(spark(r.spend));
        if (spendCaveat) {
          var cav = doc.createElement("p");
          cav.style.cssText = "font-family:var(--font-serif);font-style:italic;font-size:.76rem;line-height:1.4;color:var(--text-muted);margin:.5rem 0 0";
          cav.textContent = spendCaveat;
          sp.appendChild(cav);
        }
        card.appendChild(sp);
      }
      buildCmp(i);
      lookupSel[slug] = i;
    }

    // COMPARISON — "where does my State sit?" All 19 States ranked by 7-year average
    // per-capita spend, coloured by cess tier, the selected State pulled to full weight.
    // This is the argument the single-State card can't make: the cess belt clusters at
    // the top, the no-cess majority collapses to near-zero rupees. Rows are also a
    // navigator — click one to select that State.
    // Three genuinely separable channels (not two near-identical reds): operative =
    // solid indigo; no cess = flat grey; cess on paper/renamed = hatched crimson
    // (texture, so it holds up for red-weak vision and in greyscale/print).
    function tierFill(tier) {
      if (tier === "operative") return "var(--blue)";
      if (tier === "none") return "var(--text-muted)";
      return "repeating-linear-gradient(45deg, var(--accent) 0 4px, transparent 4px 8px)";
    }
    function buildCmp(selIdx) {
      cmpWrap.innerHTML = "";
      var selState = rows[selIdx].state;
      var head = doc.createElement("div");
      head.style.cssText = "font-family:var(--font-ui);font-weight:700;font-size:.98rem;color:var(--text);margin-bottom:.15rem";
      head.textContent = "Where " + selState + " sits — all " + rows.length + " States";
      cmpWrap.appendChild(head);
      var sub = doc.createElement("div");
      sub.style.cssText = "font-family:var(--font-mono);font-size:.58rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:.6rem";
      sub.textContent = "avg ₹/person/yr · " + yr0 + "→" + yr1 + " · nominal";
      cmpWrap.appendChild(sub);

      // legend
      var leg = doc.createElement("div");
      leg.style.cssText = "display:flex;flex-wrap:wrap;gap:.35rem .8rem;margin-bottom:.6rem";
      [["operative", "Operative cess"], ["none", "No cess"], ["provision", "Cess on paper / renamed"]].forEach(function (t) {
        var item = doc.createElement("span");
        item.style.cssText = "display:inline-flex;align-items:center;gap:.32rem;font-family:var(--font-mono);font-size:.58rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)";
        var sw = doc.createElement("span");
        sw.style.cssText = "width:12px;height:12px;border-radius:2px;border:1px solid var(--rule);background:" + tierFill(t[0]);
        var tx = doc.createElement("span"); tx.textContent = t[1];
        item.appendChild(sw); item.appendChild(tx); leg.appendChild(item);
      });
      cmpWrap.appendChild(leg);

      ranked.forEach(function (idx) {
        var r = rows[idx], v = avg[idx], on = idx === selIdx;
        var pct = (v / maxAvg) * 100;
        var row = doc.createElement("div");
        row.style.cssText = "display:grid;grid-template-columns:104px 1fr 48px;gap:.4rem;align-items:center;" +
          "padding:.5rem .28rem;min-height:44px;border-radius:2px;cursor:pointer;" + (on ? "background:var(--bg)" : "");   /* ≥44px tap height */
        row.setAttribute("role", "button");
        row.setAttribute("tabindex", "0");
        row.setAttribute("aria-label", r.state + ": " + v.toFixed(2) + " rupees per person per year average, " +
          (labels[r.cess] || r.cess).toLowerCase() + "." + (on ? " Selected." : " Select."));
        var nm = doc.createElement("span");
        nm.style.cssText = "font-family:var(--font-mono);font-size:.6rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" +
          "color:" + (on ? "var(--text)" : "var(--text-muted)") + ";font-weight:" + (on ? "700" : "400");
        nm.textContent = r.state; nm.title = r.state;
        var track = doc.createElement("span");
        track.style.cssText = "position:relative;height:9px;background:var(--rule);border-radius:2px;overflow:hidden";
        var fill = doc.createElement("span");
        // any non-zero value keeps a ≥3px sliver so "almost nothing" reads as
        // almost-nothing, not missing; a true zero stays empty.
        fill.style.cssText = "position:absolute;left:0;top:0;bottom:0;width:" + pct.toFixed(2) + "%;" +
          (v > 0 ? "min-width:3px;" : "") +
          "background:" + tierFill(r.cess) + ";border-radius:2px;opacity:" + (on ? "1" : ".55");
        track.appendChild(fill);
        var val = doc.createElement("span");
        val.style.cssText = "font-family:var(--font-mono);font-size:.6rem;text-align:right;white-space:nowrap;" +
          "color:" + (on ? "var(--text)" : "var(--text-muted)") + ";font-weight:" + (on ? "700" : "400");
        val.textContent = "₹" + v.toFixed(2);
        row.appendChild(nm); row.appendChild(track); row.appendChild(val);
        function pick() { sel.value = String(idx); draw(idx); }
        row.addEventListener("click", pick);
        row.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        cmpWrap.appendChild(row);
      });

      var note = doc.createElement("p");
      note.style.cssText = "font-family:var(--font-serif);font-style:italic;font-size:.74rem;line-height:1.4;color:var(--text-muted);margin:.6rem 0 0";
      note.textContent = "The small north-eastern States — Arunachal, Mizoram, Manipur — rank on tiny populations and central grants, not a library cess: none of them levies one. The durable pattern is the cess belt near the top and the no-cess majority collapsing toward zero rupees.";
      cmpWrap.appendChild(note);
    }

    var start = lookupSel[slug] != null ? lookupSel[slug] : 7; // default Kerala — cess + representation exemplar
    sel.value = String(start); draw(start);
    sel.addEventListener("change", function () { draw(parseInt(sel.value, 10)); });
  }

  RTR.svgHelpers = { cssv: cssv, mk: mk, svgFor: svgFor, txt: txt, bindTip: bindTip, UI: UI, MONO: MONO };
  RTR.renderers = RTR.renderers || {};
  RTR.renderers.oscillation = oscillation;
  RTR.renderers.substitution = substitution;
  RTR.renderers.cess = cess;
  RTR.renderers.silence = silence;
  RTR.renderers.lookup = lookup;
})();
