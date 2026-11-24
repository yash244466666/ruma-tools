# ADR 0029: MIT License for the Repository

- Status: **Accepted** — directed by the product owner on 2026-11-24.
- Date: 2026-11-24
- Owner: Yash Sikdar (product owner)
- Revisit when: a dependency or copied asset cannot be redistributed under a permissive license, a contribution policy requires a different inbound license, a Play listing or distribution channel imposes conflicting terms, or the owner adopts a dual-license or copyleft model.

## Context

The repository became public on 2026-11-02 under ADR 0028, but it carried no license file. Without an explicit license, the default copyright rules apply: the source is publicly readable, yet nobody may legally copy, modify, or redistribute it. That blocks the ordinary expectations of an open-source project — forking, contributions, package reuse, and redistribution of the Android artifact — and leaves contributors with no clear inbound license.

The product owner directed that the project be released as **full open-source software under the MIT License**.

The repository's own code is compatible with MIT: the foundation pins permissive dependencies (React, Vite, Tailwind, Capacitor, Lucide, `qrcode`, `pdf-lib`, `jszip` under its MIT option, and others), and `pdfjs-dist` is Apache-2.0, which is compatible with an MIT-licensed aggregate as long as its own notices are preserved. Copied portfolio logic is the author's own work, recorded in `docs/SOURCE_PROVENANCE.md`.

## Decision

- The repository is licensed under the **MIT License**; the canonical text is the root [`LICENSE`](../../LICENSE) file.
- `package.json` declares `"license": "MIT"`. The package stays `"private": true` because it is an application, not a published npm package; that flag prevents accidental registry publication and does not restrict the license.
- `README.md` states the license and its practical terms.
- Contributions are accepted under the same MIT terms (inbound = outbound); no separate contributor license agreement is introduced.
- Third-party dependencies and copied assets retain their own licenses. Their attribution is recorded in `docs/SOURCE_PROVENANCE.md` and the CycloneDX SBOM, and the release gate for bundled notices is unchanged.
- The MIT grant does **not** waive Google Play policy, Android platform policy, provider terms (for example Frankfurter), or the legal constraints recorded in the release reviews. The YouTube Downloader exclusion under ADR 0021 is unaffected.

## Alternatives considered

- **No license (all rights reserved).** Rejected: it contradicts the public repository and blocks the intended open-source use.
- **Apache-2.0.** Stronger explicit patent grant, but heavier notice and modification-statement obligations than the owner asked for; MIT is the requested and simplest permissive option.
- **GPL-3.0 or AGPL-3.0.** Rejected: copyleft is incompatible with the intended permissive reuse and with distributing the app through Google Play without additional analysis.
- **Dual license.** Not requested; adds commercial complexity without a present need.

## Consequences

- Anyone may use, modify, and redistribute the source and the built artifact under MIT, retaining the copyright and permission notice.
- The MIT warranty disclaimer and limitation of liability apply to the authors.
- The project must keep third-party copyright notices intact; MIT does not relicense dependencies.
- License compatibility must be checked for every new dependency or copied asset, as required by the repository guide.
- The repository's public license is visible to GitHub only from the default branch, so `main` should receive this change through the normal `dev` → `main` promotion.
