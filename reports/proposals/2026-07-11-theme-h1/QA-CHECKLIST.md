# Stage 2 Duplicate-Theme QA

Status: **blocked until the current live source files are refreshed**.

## Source Gate

- [ ] Restore Shopify CLI access without pasting a token into chat or Git.
- [ ] Confirm the current live theme ID.
- [ ] Pull only `sections/header.liquid`, `sections/herprint-eclat.liquid`, `sections/main-product.liquid`, and `layout/theme.liquid` into a new timestamped snapshot.
- [ ] Run `HERPRINT_LIVE_THEME_SOURCE=<new-snapshot> node verify.js`.
- [ ] If verification fails, rebuild the proposal from the new source instead of forcing the old patch.

## Duplicate Theme

- [ ] Duplicate the current live theme in Shopify Admin.
- [ ] Record the duplicate theme ID and creation time.
- [ ] Apply only the four manifest files to the duplicate theme.
- [ ] Confirm no other asset changed.

## Homepage QA

- [ ] Desktop: exactly one meaningful H1 with the existing hero tagline.
- [ ] Mobile: exactly one meaningful H1 with no visual shift or duplicate heading.
- [ ] Header logo and navigation work in both logo positions used by the theme.
- [ ] Rendered title contains Herprint once.
- [ ] Canonical and meta description remain unchanged.
- [ ] GA4 measurement tag remains present.

## Product QA

Test one ring, necklace, earring, and bracelet.

- [ ] Exactly one meaningful H1 matching the product title.
- [ ] Price, variants, inventory state, image gallery, and accordions are unchanged.
- [ ] Product JSON-LD or ProductGroup JSON-LD still contains valid offers.
- [ ] Add to cart succeeds.
- [ ] Cart drawer or cart page succeeds.
- [ ] Checkout handoff opens correctly.

## Release Gate

- [ ] Save before screenshots, rendered source, and the four refreshed source hashes.
- [ ] Run the full SEO audit against the duplicate-theme preview when technically possible.
- [ ] Record rollback references for the previous live theme and four source assets.
- [ ] Obtain explicit human approval immediately before publication.
- [ ] After publication, run the full production audit and add a changelog entry in `/Users/xiaowen/HerprintSEO/docs/seo/changelog.json`.
