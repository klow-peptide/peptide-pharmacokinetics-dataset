#!/usr/bin/env node
// Validates data/peptide-pk.json: schema, evidence rules, and that every PMID exists on PubMed.
// Usage: node scripts/validate.js [--offline]
const { records } = require('../data/peptide-pk.json');

const LEVELS = ['A', 'B', 'C', 'D'];
const errors = [];
const names = new Set();

for (const r of records) {
  const id = r.peptide;
  if (names.has(id)) errors.push(`${id}: duplicate row`);
  names.add(id);
  if (!LEVELS.includes(r.evidence_level)) errors.push(`${id}: bad evidence_level`);
  const hasValue = r.half_life_h !== null || r.half_life_range_h !== null;
  if (r.evidence_level === 'D' && hasValue) errors.push(`${id}: level D must have no value`);
  if (hasValue && !r.source) errors.push(`${id}: value without source`);
  if (r.evidence_level === 'A' && r.source_type !== 'regulatory_label') errors.push(`${id}: level A needs a label`);
  if (r.evidence_level === 'B' && !r.pmid) errors.push(`${id}: level B needs a PMID`);
  for (const k of ['half_life_h', 'tmax_h']) {
    if (r[k] !== null && !(r[k] > 0)) errors.push(`${id}: ${k} must be a positive number`);
  }
}

async function checkPmids() {
  const pmids = records.map(r => r.pmid).filter(Boolean);
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(',')}`;
  const { result } = await (await fetch(url)).json();
  for (const r of records.filter(x => x.pmid)) {
    const hit = result[r.pmid];
    if (!hit || hit.error) { errors.push(`${r.peptide}: PMID ${r.pmid} not found`); continue; }
    const author = (hit.authors[0] || {}).name || '';
    if (!r.source.includes(author.split(' ')[0])) errors.push(`${r.peptide}: PMID ${r.pmid} first author is ${author}`);
  }
}

(async () => {
  if (!process.argv.includes('--offline')) await checkPmids();
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log(`OK: ${records.length} records`);
})();
