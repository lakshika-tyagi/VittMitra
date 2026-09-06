# Scheme Data Management

This directory contains verified government scheme guidelines, parsed datasets, and seed payloads.

## Directory Structure
- `raw/`: Unaltered official government scheme notification PDFs, circulars, and policy documents (e.g., MSME Ministry guidelines, RBI priority sector lending norms).
- `processed/`: Cleaned, parsed, and normalized JSON/CSV scheme definitions.
- `seed/`: Verified starter seed datasets used for initial database seeding and testing.

## Data Quality & Anti-Hallucination Policy
- All scheme criteria must trace to official government sources (Ministry portals, PIB, official gazettes).
- Never fabricate scheme rules or financial subsidy percentages.
- Include `source_url` and `last_verified_at` metadata for every scheme record.
