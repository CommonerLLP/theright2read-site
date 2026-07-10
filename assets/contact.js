/* RTR contact — assembles obfuscated mailto links at runtime.
   The static HTML carries NO harvestable address: no "@", no "mailto:". Each
   link ships as human-readable "user [at] theright2read [dot] org" text, with
   the domain stored reversed in data-d. On load we build a real, clickable,
   screen-reader-friendly mailto. No JS ⇒ the [at]/[dot] text stays readable.
   Defeats the bulk email harvesters (which regex for @/mailto and don't run JS)
   without sacrificing accessibility. */
(function () {
  "use strict";
  function reveal() {
    var links = document.querySelectorAll("a.rtr-mail[data-u]");
    Array.prototype.forEach.call(links, function (a) {
      var u = a.getAttribute("data-u");
      var d = (a.getAttribute("data-d") || "").split("").reverse().join("");
      if (!u || !d) return;
      var addr = u + "@" + d;
      a.setAttribute("href", "mailto:" + addr);
      a.textContent = addr;
      a.removeAttribute("aria-label"); // don't let a stale label mask the real address for screen readers
      a.classList.add("rtr-mail-on");
      a.removeAttribute("data-u");
      a.removeAttribute("data-d");
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reveal);
  } else {
    reveal();
  }
})();
