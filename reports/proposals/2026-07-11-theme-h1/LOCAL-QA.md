# Stage 2 QA Report

Date: 2026-07-16
Status: published; production smoke QA passed

## Scope

Previous published theme and rollback point:

- Name: `Dawn`
- Theme ID: `141871349952`
- Current role: unpublished
- Refreshed source: `/Users/xiaowen/Documents/Codex/2026-07-05/rug/work/stage2-theme/current-live-2026-07-16`

Released theme:

- Name: `Dawn - Stage 2 SEO QA 2026-07-16`
- Theme ID: `154908491968`
- Current role: live
- Published after explicit human approval on 2026-07-16

Only these files were uploaded to the QA theme:

- `layout/theme.liquid`
- `sections/header.liquid`
- `sections/herprint-eclat.liquid`
- `sections/main-product.liquid`

No additional asset upload was bundled with publication.

## Source And Remote Verification

The four current-live files were pulled on 2026-07-16. Their SHA-256 hashes
match both `manifest.json` and the committed live-theme backup at commit
`274c9e1`.

`HERPRINT_LIVE_THEME_SOURCE=<current-live-snapshot> node verify.js` returned
`PASS` for all four files and all nine approved transformations.

After upload, the same four assets were pulled back from theme `154908491968`.
Every remote file is byte-for-byte identical to the proposal. `--nodelete` and
four explicit `--only` arguments prevented unrelated asset changes.

## Browser QA

Homepage desktop and 390 x 844 mobile checks passed:

- exactly one H1: `Jewelry that marks your every becoming.`;
- title: `Dainty Jewelry & Meaningful Gifts | Herprint`;
- canonical: `https://herprint.co/`;
- GA4 measurement ID `G-S39ZQ2J52F` remains present;
- desktop navigation, sticky navigation, mobile menu, hero buttons, and responsive layout remain usable;
- no heading, button, or navigation overlap was observed.

One product from each category was tested:

- ring: `/products/minimalist-gold-baguette-solitaire-ring`
- necklace: `/products/dainty-silver-green-heart-crystal-necklace`
- earrings: `/products/earthy-mustard-resin-wood-square-drop-earrings`
- bracelet: `/products/dainty-silver-green-heart-crystal-bracelet`

All four pages have exactly one product-title H1, a self-referencing canonical,
one `Product` JSON-LD object, and an offer with price, currency, and
availability. Product titles, prices, images, quantity controls, details,
shipping controls, and Add to cart controls rendered normally.

Add to cart and the cart drawer were exercised successfully on the bracelet
sample, then the test item was removed. The checkout button rendered, but
Shopify exits the unpublished theme preview at checkout; checkout-page smoke QA
is therefore a required immediate post-publication step. No purchase was made.

Screenshots and machine-readable results are stored in `evidence/`.

## Theme Check Comparison

| Theme copy | Errors | Warnings | New findings from this proposal |
| --- | ---: | ---: | ---: |
| Baseline | 6 | 25 | n/a |
| Candidate | 6 | 25 | 0 |

The six baseline errors are outside this proposal and remain documented as
pre-existing work. This package adds no Theme Check finding.

## Production Release Result

The approved theme was published and independently confirmed as live by a
fresh Shopify theme-list request. The former live theme remains unpublished as
the rollback point.

Production smoke QA passed:

1. True live mode was confirmed with no Shopify preview bar.
2. Desktop and 390 x 844 mobile homepage layouts passed visual inspection.
3. The homepage has one meaningful H1, the expected title and canonical, and the GA4 tag.
4. Ring, necklace, earrings, and bracelet samples each have one product H1, a self-canonical, and valid Product offer fields.
5. Add to cart and the cart drawer passed.
6. Checkout opened and rendered contact, delivery, shipping, and payment sections.
7. No customer or payment information was entered, no purchase was made, and the test item was removed.
8. The four new-live assets were pulled again and match the proposal byte-for-byte.

Production screenshots and structured results are stored in `evidence/` and
the release is recorded in `/Users/xiaowen/HerprintSEO/docs/seo/changelog.json`.
