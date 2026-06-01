# Maintainer Automation Plan

This document describes how Local Lead Finder can use coding agents and API credits in a way that directly supports open-source maintenance.

## Goals

- Reduce review load for an early-stage maintainer.
- Improve test coverage for messy public-data edge cases.
- Keep documentation and release notes current.
- Make issue triage easier for users reporting OpenStreetMap tag problems.
- Preserve the project's local-first, transparent behavior.

## Proposed workflows

### Pull request review

Use Codex to review pull requests for:

- TypeScript safety;
- data privacy concerns;
- accidental scraping or bulk-outreach features;
- score changes without tests;
- missing docs for user-facing behavior.

### Fixture and test generation

Use API credits to generate and refine test cases around real-world OSM/Overpass data patterns:

- missing coordinates;
- inconsistent phone formats;
- multiple websites or social links;
- franchise and chain signals;
- accented Portuguese category labels;
- duplicate businesses near the same coordinates.

### Issue triage

Use Codex to summarize issues and route them into categories:

- category mapping;
- data-quality normalization;
- scoring bug;
- UI/UX;
- documentation;
- security/privacy.

### Release workflow

Use Codex to draft:

- changelog entries;
- migration notes;
- release summaries;
- manual QA checklists.

### Optional user-facing AI

If implemented, AI features should be optional and transparent:

- no hidden scoring replacement;
- no mandatory API key;
- no automated outreach;
- no upload of local SQLite data without explicit user action.

## Success criteria

- CI is required for every meaningful change.
- Scoring and normalization changes include tests.
- Security and privacy concerns are documented during review.
- Releases explain behavior changes clearly.
