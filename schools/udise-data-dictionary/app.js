/* UDISE+ field dictionary — browser.
   One JSON, no build step, no dependencies. Follows the LMMHA browser in
   public-finance/references/lmmha/lod/app.js so the two read as one family.

   The point of this page: a researcher who has a UDISE+ column in front of them
   should be able to find out, in one place, what was asked, what the value list
   means, which years carry it, what changed, and what will silently break. Every
   trap carries the fix, not just the warning. */

const state = {
  evtIdx: 3, evtFilter: "ALL", data: null, year: null, section: null, field: null, tab: "browse", q: "", filter: null };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => (s == null ? "" : String(s).replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SECCOL = { "1": "var(--s1)", "2": "var(--s2)", "3": "var(--s3)", "4": "var(--s4)" };

async function init() {
  /* No cache-buster meant a browser held a stale dictionary across edits, and the
     page silently showed an older version of the data than the file on disk. */
  state.data = await (await fetch("udise_browser.json", { cache: "no-store" })).json();
  state.year = null;   // null means every year, which is the default view
  renderMasthead(); bindTabs(); bindSearch(); bindTop(); bindColophon();
  window.addEventListener("hashchange", routeFromHash);
  routeFromHash();
}

/* ---------------------------------------------------------------- masthead */
function renderMasthead() {
  const c = state.data.meta.counts;
  $("#counts").textContent =
    `${c.fields} columns · ${state.data.meta.years.length} years, ` +
    `${state.data.meta.years[0]} to ${state.data.meta.years.at(-1)} · ` +
    `${c.never_released} questions asked of every school and never released`;
}

/* Fields live in a given year only if that year is in their span. This is the
   whole point of the year selector: the schema is not one thing across eight
   releases, and a dictionary that shows only the latest hides 79 deletions. */
const inYear = (f, y) => !y || f.years.includes(y);
const fieldsIn = (y) => (y ? state.data.fields.filter((f) => inYear(f, y))
                           : state.data.fields);

/* The lifecycle is the answer to the reader's real question, so it belongs in
   the row and not behind a year selector. Eight cells, one per release: filled
   where the column shipped, empty where it did not. */
const YEAR_SHORT = (y) => y.slice(2).replace("-", "\u2013");
function lifeStrip(f) {
  return `<span class="life" title="${f.years.join(", ")}">` +
    state.data.meta.years.map((y) =>
      `<i class="${f.years.includes(y) ? "on" : "off"}"></i>`).join("") + "</span>";
}
function lifeWords(f) {
  const ys = state.data.meta.years, first = f.years[0], last = f.years.at(-1);
  const bits = [];
  bits.push(first === ys[0] ? "from the first release" : `added ${first}`);
  if (last !== ys.at(-1)) bits.push(`last released ${last}`);
  if (f.gap) bits.push("released, absent, released again");
  const ren = (f.changes || []).filter((c) => c.action === "RENAME");
  if (ren.length) bits.push(`renamed ${ren[0].at || ""}`.trim());
  const rec = (f.changes || []).filter((c) => c.action === "RECODE");
  if (rec.length) bits.push("codes changed meaning");
  const sm = (f.changes || []).filter((c) => c.action === "SPLIT" || c.action === "MERGE");
  if (sm.length) bits.push(sm[0].action.toLowerCase() + " at the break");
  if (f.dormant_2025_26) bits.push("present in 2025-26 and empty");
  return bits.join(" \u00b7 ");
}

/* What moved INTO the selected year. The 2022-23 discontinuity is the single most
   important fact about this dataset, and a year selector hides it as an absence
   unless the change is named where the user actually is. */
function eventInto(year) {
  return state.data.events.find((e) => e.to === year) || null;
}


const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------- tabs */
function bindTabs() {
  /* The W3C tab pattern: aria-selected tracks the active tab, tabindex roves
     so Tab lands once on the tablist, and arrow keys move between tabs. A
     screen reader hears "tab, 2 of 5, selected"; a keyboard never needs a
     pointer. */
  const tabs = $$(".tab");
  const select = (t, focus) => {
    state.tab = t.dataset.tab;
    tabs.forEach((x) => {
      const on = x === t;
      x.classList.toggle("active", on);
      x.setAttribute("aria-selected", on ? "true" : "false");
      x.tabIndex = on ? 0 : -1;
    });
    if (focus) t.focus();
    render();
  };
  tabs.forEach((t, i) => {
    t.onclick = () => select(t, false);
    t.onkeydown = (e) => {
      const move = {ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabs.length - 1 - i}[e.key];
      if (move === undefined) return;
      e.preventDefault();
      select(tabs[(i + move + tabs.length) % tabs.length], true);
    };
  });
}

function render() {
  const wide = state.tab !== "browse";
  $("#browse-view").hidden = wide;
  ["changes", "traps", "missing", "about"].forEach((k) =>
    $("#" + k + "-view").hidden = state.tab !== k);
  $("#searchbar").style.display = state.tab === "browse" ? "" : "none";
  if (state.tab === "browse") renderBrowse();
  syncYearbar();
  if (state.tab === "changes") renderChanges();
  if (state.tab === "traps") { renderTraps(); renderRecipes(); }
  if (state.tab === "missing") renderMissing();
  if (state.tab === "about") renderAbout();
}

function syncYearbar() {
  $("#searchbar").hidden = state.tab !== "browse";
}


/* ----------------------------------------------------------------- browse */
function renderBrowse() {
  const list = $("#list");
  list.className = "nav-pane";
  const here = fieldsIn(state.year);
  if (state.q) {
    // The early return here used to skip the detail render entirely, so clicking a
    // search result highlighted the row and left the pane on its empty state.
    renderSearchResults(list, here);
    return state.field ? showField(state.field) : showDetailEmpty();
  }

  const chips = [
    ["trap", "carries a comparability note", (f) => f.traps.length],
    ["chg", "changed", (f) => f.changes.length],
    ["full", "all 8 years", (f) => f.n_years === 8],
    ["gone", "not in every year", (f) => f.n_years < 8],
  ].map(([k, label, fn]) =>
    `<button class="filter${state.filter === k ? " active" : ""}" data-filter="${k}">${label}
      <span class="pill">${here.filter(fn).length}</span></button>`).join("");

  const picked = state.section || state.filter;
  const cards = picked ? "" : state.data.sections.map((s) => {
    const n = here.filter((f) => f.section === s.key).length;
    return `<div class="class-card${state.section === s.key ? " active" : ""}"
                 style="--cls:${SECCOL[s.key]}" data-section="${s.key}">
      <span class="count">${n}</span>
      <h3>${esc(s.name)}</h3><p>${esc(s.summary)}</p></div>`;
  }).join("");

  const crumb = picked ? `<div class="crumbbar">
    <button class="crumb-back" id="allsec">&larr; All sections</button>
    ${state.section ? `<span class="crumb-now" style="--cls:${SECCOL[state.section]}">${
      esc(state.data.sections.find((x) => x.key === state.section).name)}</span>` : ""}
  </div>` : "";

  const FILTERS = { trap: (f) => f.traps.length, chg: (f) => f.changes.length,
                    full: (f) => f.n_years === 8, gone: (f) => f.n_years < 8 };

  let rows = "";
  if (state.section || state.filter) {
    let fs = here;
    if (state.section) fs = fs.filter((f) => f.section === state.section);
    if (state.filter) fs = fs.filter(FILTERS[state.filter]);
    /* Alphabetical order carries the least information of any arrangement. A column
       with a trap or a change is the one worth reading first, so it sorts first. */
    fs = fs.slice().sort((a, b) =>
      (b.traps.length ? 2 : 0) + (b.changes.length ? 1 : 0)
      - ((a.traps.length ? 2 : 0) + (a.changes.length ? 1 : 0))
      || a.id.localeCompare(b.id));
    rows = fs.map(nodeHTML).join("")
        || `<p class="detail-empty">Nothing matches in ${state.year}.</p>`;
  }
  const yearSel = `<label class="yearsel">released in
    <select id="ysel">${["", ...state.data.meta.years].map((y) =>
      `<option value="${y}"${y === (state.year || "") ? " selected" : ""}>${
        y || "any year"}</option>`).join("")}</select></label>`;
  list.innerHTML = `${crumb}${cards ? `<div class="class-grid">${cards}</div>` : ""}
    <div class="filters">${chips}${yearSel}</div>${legendHTML()}${rows}`;
  const back = $("#allsec", list);
  if (back) back.onclick = () => {
    state.section = null; state.filter = null; renderBrowse(); showDetailEmpty();
  };
  $("#ysel", list).onchange = (e) => {
    state.year = e.target.value || null;
    renderBrowse();
  };
  $$(".class-card", list).forEach((el) => el.onclick = () => {
    state.section = state.section === el.dataset.section ? null : el.dataset.section;
    renderBrowse();
    if (state.section && !state.field) showSectionIntro(state.section);
  });
  $$(".filter", list).forEach((el) => el.onclick = () => {
    state.filter = state.filter === el.dataset.filter ? null : el.dataset.filter;
    renderBrowse();
  });
  bindRows(list);
  if (!state.field) showDetailEmpty();
  else showField(state.field);
}

/* The legend used to live in the empty state, which is exactly where it stops being
   needed. Once a column is open the user faces dozens of coloured dots with no way
   to recall what they mean. It belongs above the list, permanently. */
function legendHTML() {
  return `<div class="legend"><span class="pip trap"></span>note
    <span class="pip chg"></span>changed<span class="sp">·</span>
    <span class="life"><i class="on"></i><i class="on"></i><i class="off"></i>
      <i class="off"></i><i class="off"></i><i class="off"></i><i class="off"></i>
      <i class="off"></i></span> released, oldest left</div>`;
}

function nodeHTML(f) {
  const flags = (f.traps.length ? '<span class="pip trap" title="carries a comparability note"></span>' : "")
              + (f.changes.length ? '<span class="pip chg" title="renamed, split, merged or recoded"></span>' : "");
  /* A row is a link, not a div with a click handler. An anchor is focusable,
     Enter works, a screen reader announces it as a link, and the hash route
     is the href, so open-in-new-tab works too. */
  return `<a class="node${state.field === f.id ? " active" : ""}" data-id="${esc(f.id)}"
    href="#f/${esc(f.id)}"${state.field === f.id ? ' aria-current="true"' : ""}>
    <span class="nm"><code>${esc(f.field)}</code> <span class="ds">${esc(f.dataset)}</span>
      <span class="life-words">${esc(lifeWords(f))}</span></span>
    <span class="flags">${lifeStrip(f)}${flags}</span></a>`;
}

function bindRows(scope) { /* anchors route themselves */ }

/* -------------------------------------------------------------- detail pane */
function showField(id) {
  const f = state.data.fields.find((x) => x.id === id);
  const d = $("#detail");
  if (!f) return showDetailEmpty("No column with that id.");
  state.field = id;
  $$(".node").forEach((n) => n.classList.toggle("active", n.dataset.id === id));

  const sec = state.data.sections.find((s) => s.key === f.section);
  const tl = state.data.meta.years.map((y) =>
    `<span class="${f.years.includes(y) ? "in" : ""}">${y}</span>`).join("");

  // state.year is null when no release filter is set, which is the default.
  const gone = Boolean(state.year) && !f.years.includes(state.year);
  const traps = f.traps.map((t) => state.data.traps.find((x) => x.id === t)).filter(Boolean);

  d.innerHTML = `
    <div class="crumbs"><a onclick="location.hash=''">All sections</a>
      <span class="sep">›</span>${esc(sec ? sec.name : "—")}
      <span class="sep">›</span>${esc(f.dataset)}</div>
    <h2>${esc(f.field)}</h2>
    <div class="ds-line">${esc(f.dataset)} · released in ${f.n_years} of 8 years${f.gap ? " · WITH GAPS" : ""}</div>
    ${gone && state.year ? `<div class="trapcard"><div class="t">Not in ${state.year}</div>
      <div class="c">This column is not released in the year you are viewing. It runs
      ${f.years[0]} to ${f.years.at(-1)}.</div></div>` : ""}

    <div class="k">Released in</div><div class="tl">${tl}</div>

    ${/* Three honest states, and the header matches the one that holds. A
          verified question renders as the question. A key the release creates
          says so, because no form asks it and that silence is the fact.
          Anything else gets one plain line, not a lecture under a promising
          header. */
      f.release_key
      ? `<div class="k">No form item — a key the release creates</div>
         <p class="q-note">${esc(f.release_key)}</p>`
      : f.question && f.dcf_how !== "auto"
      ? `<div class="k">Question — as asked</div>
         <div class="q">${esc(f.question)}</div>
         <div class="ds-line" style="margin-top:6px">DCF item ${esc(f.dcf_item)}${
           f.dcf_year && f.dcf_year !== "all" ? ", " + esc(f.dcf_year) + " form"
             : f.dcf_year === "all" ? ", every form" : ""}
</div>
         ${traceHTML(f)}`
      // A column with no verified question shows NO question section. What
      // stood here was an apology carrying our own coverage rate, printed
      // where the reader came for the Ministry's question. A reader wants
      // the column. How much of the dictionary we have finished is a fact
      // about this page, and the About tab states it once, which is where a
      // statement about this page belongs.
      : ""}

    ${officialHTML(f)}

    ${f.values ? `<div class="k">What the codes mean</div>${valuesHTML(f.values)}` : ""}

    ${f.changes.length ? `<div class="k">Change history</div>` + f.changes.map(chgHTML).join("") : ""}

    ${traps.length ? `<div class="k">Comparability</div>` + traps.map(trapHTML).join("") : ""}
  `;
  bindCopy(d);
}

/* A value list arrives as one run-on string: "1-Dept of Education, 2-Tribal
   Welfare, ...". Twenty-two codes in a paragraph is a lookup the reader has to
   perform with their finger on the screen. Split it into a code table. Where the
   string is not a code list at all, print it as it came rather than mangle it. */
const CODE_PAIR = /(\d+)\s*[-\u2013]\s*([^,;]+)/g;
function valuesHTML(raw) {
  const pairs = [...String(raw).matchAll(CODE_PAIR)]
    .map((m) => [m[1], m[2].trim().replace(/[.,;]+$/, "")])
    .filter(([, label]) => label.length);
  if (pairs.length < 2) return `<div class="vals">${esc(raw)}</div>`;
  return `<div class="codes">${pairs.map(([code, label]) =>
    `<div class="code-row"><code class="cd">${esc(code)}</code>
      <span class="cl">${esc(label)}</span></div>`).join("")}</div>`;
}

/* The release ships its own description of every column. It is the first thing a
   reader needs and it was not on this page at all. Where a column spans the
   2022-23 break the two schema documents can word it differently, so both are
   shown with the era each belongs to, rather than one silently winning. */
/* The item number is a per-year address, and the wording itself can move.
   The trace quotes the matched line from every form on disk, so a rewording
   shows instead of being flattened. It is a text match and the label says so. */
function traceHTML(f) {
  const t = f.dcf_trace || {};
  const years = Object.keys(t).sort();
  if (years.length < 2) return "";
  const norm = (x) => x.toLowerCase().replace(/\(1-.*$/, "").replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ").trim();
  const wordings = [...new Set(years.map((y) => norm(t[y].line)))];
  // A year-number pair is a cell, not a phrase. Eight pairs joined by
  // dots wrapped into soup at 360px.
  const items = `<span class="trace-grid">` + years.map((y) =>
    `<span class="tg"><span class="tg-y">${esc(y)}</span><code>${esc(t[y].item)}</code></span>`).join("") + `</span>`;
  let drift = "";
  if (wordings.length > 1) {
    const byW = {};
    years.forEach((y) => { (byW[norm(t[y].line)] ||= []).push(y); });
    drift = `<div class="trace-drift"><b>The wording moves between forms.</b>` +
      Object.entries(byW).map(([, ys]) =>
        `<div class="tw"><span class="yrs">${ys.map(esc).join(", ")}</span>
         ${esc(t[ys[0]].line)}</div>`).join("") + `</div>`;
  }
  // The line carries its denominator. Two of eight rendered as a complete
  // history, and "asked twice" was false: the question sat in a grid the
  // text tracer could not read. A partial trace now says it is partial.
  const held = (state.data.meta.forms_held || []).length || 8;
  const cover = years.length >= held ? "" :
    `<div class="trace-cover">Found in ${years.length} of the ${held} forms held.
     A form missing from this line means the tracer found no matching printed
     line there — not that the form is silent.</div>`;
  return `<div class="trace"><span class="k2">Item by form:</span>
    ${items}${cover}${drift}</div>`;
}

function officialHTML(f) {
  const o = f.official || [];
  if (!o.length) {
    // Two different facts, and only one of them is about the Ministry. A
    // column the schema DESCRIBES but whose printed cell we could not read
    // is our gap, not theirs. Saying otherwise put a false claim about a
    // government document on a public page.
    const u = f.official_unreadable;
    return `<div class="k">Variable — as released</div>
      <p class="detail-empty" style="margin:0">${u
        ? `The schema document describes this column. Our reading of its printed
           cell did not survive a check (${esc(u[0].why)}), so no description is
           shown here rather than a wrong one.`
        : `The Ministry's schema document does not list this column. That is a
           gap in the published schema, not in this page.`}</p>`;
  }
  return `<div class="k">Variable — as released</div>` + o.map((x) => `
    <div class="official">
      <div class="desc">${esc(x.description)}</div>
      <div class="meta"><code>${esc(x.dtype)}${x.length ? "(" + x.length + ")" : ""}</code>
        <span class="era">${x.names_year
          ? "schema document for " + esc(x.names_year)
          : "schema document for the years before the 2022-23 break"}</span></div>
      ${/* a remark that repeats the description says nothing twice */
        x.remarks && x.remarks.trim() !== (x.description || "").trim()
          ? `<div class="rem">${esc(x.remarks)}</div>` : ""}
    </div>`).join("");
}

function chgHTML(c) {
  const body = c.action === "RENAME"
    ? `<code>${esc(c.from)}</code> → <code>${esc(c.to)}</code>`
    : c.action === "SPLIT" || c.action === "MERGE"
      ? `${(c.from || []).map((x) => "<code>" + esc(x) + "</code>").join(", ")} → ${(c.to || []).map((x) => "<code>" + esc(x) + "</code>").join(", ")}`
      : esc(c.field || "");
  const why = c.detail || c.basis || "";
  /* No confidence badge at all. An unconfirmed rename never reaches this
     payload any more — the build refuses to publish a lead — so every row
     here is settled and its basis text says what settled it. */
  const conf = "";
  return `<div class="chgcard"><span class="at">${esc(c.at || "")}</span>
    <b>${esc(c.action)}</b>${conf}<br>${body}
    ${why ? `<div class="c" style="font-size:13px;color:var(--ink-soft);margin-top:4px">${esc(why)}</div>` : ""}</div>`;
}

function trapHTML(t) {
  return `<div class="trapcard" id="t-${esc(t.id)}">
    <div class="kind">${esc(t.kind)}</div>
    <div class="t">${esc(t.what)}</div>
    ${t.cost ? `<div class="c"><b>What it costs:</b> ${esc(t.cost)}</div>` : ""}
    ${t.check ? `<div class="chk">${esc(t.check)}</div>` : ""}
    ${alsoHTML(t)}
    ${t.fix ? `<div class="k" style="margin:9px 0 3px">The fix</div>
               <div class="vals">${esc(t.fix)}</div>` : ""}</div>`;
}

/* The empty state used to explain the tool. It now demonstrates it: three numbers this
   project published wrong, and the column that caused each. A reader who clicks one has
   learned the point of the page without reading a paragraph about it. */
/* "Also affects" listed every name on the trap, including the one already open, and
   counted them wrong as a result. It must exclude the current field and dedupe. */
function alsoHTML(t) {
  const cur = state.field ? state.field.split(".").pop() : null;
  const others = [...new Set(t.fields)].filter((n) => n !== cur);
  if (!others.length) return "";
  return `<div class="also">Also affects ${others.length} other
    column${others.length > 1 ? "s" : ""}: ${others.map((n) => `<code>${esc(n)}</code>`).join(" ")}</div>`;
}

/* Selecting a section used to leave the detail pane reading "Pick a section",
   which contradicts the click the reader just made. */
function showSectionIntro(key) {
  const sec = state.data.sections.find((x) => x.key === key);
  if (!sec) return showDetailEmpty();
  const fs = fieldsIn(state.year).filter((f) => f.section === key);
  const traps = new Set(fs.flatMap((f) => f.traps));
  const changed = fs.filter((f) => f.changes.length).length;
  const partial = fs.filter((f) => f.n_years < 8).length;
  $("#detail").innerHTML = `<div class="orient">
      <h2>${esc(sec.name)}</h2>
      <p>${esc(sec.summary)}</p>
    </div>
    <div class="secstats">
      <div><b>${fs.length}</b> columns</div>
      <div><b>${fs.length - partial}</b> in all eight releases</div>
      <div><b>${changed}</b> renamed, split, merged or recoded</div>
      <div><b>${traps.size}</b> documented comparability notes</div>
    </div>
    <p class="lede">Select a column on the left to read what the release calls it, what the
      form asked, what its codes mean, and what breaks if you join two years.</p>`;
}

function showDetailEmpty(msg) {
  const ex = (state.data.examples || []).map((e) => `
    <div class="example" data-id="${esc(e.field_id)}">
      <div class="kind">${esc(e.label)}</div>
      <div class="was"><s>${esc(e.wrong)}</s></div>
      <div class="is">${esc(e.right)}</div>
      <p>${esc(e.why)}</p>
      <div class="go"><code>${esc(e.field_id.split(".").pop())}</code> →</div>
    </div>`).join("");
  const q = (t) => `<button type="button" class="exq" data-q="${esc(t)}">${esc(t)}</button>`;
  /* THE RELEASE COMES FIRST. A reader must learn what the portal hands them
     before any column detail means anything: six files per year, zipped CSVs,
     keyed on the pseudonymised school code. Column counts are computed from
     the payload. The grain is a property of each file, measured 2026-08-19
     against the 2025-26 release: four files carry one row per school; the two
     enrolment files carry one row per school PER CATEGORY GRID, which is the
     single most common thing a first-time reader gets wrong. */
  const FILE_DESC = {
    profile_data_1: ["identity, location, management, recognition", "one row per school"],
    profile_data_2: ["grants, RTE, committees, incentives", "one row per school"],
    facility_data: ["buildings, toilets, water, library, computers", "one row per school"],
    teacher_data: ["teacher headcounts by qualification and caste", "one row per school"],
    enrolment_data_1: ["enrolment by class, sex and social category", "several rows per school — one per category grid"],
    enrolment_data_2: ["enrolment by age, medium and minority group", "several rows per school — one per category grid"],
  };
  const colsBy = {};
  state.data.fields.forEach((f) => { colsBy[f.dataset] = (colsBy[f.dataset] || 0) + 1; });
  const schema = Object.entries(FILE_DESC).map(([ds, [what, grain]]) => `
    <tr><td><code>${ds}</code></td><td>${what}</td><td class="n">${colsBy[ds] || 0}</td>
    <td>${grain}</td></tr>`).join("");
  $("#detail").innerHTML = `
    <div class="orient">
      <h2>${esc(msg || "What the portal shares")}</h2>
      <p>UDISE+ is the school census every official number about Indian schooling starts
        from. Its Data Sharing Portal releases <strong>six files per year</strong> —
        zip archives of CSVs, one set per academic year since 2018-19. No file carries
        the school's name or its 11-digit UDISE code. The key is a pseudonymised
        <code>pseudocode</code>.</p>
      <div class="tscroll"><table>
        <thead><tr><th>file</th><th>holds</th><th class="n">columns</th><th>grain</th></tr></thead>
        <tbody>${schema}</tbody>
      </table></div>
      <p>This dictionary documents every column in them: what the form asked, what the
        codes mean, which years carry the column, and what breaks if you join two years.
        Choose a section on the left, or search a subject like ${q("library")},
        ${q("librarian")}, ${q("boundary")}, ${q("rte")} or ${q("toilet")} to see every
        column it is reported under.</p>
    </div>
    <h3 class="exh">Three numbers this data got wrong</h3>
    <p class="lede" style="margin:2px 0 16px">Each came from a column that looked
      straightforward. Select one to see the column behind it.</p>
    <div class="examples">${ex}</div>`;
  $$(".example").forEach((el) => el.onclick = () => location.hash = "f/" + el.dataset.id);
  $$(".exq", $("#detail")).forEach((el) => el.onclick = () => {
    $("#search").value = el.dataset.q;
    state.q = el.dataset.q; state.section = null; state.field = null;
    renderBrowse();
  });
}

/* ----------------------------------------------------------------- search */
function bindSearch() {
  const input = $("#search");
  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = input.value.trim(); state.section = null; renderBrowse(); }, 140);
  });
}

function renderSearchResults(list, here) {
  const q = norm(state.q);
  const announce = (msg) => { const el = $("#search-status"); if (el) el.textContent = msg; };
  const hit = (f) => norm(f.field + " " + f.dataset + " " + (f.question || "") + " " + (f.values || "")).includes(q);
  const inYearHits = here.filter(hit);
  const otherYears = state.data.fields.filter((f) => hit(f) && !inYear(f, state.year));
  /* state.year is null on the default view, which means every release. Naming
     it in the label printed "N in null". The other-years clause cannot fire in
     that state either, because every field is already in scope. */
  const scope = state.year ? `in ${state.year}` : "across all releases";
  list.innerHTML =
    `<p class="lede" style="margin:0 0 10px">${inYearHits.length} ${scope}` +
    (otherYears.length ? `, ${otherYears.length} in other years only` : "") + `</p>` +
    inYearHits.map(nodeHTML).join("") +
    (otherYears.length
      ? `<div class="k">Not released in ${state.year}</div>` +
        otherYears.map((f) => nodeHTML(f).replace('class="node', 'class="node gone')).join("")
      : "");
  announce(`${inYearHits.length} columns ${state.year ? "in " + state.year : "across all releases"}` +
    (otherYears.length ? `, ${otherYears.length} in other years only` : ""));
  bindRows(list);
}

/* ---------------------------------------------------------------- changes */
function renderChanges() {
  const evts = state.data.events;
  const moved = (e) => e.counts.INSERT + e.counts.DELETE + e.counts.RENAME;
  const structAt = (e) => (state.data.structural || [])
    .filter((x) => x.at[0] === e.from && x.at[1] === e.to);
  const recodeAt = (e) => (state.data.recodes || [])
    .filter((r) => r.from_year === e.from && r.to_year === e.to);
  /* A recode spanning many years belongs to every transition inside it: the column
     kept its name throughout, so a reader landing on any one of those years needs
     the warning. Anchoring it only to its first year hides it from the rest. */
  const recodeSpan = (e) => (state.data.recodes || [])
    .filter((r) => r.from_year <= e.from && r.to_year >= e.to && !(r.from_year === e.from && r.to_year === e.to));

  const max = Math.max(...evts.map((e) => moved(e) + structAt(e).length), 1);
  const bars = evts.map((e, i) => {
    const n = moved(e), extra = structAt(e).length + recodeAt(e).length;
    const h = Math.max(2, Math.round(((n + extra) / max) * 108));
    return `<div class="evt-bar${i === state.evtIdx ? " active" : ""}${e.note ? " break" : ""}"
                 data-evt="${i}" role="button" tabindex="0"
                 aria-label="${e.from} to ${e.to}, ${n} columns moved">
      <span class="n">${n || "—"}</span>
      <div class="bar" style="height:${h}px"></div>
      <span class="yr">${esc(e.to)}</span></div>`;
  }).join("");

  $("#changes-view").innerHTML = `<div class="wrap">
    <h2>How the schema changed, release by release</h2>
    <p class="lede">A flat added/dropped list hides three of the five things that happen to a
      column. A rename looks like an unrelated delete beside an unrelated insert. A split
      looks like both. So does a merge. A recode looks like nothing at all: the column keeps
      its name and changes its meaning.</p>
    <p class="tl-coverage">Eight releases, 2018-19 to 2025-26. Each bar is one release
      boundary. Height is the number of columns that moved across it. Select a bar to read
      what moved.</p>
    <div class="evt-bars">${bars}</div>
    <div id="evt-detail"></div>
  </div>`;

  $$(".evt-bar", $("#changes-view")).forEach((el) => {
    const go = () => { state.evtIdx = +el.dataset.evt; state.evtFilter = "ALL"; renderChanges(); };
    el.onclick = go;
    el.onkeydown = (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); } };
  });
  showEvent(evts[state.evtIdx], structAt(evts[state.evtIdx]),
            recodeAt(evts[state.evtIdx]), recodeSpan(evts[state.evtIdx]));
}

function evtFilterBtn(label, key, n, active) {
  return `<button class="tl-filter${active === key ? " active" : ""}" data-evt-filter="${key}"
    ${n ? "" : "disabled"}>${label} <span>${n}</span></button>`;
}

function showEvent(e, struct, recode, spanning) {
  const f = state.evtFilter || "ALL";
  const of = (a) => e.changes.filter((c) => c.action === a);
  const ren = of("RENAME"), ins = of("INSERT"), del = of("DELETE"), rej = of("NOT_A_RENAME");
  const n = ren.length + ins.length + del.length;

  const filters = [
    evtFilterBtn("All", "ALL", n + struct.length + recode.length, f),
    evtFilterBtn("Renamed", "RENAME", ren.length, f),
    evtFilterBtn("Added", "INSERT", ins.length, f),
    evtFilterBtn("Removed", "DELETE", del.length, f),
    evtFilterBtn("Split or merged", "STRUCT", struct.length, f),
    evtFilterBtn("Recoded", "RECODE", recode.length, f),
    "",   // the refusals are in the data, not on the page
  ].join("");

  const show = (k) => f === "ALL" || f === k;

  const renTable = ren.length && show("RENAME") ? `<div class="evt-block">
    <h4>Renamed — ${ren.length}</h4>
    <p class="evt-why">The column survived. Only its name changed. A panel keyed on the old
      name silently returns nothing for every year after this boundary. Two kinds of evidence
      appear below, and they are not equal. <b>Read off the form</b> means somebody opened the
      Data Capture Format for both years and saw the same question. <b>Name similarity only</b>
      means the two names look alike and nothing else in the file looks closer — a lead, not a
      finding. At the 2022-23 break this test proposed 15 renames and 5 were wrong.</p>
    <div class="tscroll"><table><thead><tr><th>was</th><th>became</th><th>file</th>
      <th>how we know it is the same column</th></tr></thead>
    <tbody>${ren.map((c) => `<tr><td><code>${esc(c.from)}</code></td>
      <td><code>${esc(c.to)}</code></td><td>${esc(c.dataset)}</td>
      <td>${esc(c.basis || "")}</td></tr>`).join("")}
    </tbody></table></div></div>` : "";

  const listBlock = (title, why, arr, kind) => arr.length && show(kind)
    ? `<div class="evt-block"><h4>${title} — ${arr.length}</h4>
       <p class="evt-why">${why}</p>
       <div class="colnames">${arr.map((c) =>
         `<button type="button" class="cn" data-goto="${esc(c.dataset + "." + c.field)}"><code>${esc(c.field)}</code></button>`).join("")}</div></div>`
    : "";

  const structBlock = struct.length && show("STRUCT") ? `<div class="evt-block">
    <h4>Split or merged — ${struct.length}</h4>
    <p class="evt-why">Neither is a rename. A split looks like one delete and two inserts.
      A merge looks like the reverse. Each pairing below was read off the forms.</p>
    ${struct.map((x) => `<div class="struct">
      <span class="act ${x.action.toLowerCase()}">${esc(x.action)}</span>
      <div><div class="sline">${x.from.map((y) => "<code>" + esc(y) + "</code>").join(" ")}
        <span class="arrow">→</span> ${x.to.map((y) => "<code>" + esc(y) + "</code>").join(" ")}</div>
        <div class="sdetail">${esc(x.detail)} <span class="ds">${esc(x.dataset)}</span></div></div>
    </div>`).join("")}</div>` : "";

  const recodeBlock = recode.length && show("RECODE") ? `<div class="evt-block">
    <h4>Recoded — ${recode.length}</h4>
    <p class="evt-why">Same column, same name, different meaning. No schema diff can see this.
      Each was found by reading the Data Capture Format value lists side by side.</p>
    ${recode.map((r) => `<div class="struct">
      <span class="act recode">RECODE</span>
      <div><div class="sline"><code>${esc(r.field)}</code>
        <span class="arrow">${esc(r.from_year)} → ${esc(r.to_year)}</span></div>
        <div class="sdetail">${esc(r.detail)} <span class="ds">${esc(r.dataset)}</span></div></div>
    </div>`).join("")}</div>` : "";

  // The seven refused rename candidates stay in udise_browser.json, where an
  // auditor can read them, and out of the page. A reader wants what changed.
  // How the ledger was typed is method, not a finding. The block also rendered
  // two files as one duplicate row, because it dropped the dataset.
  const rejBlock = "";

  const spanNote = spanning.length ? `<div class="evt-span">Still in force across this
    boundary: ${spanning.map((r) => `<code>${esc(r.field)}</code> recoded ${esc(r.from_year)}
    to ${esc(r.to_year)}`).join("; ")}.</div>` : "";

  const body = (renTable + structBlock + recodeBlock
    + listBlock("Added", "New columns. No earlier year carries them, so any series using one starts here.", ins, "INSERT")
    + listBlock("Removed", "The question stopped being released. A series using one of these ends at the previous year.", del, "DELETE")
    + rejBlock)
    || `<p class="tl-empty">Nothing under this filter for ${esc(e.from)} → ${esc(e.to)}.</p>`;

  const head = n
    ? `${esc(e.from)} → ${esc(e.to)} — ${n} column${n > 1 ? "s" : ""} moved`
    : `${esc(e.from)} → ${esc(e.to)} — the schema did not move`;

  $("#evt-detail").innerHTML = `<h3 class="evt-h">${head}</h3>
    ${e.note ? `<div class="evt-note">${esc(e.note)}</div>` : ""}
    ${n || struct.length || recode.length
      ? `<div class="tl-filters" aria-label="Filter what changed">${filters}</div>`
      : `<p class="tl-empty">Same columns, same names, same codes as ${esc(e.from)}. A panel
          across this boundary needs no repair.</p>`}
    ${spanNote}
    ${n || struct.length || recode.length ? body : ""}`;

  $$("[data-evt-filter]", $("#evt-detail")).forEach((el) => el.onclick = () => {
    state.evtFilter = el.dataset.evtFilter;
    showEvent(e, struct, recode, spanning);
  });
  /* A column name in this tab is the reader's next question. Make it the link. */
  $$(".cn[data-goto]", $("#evt-detail")).forEach((el) => el.onclick = () => {
    const id = el.dataset.goto;
    const yr = state.data.fields.find((x) => x.id === id)?.years?.[0];
    if (yr) state.year = yr;
    state.q = ""; state.field = id;
    $('.tab[data-tab="browse"]').click();
    setTimeout(() => showField(id), 40);
  });
}

/* --------------------------------------------------------------- recipes */
/* A dictionary tells you what a column is. A recipe tells you what to do with it
   without stepping on the four traps between you and the answer. Every query here
   was run against the store and the result quoted is what it returned. */
function renderRecipes() {
  const rs = state.data.recipes.map((r) => {
    const avoid = (r.avoids || []).map((id) => {
      const t = state.data.traps.find((x) => x.id === id);
      return t ? `<a class="golink" data-trap="${esc(id)}"><code>${esc(id)}</code></a>` : "";
    }).join(" ");
    return `<div class="recipe" id="r-${esc(r.id)}">
      <h3>${esc(r.title)}</h3>
      <p class="prob"><b>The problem.</b> ${esc(r.problem)}</p>
      <div class="vals" data-raw="${esc(r.sql)}">${esc(r.sql)}</div>
      <div class="res"><b>What it returns.</b> ${esc(r.result)}</div>
      ${avoid ? `<div class="avoids">Steps around ${avoid}</div>` : ""}
    </div>`;
  }).join("");
  $("#traps-view").insertAdjacentHTML("beforeend", `<div class="wrap">
    <h2>Worked recipes</h2>
    <p class="lede">Four analyses a researcher wants. Each one steps around a gap between the
      question and the answer. Copy the query. Run it. Compare your number with the one
      quoted.</p>
    ${rs}</div>`);
  bindCopy($("#traps-view"));
  $$(".golink[data-trap]", $("#traps-view")).forEach((el) => el.onclick = () => {
    $('.tab[data-tab="traps"]').click();
    setTimeout(() => document.getElementById("t-" + el.dataset.trap)?.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "center" }), 60);
  });
}

function bindColophon() {
  document.querySelectorAll('.colophon a[data-tab]').forEach((el) => el.onclick = (e) => {
    e.preventDefault();
    document.querySelector(`.tab[data-tab="${el.dataset.tab}"]`).click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ------------------------------------------------------------------ traps */
function renderTraps() {
  const byKind = {};
  state.data.traps.forEach((t) => (byKind[t.kind] ||= []).push(t));
  const KIND = {
    spelling: "Spelling — the same thing under two names",
    coding: "Coding — the number does not mean what it looks like",
    discrepancy: "Discrepancy — the release and the form do not agree",
    definitional: "Definitional — the question is not what you think it asks",
  };
  $("#traps-view").innerHTML = `<div class="wrap">
    <h2>Comparability notes</h2>
    <p class="lede">Each of these has cost somebody a wrong number. Most fail silently. You get
      no error, no warning, and a plausible result. Each entry carries the fix.</p>
    <p class="lede">These are properties of the data, not of anyone's intent. A code list that
      moves between years, or a column the release describes differently from the form, breaks a
      series whatever the reason behind it.</p>
    ${Object.entries(byKind).map(([k, ts]) => `<h3>${esc(KIND[k] || k)}</h3>` +
      ts.map((t) => trapHTML(t) + affectsHTML(t)).join("")).join("")}
  </div>`;
  bindCopy($("#traps-view"));
  bindAffects($("#traps-view"));
}

/* A trap that names its columns as inert text makes the reader go and find them.
   The column IS the thing they came for, so it is the link. */
function affectsHTML(t) {
  /* A name like `pseudocode` exists in six datasets. Listing all six is noise; the
     reader wants the name once, with a note of how many files carry it. */
  const links = [...new Set(t.fields)].map((name) => {
    const hits = state.data.fields.filter((f) => f.field === name);
    if (!hits.length) return `<code class="dead" title="not a released column name">${esc(name)}</code>`;
    const n = hits.length;
    return `<a class="golink" data-id="${esc(hits[0].id)}"><code>${esc(name)}</code>` +
      `<span class="ds">${n > 1 ? n + " files" : esc(hits[0].dataset)}</span></a>`;
  }).join(" ");
  return `<p class="affects">Affects ${links}</p>`;
}

function bindAffects(scope) {
  $$(".golink", scope).forEach((el) => el.onclick = () => {
    location.hash = "f/" + el.dataset.id;
  });
}

/* -------------------------------------------------------- asked, not shared */
function renderMissing() {
  const groups = {};
  state.data.never_released.forEach((m) => (groups[m.group || "Other"] ||= []).push(m));
  const ORDER = ["Library", "Attendance", "Entitlement", "Safety", "Accountability", "Scheme", "Facilities"];
  const NOTE = {
    Library: "UDISE+ records whether a school HAS a library. Three of the questions it asks about " +
             "one are never published, including the only item in the whole instrument that asks " +
             "whether a library is USED. A room with books and a locked cupboard answer every " +
             "released question identically.",
    Attendance: "Since 2022-23 a student PROGRESSES to the next class by default and no fresh entry " +
                "is needed. How a school actually records presence is therefore the missing half of " +
                "every retention and dropout figure. It is asked, of both students and teachers, and " +
                "published for neither.",
    Entitlement: "Bringing children who are out of school back into it is the central obligation of " +
                 "the RTE Act. The census that monitors the Act asks the question and releases no column.",
    Safety: "A parent cannot find out from public data whether their child's school has a fire " +
            "extinguisher. The school was asked.",
    Accountability: "Whether a school can account for its own books, computers and sports equipment.",
    Scheme: "A scheme's own schools cannot be identified in the census that monitors the scheme.",
  };
  const n = state.data.never_released.length;
  const lede = `<p class="lede">Every other surface on this page starts from a column.
    These ${n} questions produced none. The school answered them, every year, and no
    public file carries the answer, so there is nothing to click and nothing to join.
    They are here because a dictionary that lists only what was released describes the
    release, not the instrument.</p>`;
  const body = ORDER.filter((g) => groups[g]).map((g) => {
    // One span sentence repeated down a column is noise. When every row in
    // the group shares it, it prints once above the table instead.
    const spans = [...new Set(groups[g].map((m) => m.asked))];
    const uniform = spans.length === 1;
    return `
    <h3>${esc(g)} <span class="pill">${groups[g].length}</span></h3>
    ${NOTE[g] ? `<p>${esc(NOTE[g])}</p>` : ""}
    ${uniform ? `<p class="asked-span">Asked: ${esc(spans[0])}. Released: never.</p>` : ""}
    <div class="tscroll"><table><thead><tr><th>DCF item</th><th>the question, verbatim</th><th>values</th>
      ${uniform ? "" : "<th>asked</th>"}<th>variable</th></tr></thead>
    <tbody>${groups[g].map((m) => `<tr>
      <td><code>${esc(m.dcf)}</code></td>
      <td>${esc(m.question)}${m.why_it_matters ? `<div class="why-m">${esc(m.why_it_matters)}</div>` : ""}</td>
      <td><code>${esc(m.values)}</code></td>${uniform ? "" : `<td>${esc(m.asked)}</td>`}
      <td><span class="pill warn">never shared</span></td></tr>`).join("")}</tbody></table></div>`;
  }).join("");

  $("#missing-view").innerHTML = `<div class="wrap">
    ${lede}
    <h2>Asked of every school, released to nobody</h2>
    <p class="lede">${state.data.never_released.length} questions sit on the Data Capture Format
      that every school in India fills in. No released file carries any of them. We swept 239
      numbered items in DCF 2025-26 against all 382 released columns. We then checked each
      survivor by hand. A keyword sweep alone flagged 98, and most were artefacts.</p>
    ${body}
    <h3>Before reading anything into this</h3>
    <p>Columns leave a release for dull reasons. One comes back mostly blank. A definition proves
      unworkable once states fill it in. An item reaches the form a year before the pipeline behind
      it exists. UDISE+ has held back weak columns before. That is the right thing to do with a
      number nobody should quote.</p>
    <p>No release note accounts for any of the ${n} here. They are also not a random ${n}.
      How a school takes attendance. Whether it enrolled out-of-school children. Whether anyone
      uses the library. Whether a school employs anyone to run that library. Each answer would be
      quoted back at somebody. Both readings fit the record. Only the release policy separates
      them, and that needs an RTI.</p>
  </div>`;
}

/* ------------------------------------------------------------------- about */
function renderAbout() {
  const m = state.data.meta;
  $("#about-view").innerHTML = `<div class="wrap">
    <h2>About this data</h2>
    <p class="lede">${esc(m.title)}</p>

    <h3>What each statement rests on</h3>
    <p><b>Which columns exist in which years</b> is read from every release file,
      2018-19 to 2025-26.</p>
    <p><b>A question shown on a column's page</b> was read from the Data Capture Format for the
      year cited beside it, taken from a printed grid whose axes are known, or corroborated
      against the values the released column actually holds. A verified question covers
      ${m.counts.verified_wording} of ${m.counts.fields} columns.</p>
    <p>An empty entry means <em>this column is not yet verified against a form item</em>. It never
      means the question was not asked. The machine-readable files below carry every unverified
      lead with its source stated, for anyone who wants to finish the job.</p>

    <h3>How a change is typed</h3>
    <p>A column added or removed is read straight from the release files. A RENAME appears here
      only after a person confirmed it against the forms, and its row states what settled it:
      the same question in both years, the same cell of one printed grid, or the release's own
      schema describing both names identically.</p>
    <p>SPLIT, MERGE and RECODE cannot be found by any diff and were confirmed by hand against the
      Data Capture Formats.</p>

    <h3>What this cannot tell you</h3>
    <p>Whether a number is true. A column can appear every year, keep its name, and pass every
      consistency check. It can still record what a school was expected to report rather than what
      it has. Only a physical audit settles that. In India the only field-level ground truth sits in
      CAG performance audits, not in journals.</p>

    <h3>Take the data with you</h3>
    <p>The whole dictionary is downloadable from the foot of every page: a SKOS concept scheme in
      <a href="udise.ttl">Turtle</a> and <a href="udise.jsonld">JSON-LD</a>, a flat
      <a href="udise_fields.csv">CSV</a>, and the <a href="udise_browser.json">JSON</a> this page
      runs on. Each column is one concept with a stable identifier, the years it was released, the
      form wording with its source, and every comparability note attached. Reuse it under
      CC BY-NC 4.0.</p>
    <p>There is also a <a href="ddi/">DDI-Codebook</a>, one per release year, valid against the
      DDI-Codebook 2.5 schema. That is the format archives and repositories ingest. It states each
      question inside the variable it produced, and it uses DDI&rsquo;s own
      <code>undocCod</code> element &mdash; &ldquo;values whose meaning is unknown&rdquo; &mdash;
      for the nine columns holding a code no form defines.</p>

    <h3>Sources</h3>
    <p>UDISE+ release files 2018-19 to 2025-26 · Data Capture Formats 2018-19 to 2026-27 ·
      departmental D.O. letters from the UDISE+ portal · CAG Tamil Nadu Report No. 10 of 2022
      Table 6.5, 108 schools physically inspected · CAG Odisha Report No. 5 of 2025 Table 5.5,
      83 of 95 schools mismatched · Gorur, Radhika and Joyeeta Dey (2021), &ldquo;Making the user
      friendly: the ontological politics of digital data platforms&rdquo;, <em>Critical Studies in
      Education</em>.</p>

    <p style="font-family:var(--mono);font-size:12px;color:var(--ink-faint);margin-top:26px">
      Covers the ${m.years.length} releases from ${esc(m.years[0])} to ${esc(m.years.at(-1))}.</p>
  </div>`;
}

/* ---------------------------------------------------------------- plumbing */
function revealDetail() {
  if (window.innerWidth > 860) return;
  const d = $("#detail");
  if (d && d.innerHTML.trim()) d.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
}

function routeFromHash() {
  const h = location.hash.replace(/^#/, "");
  if (h.startsWith("f/")) { state.tab = "browse"; state.field = h.slice(2);
    $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === "browse")); }
  else if (!h) state.field = null;
  render();
  // The pane is written by render(), so the scroll has to follow it.
  if (h.startsWith("f/")) requestAnimationFrame(revealDetail);
}

/* The SQL is the payload. Selecting four lines by hand is friction on the highest-value
   action on the page. */
function bindCopy(scope) {
  $$(".vals", scope || document).forEach((el) => {
    if (el.dataset.copy) return;
    el.dataset.copy = "1";
    const b = document.createElement("button");
    b.className = "copy"; b.textContent = "copy";
    b.onclick = (ev) => {
      ev.stopPropagation();
      navigator.clipboard.writeText(el.dataset.raw || el.textContent.replace(/\s*copy$/, ""));
      b.textContent = "copied"; setTimeout(() => (b.textContent = "copy"), 1400);
    };
    el.appendChild(b);
  });
}

function bindTop() {
  const b = document.createElement("button");
  b.className = "totop"; b.textContent = "↑ top";
  b.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  document.body.appendChild(b);
}

init();
