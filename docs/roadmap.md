# Roadmap

Local Lead Finder is early-stage and intentionally focused: open data, local storage, transparent scoring, and manual review.

## Current maintainer priorities

### 1. Better OpenStreetMap coverage

- Add more categories for high-value local services.
- Support country-specific OSM tagging differences.
- Add fixtures for common Overpass responses.
- Improve readable category labels in English and Portuguese.

### 2. Stronger data-quality checks

- Improve phone, email, website, and social URL normalization.
- Add confidence scoring explanations.
- Detect low-quality or ambiguous OSM records.
- Improve duplicate detection across nearby coordinates and repeated contact data.

### 3. Safer validation workflow

- Keep outreach manual and review-first.
- Improve validation notes and lead status history.
- Add clearer warnings around public data, privacy, and anti-spam practices.

### 4. Maintainer automation

- Add CI checks for lint, typecheck, tests, and build.
- Add tests for scoring and normalization regressions.
- Add issue templates for OSM data problems and feature requests.
- Use coding agents for PR review, release notes, and fixture generation.

### 5. Optional AI assistance

The core app should remain usable without API keys. Optional AI features should be additive:

- explain why a lead is high or low priority;
- summarize website analysis findings;
- suggest safer manual validation steps;
- draft documentation and release notes for maintainers.

## Non-goals

- Google Maps scraping.
- Bulk contact automation.
- Selling proprietary lead data.
- Opaque scoring models that users cannot inspect.
