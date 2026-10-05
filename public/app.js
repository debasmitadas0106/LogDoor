// ---------- Small helpers ----------
const $ = (id) => document.getElementById(id);

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} },
};

// "YYYY-MM-DD" in your local timezone (toISOString would use UTC)
const toKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (key, n) => { const d = fromKey(key); d.setDate(d.getDate() + n); return toKey(d); };
const todayKey = () => toKey(new Date());

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const ICONS = {
  core: '<polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/>',
  linux: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 9l3 3-3 3M12 15h5"/>',
  math: '<path d="M18 4H6l6 8-6 8h12"/>',
  problem: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  systemDesign: '<rect x="9" y="2" width="6" height="6" rx="1.5"/><rect x="2" y="16" width="6" height="6" rx="1.5"/><rect x="16" y="16" width="6" height="6" rx="1.5"/><path d="M12 8v4M5 16v-2h14v2"/>',
  reading: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  custom: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
};
const svg = (paths, cls = "") => `<svg viewBox="0 0 24 24" class="${cls}">${paths}</svg>`;
const CHECK = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>');
const CHEVRON = svg('<path d="M6 9l6 6 6-6"/>', "chev");

let toastTimer;
const toast = (msg) => {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1600);
};

// ---------- State ----------
const state = {
  token: storage.get("st_token"),
  view: "today",
  date: todayKey(),
  day: null,           // { date, outing, note, tasks, summary }
  summaries: {},       // date -> { doneCount, total, percent, outing }
  learned: new Set(),  // item ids you've ticked on any day
  open: new Set(),     // expanded items
  revealed: new Set(), // system design items with the reference approach shown
  shelf: { genres: [], books: [] },
  genreFilter: "all",
};

// ---------- Study library (static JSON in /data) ----------
// The id prefix tells us which file an item lives in: "lx-001" -> linux.json
const TRACKS = {
  lx: { file: "linux.json", name: "Linux", color: "var(--c-linux)" },
  sd: { file: "systemDesign.json", name: "System design", color: "var(--c-systemDesign)" },
  js: { file: "qa-js.json", name: "JavaScript", color: "var(--c-math)" },
  node: { file: "qa-node.json", name: "Node.js", color: "var(--c-problem)" },
  mongo: { file: "qa-mongo.json", name: "MongoDB", color: "#22c55e" },
  sql: { file: "qa-sql.json", name: "SQL", color: "var(--c-core)" },
  arch: { file: "qa-architecture.json", name: "Architecture", color: "var(--c-reading)" },
  net: { file: "qa-network.json", name: "Networks", color: "#06b6d4" },
  bits: { file: "qa-bits.json", name: "Bits & Bytes", color: "#ec4899" },
};
const prefixOf = (id) => id.split("-")[0];
const library = {}; // prefix -> array of items
const byId = {};    // id -> item
const loading = {};

function loadTrack(prefix) {
  if (!TRACKS[prefix]) return Promise.resolve([]);
  if (!loading[prefix]) {
    loading[prefix] = fetch(`/data/${TRACKS[prefix].file}`)
      .then((r) => r.json())
      .then((items) => {
        library[prefix] = items;
        items.forEach((it) => (byId[it.id] = it));
        return items;
      })
      .catch(() => { delete loading[prefix]; return []; });
  }
  return loading[prefix];
}
const loadTracksFor = (ids) => Promise.all([...new Set(ids.map(prefixOf))].map(loadTrack));

// ---------- API ----------
async function api(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/login") { logout(); throw new Error("Please log in"); }
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json.data;
}

// ---------- Same scoring rules as the server (api/Business/dayBusiness.js) ----------
const isDone = (t) => {
  if (t.kind === "count") return t.count >= t.min;
  if (t.kind === "study") return t.items.length > 0 && t.items.every((i) => i.done);
  return t.done;
};
const isOptional = (t, day) => day.outing && t.skippableOnOuting;
function summarize(day) {
  const active = day.tasks.filter((t) => !isOptional(t, day));
  const doneCount = active.filter(isDone).length;
  return { date: day.date, outing: day.outing, total: active.length, doneCount,
    percent: active.length ? Math.round((doneCount / active.length) * 100) : 0 };
}

// ---------- Saving (debounced so fast clicks become one request) ----------
let saveTimer = null;
function scheduleSave() {
  state.day.summary = summarize(state.day);
  state.summaries[state.day.date] = state.day.summary;
  renderStats();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 500);
}
async function saveNow() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  const { date, outing, note, tasks } = state.day;
  try {
    const saved = await api("PUT", `/days/${date}`, {
      outing, note,
      tasks: tasks.map(({ key, done, count, custom, label, items }) => ({ key, done, count, custom, label, items })),
    });
    state.summaries[date] = saved.summary;
    if (state.day.date === date && !saveTimer) {
      state.day.tasks = saved.tasks; // keeps server-generated keys for new custom tasks
      renderTasks();
    }
    toast("Saved");
  } catch (e) {
    toast(e.message);
  }
}

// ---------- Rendering: one study item (used by Today and Library) ----------
function itemTitle(it, prefix) {
  if (prefix === "lx") return `<code>${escapeHtml(it.name)}</code><span class="item-sub">${escapeHtml(it.summary)}</span>`;
  if (prefix === "sd") return `<span class="badge ${it.level}">${it.level}</span>${escapeHtml(it.title)}`;
  const label = it.type === "practice" ? `${TRACKS[prefix].name} · Practice` : TRACKS[prefix].name;
  return `<span class="badge">${label}</span>${escapeHtml(it.question)}`;
}

function itemBody(it, prefix) {
  if (prefix === "lx") {
    return `<pre>${escapeHtml(it.example)}</pre><p>${escapeHtml(it.exampleExplained)}</p>
      <div class="meta"><span class="badge ${it.level}">${it.level}</span>${escapeHtml(it.category)}</div>`;
  }
  if (prefix === "sd") {
    const shown = state.revealed.has(it.id);
    return `<p>${escapeHtml(it.prompt)}</p>
      <h4>Key concepts</h4><div class="concepts">${it.keyConcepts.map((c) => `<span>${escapeHtml(c)}</span>`).join("")}</div>
      <h4>Think about</h4><ol>${it.thinkAbout.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ol>
      ${shown
        ? `<div class="outline"><h4 style="margin-top:0">Reference approach</h4>${escapeHtml(it.outline)}</div>`
        : `<button class="reveal" data-act="reveal" data-id="${it.id}">Try it yourself first, then show the reference approach</button>`}`;
  }
  return `<p>${escapeHtml(it.answer)}</p>${it.example ? `<pre>${escapeHtml(it.example)}</pre>` : ""}
    <div class="meta"><span class="badge ${it.level}">${it.level}</span></div>`;
}

function renderItem(id, { done, taskIndex = null }) {
  const it = byId[id];
  const prefix = prefixOf(id);
  const color = TRACKS[prefix]?.color || "var(--accent)";
  if (!it) return `<div class="item"><div class="empty">Loading ${escapeHtml(id)}…</div></div>`;
  const open = state.open.has(id);
  const check = taskIndex === null
    ? `<span class="mini-check" title="${done ? "Learned" : "Not learned yet"}">${CHECK}</span>`
    : `<button class="mini-check" data-act="item-check" data-t="${taskIndex}" data-id="${id}" aria-label="Mark learned">${CHECK}</button>`;
  return `<div class="item ${done ? "is-done" : ""} ${open ? "is-open" : ""}" style="--c:${color}">
    <div class="item-row">${check}
      <button class="item-head" data-act="item-open" data-id="${id}">
        <span class="item-title">${itemTitle(it, prefix)}</span>${CHEVRON}
      </button>
    </div>
    ${open ? `<div class="item-body">${itemBody(it, prefix)}</div>` : ""}
  </div>`;
}

// ---------- Rendering: Today ----------
const CHEERS = [
  [0, "Start with one small thing."],
  [1, "Good start. Keep the momentum."],
  [50, "Halfway there. Nice work."],
  [75, "Almost done for the day."],
  [100, "All done. Proud of you!"],
];

function renderHeader() {
  const d = fromKey(state.date);
  const isToday = state.date === todayKey();
  $("dayName").textContent = isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: "long" });
  $("dayDate").textContent = d.toLocaleDateString(undefined, { weekday: isToday ? "long" : undefined, day: "numeric", month: "long", year: "numeric" });
  $("nextDay").disabled = isToday;
  $("todayBtn").classList.toggle("hidden", isToday);
}

function renderTasks() {
  const day = state.day;
  $("outingToggle").checked = day.outing;
  if (document.activeElement !== $("note")) $("note").value = day.note;

  $("taskList").innerHTML = day.tasks.map((t, i) => {
    const color = ICONS[t.key] ? t.key : "custom";
    const cls = ["task", t.kind === "study" && "study", isDone(t) && "is-done", isOptional(t, day) && "is-optional"].filter(Boolean).join(" ");
    const tag = isOptional(t, day) ? '<span class="tag">optional today</span>' : "";
    const reading = t.key === "reading" ? state.shelf.books.filter((b) => b.status === "reading").map((b) => b.title) : [];
    const hintText = reading.length ? `Reading: ${reading.join(", ")}` : t.hint;
    const hint = hintText ? `<div class="task-hint">${escapeHtml(hintText)}</div>` : "";
    const head = `<div class="task-icon">${svg(ICONS[color])}</div>
      <div class="task-body"><div class="task-label">${escapeHtml(t.label)}${tag}</div>${hint}`;

    if (t.kind === "study") {
      const doneN = t.items.filter((x) => x.done).length;
      const items = t.items.length
        ? t.items.map((x) => renderItem(x.id, { done: x.done, taskIndex: i })).join("")
        : '<div class="empty">You have finished everything in this track. Amazing!</div>';
      return `<li class="${cls}" style="--c: var(--c-${color})">${head}</div>
        <div class="study-progress">${doneN}<small>/${t.items.length}</small></div>
        <div class="items">${items}</div></li>`;
    }
    if (t.kind === "count") {
      const pips = Array.from({ length: t.target }, (_, n) => `<i class="${n < t.count ? "on" : ""}"></i>`).join("");
      return `<li class="${cls}" style="--c: var(--c-${color})">${head}<div class="pips">${pips}</div></div>
        <div class="counter">
          <button data-act="dec" data-i="${i}" aria-label="Decrease">${svg('<path d="M5 12h14"/>')}</button>
          <div class="count-val">${t.count}<small>/${t.target}</small></div>
          <button data-act="inc" data-i="${i}" aria-label="Increase">${svg('<path d="M12 5v14M5 12h14"/>')}</button>
        </div></li>`;
    }
    const remove = t.custom ? `<button class="remove" data-act="remove" data-i="${i}" aria-label="Remove task">${svg('<path d="M6 6l12 12M18 6L6 18"/>')}</button>` : "";
    return `<li class="${cls}" style="--c: var(--c-${color})">${head}</div>
      ${remove}<button class="check" data-act="toggle" data-i="${i}" aria-label="Mark done">${CHECK}</button></li>`;
  }).join("");
  renderStats();
}

function streak() {
  let count = 0;
  let key = todayKey();
  if (!(state.summaries[key]?.doneCount > 0)) key = addDays(key, -1); // today isn't over yet
  while (state.summaries[key]?.doneCount > 0) { count++; key = addDays(key, -1); }
  return count;
}

function renderStats() {
  const s = state.day.summary;
  $("percent").textContent = s.percent;
  $("ringBar").style.strokeDashoffset = 314.16 * (1 - s.percent / 100);
  $("doneText").textContent = s.total ? `${s.doneCount} of ${s.total} done` : "Nothing planned";
  $("cheer").textContent = [...CHEERS].reverse().find(([p]) => s.percent >= p)[1];
  $("streak").textContent = streak();
  renderWeek();
  renderHeatmap();
}

function renderWeek() {
  const today = todayKey();
  const sel = fromKey(state.date);
  const monday = addDays(state.date, -((sel.getDay() + 6) % 7));
  $("week").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const key = addDays(monday, i);
    const s = state.summaries[key];
    const d = fromKey(key);
    const future = key > today;
    const cls = ["wday", key === state.date && "is-selected", future && "is-future"].filter(Boolean).join(" ");
    return `<button class="${cls}" data-date="${key}" ${future ? "disabled" : ""}>
      <span class="wd">${d.toLocaleDateString(undefined, { weekday: "short" })}</span>
      <span class="bar"><i style="height:${s ? s.percent : 0}%"></i></span>
      <span class="dn">${d.getDate()}</span>
      <span class="out">${s?.outing ? "out" : ""}</span>
    </button>`;
  }).join("");
}

function renderHeatmap() {
  const today = todayKey();
  const t = fromKey(today);
  const start = addDays(today, -((t.getDay() + 6) % 7) - 7 * 11); // Monday, 11 weeks ago
  const cells = [];
  for (let i = 0; i < 84; i++) {
    const key = addDays(start, i);
    const p = state.summaries[key]?.percent ?? 0;
    const level = key > today ? "future" : p === 0 ? "" : p < 34 ? "l1" : p < 67 ? "l2" : p < 100 ? "l3" : "l4";
    cells.push(`<i class="${level} ${key === today ? "today" : ""}" title="${key}: ${p}%"></i>`);
  }
  $("heatmap").innerHTML = cells.join("");
}

// ---------- Rendering: Library ----------
const lib = { track: storage.get("st_track") || "lx", search: "", level: "all", status: "all", limit: 40 };

function renderChips() {
  $("trackChips").innerHTML = Object.entries(TRACKS).map(([p, t]) => {
    const items = library[p];
    const learned = items ? items.filter((it) => state.learned.has(it.id)).length : 0;
    return `<button class="chip ${p === lib.track ? "is-active" : ""}" style="--c:${t.color}" data-track="${p}">
      ${t.name}${items ? `<small>${learned}/${items.length}</small>` : ""}</button>`;
  }).join("");
}

function itemText(it) {
  return [it.name, it.summary, it.category, it.title, it.prompt, it.question, it.answer, ...(it.keyConcepts || [])]
    .filter(Boolean).join(" ").toLowerCase();
}

async function renderLibrary() {
  const p = lib.track;
  const t = TRACKS[p];
  $("libraryView").style.setProperty("--c", t.color);
  renderChips();
  Object.keys(TRACKS).forEach((k) => loadTrack(k).then(() => { if (state.view === "library") renderChips(); }));
  const items = await loadTrack(p);
  if (lib.track !== p) return; // switched while loading
  renderChips();

  const levels = [...new Set(items.map((it) => it.level))];
  const levelOptions = `<option value="all">All levels</option>` + levels.map((l) => `<option value="${l}">${l[0].toUpperCase() + l.slice(1)}</option>`).join("");
  if ($("libLevel").dataset.track !== p) {
    $("libLevel").innerHTML = levelOptions;
    $("libLevel").dataset.track = p;
    lib.level = "all";
  }
  $("libLevel").value = lib.level;

  const learnedCount = items.filter((it) => state.learned.has(it.id)).length;
  const pct = items.length ? Math.round((learnedCount / items.length) * 100) : 0;
  $("libTitle").textContent = t.name;
  $("libCount").textContent = `${learnedCount} of ${items.length} learned`;
  $("libPercent").textContent = `${pct}%`;
  $("libBar").style.width = `${pct}%`;

  const q = lib.search.trim().toLowerCase();
  const filtered = items.filter((it) =>
    (lib.level === "all" || it.level === lib.level) &&
    (lib.status === "all" || (lib.status === "done") === state.learned.has(it.id)) &&
    (!q || itemText(it).includes(q)));

  $("libList").innerHTML = filtered.length
    ? filtered.slice(0, lib.limit).map((it) => renderItem(it.id, { done: state.learned.has(it.id) })).join("")
    : '<div class="card empty">Nothing matches your filters.</div>';
  $("libMore").classList.toggle("hidden", filtered.length <= lib.limit);
  $("libMore").textContent = `Show more (${filtered.length - lib.limit} left)`;
}

async function loadProgress() {
  try {
    const { learned } = await api("GET", "/progress");
    state.learned = new Set(learned);
  } catch (e) { toast(e.message); }
}

// ---------- Books ----------
const GENRE_COLORS = ["#6d5efc", "#f43f5e", "#14b8a6", "#f59e0b", "#a855f7", "#0ea5e9", "#22c55e", "#ec4899", "#64748b"];
const STATUS_LABEL = { "to-read": "To read", reading: "Reading", done: "Done" };
const NEXT_STATUS = { "to-read": "reading", reading: "done", done: "to-read" };
const genreColor = (id) => GENRE_COLORS[Math.max(0, state.shelf.genres.findIndex((g) => g._id === id)) % GENRE_COLORS.length];

function renderBooks() {
  const { genres, books } = state.shelf;
  const count = (status) => books.filter((b) => b.status === status).length;
  $("bkReading").textContent = count("reading");
  $("bkDone").textContent = count("done");
  $("bkTodo").textContent = count("to-read");
  $("bkSummary").textContent = `${books.length} books in ${genres.length} genres`;

  if (state.genreFilter !== "all" && !genres.some((g) => g._id === state.genreFilter)) state.genreFilter = "all";
  $("genreChips").innerHTML = [`<button class="chip ${state.genreFilter === "all" ? "is-active" : ""}" style="--c:var(--accent)" data-genre="all">All<small>${books.length}</small></button>`]
    .concat(genres.map((g) => `<button class="chip ${state.genreFilter === g._id ? "is-active" : ""}" style="--c:${genreColor(g._id)}" data-genre="${g._id}">
      ${escapeHtml(g.name)}<small>${books.filter((b) => b.genreId === g._id).length}</small></button>`)).join("");

  const shown = state.genreFilter === "all" ? genres : genres.filter((g) => g._id === state.genreFilter);
  $("bookShelf").innerHTML = shown.map((g) => {
    const list = books.filter((b) => b.genreId === g._id);
    const cards = list.map((b) => `
      <div class="book ${b.status === "done" ? "is-done" : ""}">
        <div class="book-cover">${escapeHtml(b.title.trim()[0] || "?").toUpperCase()}</div>
        <div class="book-body">
          <div class="book-title">${escapeHtml(b.title)}</div>
          ${b.author ? `<div class="book-author">${escapeHtml(b.author)}</div>` : ""}
          ${b.why ? `<div class="book-why">${escapeHtml(b.why)}</div>` : ""}
        </div>
        <button class="status ${b.status}" data-act="status" data-id="${b._id}" title="Tap to change">${STATUS_LABEL[b.status]}</button>
        <button class="remove" data-act="delete-book" data-id="${b._id}" aria-label="Delete book">${svg('<path d="M6 6l12 12M18 6L6 18"/>')}</button>
      </div>`).join("");
    return `<section style="--g:${genreColor(g._id)}">
      <div class="genre-head">
        <div class="genre-name"><i></i>${escapeHtml(g.name)}<small>${list.filter((b) => b.status === "done").length}/${list.length} read</small></div>
        ${list.length ? "" : `<button class="text-btn" data-act="delete-genre" data-id="${g._id}">Delete genre</button>`}
      </div>
      <div class="books">${cards || '<div class="empty-genre">No books yet. Add one below.</div>'}</div>
    </section>`;
  }).join("") || '<div class="card empty">No genres yet. Add one below.</div>';

  const selected = $("bkGenre").value;
  $("bkGenre").innerHTML = genres.map((g) => `<option value="${g._id}">${escapeHtml(g.name)}</option>`).join("");
  if (genres.some((g) => g._id === selected)) $("bkGenre").value = selected;
  else if (state.genreFilter !== "all") $("bkGenre").value = state.genreFilter;
}

async function loadBooks() {
  try {
    state.shelf = await api("GET", "/books");
    if (state.view === "books") renderBooks();
    if (state.day) renderTasks(); // refresh "Reading: ..." hint
  } catch (e) { toast(e.message); }
}

$("bookShelf").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  try {
    if (btn.dataset.act === "status") {
      const book = state.shelf.books.find((b) => b._id === id);
      const previous = book.status;
      book.status = NEXT_STATUS[previous]; // update the screen first, then save
      renderBooks();
      try { await api("PATCH", `/books/${id}`, { status: book.status }); }
      catch (err) { book.status = previous; renderBooks(); throw err; }
      if (book.status === "done") toast("Finished! Well done.");
    }
    if (btn.dataset.act === "delete-book") {
      await api("DELETE", `/books/${id}`);
      state.shelf.books = state.shelf.books.filter((b) => b._id !== id);
      toast("Book removed");
    }
    if (btn.dataset.act === "delete-genre") {
      await api("DELETE", `/genres/${id}`);
      state.shelf.genres = state.shelf.genres.filter((g) => g._id !== id);
      toast("Genre removed");
    }
    renderBooks();
  } catch (err) { toast(err.message); }
});

$("genreChips").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-genre]");
  if (!b) return;
  state.genreFilter = b.dataset.genre;
  renderBooks();
});

$("addBookForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!$("bkGenre").value) return toast("Add a genre first");
  try {
    const book = await api("POST", "/books", {
      title: $("bkTitle").value, author: $("bkAuthor").value, why: $("bkWhy").value, genreId: $("bkGenre").value,
    });
    state.shelf.books.push(book);
    ["bkTitle", "bkAuthor", "bkWhy"].forEach((id) => ($(id).value = ""));
    renderBooks();
    toast("Book added");
  } catch (err) { toast(err.message); }
});

$("addGenreForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("genreName").value.trim();
  if (!name) return;
  try {
    const genre = await api("POST", "/genres", { name });
    state.shelf.genres.push(genre);
    $("genreName").value = "";
    renderBooks();
    $("bkGenre").value = genre._id;
    toast("Genre added");
  } catch (err) { toast(err.message); }
});

// ---------- Loading ----------
async function loadDay(date) {
  await saveNow(); // don't lose unsaved changes when switching days
  state.date = date;
  renderHeader();
  try {
    const day = await api("GET", `/days/${date}`);
    await loadTracksFor(day.tasks.flatMap((t) => (t.items || []).map((x) => x.id)));
    state.day = day;
    renderTasks();
  } catch (e) { toast(e.message); }
}

async function loadHistory() {
  const today = todayKey();
  try {
    const list = await api("GET", `/days?from=${addDays(today, -120)}&to=${today}`);
    list.forEach((s) => (state.summaries[s.date] = s));
    if (state.day) renderStats();
  } catch (e) { toast(e.message); }
}

const VIEWS = ["today", "library", "books"];
async function showView(view) {
  if (!VIEWS.includes(view)) view = "today";
  state.view = view;
  $("booksView").classList.toggle("hidden", view !== "books");
  if (view === "books") { renderBooks(); loadBooks(); }
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
  $("todayView").classList.toggle("hidden", view !== "today");
  $("libraryView").classList.toggle("hidden", view !== "library");
  if (view === "library") {
    await saveNow();
    renderLibrary();
    await loadProgress();
    renderLibrary();
  }
}

// ---------- Events ----------
function toggleOpen(id) {
  state.open.has(id) ? state.open.delete(id) : state.open.add(id);
}

$("taskList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;

  if (act === "item-open") { toggleOpen(btn.dataset.id); return renderTasks(); }
  if (act === "reveal") { state.revealed.add(btn.dataset.id); return renderTasks(); }
  if (act === "item-check") {
    const item = state.day.tasks[Number(btn.dataset.t)].items.find((x) => x.id === btn.dataset.id);
    item.done = !item.done;
    item.done ? state.learned.add(item.id) : state.learned.delete(item.id);
    renderTasks();
    return scheduleSave();
  }

  const task = state.day.tasks[Number(btn.dataset.i)];
  if (act === "toggle") task.done = !task.done;
  if (act === "inc") task.count = Math.min(task.count + 1, 20);
  if (act === "dec") task.count = Math.max(task.count - 1, 0);
  if (act === "remove") state.day.tasks.splice(Number(btn.dataset.i), 1);
  renderTasks();
  scheduleSave();
});

$("libList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  if (btn.dataset.act === "item-open") toggleOpen(btn.dataset.id);
  if (btn.dataset.act === "reveal") state.revealed.add(btn.dataset.id);
  renderLibrary();
});

$("trackChips").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-track]");
  if (!b) return;
  lib.track = b.dataset.track;
  lib.limit = 40;
  storage.set("st_track", lib.track);
  renderLibrary();
});

let searchTimer;
$("libSearch").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { lib.search = e.target.value; lib.limit = 40; renderLibrary(); }, 200);
});
$("libLevel").addEventListener("change", (e) => { lib.level = e.target.value; lib.limit = 40; renderLibrary(); });
$("libStatus").addEventListener("change", (e) => { lib.status = e.target.value; lib.limit = 40; renderLibrary(); });
$("libMore").addEventListener("click", () => { lib.limit += 40; renderLibrary(); });

document.querySelector(".tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-view]");
  if (b) location.hash = b.dataset.view; // the hashchange listener shows the page
});
window.addEventListener("hashchange", () => { if (state.token) showView(location.hash.slice(1)); });

$("outingToggle").addEventListener("change", (e) => {
  state.day.outing = e.target.checked;
  renderTasks();
  scheduleSave();
});

$("note").addEventListener("input", (e) => {
  state.day.note = e.target.value;
  scheduleSave();
});

$("addTaskForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const label = $("newTask").value.trim();
  if (!label) return;
  if (state.day.tasks.filter((t) => t.custom).length >= 5) return toast("Max 5 extra tasks a day");
  state.day.tasks.push({ key: "", label, kind: "check", done: false, count: 0, min: 1, target: 1, custom: true, items: [] });
  $("newTask").value = "";
  renderTasks();
  scheduleSave();
});

$("prevDay").addEventListener("click", () => loadDay(addDays(state.date, -1)));
$("nextDay").addEventListener("click", () => loadDay(addDays(state.date, 1)));
$("todayBtn").addEventListener("click", () => loadDay(todayKey()));
$("week").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-date]");
  if (b && !b.disabled) loadDay(b.dataset.date);
});
window.addEventListener("beforeunload", () => { if (saveTimer) saveNow(); });

// ---------- Horizontal chip rows: arrows + mouse wheel ----------
function setupScroller(wrap) {
  const row = wrap.querySelector(".chips");
  const left = wrap.querySelector(".chip-arrow.left");
  const right = wrap.querySelector(".chip-arrow.right");
  const update = () => {
    const max = row.scrollWidth - row.clientWidth;
    left.classList.toggle("show", row.scrollLeft > 2);
    right.classList.toggle("show", row.scrollLeft < max - 2);
  };
  left.addEventListener("click", () => row.scrollBy({ left: -row.clientWidth * 0.7, behavior: "smooth" }));
  right.addEventListener("click", () => row.scrollBy({ left: row.clientWidth * 0.7, behavior: "smooth" }));
  // A normal mouse wheel only scrolls up/down, so turn that into sideways scrolling here
  row.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = row.scrollWidth - row.clientWidth;
    if (max <= 0) return;
    const atEdge = (e.deltaY < 0 && row.scrollLeft <= 0) || (e.deltaY > 0 && row.scrollLeft >= max);
    if (atEdge) return; // let the page scroll once you reach the end
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });
  row.addEventListener("scroll", update, { passive: true });
  new ResizeObserver(update).observe(row);
  new MutationObserver(update).observe(row, { childList: true });
  update();
}
document.querySelectorAll(".chip-scroller").forEach(setupScroller);

// ---------- Auth ----------
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  $("loginError").textContent = "";
  try {
    const { token, name } = await api("POST", "/login", { passcode: $("passcode").value });
    state.token = token;
    storage.set("st_token", token);
    storage.set("st_name", name);
    $("passcode").value = "";
    start();
  } catch (err) {
    $("loginError").textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

function showLogin() {
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
}

// Reloading wipes everything in memory, so the next person
// on this browser never sees the previous account's data
function logout() {
  state.token = null;
  storage.remove("st_token");
  storage.remove("st_name");
  history.replaceState(null, "", location.pathname);
  location.reload();
}
$("logoutBtn").addEventListener("click", logout);

function showName(name) {
  $("userName").textContent = name ? `Hi, ${name}` : "";
}
async function loadMe() {
  try {
    const { name } = await api("GET", "/me");
    storage.set("st_name", name);
    showName(name);
  } catch {}
}

function start() {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  showName(storage.get("st_name"));
  loadMe();
  showView(location.hash.slice(1));
  loadDay(todayKey()).then(loadHistory);
  loadBooks();
}

if (state.token) start();
else showLogin();
