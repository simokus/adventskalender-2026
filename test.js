// node test.js
const assert = require('assert');
const { PEOPLE, DAYS, daysOf, reservations, wishesOf, maySeeStatus, sanitizeLink } = require('./app.js');

// Plan stimmt mit dem PDF überein: 24 Tage, jeder schenkt jedem zweimal, nie sich selbst
assert.strictEqual(DAYS.length, 24);
assert.deepStrictEqual(DAYS.map(d => d.day), [...Array(24)].map((_, i) => i + 1));
for (const d of DAYS) assert.notStrictEqual(d.to, d.from, 'Tag ' + d.day + ': schenkt sich selbst');
for (const p of PEOPLE) {
  assert.strictEqual(daysOf(p).length, 6, p + ' schenkt nicht 6x');
  assert.strictEqual(DAYS.filter(d => d.to === p).length, 6, p + ' erhält nicht 6x');
  for (const q of PEOPLE.filter(x => x !== p)) {
    assert.strictEqual(DAYS.filter(d => d.from === p && d.to === q).length, 2, p + '->' + q);
  }
}

// Rotation: jede Person bekommt der Reihe nach von den drei anderen,
// also vom selben Menschen genau alle 12 Tage.
for (const p of PEOPLE) {
  const got = DAYS.filter(d => d.to === p);
  assert.deepStrictEqual(got.map(d => d.day), [0, 1, 2, 3, 4, 5].map(i => PEOPLE.indexOf(p) + 1 + i * 4));
  const first3 = got.slice(0, 3).map(d => d.from);
  assert.strictEqual(new Set(first3).size, 3, p + ': erste drei Paeckchen nicht von drei verschiedenen');
  assert.deepStrictEqual(got.slice(3).map(d => d.from), first3, p + ': Reihenfolge wiederholt sich nicht');
  for (const d of got.slice(0, 3)) {
    const same = got.filter(x => x.from === d.from).map(x => x.day);
    assert.strictEqual(same[1] - same[0], 12, p + ' <- ' + d.from + ': Abstand nicht 12 Tage');
  }
}

// Reservierungen
const state = {
  wishes: [{ id: 'a', owner: 'Ilina' }, { id: 'b', owner: 'Ilina' }, { id: 'c', owner: 'Simon' }],
  claims: { 2: { wishId: 'a' }, 7: { done: true }, 9: { idea: 'Socken' } },
};
assert.deepStrictEqual(reservations(state), { a: 2 });
assert.deepStrictEqual(wishesOf(state, 'Ilina').map(w => w.id), ['a', 'b']);

// Besitzer sieht den Status seiner eigenen Wünsche nie
assert.strictEqual(maySeeStatus('Ilina', 'Ilina'), false);
assert.strictEqual(maySeeStatus('Simon', 'Ilina'), true);

// Links: nur http(s)
assert.strictEqual(sanitizeLink('https://ex.ch/x'), 'https://ex.ch/x');
assert.strictEqual(sanitizeLink('javascript:alert(1)'), '');
assert.strictEqual(sanitizeLink(''), '');

console.log('OK — alle Checks bestanden');
