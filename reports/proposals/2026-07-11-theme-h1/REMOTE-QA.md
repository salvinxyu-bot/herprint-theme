# Stage 2 Shopify Remote QA

Date: 2026-07-16

## Themes

- Current live: `Dawn - Stage 2 SEO QA 2026-07-16` (`154908491968`)
- Rollback theme: `Dawn` (`141871349952`, unpublished)

## Integrity

- Current-live four-file refresh: PASS against `verify.js`.
- Current-live hashes: unchanged from the 2026-07-11 committed baseline.
- Upload scope: four manifest files, `--nodelete`, no publish flag.
- Remote pullback: all four files byte-for-byte equal to the proposal.
- Publication switched theme roles only; no asset upload was bundled with it.

## Browser Result

- Homepage desktop and 390 x 844 mobile: PASS.
- Unique homepage H1, title, canonical, navigation, and GA4: PASS.
- Ring, necklace, earrings, and bracelet product samples: PASS for unique H1, canonical, Product JSON-LD, and offer fields.
- Add to cart and cart drawer: PASS; test item removed.
- Checkout button: present in preview; full checkout handoff passed after publication.

## Release Result

Explicit human approval was recorded immediately before publication. Theme
`154908491968` is live, theme `141871349952` is the rollback point, and the
production smoke test passed. A post-release pull confirmed that all four live
files remain byte-for-byte equal to the approved proposal.
