#!/usr/bin/env node
// Builds data/peptide-pk.json from data/peptide-pk.csv (the CSV is the source of truth).
const fs = require('fs');
const path = require('path');

const CSV = path.join(__dirname, '../data/peptide-pk.csv');
const OUT = path.join(__dirname, '../data/peptide-pk.json');
const meta = { name: 'Peptide Pharmacokinetics Dataset', version: '1.0.0', license: 'CC-BY-4.0', units: 'hours' };

function parseLine(line) {
  const cells = [];
  let cur = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { cells.push(cur); cur = ''; }
    else cur += c;
  }
  cells.push(cur);
  return cells;
}

const [header, ...lines] = fs.readFileSync(CSV, 'utf8').trim().split('\n');
const cols = parseLine(header);
const records = lines.map(line => {
  const cells = parseLine(line);
  if (cells.length !== cols.length) throw new Error(`Bad column count: ${line}`);
  const r = {};
  cols.forEach((c, i) => { r[c] = cells[i] === '' ? null : cells[i]; });
  r.aliases = r.aliases ? r.aliases.split(';') : [];
  for (const k of ['half_life_h', 'tmax_h']) r[k] = r[k] === null ? null : Number(r[k]);
  return r;
});

fs.writeFileSync(OUT, JSON.stringify({ ...meta, records }, null, 2) + '\n');
console.log(`Wrote ${records.length} records`);
