// node make-pdf.js  -> Adventskalender_2026.pdf (ein Blatt: wer bekommt von wem)
// Quelle der Zuteilung ist app.js, damit Webseite und Blatt nie auseinanderlaufen.
const { DAYS, PEOPLE } = require('./app.js');
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if (!CHROME) throw new Error('Kein Chrome/Edge gefunden');

const row = d => `<tr><td class=n>${d.day}</td><td>${d.to}</td><td class=f>${d.from}</td></tr>`;
const table = ds => `<table><thead><tr><th>Tag</th><th>bekommt</th><th>von</th></tr></thead>
<tbody>${ds.map(row).join('')}</tbody></table>`;

const html = `<!doctype html><meta charset="utf-8"><title>Adventskalender 2026</title><style>
  @page{size:A4;margin:16mm}
  body{font:11pt/1.4 "Segoe UI",system-ui,sans-serif;color:#2a1c1a;margin:0}
  h1{font-size:21pt;color:#b3121b;margin:0 0 2mm;text-align:center}
  .sub{text-align:center;color:#7d6b67;font-size:9.5pt;margin:0 0 7mm}
  .cols{display:flex;gap:8mm}
  table{flex:1;border-collapse:collapse;font-size:10.5pt}
  th{background:#b3121b;color:#fff;font-weight:600;font-size:9pt;text-align:left;padding:2mm 3mm}
  td{padding:1.8mm 3mm;border-bottom:1px solid #ebdedb}
  tr:nth-child(even) td{background:#fdf6f5}
  .n{color:#b3121b;font-weight:700;width:9mm}
  .f{color:#7d6b67}
  .legend{margin-top:7mm;border-top:1px solid #ebdedb;padding-top:4mm;font-size:9.5pt;color:#2a1c1a}
  .legend b{color:#b3121b}
  .legend p{margin:0 0 2mm;color:#7d6b67}
</style>
<h1>&#127876; Adventskalender 2026</h1>
<p class=sub>Jeder beschenkt jeden zweimal &middot; vom selben Menschen bekommt man alle 12 Tage ein P&auml;ckchen</p>
<div class=cols>${table(DAYS.slice(0, 12))}${table(DAYS.slice(12))}</div>
<div class=legend><p>Wer an welchen Tagen ein P&auml;ckchen besorgt:</p>
${PEOPLE.map(p => `<div><b>${p}</b> schenkt an Tag ${DAYS.filter(d => d.from === p)
    .map(d => `${d.day}&nbsp;(${d.to})`).join(', ')}</div>`).join('')}</div>`;

const fwd = (q) => q.split(String.fromCharCode(92)).join('/');
const tmp = path.join(os.tmpdir(), 'adv2026-plan.html');
fs.writeFileSync(tmp, html);
execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
  '--print-to-pdf=' + path.resolve('Adventskalender_2026.pdf'), 'file:///' + fwd(tmp)],
  { stdio: 'inherit' });
console.log('Adventskalender_2026.pdf geschrieben');
