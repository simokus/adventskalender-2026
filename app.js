/* Adventskalender 2026 — Wunschliste & Geschenk-Planer */

const PEOPLE = ['Simon', 'Ilina', 'Patrizia', 'Patrick'];

// Tag -> [Beschenkte Person, Schenkende Person]  (fix laut Adventskalender-Plan)
const DAYS = [
  [1, 'Simon', 'Patrick'], [2, 'Ilina', 'Simon'], [3, 'Patrizia', 'Ilina'], [4, 'Patrick', 'Patrizia'],
  [5, 'Simon', 'Patrizia'], [6, 'Ilina', 'Patrick'], [7, 'Patrizia', 'Simon'], [8, 'Patrick', 'Ilina'],
  [9, 'Simon', 'Ilina'], [10, 'Ilina', 'Patrizia'], [11, 'Patrizia', 'Patrick'], [12, 'Patrick', 'Simon'],
  [13, 'Simon', 'Patrizia'], [14, 'Ilina', 'Patrick'], [15, 'Patrizia', 'Simon'], [16, 'Patrick', 'Ilina'],
  [17, 'Simon', 'Ilina'], [18, 'Ilina', 'Patrizia'], [19, 'Patrizia', 'Patrick'], [20, 'Patrick', 'Simon'],
  [21, 'Simon', 'Patrick'], [22, 'Ilina', 'Simon'], [23, 'Patrizia', 'Ilina'], [24, 'Patrick', 'Patrizia'],
].map(([day, to, from]) => ({ day, to, from }));

// ---- reine Logik (von test.js geprüft) ----

const daysOf = (giver) => DAYS.filter(d => d.from === giver);

/** wishId -> Tag, auf den der Wunsch reserviert ist */
function reservations(state) {
  const map = {};
  for (const [day, c] of Object.entries(state.claims || {})) {
    if (c && c.wishId) map[c.wishId] = Number(day);
  }
  return map;
}

const wishesOf = (state, owner) => (state.wishes || []).filter(w => w.owner === owner);

/** Der Besitzer eines Wunsches darf NIE sehen, ob er reserviert ist. */
const maySeeStatus = (viewer, owner) => viewer !== owner;

function sanitizeLink(url) {
  if (!url) return '';
  const u = String(url).trim();
  return /^https?:\/\//i.test(u) ? u : '';
}

// ---- Speicher (textdb.dev, kein Konto nötig) ----

const KEY = 'adventskalender-2026-f11bc25b9886';
const URL_ = 'https://textdb.dev/api/data/' + KEY;
const EMPTY = { v: 1, pins: {}, wishes: [], claims: {} };

async function fetchState() {
  const r = await fetch(URL_ + '?t=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('Laden fehlgeschlagen (' + r.status + ')');
  const txt = (await r.text()).trim();
  if (!txt) return { ...EMPTY };
  const s = JSON.parse(txt);
  return { ...EMPTY, ...s };
}

async function putState(s) {
  const r = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(s) });
  if (!r.ok) throw new Error('Speichern fehlgeschlagen (' + r.status + ')');
  try { localStorage.setItem('adv2026-backup', JSON.stringify(s)); } catch (e) { /* egal */ }
}

// ponytail: Vor jedem Schreiben neu laden und mergen — kollidiert nur,
// wenn zwei Leute in derselben Sekunde speichern. Reicht für 4 Personen.
async function mutate(fn) {
  const fresh = await fetchState();
  fn(fresh);
  state = fresh;
  await putState(fresh);
  render();
}

// ---- App-Zustand ----

let state = { ...EMPTY };
let me = typeof localStorage !== 'undefined' ? localStorage.getItem('adv2026-me') : null;
let tab = 'liste';

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);

async function init() {
  document.getElementById('reload').onclick = () => refresh(true);
  document.getElementById('logout').onclick = () => { me = null; localStorage.removeItem('adv2026-me'); render(); };
  document.getElementById('export').onclick = () => {
    const a = document.createElement('a');
    a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(state, null, 2));
    a.download = 'adventskalender-2026-backup.json';
    a.click();
  };
  for (const el of document.querySelectorAll('[data-tab]')) {
    el.onclick = () => { tab = el.dataset.tab; render(); };
  }
  await refresh(true);
  setInterval(() => { if (!document.hidden) refresh(false); }, 20000);
  window.addEventListener('focus', () => refresh(false));
}

async function refresh(showErr) {
  try {
    state = await fetchState();
    status('');
  } catch (e) {
    if (showErr) status('⚠ ' + e.message);
  }
  render();
}

const status = (t) => { document.getElementById('status').textContent = t; };

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

// ---- Rendering ----

function render() {
  const login = document.getElementById('login');
  const app = document.getElementById('app');
  if (!me) { login.hidden = false; app.hidden = true; renderLogin(); return; }
  login.hidden = true; app.hidden = false;
  document.getElementById('who').textContent = me;
  for (const b of document.querySelectorAll('[data-tab]')) b.classList.toggle('on', b.dataset.tab === tab);
  const main = document.getElementById('main');
  main.textContent = '';
  if (tab === 'liste') renderListe(main);
  else if (tab === 'meine') renderMeine(main);
  else renderGeschenke(main);
}

function renderLogin() {
  const box = document.getElementById('loginBox');
  box.textContent = '';
  for (const p of PEOPLE) {
    const b = el('button', 'person', p);
    b.onclick = () => askPin(p);
    box.appendChild(b);
  }
}

function askPin(person) {
  const known = state.pins && state.pins[person];
  const pin = prompt(known
    ? 'PIN von ' + person + ':'
    : 'Noch kein PIN für ' + person + '. Wähle einen 4-stelligen PIN (gut merken!):');
  if (pin == null) return;
  const clean = String(pin).trim();
  if (!/^\d{4}$/.test(clean)) { alert('Bitte genau 4 Ziffern.'); return; }
  if (known) {
    if (clean !== known) { alert('Falscher PIN.'); return; }
    me = person; localStorage.setItem('adv2026-me', me); render();
  } else {
    mutate(s => { s.pins[person] = clean; })
      .then(() => { me = person; localStorage.setItem('adv2026-me', me); render(); })
      .catch(e => alert(e.message));
  }
}

function wishCard(w, viewer, res) {
  const card = el('div', 'card');
  const head = el('div', 'row');
  head.appendChild(el('strong', null, w.title));
  if (w.budget) head.appendChild(el('span', 'badge budget', w.budget + ' CHF'));
  if (maySeeStatus(viewer, w.owner) && res[w.id]) {
    head.appendChild(el('span', 'badge taken', '✓ schon reserviert'));
  }
  card.appendChild(head);
  if (w.note) card.appendChild(el('div', 'note', w.note));
  const link = sanitizeLink(w.link);
  if (link) {
    const a = el('a', 'link', link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60));
    a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer';
    card.appendChild(a);
  }
  return card;
}

function renderListe(main) {
  const res = reservations(state);
  main.appendChild(el('p', 'hint', 'Alle Wünsche aller vier. Bei deinen eigenen siehst du absichtlich nicht, ob sie schon reserviert sind.'));
  for (const p of PEOPLE) {
    const sec = el('section');
    sec.appendChild(el('h2', null, p === me ? p + ' (du)' : p));
    const ws = wishesOf(state, p);
    if (!ws.length) sec.appendChild(el('p', 'hint', 'Noch keine Wünsche eingetragen.'));
    for (const w of ws) sec.appendChild(wishCard(w, me, res));
    main.appendChild(sec);
  }
}

function renderMeine(main) {
  const form = el('div', 'card form');
  const title = el('input'); title.placeholder = 'Was wünschst du dir?'; title.maxLength = 120;
  const budget = el('input'); budget.type = 'number'; budget.min = '0'; budget.placeholder = 'Budget CHF (optional)';
  const link = el('input'); link.type = 'url'; link.placeholder = 'Link (optional, https://…)';
  const note = el('input'); note.placeholder = 'Bemerkung (Grösse, Farbe, …)'; note.maxLength = 200;
  const add = el('button', 'primary', '+ Wunsch hinzufügen');
  add.onclick = () => {
    const t = title.value.trim();
    if (!t) { title.focus(); return; }
    const w = {
      id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      owner: me, title: t,
      budget: budget.value ? Math.max(0, Math.round(Number(budget.value))) : null,
      link: sanitizeLink(link.value), note: note.value.trim(),
    };
    add.disabled = true;
    mutate(s => { s.wishes.push(w); })
      .catch(e => alert(e.message))
      .finally(() => { add.disabled = false; });
  };
  for (const n of [title, budget, link, note, add]) form.appendChild(n);
  main.appendChild(form);

  const ws = wishesOf(state, me);
  main.appendChild(el('h2', null, 'Deine ' + ws.length + ' Wünsche'));
  for (const w of ws) {
    const card = wishCard(w, me, {});
    const del = el('button', 'ghost', 'löschen');
    del.onclick = () => {
      if (!confirm('"' + w.title + '" wirklich löschen?')) return;
      mutate(s => {
        s.wishes = s.wishes.filter(x => x.id !== w.id);
        for (const [d, c] of Object.entries(s.claims)) if (c && c.wishId === w.id) delete s.claims[d];
      }).catch(e => alert(e.message));
    };
    card.appendChild(del);
    main.appendChild(card);
  }
}

function renderGeschenke(main) {
  const res = reservations(state);
  main.appendChild(el('p', 'hint', 'Deine 6 Päckchen. Wähle pro Tag einen Wunsch oder schreibe eine eigene Idee. Was du hier wählst, sieht die beschenkte Person nicht.'));
  for (const d of daysOf(me)) {
    const c = (state.claims || {})[d.day] || {};
    const card = el('div', 'card day');
    const head = el('div', 'row');
    head.appendChild(el('span', 'daynum', 'Tag ' + d.day));
    head.appendChild(el('strong', null, 'für ' + d.to));
    if (c.done) head.appendChild(el('span', 'badge done', '✓ besorgt'));
    card.appendChild(head);

    const sel = el('select');
    const none = el('option', null, '— noch offen —'); none.value = ''; sel.appendChild(none);
    for (const w of wishesOf(state, d.to)) {
      const taken = res[w.id];
      const o = el('option', null,
        w.title + (w.budget ? ' (' + w.budget + ' CHF)' : '') +
        (taken && taken !== d.day ? '  [schon an Tag ' + taken + ']' : ''));
      o.value = w.id;
      if (taken && taken !== d.day) o.disabled = true;
      if (c.wishId === w.id) o.selected = true;
      sel.appendChild(o);
    }
    const own = el('option', null, '✎ eigene Idee'); own.value = '__own';
    if (!c.wishId && c.idea) own.selected = true;
    sel.appendChild(own);
    sel.onchange = () => {
      const v = sel.value;
      mutate(s => {
        s.claims[d.day] = v === '__own'
          ? { idea: (s.claims[d.day] || {}).idea || '', done: !!c.done }
          : v ? { wishId: v, done: !!c.done } : { done: !!c.done };
      }).catch(e => alert(e.message));
    };
    card.appendChild(sel);

    if (sel.value === '__own') {
      const idea = el('input'); idea.placeholder = 'Eigene Idee…'; idea.value = c.idea || ''; idea.maxLength = 200;
      idea.onchange = () => mutate(s => { s.claims[d.day] = { idea: idea.value.trim(), done: !!c.done }; }).catch(e => alert(e.message));
      card.appendChild(idea);
    }

    const chosen = (state.wishes || []).find(w => w.id === c.wishId);
    const link = chosen && sanitizeLink(chosen.link);
    if (link) {
      const a = el('a', 'link', 'Link zum Wunsch öffnen');
      a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer';
      card.appendChild(a);
    }

    const lbl = el('label', 'check');
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = !!c.done;
    cb.onchange = () => mutate(s => {
      s.claims[d.day] = { ...(s.claims[d.day] || {}), done: cb.checked };
    }).catch(e => alert(e.message));
    lbl.appendChild(cb); lbl.appendChild(el('span', null, 'besorgt / eingepackt'));
    card.appendChild(lbl);
    main.appendChild(card);
  }
}

if (typeof module !== 'undefined') module.exports = { PEOPLE, DAYS, daysOf, reservations, wishesOf, maySeeStatus, sanitizeLink };
