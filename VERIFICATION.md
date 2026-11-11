# Value-level verification

This file records, for every row, where each number comes from and how it was checked.
It answers one question: can a reader find each value, word for word, in the primary source?

Last full check: **2026-11-11**.

## How each value is checked

1. **Direct link.** Every row with a source has a `source_url`:
   - FDA labels (evidence level A): the DailyMed page of the current label, by `setid`.
     The label version and effective date that were read are in `source_location`.
   - Studies (levels B and C): the PubMed record, or the PMC full text when the value is only in the full text.
     `pmid`, `pmcid` and `doi` are kept as well.
2. **Exact quote.** `source_quote` holds the exact sentence or sentences that state the values
   (several excerpts are separated by ` | `).
3. **Quote check (online).** `scripts/validate.js` downloads the source and checks that every excerpt is present verbatim
   (whitespace and case ignored):
   - DailyMed: the SPL XML of the label, section 12.3 Pharmacokinetics, through the DailyMed v2 API;
   - PubMed: the abstract, through NCBI E-utilities `efetch`;
   - PMC: the open-access full text, through the NCBI BioC API.
4. **Number check (offline).** The script reads every time value written in `source_quote`, converts it to hours
   (1 min = 1/60 h, 1 day = 24 h, 1 week = 168 h) and checks that **every** number in
   `half_life_h`, `half_life_range_h`, `tmax_h` and `tmax_range_h` matches one of them
   (tolerance: rounding, at most 0.05 h or 2 %).
   A value that is not written in the quote fails the check.
5. **Status.** `verification_status` is:
   - `verified`: the quote is in the source and every number matches it;
   - `review`: the quote is in the source, but at least one number is derived rather than stated
     (reserved for future corrections; no row has it in this release);
   - `no_data`: no published pharmacokinetic value was found (evidence level D). These rows hold no number.

Run it:

```sh
node scripts/validate.js            # schema + numbers + PubMed + quotes in the live sources
node scripts/validate.js --offline  # schema + numbers only
node scripts/validate.js --strict   # also fails on rows with status "review"
```

The script checks that each number is written in the source. It does not judge the quality of the study.
That judgement is the evidence level, set by hand (see `METHODOLOGY.md`).

## Derived values removed in 1.1.0

Version 1.0.0 held five numbers that the source does not state (a midpoint, a central value or a mean ± SD shown as a range).
That broke our own rule "no central value or range unless the source states it". They were removed in 1.1.0;
the stated values, the source link and the quote are kept.

| Peptide | Removed | Kept (stated in the source) |
|---|---|---|
| Octreotide | `half_life_h` 1.8 (midpoint of the label range) | `half_life_range_h` 1.7-1.9 h; `tmax_h` 0.4 h |
| Cagrilintide | `half_life_h` 180 (not in the abstract) | `half_life_range_h` 159-195 h; `tmax_range_h` 24-72 h |
| CJC-1295 with DAC | `half_life_h` 168 (7 d, not in the abstract) | `half_life_range_h` 139-194 h (5.8-8.1 d) |
| Cotadutide | `half_life_h` 11 (not in the abstract) | `half_life_range_h` 9.5-12.1 h; `tmax_range_h` 4.5-9.0 h |
| GHRP-6 | `half_life_range_h` 1.4-3.6 (mean ± SD, 2.5 ± 1.1 h) | `half_life_h` 2.5 h (the stated mean) |

No row has status `review` in this release.

## Row by row

Values are in hours. The quote keeps the unit used by the source; the script converts it.

| Peptide | Values in the dataset | Source (direct link) | Where | Quote | Status |
|---|---|---|---|---|---|
| Semaglutide | t½ 168 h; Tmax range 24-72 h | [FDA label Ozempic injection (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=adec4fd2-6858-4c99-91d4-531f5f2a2d79) | DailyMed SPL version 20 (effective 2026-06-01), section 12.3 Pharmacokinetics | Maximum concentration of semaglutide is reached 1 to 3 days post dose <br> With an elimination half-life of approximately 1 week | verified |
| Tirzepatide | t½ 120 h; Tmax range 8-72 h | [FDA label Mounjaro (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d2d7da5d-ad07-4228-955f-cf7e355c8cc0) | DailyMed SPL version 40 (effective 2026-08-27), section 12.3 Pharmacokinetics | the time to maximum plasma concentration of tirzepatide ranges from 8 to 72 hours <br> with an elimination half-life of approximately 5 days | verified |
| Liraglutide | t½ 13 h; Tmax range 8-12 h | [FDA label Victoza (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5a9ef4ea-c76a-4d34-a604-27c5b505f5a4) | DailyMed SPL version 31 (effective 2025-10-14), section 12.3 Pharmacokinetics | maximum concentrations of liraglutide are achieved at 8 to 12 hours post dosing <br> with an elimination half-life of approximately 13 hours | verified |
| Dulaglutide | t½ 120 h; Tmax 48 h; Tmax range 24-72 h | [FDA label Trulicity (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=463050bd-2b1c-40f5-b3c3-0a04bb433309) | DailyMed SPL version 62 (effective 2026-06-16), section 12.3 Pharmacokinetics | the time to maximum plasma concentration of dulaglutide at steady state ranges from 24 to 72 hours, with a median of 48 hours <br> The elimination half-life of dulaglutide was approximately 5 days | verified |
| Exenatide | t½ 2.4 h; Tmax 2.1 h | [FDA label Byetta (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=53d03c03-ebf7-418d-88a8-533eabd2ee4f) | DailyMed SPL version 26 (effective 2025-09-02), section 12.3 Pharmacokinetics | exenatide reaches median peak plasma concentrations in 2.1 hours <br> the mean terminal half-life is 2.4 hours | verified |
| Tesamorelin | t½ 0.13 h; Tmax 0.15 h | [FDA label Egrifta SV (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=3d783378-b02d-4f19-99dd-0fc91a042224) | DailyMed SPL version 9 (effective 2026-07-29), section 12.3 Pharmacokinetics | the median T max was 0.15 h <br> Mean elimination half-life (t 1/2 ) of tesamorelin was 8 minutes | verified |
| Bremelanotide | t½ 2.7 h; t½ range 1.9-4.0 h; Tmax 1 h; Tmax range 0.5-1.0 h | [FDA label Vyleesi (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f1d0c1b5-2f39-4bad-a6a4-0066e3ad5dcf) | DailyMed SPL version 2 (effective 2026-11-05), section 12.3 Pharmacokinetics | Bremelanotide median T max is approximately 1.0 hour (range: 0.5 - 1.0 hours) <br> mean terminal half-life of bremelanotide is approximately 2.7 hours (range: 1.9– 4.0 hours) | verified |
| Teriparatide | t½ 1 h; Tmax 0.5 h | [FDA label Forteo (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=aae667c5-381f-4f92-93df-2ed6158d07b0) | DailyMed SPL version 44 (effective 2026-08-03), section 12.3 Pharmacokinetics | The peptide reaches peak serum concentrations about 30 minutes after subcutaneous injection <br> The half-life of teriparatide in serum was approximately 1 hour | verified |
| Setmelanotide | t½ 11 h; Tmax 8 h | [FDA label Imcivree (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=70c3ccf7-4df0-4c75-ba07-fede9970c8d9) | DailyMed SPL version 14 (effective 2026-04-01), section 12.3 Pharmacokinetics | reached maximum concentrations at a median tmax of 8 h after dosing <br> The effective elimination half-life (t½) of setmelanotide was approximately 11 hours | verified |
| Octreotide | t½ range 1.7-1.9 h; Tmax 0.4 h | [FDA label Sandostatin (sec. 12.3)](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4e2c9856-1836-49f0-9472-4dbeeb408f39) | DailyMed SPL version 23 (effective 2026-07-22), section 12.3 Pharmacokinetics | were reached 0.4 hours after dosing <br> had an apparent half-life of 1.7 to 1.9 hours | verified |
| Retatrutide | t½ 144 h | [Urva S et al. Lancet 2022](https://pubmed.ncbi.nlm.nih.gov/36354040/) | PubMed abstract | its half-life was approximately 6 days | verified |
| Cagrilintide | t½ range 159-195 h; Tmax range 24-72 h | [Enebo LB et al. Lancet 2021](https://pubmed.ncbi.nlm.nih.gov/33894838/) | PubMed abstract | Cagrilintide 0·16-4·5 mg had a half-life of 159-195 h, with a median t max of 24-72 h | verified |
| CJC-1295 with DAC | t½ range 139-194 h | [Teichman SL et al. J Clin Endocrinol Metab 2006](https://pubmed.ncbi.nlm.nih.gov/16352683/) | PubMed abstract | The estimated half-life of CJC-1295 was 5.8-8.1 d | verified |
| Cotadutide | t½ range 9.5-12.1 h; Tmax range 4.5-9.0 h | [Ambery PD et al. Br J Clin Pharmacol 2018](https://pubmed.ncbi.nlm.nih.gov/29926478/) | PubMed abstract | time to maximum plasma concentration: 4.50-9.00 h; elimination half-life: 9.54-12.07 h | verified |
| Thymosin alpha-1 | t½ range <3 h; Tmax range 1-2 h | [Rost KL et al. Int J Clin Pharmacol Ther 1999](https://pubmed.ncbi.nlm.nih.gov/10027483/) | PubMed abstract | with a mean t(max) between 1-2 hours <br> the short elimination half-life of less than 3 hours | verified |
| Ipamorelin | t½ 2 h | [Gobburu JV et al. Pharm Res 1999](https://pubmed.ncbi.nlm.nih.gov/10496658/) | PubMed abstract | with a short terminal half-life of 2 hours | verified |
| GHRP-6 | t½ 2.5 h | [Cabrales A et al. Eur J Pharm Sci 2013](https://pubmed.ncbi.nlm.nih.gov/23099431/) | PubMed abstract | elimination half-life of GHRP-6 were 7.6 ± 1.9 min and 2.5 ± 1.1h | verified |
| Thymosin beta-4 | t½ range 0.5-2.1 h; Tmax range 0.05-0.25 h | [Wang X et al. J Cell Mol Med 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8419156/) | PMC full text (Results, pharmacokinetics) | the T max was from 3 to 15 minutes, and t 1/2 was from 0.5 to 2.08 hours | verified |
| Hexarelin | (no value) | [Imbimbo BP et al. Eur J Clin Pharmacol 1994](https://pubmed.ncbi.nlm.nih.gov/7957536/) | PubMed abstract | peaking at about 30 min and then decreasing to baseline values within 240 min with a half-life of about 55 min | verified |
| BPC-157 | t½ range <0.5 h | [He L et al. Front Pharmacol 2022](https://pubmed.ncbi.nlm.nih.gov/36588717/) | PubMed abstract | the elimination half-life (t 1/2 ) of prototype BPC157 was less than 30 min | verified |

## Rows with no published data (status `no_data`)

These rows hold no number, so there is nothing to verify. The `notes` column says what was searched or found.

Sermorelin, Melanotan II, Semax, CJC-1295 (no DAC), TB-500, GHK-Cu, KPV, Selank, DSIP, AOD-9604, LL-37, Epitalon, GHRP-2, IGF-1 LR3, MOTS-c.

