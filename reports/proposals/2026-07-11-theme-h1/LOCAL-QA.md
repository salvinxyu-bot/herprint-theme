# Stage 2 QA Report

Date: 2026-07-16
Status: duplicate-theme QA passed; publication pending human approval

## Scope

Current published theme:

- Name: `Dawn`
- Theme ID: `141871349952`
- Refreshed source: `/Users/xiaowen/Documents/Codex/2026-07-05/rug/work/stage2-theme/current-live-2026-07-16`

Unpublished QA theme:

- Name: `Dawn - Stage 2 SEO QA 2026-07-16`
- Theme ID: `154908491968`
- Preview: `https://15icsx-ru.myshopify.com?preview_theme_id=154908491968`

Only these files were uploaded to the QA theme:

- `layout/theme.liquid`
- `sections/header.liquid`
- `sections/herprint-eclat.liquid`
- `sections/main-product.liquid`

The live theme was not modified or published.

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

## Remaining Release Gate

1. Human reviews the unpublished preview.
2. Human gives explicit approval immediately before publication.
3. Publish the already-tested duplicate theme without adding other changes.
4. Immediately verify production homepage/product H1s, GA4, add to cart, cart, and checkout handoff.
5. Save the previous live theme as the rollback reference and add the production release to `/Users/xiaowen/HerprintSEO/docs/seo/changelog.json`.
