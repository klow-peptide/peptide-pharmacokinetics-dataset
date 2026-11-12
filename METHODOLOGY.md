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

Details and the row-by-row table are in `VERIFICATION.md`.

- Every row with a value has a direct `source_url` (DailyMed setid for labels, PubMed or PMC for studies)
  and a `source_quote` with the exact sentence that states the values.
- `scripts/validate.js` checks, for every row:
  - that the quote is present verbatim in the live source (DailyMed label section 12.3, PubMed abstract, or PMC full text);
  - that every number in the value columns matches a time value written in the quote, after conversion to hours;
  - that every PMID exists on PubMed with the cited first author.
- A row whose number is derived rather than stated is marked `review` and listed in `VERIFICATION.md`.
- Last full check: 2026-11-11.

## Known limits

- Many records rely on one small study (often fewer than 20 subjects).
- Research-grade products can differ from the pharmaceutical form.
- Labels change. When a label changes, the row changes in a new version.

## Changelog

- **1.1.0 (unreleased)**: direct source links for all 10 FDA-label rows (DailyMed setid); new columns
  `source_url`, `source_location`, `source_quote`, `verified_on`, `verification_status`;
  value-level checks in `scripts/validate.js`; `VERIFICATION.md`. Five derived values not stated in the source were removed
  (octreotide, cagrilintide, CJC-1295 with DAC and cotadutide central half-lives; GHRP-6 mean ± SD range); see `VERIFICATION.md`.
- **1.0.0 (2026-10)**: first public release, 35 peptides.
