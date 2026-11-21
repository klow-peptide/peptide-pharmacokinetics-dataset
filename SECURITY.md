# Security and privacy

The dataset files (`data/peptide-pk.json` and `data/peptide-pk.csv`) are static. Reading or using them does not make network requests and there is no telemetry.

`scripts/build-json.js` is also offline: it only reads and writes local files.

`scripts/validate.js` has two modes:

- `--offline` (schema, evidence rules, and the check that each number appears in `source_quote`): no network.
- Default (the source check): it fetches the cited source text, and only from these hosts:
  - `https://dailymed.nlm.nih.gov` — DailyMed SPL XML, by the label `setid` already stored in the row
  - `https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi` — PMC Open Access full text, by the `pmcid` already stored in the row
  - `https://eutils.ncbi.nlm.nih.gov/entrez/eutils` — PubMed `efetch` (abstract) and `esummary` (PMID metadata)

No other destinations are called, and the script does not send telemetry. It does not take an API key. Quotes, PMIDs and setids from the local dataset are sent only to the source they belong to, so the script can check that the quote is present and that the PMID exists.
