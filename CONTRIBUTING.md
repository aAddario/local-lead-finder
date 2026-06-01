# Contributing to Local Lead Finder

Thanks for helping improve Local Lead Finder.

This project is focused on responsible local business discovery using open data. Contributions should keep the app transparent, privacy-conscious, and useful without depending on closed scraping workflows.

## Development setup

```bash
git clone https://github.com/aAddario/local-lead-finder.git
cd local-lead-finder
npm ci
npm run dev
```

## Before opening a pull request

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Useful contribution areas

- OpenStreetMap category mappings.
- Overpass edge-case fixtures.
- Lead scoring tests.
- CSV export improvements.
- Accessibility improvements.
- Documentation and examples.
- Responsible outreach and validation workflows.

## Code style

- Prefer TypeScript-first, typed helpers.
- Keep lead scoring deterministic and explainable.
- Add tests for scoring, normalization, deduplication, and data-quality behavior.
- Do not add scraping of closed platforms.
- Do not add automated bulk-contact features.

## Pull request checklist

- Explain what changed and why.
- Include test coverage for behavior changes.
- Confirm lint, typecheck, tests, and build pass.
- Mention any data/privacy implications.

## Reporting data issues

If you find a category, tag, or Overpass response that is parsed poorly, open an issue with:

- country/city context;
- anonymized or public OSM tags;
- expected category/output;
- current category/output.

Do not paste private customer data, API keys, personal databases, or bulk contact lists.
