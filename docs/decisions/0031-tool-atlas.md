# ADR 0031 — Tool Atlas navigation

- Status — Accepted on 2026-11-27
- Owner — Yash Sikdar
- Revisit when the release scope or its seven task groups change.

The owner compared seven working layouts and selected Tool Atlas. The previous catalog opened with a tall introduction and a flat sequence of tool cards. In a 390 × 700 browser viewport the first tool card began at y=485 and extended below the bottom navigation.

The home screen now navigates through the seven task groups in ADR 0026. Each tile opens a hash route under `#/category/`. The tool count opens `#/category/all`. Catalog search matches across the enabled tools. Favorites and Recent retain their own lists. Existing `#/tool/<id>` links and device-local storage keys keep their meanings.

This updates ADR 0026's coarse-filter presentation and the non-root Back behavior described in ADR 0019. A tool opened from a category, favorites or recents returns to that list. Direct entry falls back to the home catalog. At the home route, system Back still delegates to Android. Catalog queries stay in memory and only the list route is recorded in browser history state.

The alternatives included a compact index, a favorites desk, a search launcher, an inline workbench, an icon grid, and a split workspace. Tool Atlas trades one additional tap through a category for a visible overview of the 38 tools. The 38 enabled and 70 removed entries, the permission budget, and the single provider remain as set by their existing decisions.
