# Stage 3 Shop All QA Checklist

Status: Stage 3 published; production smoke passed except Shopify page cache on exact `/collections/all`

## Source Gate

- [x] Source `layout/theme.liquid` matches the post-Stage-2 live pullback hash.
- [x] Source `main-collection-banner.liquid` is preserved from the tested duplicate-theme source.
- [x] Proposal is limited to two files.
- [x] Deterministic verifier passes.
- [x] Full-theme check matches the source baseline: 31 existing findings, no new offense.
- [x] Refresh both files from the current live theme immediately before remote QA.

## Content Gate

- [x] H1 is `All Jewelry` only on `/collections/all`.
- [x] Search title names the four stocked product families without stuffing.
- [x] Meta description is 146 characters.
- [x] Introduction is 20 words.
- [x] No unsupported material, manufacturing, shipping, duties, or handmade claim.

## Duplicate-Theme Gate

- [x] Create or refresh an unpublished QA theme from the current live theme.
- [x] Upload only `layout/theme.liquid` and `sections/main-collection-banner.liquid`.
- [x] Pull both remote files back and compare byte-for-byte.
- [x] Confirm homepage, product, and non-`all` collection metadata remain unchanged.
- [x] Confirm `/collections/all` title, meta, H1, canonical, Open Graph fields, and introduction.
- [x] Confirm pagination, sort, filter, product cards, add to cart, and cart drawer.
- [x] Save desktop and 390 x 844 mobile screenshots.

## Release Gate

- [x] Complete and snapshot the Shopify Admin URL/indexability operations.
- [x] Obtain explicit human approval immediately before publication.
- [x] Publish only the tested duplicate theme.
- [x] Pull the live files back and verify both hashes against the proposal.
- [x] Run production smoke QA and update the SEO changelog.
- [ ] Confirm Shopify's route page cache for exact `/collections/all` has refreshed to the Stage 3 output.

The final open item is a platform cache observation, not an unpublished file or
failed theme deployment. Query variants and the rest of the smoke-test set
already serve Stage 3. No collection content was mutated to force invalidation.
