# Stage 2 Production Release

Date: 2026-07-16
Status: complete

## Publication

- Store: `15icsx-ru.myshopify.com`
- Published theme: `Dawn - Stage 2 SEO QA 2026-07-16` (`154908491968`)
- Rollback theme: `Dawn` (`141871349952`, unpublished)
- Approval: explicit human approval recorded immediately before publication
- Publication command changed the remote theme role only; it did not upload files

## Production Smoke

- True live storefront confirmed without a preview bar.
- Homepage desktop 1440 x 900 and mobile 390 x 844: PASS.
- Homepage H1, title, canonical, meta description, and GA4: PASS.
- Ring, necklace, earrings, and bracelet samples: PASS for unique H1, canonical, Product JSON-LD, offer price/currency/availability, and enabled Add to cart.
- Add to cart and cart drawer: PASS.
- Checkout handoff: PASS; the checkout page rendered contact, delivery, shipping, and payment sections.
- No customer or payment data was entered and no purchase was made.
- Test cart item removed: PASS.

## Integrity And Rollback

The four assets were pulled from the new live theme after publication. Every
file is byte-for-byte identical to the approved proposal:

- `layout/theme.liquid`
- `sections/header.liquid`
- `sections/herprint-eclat.liquid`
- `sections/main-product.liquid`

Rollback is available by republishing theme `141871349952`. No rollback was
required because all release checks passed.

Machine-readable results and live screenshots are stored in `evidence/`.
