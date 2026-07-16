# Stage 3 Shop All Remote QA

Date: 2026-07-16

## Theme Boundary

- Source/live theme: `154908491968` (`Dawn - Stage 2 SEO QA 2026-07-16`)
- QA theme: `154911768768` (`Dawn - Stage 3 Shop All QA 2026-07-16`)
- QA theme role: unpublished
- Preview: `https://15icsx-ru.myshopify.com?preview_theme_id=154911768768`
- Production theme after QA: unchanged at `154908491968`
- Shopify Admin collection and redirect operations: not performed
- Publication: not performed

## File Integrity

The QA theme was duplicated from the current live theme. Before upload, both
remote source files matched the proposal's preserved source hashes. After
upload, both remote files were pulled back and matched the proposal exactly.

| File | Remote source SHA-256 | Remote pullback SHA-256 | Result |
| --- | --- | --- | --- |
| `layout/theme.liquid` | `a657b3d81ce70eb318a82fe7ba95da73fc4eb3b1643f73e8bf78285f1bc5802b` | `8329e3988e6807ee4b7b17e3a8489da6d56ad6f24f4dd4571b30f210444378c1` | Exact match |
| `sections/main-collection-banner.liquid` | `20eca13abf715d2cd2ffa75e864daeb29e5e61c6616808a6e12d641d7ed36810` | `797c77088a98c150ead5e11dc566687b041255a50bea6b67c278ce6a62fe6860` | Exact match |

## Browser QA

- `/collections/all` title, meta description, canonical, Open Graph title and description, visible H1, and introduction matched the proposal.
- The accessible H1 is `Collection: All Jewelry`; the `Collection:` prefix is visually hidden by the Dawn theme, leaving visible text `All Jewelry`.
- Page 1 rendered 16 product cards, filtering, sorting, and a working page 2 link.
- Page 2 rendered 16 product cards with the correct page-specific title and canonical.
- Sorting changed to `price-ascending` and updated the URL without breaking the grid.
- Mobile QA at 390 x 844 had no horizontal overflow and retained the H1, introduction, filter/sort control, and 16 product cards.
- Homepage metadata, H1, canonical, and GA4 measurement remained present.
- `/collections/rings` retained its existing title, H1, canonical, and product grid; the Stage 3 override did not apply.
- The sampled product retained its title, description, H1, canonical, Product JSON-LD, and add-to-cart control.
- Add to cart, the cart drawer, and the checkout button worked. The test item was removed and the cart returned to empty.

## Evidence

- `evidence/browser-qa.json`
- `evidence/shop-all-desktop-1440x900.png`
- `evidence/shop-all-mobile-390x844.png`

## Remaining Gates

1. Approve and complete the separate Shopify Admin URL/indexability operations.
2. Recheck the unpublished theme after those operations.
3. Obtain explicit human approval immediately before publication.
4. Publish only theme `154911768768` and run production smoke QA.
