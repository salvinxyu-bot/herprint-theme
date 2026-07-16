# Stage 3 Shop All Remote QA

Date: 2026-07-16

## Theme Boundary

- Previous live theme: `154908491968` (`Dawn - Stage 2 SEO QA 2026-07-16`)
- Published theme: `154911768768` (`Dawn - Stage 3 Shop All QA 2026-07-16`)
- Published theme role: live
- Preview: `https://15icsx-ru.myshopify.com?preview_theme_id=154911768768`
- Production theme after release: `154911768768`
- Shopify Admin collection and redirect operations: completed and verified
- Publication: performed after explicit human approval
- Forced cache-refresh switch: `154908491968` published temporarily, then `154911768768` immediately republished after explicit human approval

## File Integrity

The QA theme was duplicated from the current live theme. Before upload, both
remote source files matched the proposal's preserved source hashes. After
upload, both remote files were pulled back and matched the proposal exactly.

| File | Remote source SHA-256 | Remote pullback SHA-256 | Result |
| --- | --- | --- | --- |
| `layout/theme.liquid` | `a657b3d81ce70eb318a82fe7ba95da73fc4eb3b1643f73e8bf78285f1bc5802b` | `8329e3988e6807ee4b7b17e3a8489da6d56ad6f24f4dd4571b30f210444378c1` | Exact match |
| `sections/main-collection-banner.liquid` | `20eca13abf715d2cd2ffa75e864daeb29e5e61c6616808a6e12d641d7ed36810` | `797c77088a98c150ead5e11dc566687b041255a50bea6b67c278ce6a62fe6860` | Exact match |

## Shopify Admin Operations

- Collection `352250527936` (`/collections/all-product`) was removed from the Online Store channel without deletion. The route returned 404 before redirect creation.
- Redirect `437585281216` now sends `/collections/all-product` to `/collections/all`.
- Collection `328963981504` (`/collections/frontpage`) was removed from the Online Store channel without deletion. The route returned 404 before redirect creation.
- Redirect `437585313984` now sends `/collections/frontpage` to `/collections/all`.
- Collection `347464892608` was renamed from `Necklace` to `Necklaces`; its handle remains `/collections/necklace`.
- Both old routes return Shopify-native 301 responses and finish at a 200 response on `/collections/all`.
- `/collections/necklace` returns 200 with title and H1 `Necklaces` and a self-canonical URL.

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
- Post-operation QA confirmed both redirects inside the unpublished Stage 3 preview.
- Post-operation QA confirmed `Necklaces` in the unpublished Stage 3 preview with the unchanged `/collections/necklace` canonical.
- Production now serves theme `154911768768`.

## Production Release

- Shopify CLI publication of theme `154911768768` succeeded.
- A live pullback after publication matched both approved proposal files byte-for-byte.
- Homepage, sampled product, `/collections/necklace`, `/collections/all?page=1`, and `/collections/all?sort_by=best-selling` passed production smoke QA and served the Stage 3 theme asset revision.
- `/collections/all-product` and `/collections/frontpage` retained their Shopify-native 301 redirects to `/collections/all`.
- The exact canonical root `/collections/all` returns HTTP 200 and a self-canonical URL, but its HTML remains the prior `Products` rendering with no Stage 3 description and the prior theme asset revision.
- A direct request to Shopify's origin reports live theme `154911768768` in `server-timing` while returning ETag `W/\"page_cache:68814373056:CollectionDetailsController:53a4db53dea8c2aafeacc81cb8505b70\"` and the stale `t/4` assets.
- Publishing the Stage 2 theme temporarily and immediately republishing Stage 3 did not invalidate this route-specific Shopify page cache.
- Stage 3 remains live because no commerce, canonical, redirect, analytics, product, or non-`all` collection regression was found. No unsupported content mutation was used to force invalidation.

## Evidence

- `evidence/browser-qa.json`
- `evidence/admin-operations.json`
- `evidence/production-release.json`
- `evidence/shop-all-desktop-1440x900.png`
- `evidence/shop-all-mobile-390x844.png`

## Remaining Follow-Up

1. Recheck the exact `/collections/all` path until Shopify's route page cache serves the Stage 3 output.
2. Escalate to Shopify Support with `evidence/production-release.json` if the stale page cache persists.
3. Do not touch collection content solely to force cache invalidation without a separate approved change plan.
