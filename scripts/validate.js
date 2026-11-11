#!/usr/bin/env node
// Validates data/peptide-pk.json.
//   1. Schema and evidence rules (offline).
//   2. Value-level check (offline): every number in half_life_h, half_life_range_h, tmax_h
//      and tmax_range_h must match a time value written in source_quote, after unit conversion
//      to hours (min, h, day, week). Rows marked verification_status=review are reported as warnings.
//   3. Source check (online): every PMID exists on PubMed with the cited first author, and every
//      source_quote appears verbatim in the source text: DailyMed label section 12.3 (by setid),
//      the PubMed abstract, or the PMC full text.
// Usage: node scripts/validate.js [--offline] [--strict]
const { records } = require('../data/peptide-pk.json');

const LEVELS = ['A', 'B', 'C', 'D'];
const STATUSES = ['verified', 'review', 'no_data'];
const DAILYMED = /^https:\/\/dailymed\.nlm\.nih\.gov\/dailymed\/drugInfo\.cfm\?setid=([0-9a-f-]{36})$/;
const errors = [];
const warnings = [];
const names = new Set();

const UNIT_HOURS = { min: 1 / 60, h: 1, d: 24, w: 168 };
const NON_TIME = /^(mg|mcg|µg|μg|ng|pg|g|ml|l|kg|%)/i;

// Returns every time value (in hours) written in a quote. A number takes the next unit after it.
function timeValues(quote) {
  const tokens = quote.match(/\d+(?:[.·]\d+)?|[A-Za-zµμ%]+/g) || [];
  const out = [];
  let pending = [];
  for (const t of tokens) {
    if (/^\d/.test(t)) { pending.push(Number(t.replace('·', '.'))); continue; }
    if (!pending.length) continue;
    const w = t.toLowerCase();
    let unit = null;
    if (/^(min|mins|minute|minutes)$/.test(w)) unit = 'min';
    else if (/^(h|hr|hrs|hour|hours)$/.test(w)) unit = 'h';
    else if (/^(d|day|days)$/.test(w)) unit = 'd';
    else if (/^(week|weeks)$/.test(w)) unit = 'w';
    else if (NON_TIME.test(w)) { pending = []; continue; }
    else continue; // words such as "to", "and", "range" keep the numbers pending
    for (const n of pending) out.push(n * UNIT_HOURS[unit]);
    pending = [];
  }
  return out;
}

function dataNumbers(r) {
  const nums = [];
  for (const k of ['half_life_h', 'tmax_h']) if (r[k] !== null) nums.push([k, r[k]]);
  for (const k of ['half_life_range_h', 'tmax_range_h']) {
    if (r[k] === null) continue;
    for (const n of r[k].replace(/^</, '').split('-')) nums.push([k, Number(n)]);
  }
  return nums;
}

const close = (a, b) => Math.abs(a - b) <= Math.max(0.05, 0.02 * b);

for (const r of records) {
  const id = r.peptide;
  if (names.has(id)) errors.push(`${id}: duplicate row`);
  names.add(id);
  if (!LEVELS.includes(r.evidence_level)) errors.push(`${id}: bad evidence_level`);
  if (!STATUSES.includes(r.verification_status)) errors.push(`${id}: bad verification_status`);
  const hasValue = dataNumbers(r).length > 0;
  if (r.evidence_level === 'D' && hasValue) errors.push(`${id}: level D must have no value`);
  if (hasValue && !r.source) errors.push(`${id}: value without source`);
  if (hasValue && !r.source_url) errors.push(`${id}: value without source_url`);
  if (hasValue && !r.source_quote) errors.push(`${id}: value without source_quote`);
  if (r.source_url && !r.verified_on) errors.push(`${id}: source_url without verified_on date`);
  if (r.evidence_level === 'A' && r.source_type !== 'regulatory_label') errors.push(`${id}: level A needs a label`);
  if (r.evidence_level === 'A' && !DAILYMED.test(r.source_url || '')) errors.push(`${id}: level A needs a DailyMed setid URL`);
  if (r.evidence_level === 'B' && !r.pmid) errors.push(`${id}: level B needs a PMID`);
  if (r.evidence_level !== 'D' && !r.source_url) errors.push(`${id}: level ${r.evidence_level} needs a source_url`);
  for (const k of ['half_life_h', 'tmax_h']) {
    if (r[k] !== null && !(r[k] > 0)) errors.push(`${id}: ${k} must be a positive number`);
  }
  // Value-level check against the quoted source text.
  if (hasValue && r.source_quote) {
    const quoted = timeValues(r.source_quote);
    const missing = dataNumbers(r).filter(([, n]) => !quoted.some(q => close(n, q)));
    for (const [k, n] of missing) {
      const msg = `${id}: ${k} value ${n} h is not written in source_quote`;
      if (r.verification_status === 'review') warnings.push(`${msg} (known, status=review)`);
      else errors.push(msg);
    }
    if (!missing.length && r.verification_status === 'review') {
      errors.push(`${id}: all values match the quote; status should be verified`);
    }
  }
}

const norm = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, '').toLowerCase();
const stripTags = xml => xml.replace(/<[^>]+>/g, ' ');

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function sourceText(r) {
  const m = DAILYMED.exec(r.source_url || '');
  if (m) {
    const xml = await get(`https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${m[1]}.xml`);
    // Keep only section 12.3 when it can be located.
    const start = xml.search(/<title[^>]*>\s*12\.3/);
    const end = start >= 0 ? xml.slice(start + 10).search(/<title[^>]*>\s*12\.[4-9]|<title[^>]*>\s*1[3-9]\b/) : -1;
    return stripTags(start >= 0 ? xml.slice(start, end >= 0 ? start + 10 + end : undefined) : xml);
  }
  if (r.source_url.includes('pmc.ncbi.nlm.nih.gov') && r.pmcid) {
    const json = JSON.parse(await get(`https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/${r.pmcid}/unicode`));
    const coll = Array.isArray(json) ? json[0] : json;
    return coll.documents.flatMap(d => d.passages.map(p => p.text || '')).join(' ');
  }
  if (r.pmid) {
    return stripTags(await get(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${r.pmid}`));
  }
  throw new Error('no machine-readable source');
}

async function checkOnline() {
  const pmids = records.map(r => r.pmid).filter(Boolean);
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(',')}`;
  const { result } = await (await fetch(url)).json();
  for (const r of records.filter(x => x.pmid)) {
    const hit = result[r.pmid];
    if (!hit || hit.error) { errors.push(`${r.peptide}: PMID ${r.pmid} not found`); continue; }
    const author = (hit.authors[0] || {}).name || '';
    if (!r.source.includes(author.split(' ')[0])) errors.push(`${r.peptide}: PMID ${r.pmid} first author is ${author}`);
  }
  for (const r of records.filter(x => x.source_quote)) {
    try {
      const text = norm(await sourceText(r));
      for (const part of r.source_quote.split(' | ')) {
        if (!text.includes(norm(part))) errors.push(`${r.peptide}: quote not found in source: "${part}"`);
      }
    } catch (e) {
      errors.push(`${r.peptide}: could not read source (${e.message})`);
    }
    await new Promise(ok => setTimeout(ok, 350)); // stay under the NCBI rate limit
  }
}

(async () => {
  if (!process.argv.includes('--offline')) await checkOnline();
  if (warnings.length) console.warn(warnings.map(w => `WARN ${w}`).join('\n'));
  if (process.argv.includes('--strict')) errors.push(...warnings);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  const n = s => records.filter(r => r.verification_status === s).length;
  console.log(`OK: ${records.length} records (${n('verified')} verified, ${n('review')} review, ${n('no_data')} no data)`);
})();
