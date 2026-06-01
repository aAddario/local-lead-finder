# Local Lead Finder

Privacy-first local business discovery and lightweight CRM powered by OpenStreetMap and Overpass.

Local Lead Finder helps developers, freelancers, and small teams discover local businesses, prioritize opportunities, validate public contact data, and manage an outreach pipeline without scraping closed platforms or automating spam.

> Status: early-stage open-source project. The current version is useful for local prospecting workflows and is being hardened with tests, documentation, and maintainer automation.

## Why this exists

Most local lead tools depend on proprietary datasets, aggressive scraping, or bulk-contact automation. Local Lead Finder takes a safer approach:

- open data first: OpenStreetMap, Nominatim, and Overpass;
- local-first storage: SQLite on the user's machine;
- transparent scoring: deterministic rules instead of opaque lead scores;
- manual validation: quick links for checking websites and social profiles;
- no mass outreach: messages and proposals are generated for manual review.

The goal is to make local business discovery reproducible, inspectable, and useful for small operators who cannot afford expensive proprietary lead databases.

## Features

### Local business search

- Search by city, radius, and business category.
- Query OpenStreetMap through Overpass.
- Normalize business names, coordinates, addresses, phones, websites, and social links.
- Filter for businesses without a website, with phone numbers, or without obvious franchise signals.
- Export leads to CSV.

### Opportunity scoring

Each lead receives a 0-100 score based on explainable rules:

- missing website;
- phone or contact data available;
- high-ticket category;
- complete address;
- local-business signal;
- clear business name;
- franchise or large-chain penalty;
- incomplete-data penalty.

Every score includes positive and negative reasons so users can review why a lead was prioritized.

### Manual validation workflow

Lead cards include shortcuts to:

- search the business on Google;
- search Instagram and Facebook;
- open WhatsApp when a phone number is available;
- mark website status;
- mark a lead as verified, discarded, or high-potential;
- save notes and follow-up information.

### Lightweight CRM

The app includes a simple pipeline for moving leads through statuses:

- New;
- Check;
- Verified;
- Contact sent;
- Replied;
- Meeting scheduled;
- Proposal sent;
- Closed;
- Lost;
- Discarded.

### Website checks and proposals

For businesses with websites, Local Lead Finder can run a basic homepage check for public signals such as WhatsApp links, CTA clarity, services sections, forms, viewport metadata, title, and description.

For promising leads, the app can generate a copyable proposal outline based on the lead's visible gaps and business category.

## Tech stack

- Next.js 15
- React 19
- TypeScript
- SQLite through better-sqlite3
- Tailwind CSS
- Leaflet
- OpenStreetMap / Nominatim / Overpass
- Vitest
- ESLint

## Getting started

### Prerequisites

- Node.js 22+
- npm

### Install

```bash
git clone https://github.com/aAddario/local-lead-finder.git
cd local-lead-finder
npm ci
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

The app creates a local SQLite database for saved leads and searches. SQLite files are ignored by Git because they may contain personal or business data.

### Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Open data and responsible use

Local Lead Finder does not scrape Google Maps and does not automate bulk messaging. It uses public OpenStreetMap data and gives users manual validation tools.

When using the app:

- respect OpenStreetMap, Nominatim, and Overpass usage policies;
- verify lead data manually before contacting any business;
- avoid spam and bulk outreach;
- follow local privacy, marketing, and data-protection rules.

## Maintainer roadmap

Current priorities:

- expand OpenStreetMap category coverage;
- add fixtures for messy Overpass data;
- improve deduplication and data-quality scoring;
- add more unit and integration tests;
- document common local prospecting workflows;
- add optional AI-assisted explanations while keeping the core app usable without API keys.

See `docs/roadmap.md` and `docs/maintainer-automation.md` for more detail.

## Contributing

Contributions are welcome. Good first areas:

- new category mappings;
- tests for real-world OpenStreetMap tags;
- documentation improvements;
- CSV/export improvements;
- accessibility and UX fixes;
- safer validation workflows.

Read `CONTRIBUTING.md` before opening a pull request.

## Security

Please do not open public issues for vulnerabilities or sensitive data exposure. See `SECURITY.md`.

## License

MIT. See `LICENSE`.
