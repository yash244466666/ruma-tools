# ADR 0030: Ruma Tools Product Identity

- Status: **Accepted** — directed by the product owner on 2026-11-24.
- Date: 2026-11-24
- Owner: Yash Sikdar (product owner)
- Amends: [ADR 0002](0002-provisional-identity-and-privacy.md) identity values. ADR 0002's privacy posture, backup exclusion, and no-SDK rules remain in force.
- Revisit when: the Google Play listing is created, the `ruma.tools` domain or App Links are adopted, store branding changes, or any identity value must change after durable user data or a public release exists.

## Context

The repository was renamed to `ruma-tools` and became public under ADR 0028, but the application still carried the foundation's provisional, personal-brand identity in roughly 85 files: the Capacitor configuration, Android `applicationId`/namespace and Java packages, resources, scripts, tests, documentation, certification records, and the `PreferenceStore` namespace.

The product owner directed that the product be named **Ruma Tools** and that every file carrying the former name be updated. No Google Play listing, signing key, or public release exists, so this is the last point at which the identifiers can change without a migration or a permanent listing consequence.

## Decision

- Display name: **Ruma Tools**.
- Application ID and Android namespace: **`dev.ruma.tools`** (debug and internal variants append `.debug` and `.internal`).
- Bundled production origin: **`https://app.ruma.tools`** (`androidScheme: "https"`).
- Custom URL scheme: **`dev.ruma.tools`**.
- Durable preference namespace: **`ruma-tools:v1:`**.
- Android Java packages move to `dev/ruma/tools` in all three source sets (main, test, androidTest), including the instrumented test package.
- Capacitor config, Android resources, manifest-check allowlists, device scripts, SBOM metadata, README, operating guide, tracker, and certification documents use the new identity.
- Generated Android web assets are regenerated through `pnpm build && pnpm cap:sync`, never hand-edited.
- The opaque `yash-tools-work-item` HTML marker embedded in provisioned GitHub issue bodies is **retained unchanged**. It is remote matching state, not product branding; renaming it would orphan 151 managed issues and create duplicates. It is documented at its definition in `scripts/setup-github-work-management.ts`.

## Migration notes

- There is no released build and no public durable data, so no preference or WebView-storage migration is implemented. The namespace and origin change together; an old debug or internal installation is a different package and does not inherit its data.
- Git history is not rewritten. The former identifiers remain discoverable in earlier commits and pull requests, which is expected for a public repository.
- Once the Play listing exists, the application ID is permanent for that listing, and changing the bundled origin after public data exists would orphan WebView storage.

## Alternatives considered

- **Keep the former personal-brand identifiers.** Rejected by the product owner; it conflicts with the repository rename and the intended product name.
- **Rename only the display label.** Rejected: the application ID, origin, package tree, and storage namespace would remain misleading and would be far more expensive to change after release.
- **Add a preference-namespace migration.** Not applicable: no public release or durable user data exists, and carrying a one-off migration for unreleased debug installs adds permanent code.
- **Rename the work-item marker.** Rejected: it would break reconciliation with the live GitHub issues and Project.

## Consequences

- All build variants, instrumented tests, and device scripts now target `dev.ruma.tools`; the merged-manifest policy and release notes were updated to match.
- Existing debug/internal installs are separate packages; testers must install the new build and re-enter preferences.
- The README, help text, SBOM description, and certification records now match the shipped identity.
- GitHub surfaces the license and repository name from the default branch, so `main` receives this change only through the normal `dev` → `main` promotion.
