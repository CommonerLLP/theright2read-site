/* RTR charts — app: theme, hash router, loader, PNG export.
   Routes (hash-based, so it works at ANY base path — /charts/, a subdomain, or
   a subfolder — with no server rewrites, which static GitHub Pages can't do):
     #/            → index of all charts (from manifest.json)
     #/c/<slug>    → render data/<slug>.json
   Query params:
     ?theme=dark|light  → force + lock the theme (for iframe hosts)
     ?embed=1           → strip app chrome (header/footer) for clean iframes
*/
(function () {
  var RTR = (window.RTR = window.RTR || {});
  var doc = document, root = doc.documentElement;
  var view = doc.getElementById("view");
  var THEME_KEY = "rtr-theme"; // shared with the main site (assets/theme.js)

  function parseQS(s) {
    var q = {}; (s || "").replace(/^\?/, "").split("&").forEach(function (p) { if (!p) return; var kv = p.split("="); q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ""); });
    return q;
  }
  // params may live in the real query string OR after the hash (permalink-friendly:
  // …/#/c/oscillation?embed=1&theme=dark). Merge both; hash wins.
  function routeParams() {
    var hashQS = (location.hash.split("?")[1]) || "";
    var q = parseQS(location.search); var hq = parseQS(hashQS);
    for (var k in hq) q[k] = hq[k];
    return q;
  }
  var EMBED = false, FORCED_THEME = null;
  function applyRouteParams() {
    var Q = routeParams();
    EMBED = Q.embed === "1" || Q.embed === "true";
    FORCED_THEME = (Q.theme === "dark" || Q.theme === "light") ? Q.theme : null;
    doc.body.classList.toggle("embed", EMBED);
    if (FORCED_THEME) root.setAttribute("data-theme", FORCED_THEME);
  }

  /* ---- theme ----
     Theme is owned by the site's assets/theme.js (RTRTheme + the masthead toggle),
     same as every other page. We only need to REDRAW charts when the theme flips,
     since the SVG/canvas renderers read live CSS vars — a MutationObserver on
     data-theme (wired in boot) calls rerender(). ?theme= (embeds) is applied in
     applyRouteParams above. */

  /* ---- render bookkeeping (re-run on theme/resize; SVG reads live CSS vars) ---- */
  var _rerender = null, _resizeOnly = null;
  function rerender() { if (_rerender) _rerender(); }
  function clearActive() {
    _rerender = null; _resizeOnly = null;
    if (RTR.echartsClear) RTR.echartsClear();
  }

  /* ---- data ---- */
  function fetchJSON(url) { return fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(url + " → " + r.status); return r.json(); }); }

  /* ---- views ---- */
  function el(tag, attrs, html) { var e = doc.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }

  function renderIndex() {
    clearActive();
    fetchJSON("./manifest.json").then(function (m) {
      view.innerHTML = "";
      view.appendChild(el("h1", { class: "idx-title" }, "Evidence"));
      var p = el("div", { style: "color:var(--text-muted);font-size:.9rem;line-height:1.55;margin:-.4rem 0 1.5rem" },
        "<b style=\"color:var(--text)\">Using this work.</b> Every chart is a permalink, and embeddable — " +
        "<code>&lt;iframe src=\"&hellip;/#/c/&lt;slug&gt;?embed=1\"&gt;</code>. These are research products of " +
        "<b style=\"color:var(--text)\">The Right to Read</b>, released for noncommercial reuse " +
        "(<a href=\"https://polyformproject.org/licenses/noncommercial/1.0.0\" style=\"color:var(--accent)\">PolyForm-NC 1.0.0</a>). " +
        "If you use one, <b style=\"color:var(--text)\">credit The Right to Read</b> and cite the primary source named on the chart.");
      view.appendChild(p);
      // reader-meaningful type, not the render-tech token (svg/canvas/lookup)
      var KIND = { lookup: "Lookup", svg: "Chart", canvas: "Graphic", echarts: "Map" };
      var ul = el("ul", { class: "idx" });
      (m.charts || []).forEach(function (c) {
        var li = el("li");
        var a = el("a", { href: "#/c/" + c.slug });
        a.appendChild(el("span", { class: "t" }, c.title || c.slug));
        a.appendChild(el("span", { class: "s" }, KIND[c.renderer] || "Chart"));
        a.appendChild(el("span", { class: "go", "aria-hidden": "true" }, "→"));   // tappable affordance
        li.appendChild(a); ul.appendChild(li);
      });
      view.appendChild(ul);
    }).catch(function (e) { view.innerHTML = '<p style="color:var(--accent)">Could not load chart index: ' + e.message + "</p>"; });
  }

  function renderChart(slug) {
    clearActive();
    fetchJSON("./charts/" + slug + ".json").then(function (chart) {
      view.innerHTML = "";
      doc.title = (chart.title || slug) + " — The Right to Read";
      var fig = el("figure", { id: "fig-" + slug });
      var pad = el("div", { class: "fig-pad" });
      if (chart.subtitle) pad.appendChild(el("p", { class: "fig-kicker" }, chart.subtitle));
      pad.appendChild(el("h1", { class: "fig-title" }, chart.title || slug));   // single H1 per chart page
      var canvasHost = el("div", { class: "chart-host" });
      pad.appendChild(canvasHost);
      if (chart.caption) pad.appendChild(el("figcaption", null, chart.caption));
      if (chart.source) pad.appendChild(el("p", { class: "fig-src" }, "Source: " + chart.source));
      pad.appendChild(el("p", { class: "fig-cite" }, "Cite as: The Right to Read, “" + (chart.title || slug) + "”, theright2read.org/evidence/#/c/" + slug + " (2026). Reuse noncommercial, with credit."));
      pad.appendChild(el("p", { class: "embed-cite" }, "theright2read.org/evidence · #/c/" + slug));
      fig.appendChild(pad); view.appendChild(fig);

      var isEch = chart.renderer === "echarts";
      var draw = function () {
        if (isEch) { RTR.renderEcharts(canvasHost, chart); }
        else {
          var fn = RTR.renderers[chart.type];
          if (fn) fn(canvasHost, chart);
          else canvasHost.innerHTML = '<p style="color:var(--accent)">Unknown chart type: ' + chart.type + "</p>";
        }
      };
      draw();
      _rerender = draw;                       // theme change → redraw (picks up new CSS vars)
      _resizeOnly = function () { if (isEch && RTR.echartsResize) RTR.echartsResize(); else draw(); };

      // PNG export (Substack / print fallback) — a per-figure control, graphic charts only
      if (chart.renderer !== "lookup") {
        var tools = el("div", { class: "fig-tools" });
        var pbtn = el("button", { class: "png-btn", type: "button" }, "Download PNG");
        pbtn.onclick = function () { exportPNG(slug, chart, canvasHost); };
        tools.appendChild(pbtn); pad.appendChild(tools);
      }
    }).catch(function () {
      // plain-language miss (no file path / HTTP status leaked) + a way back
      view.innerHTML = "";
      var box = el("div", { class: "chart-missing" });
      box.appendChild(el("h1", { class: "fig-title" }, "That chart isn’t here"));
      box.appendChild(el("p", { style: "color:var(--text-muted);margin:0 0 1rem" },
        "We couldn’t find a chart called “" + slug + "”. It may have been renamed or moved."));
      box.appendChild(el("a", { href: "#/", class: "back-link" }, "← Browse all charts"));
      view.appendChild(box);
      doc.title = "Chart not found — The Right to Read";
    });
  }

  /* ---- PNG export (best-effort static render for Substack/print) ---- */
  function download(dataURL, name) { var a = doc.createElement("a"); a.href = dataURL; a.download = name; doc.body.appendChild(a); a.click(); doc.body.removeChild(a); }
  function exportPNG(slug, chart, host) {
    var bg = getComputedStyle(root).getPropertyValue("--bg").trim() || "#fff";
    if (chart.renderer === "echarts") { var u = RTR.echartsExportPNG && RTR.echartsExportPNG(); if (u) download(u, "rtr-" + slug + ".png"); return; }
    var cv = host.querySelector("canvas");
    if (cv) { // canvas chart (silence): composite the grids onto one padded canvas
      var canvases = host.querySelectorAll("canvas"), scale = 1, pad = 24, gap = 24;
      var w = 0, h = 0; canvases.forEach(function (c) { w += c.width + gap; h = Math.max(h, c.height); });
      w = w - gap + pad * 2; h = h + pad * 2;
      var out = doc.createElement("canvas"); out.width = w; out.height = h; var ctx = out.getContext("2d");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      var x = pad; canvases.forEach(function (c) { ctx.drawImage(c, x, pad); x += c.width + gap; });
      download(out.toDataURL("image/png"), "rtr-" + slug + ".png"); return;
    }
    var svg = host.querySelector("svg"); if (!svg) return;
    var vb = svg.viewBox.baseVal, scale = 3;
    var clone = svg.cloneNode(true);
    clone.setAttribute("width", vb.width); clone.setAttribute("height", vb.height);
    var xml = new XMLSerializer().serializeToString(clone);
    var img = new Image();
    img.onload = function () {
      var out = doc.createElement("canvas"); out.width = vb.width * scale; out.height = vb.height * scale;
      var ctx = out.getContext("2d"); ctx.fillStyle = bg; ctx.fillRect(0, 0, out.width, out.height);
      ctx.scale(scale, scale); ctx.drawImage(img, 0, 0);
      try { download(out.toDataURL("image/png"), "rtr-" + slug + ".png"); }
      catch (e) { alert("PNG export blocked by the browser for this chart. Screenshot it instead."); }
    };
    img.onerror = function () { alert("PNG export failed; screenshot the chart instead."); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  }

  /* ---- router ---- */
  function route() {
    applyRouteParams();
    var path = location.hash.replace(/^#/, "").split("?")[0];
    var m = path.match(/^\/c\/([\w-]+)$/);
    if (m) renderChart(m[1]); else renderIndex();
  }

  /* ---- boot ---- */
  // redraw charts when the site theme toggles (theme.js sets data-theme on <html>)
  new MutationObserver(function () { rerender(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  // and when the OS theme changes while on system default (no explicit choice)
  // OS-theme change on system default — guard addEventListener (older WebKit/Safari
  // MediaQueryList has only addListener; calling the missing method would throw and
  // abort boot before route()). [codex #20]
  if (window.matchMedia) {
    var _mq = window.matchMedia("(prefers-color-scheme: dark)");
    var _onSys = function () { if (!FORCED_THEME && !(function(){try{return localStorage.getItem(THEME_KEY)}catch(e){return null}})()) rerender(); };
    if (_mq.addEventListener) _mq.addEventListener("change", _onSys);
    else if (_mq.addListener) _mq.addListener(_onSys);
  }
  window.addEventListener("hashchange", route);
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (_resizeOnly) _resizeOnly(); }, 180); });
  route();
})();
