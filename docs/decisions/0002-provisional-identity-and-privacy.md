# ADR 0002: Provisional Identity and Version 1 Privacy Posture

- Status: Identity values approved and updated by [ADR 0030](0030-ruma-tools-identity.md); the privacy posture below remains in force.
- Date: 2026-09-05 (identity values updated 2026-11-24)
- Owner: Yash Sikdar
- Revisit when: the Play listing is created, domain ownership or App Links change, monetization changes, or any SDK/backend/data collection is proposed.

## Decision

Foundation values:

- App name: `Ruma Tools`.
- Application ID: `dev.ruma.tools`.
- Bundled local origin: `https://app.ruma.tools`.
- Minimum API: 24.
- Target/compile API: 36.
- Free, no ads, no analytics, no account, no cloud sync, no automatic crash upload.
- Strict Android backup and device-transfer exclusion.

## Consequences

- Identity values can still change before Play creation, but all generated Android packages/resources must change together.
- After public release, package ID is effectively permanent for that listing.
- After durable WebView-origin data exists, changing the local origin requires a migration or risks orphaning data.
- Manual user-controlled Export/Import must replace automatic device backup for durable tools.
- Any future network/SDK/monetization change requires privacy policy, Data Safety, permission, and release review.
