# Stage 2 Shopify Remote QA

Date: 2026-07-16

## Themes

- Current live: `Dawn` (`141871349952`)
- Unpublished QA: `Dawn - Stage 2 SEO QA 2026-07-16` (`154908491968`)
- Preview: `https://15icsx-ru.myshopify.com?preview_theme_id=154908491968`

## Integrity

- Current-live four-file refresh: PASS against `verify.js`.
- Current-live hashes: unchanged from the 2026-07-11 committed baseline.
- Upload scope: four manifest files, `--nodelete`, no publish flag.
- Remote pullback: all four files byte-for-byte equal to the proposal.
- Published theme: untouched.

## Browser Result

- Homepage desktop and 390 x 844 mobile: PASS.
- Unique homepage H1, title, canonical, navigation, and GA4: PASS.
- Ring, necklace, earrings, and bracelet product samples: PASS for unique H1, canonical, Product JSON-LD, and offer fields.
- Add to cart and cart drawer: PASS; test item removed.
- Checkout button: present. Checkout-page smoke is deferred because Shopify exits draft-theme preview at that boundary.

No publication occurred. Human approval is the next release gate.
