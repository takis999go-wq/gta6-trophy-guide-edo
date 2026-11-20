// Leonida Legend — GTA VI trophy tracker.
// Plain ES module, no libraries: it fetches only its own data file, keeps the
// player's ticks in localStorage, and renders the checklist, the filters, the
// roadmap and one trophy's guide at a time. It never touches the network
// beyond data/trophies.json, so it works with the network off.

const STORAGE_KEY = 'leonida-legend-earned-v1';

const state = {
  trophies: [],
  roadmap: [],
  sourceNames: [],
  earned: new Set(loadEarned()),
  selectedId: null,
  grade: 'all',
  kind: 'all',
  status: 'all',
  missableOnly: false,
  spoilers: false,
  hideEarned: false,
  query: '',
};

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.earned]));
}

function trophyById(id) {
  return state.trophies.find((t) => t.id === id) ?? null;
}

function isEarned(trophy) {
  return state.earned.has(trophy.name);
}

// A story trophy is spoiler-hidden when the spoiler setting is on, the trophy
// belongs to the story and the player has not earned it yet.
function isSpoilerHidden(trophy) {
  return state.spoilers && trophy.kind === 'story' && !isEarned(trophy);
}

function matchesFilters(trophy) {
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
  if (state.status === 'confirmed' && !trophy.confirmed) return false;
  if (state.status === 'unconfirmed' && trophy.confirmed) return false;
  if (state.missableOnly && !trophy.missable) return false;
  if (state.hideEarned && isEarned(trophy)) return false;
  if (state.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function renderList() {
  const list = document.getElementById('trophylist');
  list.replaceChildren();
  let shown = 0;
  for (const trophy of state.trophies) {
    if (!matchesFilters(trophy)) continue;
    shown += 1;
    const card = document.createElement('article');
    card.className = 'card';
    if (isEarned(trophy)) card.classList.add('done');
    if (isSpoilerHidden(trophy)) card.classList.add('hiddenstory');
    if (trophy.id === state.selectedId) card.classList.add('selected');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Open guide for ${trophy.name}`);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'box';
    box.checked = isEarned(trophy);
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => toggleEarned(trophy, box.checked));

    const swatch = document.createElement('span');
    swatch.className = `swatch ${trophy.grade}`;

    const text = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = isSpoilerHidden(trophy) ? 'Hidden story trophy' : trophy.name;
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = isSpoilerHidden(trophy) ? 'Earn it to reveal its name and description.' : trophy.description;
    text.append(name, desc);

    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.append(badge(trophy.grade, `grade ${trophy.grade}`));
    if (trophy.missable) badges.append(badge('Missable', 'missable'));
    if (!trophy.confirmed) badges.append(badge('Unconfirmed', 'unconfirmed'));

    card.append(box, swatch, text, badges);
    card.addEventListener('click', () => selectTrophy(trophy.id));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectTrophy(trophy.id);
      }
    });
    list.append(card);
  }
  document.getElementById('showing').textContent =
    `Showing ${shown} of ${state.trophies.length} trophies — click one to read its guide.`;
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.trophies.filter((t) => isEarned(t)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('bigcount').innerHTML = `${done}<span class="of"> / ${total}</span>`;
  document.getElementById('progresslabel').textContent =
    done === total && total > 0 ? 'Platinum earned — Vice got a price!' : `${pct}% to the platinum`;
  document.getElementById('barfill').style.width = `${pct}%`;
  const parts = [];
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const all = state.trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => isEarned(t)).length;
    parts.push(`${grade}: <b>${got}/${all.length}</b>`);
  }
  document.getElementById('gradecounts').innerHTML = parts.join(' · ');
}

function toggleEarned(trophy, on) {
  if (on) state.earned.add(trophy.name);
  else state.earned.delete(trophy.name);
  saveEarned();
  renderProgress();
  renderList();
  if (state.selectedId === trophy.id) renderGuide();
}

function selectTrophy(id) {
  state.selectedId = id;
  renderList();
  renderGuide();
}

function renderGuide() {
  const empty = document.getElementById('guideempty');
  const card = document.getElementById('guidecard');
  const trophy = state.selectedId == null ? null : trophyById(state.selectedId);
  if (!trophy) {
    empty.hidden = false;
    card.hidden = true;
    return;
  }
  empty.hidden = true;
  card.hidden = false;
  const meta = document.getElementById('guidemeta');
  const name = document.getElementById('guidename');
  const desc = document.getElementById('guidedesc');
  const flags = document.getElementById('guideflags');
  const text = document.getElementById('guidetext');
  const check = document.getElementById('guidecheck');
  flags.replaceChildren();
  if (isSpoilerHidden(trophy)) {
    meta.textContent = 'Story trophy — spoiler setting on';
    name.textContent = 'Hidden story trophy';
    desc.textContent = 'Its name, description and guide stay hidden until you earn it.';
    text.textContent = 'Tick it as earned in the checklist (or turn the spoiler setting off) to reveal the guide.';
    check.checked = false;
    return;
  }
  meta.textContent = `Trophy ${trophy.id} of ${state.trophies.length} · ${trophy.kind}`;
  name.textContent = trophy.name;
  desc.textContent = trophy.description;
  flags.append(badge(trophy.grade, `grade ${trophy.grade}`));
  if (trophy.missable) flags.append(badge('Missable', 'missable'));
  if (!trophy.confirmed) flags.append(badge('Unconfirmed method', 'unconfirmed'));
  if (isEarned(trophy)) flags.append(badge('Earned', ''));
  text.textContent = trophy.guide;
  check.checked = isEarned(trophy);
}

function renderRoadmap() {
  const list = document.getElementById('roadmap');
  list.replaceChildren();
  for (const step of state.roadmap) {
    const li = document.createElement('li');
    const title = document.createElement('div');
    title.className = 'stage-title';
    title.textContent = `Step ${step.stage} — ${step.title}`;
    const detail = document.createElement('div');
    detail.className = 'stage-detail';
    detail.textContent = step.detail;
    li.append(title, detail);
    list.append(li);
  }
  const sources = document.getElementById('sourcenames');
  sources.replaceChildren();
  for (const line of state.sourceNames) {
    const li = document.createElement('li');
    li.textContent = line;
    sources.append(li);
  }
}

function exportProgress() {
  const payload = JSON.stringify({ earned: [...state.earned] }, null, 2);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importProgress(file) {
  const parsed = JSON.parse(await file.text());
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) return;
  const valid = new Set(state.trophies.map((t) => t.name));
  state.earned = new Set(names.filter((n) => valid.has(n)));
  saveEarned();
  renderProgress();
  renderList();
  renderGuide();
}

function wireControls() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderList();
  });
  document.getElementById('gradechips').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-grade]');
    if (!button) return;
    state.grade = button.dataset.grade;
    for (const chip of document.querySelectorAll('#gradechips .chip')) {
      chip.classList.toggle('active', chip === button);
    }
    renderList();
  });
  document.getElementById('kindfilter').addEventListener('change', (event) => {
    state.kind = event.target.value;
    renderList();
  });
  document.getElementById('statusfilter').addEventListener('change', (event) => {
    state.status = event.target.value;
    renderList();
  });
  document.getElementById('missableonly').addEventListener('change', (event) => {
    state.missableOnly = event.target.checked;
    renderList();
  });
  document.getElementById('spoilers').addEventListener('change', (event) => {
    state.spoilers = event.target.checked;
    renderList();
    renderGuide();
  });
  document.getElementById('hideearned').addEventListener('change', (event) => {
    state.hideEarned = event.target.checked;
    renderList();
  });
  document.getElementById('exportbtn').addEventListener('click', exportProgress);
  document.getElementById('importfile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) await importProgress(file);
    event.target.value = '';
  });
  document.getElementById('guidecheck').addEventListener('change', (event) => {
    const trophy = trophyById(state.selectedId);
    if (trophy) toggleEarned(trophy, event.target.checked);
  });
  document.getElementById('guideclose').addEventListener('click', () => {
    state.selectedId = null;
    renderList();
    renderGuide();
  });
}

// Optional view parameters, handy for sharing a filtered view (and for the
// maker's own screenshots): ?grade=silver, ?status=unconfirmed, ?q=meditation,
// ?open=28 picks a trophy, ?seed=2,3,4 pre-ticks trophies by id,
// ?missable=1 and ?spoilers=1 flip those toggles.
function applyViewParams() {
  const params = new URLSearchParams(location.search);
  const grade = params.get('grade');
  if (grade) {
    state.grade = grade;
    for (const chip of document.querySelectorAll('#gradechips .chip')) {
      chip.classList.toggle('active', chip.dataset.grade === grade);
    }
  }
  const kind = params.get('kind');
  if (kind) {
    state.kind = kind;
    document.getElementById('kindfilter').value = kind;
  }
  const status = params.get('status');
  if (status) {
    state.status = status;
    document.getElementById('statusfilter').value = status;
  }
  const query = params.get('q');
  if (query) {
    state.query = query.toLowerCase();
    document.getElementById('search').value = query;
  }
  if (params.get('missable') === '1') {
    state.missableOnly = true;
    document.getElementById('missableonly').checked = true;
  }
  if (params.get('spoilers') === '1') {
    state.spoilers = true;
    document.getElementById('spoilers').checked = true;
  }
  const seed = params.get('seed');
  if (seed) {
    for (const part of seed.split(',')) {
      const trophy = trophyById(Number(part));
      if (trophy) state.earned.add(trophy.name);
    }
    saveEarned();
  }
  const open = params.get('open');
  if (open && trophyById(Number(open))) state.selectedId = Number(open);
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  state.trophies = doc.trophies;
  state.roadmap = doc.roadmap ?? [];
  state.sourceNames = doc.sourceNames ?? [];
  wireControls();
  applyViewParams();
  renderRoadmap();
  renderProgress();
  renderList();
  renderGuide();
}

boot();
