# Security Policy

## Supported versions

Local Lead Finder is early-stage. Security fixes target the current `main` branch and latest tagged release.

## Reporting a vulnerability

Please do not open a public GitHub issue for vulnerabilities or sensitive data exposure.

Email: ricardosuper11@gmail.com

Include:

- affected version or commit;
- reproduction steps;
- impact;
- whether the issue involves local SQLite data, CSV exports, API routes, or external requests.

## Sensitive data

The app stores local business and workflow data in SQLite. Database files are ignored by Git:

- `*.sqlite`
- `*.sqlite-shm`
- `*.sqlite-wal`

Never commit local databases, `.env` files, API keys, private lead lists, or exported customer data.

## Responsible scope

This project does not scrape Google Maps and does not automate bulk outreach. Security reports involving spam automation or closed-platform scraping features may be closed as out of scope because those features are intentionally excluded.
