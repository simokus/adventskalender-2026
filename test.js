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
