# Stage 3 Shop All QA Checklist

Status: proposal validation in progress; production untouched

## Source Gate

- [x] Source `layout/theme.liquid` matches the post-Stage-2 live pullback hash.
- [x] Source `main-collection-banner.liquid` is preserved from the tested duplicate-theme source.
- [x] Proposal is limited to two files.
- [x] Deterministic verifier passes.
- [x] Full-theme check matches the source baseline: 31 existing findings, no new offense.
- [ ] Refresh both files from the current live theme immediately before remote QA.

## Content Gate

- [x] H1 is `All Jewelry` only on `/collections/all`.
- [x] Search title names the four stocked product families without stuffing.
- [x] Meta description is 146 characters.
- [x] Introduction is 20 words.
- [x] No unsupported material, manufacturing, shipping, duties, or handmade claim.

## Duplicate-Theme Gate

- [ ] Create or refresh an unpublished QA theme from the current live theme.
- [ ] Upload only `layout/theme.liquid` and `sections/main-collection-banner.liquid`.
- [ ] Pull both remote files back and compare byte-for-byte.
- [ ] Confirm homepage, product, and non-`all` collection metadata remain unchanged.
- [ ] Confirm `/collections/all` title, meta, H1, canonical, Open Graph fields, and introduction.
- [ ] Confirm pagination, sort, filter, product cards, add to cart, and cart drawer.
- [ ] Save desktop and 390 x 844 mobile screenshots.

## Release Gate

- [ ] Complete and snapshot the Shopify Admin URL/indexability operations.
- [ ] Obtain explicit human approval immediately before publication.
- [ ] Publish only the tested duplicate theme.
- [ ] Run production smoke QA and update the SEO changelog.
