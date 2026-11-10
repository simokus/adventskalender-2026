# 🎄 Adventskalender 2026

Wunschliste & Geschenk-Planung für Simon, Ilina, Patrizia und Patrick.
24 Tage, 24 Päckchen — wer wem schenkt, steht schon fest: die vier kommen reihum dran
(Tag 1 Simon, 2 Ilina, 3 Patrizia, 4 Patrick, dann von vorn), und pro Person rotieren
die drei Schenkenden der Reihe nach durch — vom selben Menschen bekommt man also genau
alle 12 Tage ein Päckchen. Die Tabelle steht in `Adventskalender_2026.pdf`.

**Live:** https://simokus.github.io/adventskalender-2026/

## Wie es funktioniert

1. Name wählen, beim ersten Mal einen 4-stelligen PIN setzen (gut merken, es gibt kein Zurücksetzen ausser durch mich).
2. **Meine Wünsche** — beliebig viele Wünsche eintragen: Titel, Budget in CHF, Link, Bemerkung.
3. **Wunschliste** — alle Wünsche von allen. Bei *deinen eigenen* Wünschen wird absichtlich nicht angezeigt, ob sie schon reserviert sind.
4. **Meine Geschenke** — deine 6 Tage mit der jeweils beschenkten Person. Pro Tag einen Wunsch auswählen (oder eigene Idee eintippen) und abhaken, wenn besorgt. Ein Wunsch, der schon an einem Tag reserviert ist, ist für die anderen gesperrt — doppelt schenken geht also nicht.

## Technik

Eine HTML-Datei, kein Build, keine Abhängigkeiten. Daten liegen als ein JSON-Dokument
bei [textdb.dev](https://textdb.dev) (gratis, kein Konto). Vor jedem Schreiben wird neu
geladen und gemerged; alle 20 s wird aktualisiert. **Backup**-Knopf lädt den aktuellen
Stand als JSON herunter.

Logik-Check: `node test.js`

Das PDF-Blatt neu erzeugen (liest die Zuteilung aus `app.js`, druckt per Chrome):
`node make-pdf.js`

## Grenzen (bewusst so)

- Die PINs trennen nur die Ansichten, sie sind keine echte Sicherheit: alle Daten
  kommen im Browser an, wer die Entwicklerkonsole öffnet, kann alles sehen.
  Reicht, damit niemand *versehentlich* die Überraschung verdirbt.
- Wer die textdb-Adresse kennt, kann die Daten lesen und ändern. Darum den Link
  nur in der Familie teilen.
