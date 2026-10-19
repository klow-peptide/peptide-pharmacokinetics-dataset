# Methodology

## Inclusion

A peptide is included if it is a therapeutic peptide or a peptide often discussed in research use.
A row with no data is kept on purpose: "no published PK" is a result.

## Sources, in order of priority

1. FDA prescribing information, section 12.3 (Pharmacokinetics), read on DailyMed.
2. Human clinical trials indexed on PubMed, with PK values in the abstract or full text.
3. Animal PK studies (evidence level C, never shown as a human value).

Vendor pages, forums and secondary blogs are never used as a source.

## Values

- Units are hours.
- `half_life_h` and `tmax_h` hold a central value only when the source gives one.
- When a source gives only a range, only the range column is filled. No midpoint is added.
- When a source gives only a bound ("less than 3 h"), the range column holds that bound.
- Values from IV studies are marked `IV`. They do not describe SC use.
- `notes` quotes what the source says, so each number can be traced.

## Verification

- Every PMID and PMCID is checked against PubMed (first author and topic) with `scripts/validate.js`.
- Every number from a study is checked against the abstract or the open full text.
- Every label value is checked against the current label on DailyMed. Last check: 2026-10-19.

## Known limits

- Many records rely on one small study (often fewer than 20 subjects).
- Research-grade products can differ from the pharmaceutical form.
- Labels change. When a label changes, the row changes in a new version.

## Changelog

- **1.0.0 (2026-10)**: first public release, 35 peptides.
