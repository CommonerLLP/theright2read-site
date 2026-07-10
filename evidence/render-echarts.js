/* RTR charts — ECharts renderer (hybrid path).
   Used only for charts whose JSON sets "renderer":"echarts" — maps and dense
   standard charts. Vendored ECharts (Apache-2.0) is loaded lazily so the four
   signature SVG charts stay zero-dependency. The chart JSON's `option` is an
   ECharts option object; we merge it over the RTR theme so it inherits palette/
   fonts/dark-mode automatically.
*/
(function () {
  var RTR = (window.RTR = window.RTR || {});
  var loaded = false, loading = null;
  var instances = []; // track for theme re-render + resize

  function loadECharts() {
    if (loaded) return Promise.resolve(window.echarts);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "./vendor/echarts.min.js";
      s.onload = function () { loaded = true; resolve(window.echarts); };
      s.onerror = function () { reject(new Error("ECharts failed to load from ./vendor/echarts.min.js")); };
      document.head.appendChild(s);
    });
    return loading;
  }

  RTR.renderEcharts = function (host, chart) {
    return loadECharts().then(function (echarts) {
      echarts.registerTheme("rtr", RTR.echartsTheme());
      host.innerHTML = "";
      var el = document.createElement("div");
      el.style.cssText = "width:100%;height:" + (chart.height || 380) + "px";
      host.appendChild(el);
      var inst = echarts.init(el, "rtr", { renderer: "svg" });
      inst.setOption(chart.option || {});
      instances.push(inst);
      return inst;
    }).catch(function (err) {
      host.innerHTML = '<p style="font-family:var(--font-mono);color:var(--text-muted);padding:1rem">' +
        'This chart needs the ECharts library (charts/vendor/echarts.min.js). ' + err.message + '</p>';
    });
  };

  // called by app on theme change / resize
  RTR.echartsRerender = function () { if (window.echarts) instances.forEach(function (i) { i.setOption({}, false); }); };
  RTR.echartsResize = function () { instances.forEach(function (i) { i.resize(); }); };
  RTR.echartsClear = function () { instances.forEach(function (i) { i.dispose(); }); instances = []; };
  RTR.echartsExportPNG = function () { return instances[0] ? instances[0].getDataURL({ type: "png", pixelRatio: 3, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() }) : null; };
})();
