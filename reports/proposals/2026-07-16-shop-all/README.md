# Stage 3 Shop All Theme Proposal

Date: 2026-07-16
Status: proposal ready; no production change authorized

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

## Release Boundary

This package is not a publication instruction. Before release:

1. Refresh both source files from the current live theme and rerun the verifier.
2. Apply the two files to an unpublished duplicate theme.
3. Preview `/collections/all` on desktop and mobile and test pagination, filtering, sorting, product cards, cart, and canonical output.
4. Obtain explicit human approval immediately before publication.
5. Handle `/collections/all-product`, `/collections/frontpage`, and the `Necklace` title as separately snapshotted Shopify Admin operations.
