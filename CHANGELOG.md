# Changelog

All notable changes to Local Lead Finder will be documented here.

The project follows a practical semantic versioning style while it is early-stage.

## 0.1.0 - 2026-06-01

### Added

- Public open-source metadata, MIT license, contributing guide, and security policy.
- GitHub Actions CI for lint, typecheck, tests, and production build.
- Vitest test suite for lead scoring behavior.
- Roadmap and maintainer automation documentation.

### Fixed

- High-ticket category matching now normalizes accents before comparing category terms, improving scoring for Portuguese labels such as `Clínica`, `Escritório contábil`, and `Loja de móveis`.

## Earlier work

- OpenStreetMap/Overpass local business search.
- Local SQLite lead storage.
- Opportunity scoring with positive and negative explanations.
- Manual validation actions.
- Kanban-style lead pipeline.
- CSV export.
- Basic website analysis.
- Proposal and outreach message generation.
