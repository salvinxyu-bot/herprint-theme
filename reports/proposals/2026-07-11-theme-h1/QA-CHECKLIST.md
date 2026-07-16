# Stage 2 Duplicate-Theme QA

Status: **browser QA passed; checkout handoff deferred to production smoke; publication requires human approval**.

## Source Gate

- [x] Restore Shopify CLI access without storing a token in chat or Git.
- [x] Confirm current live theme ID `141871349952`.
- [x] Pull the four target files into a new 2026-07-16 snapshot.
- [x] Run `HERPRINT_LIVE_THEME_SOURCE=<new-snapshot> node verify.js` with a PASS result.
- [x] Confirm no source drift; no rebase was required.

## Duplicate Theme

- [x] Duplicate the current live theme.
- [x] Record unpublished theme `154908491968`, created 2026-07-16.
- [x] Apply only the four manifest files with `--nodelete`.
- [x] Pull the four files back and confirm byte-for-byte equality with the proposal.

## Homepage QA

- [x] Desktop: exactly one meaningful H1 with the existing hero tagline.
- [x] Mobile 390 x 844: exactly one meaningful H1 with no visual shift or duplicate heading.
- [x] Desktop, sticky, and mobile navigation remain usable.
- [x] Rendered title contains Herprint once.
- [x] Canonical and metadata rendering remain intact.
- [x] GA4 measurement tag remains present.

## Product QA

One ring, necklace, earring, and bracelet were tested.

- [x] Exactly one meaningful H1 matching each product title.
- [x] Price, inventory display, image gallery, quantity, and accordions remain intact.
- [x] Product JSON-LD contains offers with price, currency, and availability on all four samples.
- [x] Add to cart succeeds on the bracelet sample using the shared product template.
- [x] Cart drawer succeeds and the test item was removed.
- [ ] Checkout page: the button renders, but Shopify exits draft-theme preview at checkout. Test immediately after publication; do not purchase.

## Release Gate

- [x] Save desktop/mobile screenshots, product screenshots, browser results, and refreshed source hashes.
- [x] Record rollback theme `141871349952` and the four source assets.
- [ ] Obtain explicit human approval immediately before publication.
- [ ] Publish the duplicate theme without bundling unrelated work.
- [ ] Run the production smoke test and add a changelog entry in `/Users/xiaowen/HerprintSEO/docs/seo/changelog.json`.
