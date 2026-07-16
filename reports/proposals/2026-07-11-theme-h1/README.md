# Stage 2 Theme Semantics Proposal

Status: **prepared locally, not applied to Shopify**.

Publication is blocked until the four exact assets are pulled from the current
live theme and the package is verified against those refreshed sources. The
Shopify CLI refresh attempt on 2026-07-16 returned HTTP 401, so this package
continues to use the committed 2026-07-11 live-theme backup at Git commit
`274c9e1` as its construction source.

## Scope

The package contains four files and no visible copy, layout, product, cart, or
analytics change:

- `sections/header.liquid`: demote two homepage logo wrappers from H1 to div.
- `sections/herprint-eclat.liquid`: promote the existing visible tagline from p to H1.
- `sections/main-product.liquid`: promote the existing product title from H2 to H1.
- `layout/theme.liquid`: compare `page_title` and `shop.name` in lowercase before appending the brand suffix.

The expected homepage H1 remains the existing tagline:

`Jewelry that marks your every becoming.`

## Deterministic Verification

Run:

```bash
node verify.js
```

The verifier reconstructs every proposal file from the source using only the
approved transformations. It fails if the source has drifted or the proposal
contains an unrelated difference.

After refreshing the current live files, run:

```bash
HERPRINT_LIVE_THEME_SOURCE=/path/to/new-live-snapshot node verify.js
```

Do not bypass a failure. Rebuild the proposal from the refreshed files.

## Safe Application Sequence

1. Restore Shopify CLI or equivalent read-only theme access without sharing a token.
2. Confirm the current live theme ID and pull the four exact assets.
3. Re-run `verify.js` against the refreshed snapshot.
4. Duplicate the current live theme.
5. Apply only the four manifest files to the duplicate theme.
6. Complete every item in `QA-CHECKLIST.md`.
7. Obtain explicit human approval immediately before publication.
8. Save the published assets and release evidence back to Git and the SEO changelog.

See `manifest.json` for source and proposal hashes, prohibited changes, and the
release gates.
