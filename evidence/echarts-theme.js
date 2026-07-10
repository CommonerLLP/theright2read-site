/* RTR → ECharts theme.
   Builds an ECharts theme object from the LIVE computed tokens.css variables, so
   ECharts charts inherit the exact campaign palette/fonts and follow light/dark
   with the rest of the app. Call rtrEChartsTheme() after the theme is applied to
   <html>; re-register + re-init on theme change. NO green (game-signal only).
*/
(function () {
  var RTR = (window.RTR = window.RTR || {});
  var root = document.documentElement;
  function v(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  RTR.echartsTheme = function () {
    var text = v("--text"), muted = v("--text-muted"), rule = v("--rule"),
        accent = v("--accent"), blue = v("--blue"), red2 = v("--red-2"),
        ink = v("--text"), bg = v("--bg");
    var UI = '"Inter Tight", system-ui, sans-serif';
    var MONO = '"PT Mono", "Menlo", monospace';
    // ordered categorical palette — brand roles only, no green
    var palette = [accent, blue, ink, red2, muted];
    var axisLine = { lineStyle: { color: rule } };
    var axisLabel = { color: muted, fontFamily: MONO, fontSize: 11 };
    var splitLine = { lineStyle: { color: rule, opacity: 0.6, type: [1, 5] } };
    return {
      color: palette,
      backgroundColor: "transparent",
      textStyle: { fontFamily: UI, color: text },
      title: { textStyle: { fontFamily: '"Oswald", "Arial Narrow", sans-serif', fontWeight: 700, color: text }, subtextStyle: { color: muted, fontFamily: MONO } },
      legend: { textStyle: { color: text, fontFamily: UI } },
      tooltip: {
        backgroundColor: text, borderColor: text, borderWidth: 0,
        textStyle: { color: bg, fontFamily: UI, fontSize: 12 },
        extraCssText: "border-radius:2px; box-shadow:0 8px 24px rgba(0,0,0,.18);"
      },
      grid: { borderColor: rule },
      categoryAxis: { axisLine: axisLine, axisTick: axisLine, axisLabel: axisLabel, splitLine: { show: false }, nameTextStyle: { color: muted, fontFamily: MONO } },
      valueAxis: { axisLine: { show: false }, axisTick: { show: false }, axisLabel: axisLabel, splitLine: splitLine, nameTextStyle: { color: muted, fontFamily: MONO } },
      logAxis: { axisLine: axisLine, axisLabel: axisLabel, splitLine: splitLine },
      timeAxis: { axisLine: axisLine, axisLabel: axisLabel, splitLine: splitLine },
      line: { itemStyle: { borderWidth: 2 }, lineStyle: { width: 3 }, symbolSize: 7, symbol: "circle", smooth: false },
      bar: { itemStyle: { barBorderWidth: 0, barBorderRadius: [2, 2, 0, 0] } },
      // geo/map (ready for the state-cess choropleth when its GeoJSON lands)
      geo: { itemStyle: { areaColor: v("--surface"), borderColor: rule }, emphasis: { itemStyle: { areaColor: accent } }, label: { color: text, fontFamily: UI } },
      visualMap: { textStyle: { color: text, fontFamily: MONO }, inRange: { color: [v("--surface"), accent] } }
    };
  };
})();
