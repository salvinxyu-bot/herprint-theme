# Stage 3 Shop All Theme Proposal

Date: 2026-07-16
Status: unpublished duplicate-theme QA passed; production untouched

## Purpose

This two-file proposal gives Shopify's fixed `/collections/all` route a useful
search title, meta description, visible H1, and concise collection introduction.
It does not change the URL, canonical, product set, sorting, filtering, layout,
CSS, JavaScript, analytics, or commerce behavior.

## Proposed Output

| Element | Current production | Proposed |
| --- | --- | --- |
| Search title | `Products – herprint` | `Dainty Jewelry: Rings, Necklaces & More – herprint` |
| Meta description | Missing | `Shop Herprint's collection of dainty rings, necklaces, earrings, and bracelets for everyday wear, thoughtful gifts, and meaningful moments online.` |
| Visible H1 | `Products` | `All Jewelry` |
| Introduction | Missing | `Explore Herprint's dainty rings, necklaces, earrings, and bracelets for everyday moments, thoughtful gifts, quiet celebrations, and every chapter of becoming.` |

The meta description is 146 characters. The visible introduction is 20 words.
Neither statement introduces a material, manufacturing, shipping, duties, or
handmade claim.

## Files

- `layout/theme.liquid`: overrides title, description, Open Graph title, and Open Graph description only when the page is the built-in `all` collection.
- `sections/main-collection-banner.liquid`: overrides the rendered collection heading and introduction only when `collection.handle == 'all'`.

Exact source files are preserved in `source/`. Run `node verify.js` to prove
that the proposal contains only the approved transformations.

## Remote QA Result

The proposal was applied to unpublished theme `154911768768`, named
`Dawn - Stage 3 Shop All QA 2026-07-16`. Both files were pulled back from
Shopify and matched the proposal byte-for-byte. Desktop and 390 x 844 mobile
browser QA passed, including metadata, the visible H1 and introduction,
pagination, sorting, filtering, product cards, add to cart, the cart drawer,
and regression checks on the homepage, a product page, and `/collections/rings`.

See `REMOTE-QA.md` and `evidence/browser-qa.json` for the recorded checks.

## Release Boundary

This package is not a publication instruction. Before release:

1. Complete the separately approved Shopify Admin operations for `/collections/all-product`, `/collections/frontpage`, and the visible `Necklace` collection title.
2. Recheck the tested unpublished theme after those operations.
3. Obtain explicit human approval immediately before publication.
4. Publish only theme `154911768768`.
5. Run production smoke QA and update the SEO changelog.
