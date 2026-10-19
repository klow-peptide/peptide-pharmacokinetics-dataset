# Peptide Pharmacokinetics Dataset

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23464099.svg)](https://doi.org/10.5281/zenodo.23464099)

An open, sourced table of **half-life (t½) and time to peak (Tmax)** for 35 therapeutic and research peptides.
Every number links to a primary source: an FDA label, a PubMed record, or a DOI.
When no reliable data exists, the value is left **empty**. We do not fill gaps with estimates.

Maintained by [Klow Peptide](https://klow-peptide.com/en/). License: [CC BY 4.0](LICENSE).
Overview of all our open resources: [klow-peptide.com/en/pages/open-data](https://klow-peptide.com/en/pages/open-data/).

## Why this dataset exists

Many peptide websites quote half-lives with no source. Some of these numbers are wrong by a factor of 10 or more.
This dataset separates what is measured in humans from what is only assumed.

| Evidence level | Meaning | Peptides |
|---|---|---|
| **A** | Regulatory label (FDA prescribing information) | 10 |
| **B** | Human clinical trial, PK reported | 8 |
| **C** | Animal PK only, or human data without drug PK | 2 |
| **D** | No published pharmacokinetic data found | 15 |

Key finding: **15 of 35 peptides (43 %) have no published half-life at all**, including TB-500, GHK-Cu,
Epitalon and IGF-1 LR3. BPC-157 has animal data only.

## Files

| File | Content |
|---|---|
| `data/peptide-pk.csv` | The dataset, one row per peptide (source of truth) |
| `data/peptide-pk.json` | The same data as JSON |
| `METHODOLOGY.md` | Inclusion rules, evidence levels, how values are checked |
| `scripts/build-json.js` | Rebuilds the JSON from the CSV |
| `scripts/validate.js` | Checks the schema and that every PMID resolves on PubMed |

## Columns

| Column | Description |
|---|---|
| `peptide`, `aliases` | Name and common synonyms (`;` separated) |
| `half_life_h`, `half_life_range_h` | Elimination half-life in hours: central value and reported range |
| `tmax_h`, `tmax_range_h` | Time to maximum plasma concentration, in hours |
| `route` | `SC` subcutaneous, `IV` intravenous, `IM` intramuscular |
| `species` | Species in the source study |
| `evidence_level` | A, B, C or D (see above) |
| `source_type`, `source`, `pmid`, `pmcid`, `doi` | Primary source |
| `notes` | What the source says, and caveats (route, population) |

## Use it

```js
const { records } = require('./data/peptide-pk.json');
const measured = records.filter(r => r.half_life_h !== null);
```

Interactive half-life curves built on this data: [Peptide Lab](https://klow-peptide.com/en/pages/peptide-lab/).

## Cite

> Klow Peptide (2026). *Peptide Pharmacokinetics Dataset* (v1.0.0) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.23464100

To cite all versions, use the concept DOI: [10.5281/zenodo.23464099](https://doi.org/10.5281/zenodo.23464099). It always resolves to the latest version.

See `CITATION.cff`. GitHub shows a "Cite this repository" button.

## Disclaimer

This dataset is for research and educational use only. It is not medical advice and it gives no dosing guidance.
Pharmacokinetics change with dose, formulation, route and population. Always read the primary source.

## Contribute

Found an error or a better source? Open an issue with the PMID, the DOI or the label link.
A value is changed only with a primary source.
