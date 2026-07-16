# Stage 2 Local QA Report

Date: 2026-07-16
Status: local preflight passed; Shopify release blocked

## Scope

The candidate was assembled from the committed live-theme backup at:

`/Users/xiaowen/Herprintwebbuilding/live-theme-backups/2026-07-11-dawn-live`

Baseline commit: `274c9e1`

Only these files differ from that baseline:

- `layout/theme.liquid`
- `sections/header.liquid`
- `sections/herprint-eclat.liquid`
- `sections/main-product.liquid`

No Shopify theme was created, modified, or published during this QA pass.

## Deterministic Verification

`node verify.js` returned `PASS` for all four files and all nine approved transformations. The source and proposal SHA-256 values match `manifest.json`.

The verifier rejects:

- a changed source file;
- an unapproved proposal change;
- a missing or extra approved transformation.

## Semantic Checks

- Header logo wrappers use `div`, so the site logo no longer creates a homepage `h1`.
- The homepage tagline uses `h1` in `herprint-eclat.liquid`.
- Product titles use `h1` in both title rendering branches in `main-product.liquid`.
- The document title compares a downcased page title with a downcased shop name before appending the brand, preventing case-only duplicate brand suffixes.

Rendered-page H1 counts still require duplicate-theme browser QA because Shopify template composition and merchant settings are dynamic.

## Theme Check Comparison

Shopify Theme Check was run against the baseline and the assembled candidate.

| Theme copy | Errors | Warnings | New findings from this proposal |
| --- | ---: | ---: | ---: |
| Baseline | 6 | 25 | n/a |
| Candidate | 6 | 25 | 0 |

The six baseline errors are in files outside this proposal:

- `sections/page-story.liquid`: 1 missing image height
- `sections/story-profiles.liquid`: 1 missing image height
- `snippets/header-mega-menu.liquid`: 2 missing image heights
- `sections/featured-product.liquid`: 2 missing schema translations

Existing warnings in touched files are unchanged: three remote-asset warnings in `herprint-eclat.liquid`, nine pre-existing warnings in `main-product.liquid`, and one pre-existing undefined-object warning in `theme.liquid`.

## Release Gate

Do not upload these files until all of the following are complete:

1. Restore Shopify CLI authentication for `15icsx-ru.myshopify.com`.
2. Pull the four target files again from the current published theme.
3. Run `verify.js` against that fresh source and resolve any source-hash drift before proceeding.
4. Apply the four-file proposal to a duplicate unpublished theme.
5. Complete the homepage and ring, necklace, earring, and bracelet checks in `QA-CHECKLIST.md` on desktop and mobile.
6. Obtain explicit human approval before publishing.

The current CLI request returns HTTP 401, so the fresh-source and duplicate-theme gates remain open.
