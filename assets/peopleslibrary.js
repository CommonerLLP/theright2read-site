/* peopleslibrary.js — navigation for the full-text PNLP 2024 page.
   Everything here is additive: with JavaScript off the document still reads, the
   contents still jump, and footnotes still work as ordinary anchors. */
(function () {
  'use strict';

  var doc = document.getElementById('document');
  if (!doc) return;

  var calm = matchMedia('(prefers-reduced-motion: reduce)');
  function scrollBehavior() { return calm.matches ? 'auto' : 'smooth'; }

  /* ---------- search ---------- */
  var input = document.getElementById('doc-search');
  var status = document.querySelector('[data-search-status]');
  var supportsHighlight = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function';

  var nodes = [];   // text nodes, in document order
  var flat = '';    // their concatenated lowercase text
  var starts = [];  // flat-string offset where each node begins

  function buildIndex() {
    var walker = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var parts = [], at = 0, n;
    while ((n = walker.nextNode())) {
      nodes.push(n);
      starts.push(at);
      parts.push(n.nodeValue.toLowerCase());
      at += n.nodeValue.length;
    }
    flat = parts.join('');
  }

  function nodeAt(offset) {
    var lo = 0, hi = starts.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  var hits = [];      // Range objects
  var current = -1;

  function clearHighlights() {
    if (supportsHighlight) {
      CSS.highlights.delete('doc-search-hit');
      CSS.highlights.delete('doc-search-current');
    }
    hits = [];
    current = -1;
  }

  function search(qRaw) {
    clearHighlights();
    var q = qRaw.trim().toLowerCase();
    if (!q.length) { status.textContent = ''; return; }
    if (q.length < 2) {
      status.textContent = 'Type two or more characters.';
      return;
    }
    if (!flat) buildIndex();

    var from = 0, idx, capped = false;
    while ((idx = flat.indexOf(q, from)) !== -1) {
      if (hits.length >= 500) { capped = true; break; }
      var i = nodeAt(idx);
      var startOffset = idx - starts[i];
      // a match that straddles two text nodes is skipped; in running prose the
      // cost is a rare miss, and stitching ranges across nodes is not worth it
      if (startOffset + q.length <= nodes[i].nodeValue.length) {
        var r = document.createRange();
        r.setStart(nodes[i], startOffset);
        r.setEnd(nodes[i], startOffset + q.length);
        hits.push(r);
      }
      from = idx + q.length;
    }

    if (!hits.length) {
      status.textContent = 'No matches.';
      return;
    }
    if (supportsHighlight) {
      CSS.highlights.set('doc-search-hit', new Highlight(...hits));
    }
    // the scan stops at 500 ranges; saying "500 matches" would be a false count
    status.textContent = (capped ? '500+ matches — narrow your search'
                                 : hits.length + (hits.length === 1 ? ' match' : ' matches'))
      + ' — press Enter to step through';
    current = -1;
  }

  function step(dir) {
    if (!hits.length) return;
    current = (current + dir + hits.length) % hits.length;
    var r = hits[current];
    if (supportsHighlight) {
      CSS.highlights.set('doc-search-current', new Highlight(r));
    }
    var el = r.startContainer.parentElement;
    if (el) {
      // the section may be skipped by content-visibility; scrolling forces layout
      el.scrollIntoView({ block: 'center', behavior: scrollBehavior() });
    }
    status.textContent = 'Match ' + (current + 1) + ' of ' + hits.length +
      ' — Enter for next, Esc to clear';
  }

  if (input && status) {
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { search(input.value); }, 180);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        // on a phone the drawer and its scrim sit over the document; stepping to a
        // match while they are open shows the reader nothing
        setDrawer(false);
        step(e.shiftKey ? -1 : 1);
      } else if (e.key === 'Escape') {
        input.value = '';
        clearHighlights();
        status.textContent = '';
      }
    });
  }

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
      var first = index.querySelector('a, input');
      if (first) first.focus();
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setDrawer(index.getAttribute('data-open') === null);
    });
  }
  if (scrim) scrim.addEventListener('click', function () {
    setDrawer(false);
    if (toggle) toggle.focus();
  });
  // picking a section is the end of using the drawer
  if (index) {
    index.addEventListener('click', function (e) {
      if (e.target.closest('a')) setDrawer(false);
    });
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

  /* ---------- make room for the annotator's toolbar ----------
     Hypothes.is paints a fixed 33x115px control strip hard against the right
     edge, inside its own shadow DOM (so it cannot be styled or moved from here).
     At 360px that strip sits over the last of the reading column and on top of
     the theme toggle. Flag it on <html> and let CSS reserve the gutter, so the
     gutter disappears by itself if the annotation layer is ever removed. */
  (function flagAnnotator() {
    if (document.querySelector('hypothesis-sidebar')) {
      document.documentElement.classList.add('annotator-present');
      return;
    }
    var obs = new MutationObserver(function () {
      if (document.querySelector('hypothesis-sidebar')) {
        document.documentElement.classList.add('annotator-present');
        obs.disconnect();
      }
    });
    // No timeout: the embed is async and on a slow connection can arrive well
    // after any deadline we would pick — and giving up early brings the overlap
    // back on exactly the cheap-Android-on-patchy-data reader this is built for.
    // Watching body's direct children only, so an idle observer costs nothing.
    obs.observe(document.body, { childList: true });
  })();

  /* ---------- reading progress + contents scroll-spy ---------- */
  var bar = document.querySelector('[data-progress]');
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc-list a'));
  var targets = tocLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });

  function onScroll() {
    if (bar) {
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
