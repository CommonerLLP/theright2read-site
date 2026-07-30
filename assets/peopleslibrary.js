/* peopleslibrary.js — navigation for the full-text PNLP 2024 page.
   Everything here is additive: with JavaScript off the document still reads, the
   contents still jump, and footnotes still work as ordinary anchors. */
(function () {
  'use strict';

  var doc = document.getElementById('document');
  if (!doc) return;

  var calm = matchMedia('(prefers-reduced-motion: reduce)');
  function scrollBehavior() { return calm.matches ? 'auto' : 'smooth'; }

  /* ---------- the contents drawer (below 1024px) ---------- */
  var index = document.getElementById('doc-index');
  var toggle = document.querySelector('.index-toggle');
  var scrim = document.querySelector('.doc-scrim');

  function setDrawer(open) {
    if (!index || !toggle) return;
    if (open) index.setAttribute('data-open', '');
    else index.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (scrim) scrim.hidden = !open;
    if (open) {
      var first = index.querySelector('a');
      if (first) first.focus();
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setDrawer(index.getAttribute('data-open') === null);
    });
  }
  if (scrim) {
    scrim.addEventListener('click', function () {
      setDrawer(false);
      if (toggle) toggle.focus();
    });
  }
  if (index) {
    index.addEventListener('click', function (e) {
      if (e.target.closest('a')) setDrawer(false);
    });
  }

  /* ---------- search across every section ----------
     The document is now one page per section, so an in-page highlighter can only
     ever see a thirtieth of it. A build-time index answers the whole document in
     one small fetch, and each result deep-links to the sentence with a text
     fragment rather than dumping the reader at a section top. */
  var input = document.getElementById('doc-search');
  var results = document.querySelector('[data-results]');
  var status = document.querySelector('[data-search-status]');
  var data = null, pending = null;

  function loadIndex() {
    if (!input) return Promise.resolve(null);
    if (data) return Promise.resolve(data);
    // share the in-flight request: returning a resolved null here meant a keystroke
    // during the fetch never rendered anything
    if (pending) return pending;
    pending = fetch(input.getAttribute('data-search-index'))
      .then(function (r) { return r.json(); })
      .then(function (j) { data = j; pending = null; return j; })
      .catch(function () {
        pending = null;
        if (status) status.textContent = 'Search is unavailable — use the contents.';
        return null;
      });
    return pending;
  }

  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function snippet(text, q) {
    var at = text.toLowerCase().indexOf(q);
    var from = Math.max(0, at - 60);
    var raw = text.slice(from, at + q.length + 90);
    var rel = raw.toLowerCase().indexOf(q);
    return {
      html: (from > 0 ? '\u2026' : '') + esc(raw.slice(0, rel))
            + '<mark>' + esc(raw.substr(rel, q.length)) + '</mark>'
            + esc(raw.slice(rel + q.length))
            + (at + q.length + 90 < text.length ? '\u2026' : ''),
      exact: raw.substr(rel, q.length)
    };
  }

  function render(q) {
    if (!results) return;
    var scored = [];
    for (var i = 0; i < data.length; i++) {
      var lower = data[i].x.toLowerCase();
      var n = 0, at = lower.indexOf(q);
      while (at !== -1) { n++; at = lower.indexOf(q, at + q.length); }
      if (n) scored.push({ e: data[i], n: n });
    }
    // the section that is *about* the term should lead, not the first one to mention it
    scored.sort(function (a, b) { return b.n - a.n; });
    var hits = [];
    for (var k = 0; k < scored.length && hits.length < 40; k++) {
      var e = scored[k].e;
      var s = snippet(e.x, q);
      var href = e.u + (e.u.indexOf('#') === -1 ? '#' : '')
                 + ':~:text=' + encodeURIComponent(s.exact);
      hits.push('<li><a href="' + href + '"><span class="r-sec">' + esc(e.t)
                + '</span><span class="r-snip">' + s.html + '</span>'
                + '<span class="r-count">' + scored[k].n + '</span></a></li>');
    }
    if (!hits.length) {
      results.innerHTML = '<p class="r-none">No matches for \u201c' + esc(q)
        + '\u201d. Try a shorter word, or use the contents.</p>';
      if (status) status.textContent = 'No matches.';
    } else {
      results.innerHTML = '<ol>' + hits.join('') + '</ol>';
      if (status) {
        status.textContent = hits.length
          + (hits.length === 1 ? ' section matches.' : ' sections match.');
      }
    }
    results.hidden = false;
  }

  function search(raw) {
    var q = raw.trim().toLowerCase();
    if (!q.length) {
      if (results) { results.hidden = true; results.innerHTML = ''; }
      if (status) status.textContent = '';
      return;
    }
    if (q.length < 2) {
      if (status) status.textContent = 'Type two or more characters.';
      return;
    }
    loadIndex().then(function () { if (data) render(q); });
  }

  if (input) {
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { search(input.value); }, 180);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; search(''); }
    });
    input.addEventListener('focus', loadIndex, { once: true });
  }

  /* ---------- reach search from anywhere ---------- */
  document.addEventListener('keydown', function (e) {
    if (!input) return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)
                 || document.activeElement.isContentEditable;
    var wants = (e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key === 'k');
    if (!wants) return;
    e.preventDefault();
    setDrawer(false);
    input.focus();
    input.select();
  });

  /* Old single-page links now live on their own pages. The map covers every
     heading, not only section slugs, so /peopleslibrary/#early-beginnings (a former
     h3) forwards too instead of leaving the reader on the introduction. */
  if (location.pathname === '/peopleslibrary/' && location.hash.length > 1) {
    var want = location.hash.slice(1);
    if (!document.getElementById(want)) {
      var mapEl = document.getElementById('legacy-anchors');
      var map = mapEl ? JSON.parse(mapEl.textContent) : null;
      if (map && map[want]) location.replace(map[want]);
    }
  }

  /* ---------- copyable heading anchors ---------- */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('.head-anchor') : null;
    if (!a || !navigator.clipboard) return;
    e.preventDefault();
    var url = location.origin + location.pathname + a.getAttribute('href');
    navigator.clipboard.writeText(url).then(function () {
      history.replaceState(null, '', a.getAttribute('href'));
      a.classList.add('copied');
      setTimeout(function () { a.classList.remove('copied'); }, 1400);
    });
  });

  /* ---------- footnote cards ---------- */
  var card = null;
  // the card is built once, so the marker to return focus to must live out here;
  // closing over the first one sends every later reader back to footnote 1
  var focusBack = null;

  function closeCard() {
    if (card) card.hidden = true;
  }

  function showNote(num, noteEl, returnTo) {
    focusBack = returnTo;
    if (!card) {
      // a div, not <aside>: overriding <aside>'s implicit complementary role with
      // dialog is not an allowed role combination
      card = document.createElement('div');
      card.className = 'fn-card';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-labelledby', 'fn-card-num');
      card.innerHTML = '<button class="fn-card-close" aria-label="Close note">&times;</button>' +
        '<div class="fn-card-num" id="fn-card-num"></div><div class="fn-card-body"></div>';
      card.querySelector('.fn-card-close').addEventListener('click', function () {
        closeCard();
        if (focusBack && focusBack.focus) focusBack.focus();
      });
      document.body.appendChild(card);
    }
    card.querySelector('.fn-card-num').textContent = 'Note ' + num;
    var body = noteEl.cloneNode(true);
    var back = body.querySelector('.footnote-backref, a[class*="backref"]');
    if (back) back.remove();
    var slot = card.querySelector('.fn-card-body');
    slot.replaceChildren.apply(slot, body.childNodes);
    card.hidden = false;
    card.querySelector('.fn-card-close').focus();
  }

  doc.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('sup[id^="fnref"] a') : null;
    if (!link) return;
    var id = (link.getAttribute('href') || '').replace(/^#/, '');
    var note = id && document.getElementById(id);
    if (!note) return;                     // fall through to the plain anchor jump
    e.preventDefault();
    showNote(link.textContent.trim(), note, link);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeCard();
    if (index && index.getAttribute('data-open') !== null) {
      setDrawer(false);
      if (toggle) toggle.focus();
    }
  });

  /* ---------- reading progress + contents scroll-spy ---------- */
  var bar = document.querySelector('[data-progress]');
  // only same-page anchors: the sidebar's section links point at other documents
  var tocLinks = Array.prototype.slice.call(
    document.querySelectorAll('.toc-list a[href^="#"]'));
  var targets = tocLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });

  var cssProgress = window.CSS && CSS.supports
                    && CSS.supports('animation-timeline', 'scroll()');

  function onScroll() {
    if (bar && !cssProgress) {
      var max = doc.offsetTop + doc.offsetHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = (pct * 100).toFixed(1) + '%';
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); syncSpy(); ticking = false; });
  }, { passive: true });
  onScroll();
  syncSpy();

  // Position-derived, not entry-derived: sections here run for several screens, so an
  // IntersectionObserver band is empty most of the time and the reader loses their place.
  var spyTargets = null;   // built on first use: this block is evaluated after the
                           // first syncSpy() call, so eager assignment would throw
  var lastActive = null;

  function syncSpy() {
    if (!spyTargets) {
      spyTargets = targets.map(function (t, i) {
        return t ? {el: t, link: tocLinks[i]} : null;
      }).filter(Boolean);
    }
    if (!spyTargets.length) return;
    var line = window.innerHeight * 0.25;   // the reader's eye, not the viewport top
    var current = spyTargets[0];
    for (var i = 0; i < spyTargets.length; i++) {
      if (spyTargets[i].el.getBoundingClientRect().top <= line) current = spyTargets[i];
      else break;
    }
    if (current === lastActive) return;
    lastActive = current;
    tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
    current.link.setAttribute('aria-current', 'true');
    // a 104-row index scrolls internally; without this the active row is off-screen
    var inner = document.querySelector('.doc-index-inner');
    if (inner && inner.scrollHeight > inner.clientHeight) {
      var lr = current.link.getBoundingClientRect(), ir = inner.getBoundingClientRect();
      if (lr.top < ir.top || lr.bottom > ir.bottom) {
        current.link.scrollIntoView({block: 'nearest', behavior: 'auto'});
      }
    }
  }
})();
