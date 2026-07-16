# Stage 2 Theme Semantics Proposal

Status: **duplicate-theme QA passed; publication pending human approval**.

The four exact assets were pulled again from the current live Dawn theme on
2026-07-16. Their hashes still match the committed 2026-07-11 baseline, and the
deterministic verifier passed against the refreshed source. Only the four
manifest files were uploaded to unpublished theme `154908491968`, named
`Dawn - Stage 2 SEO QA 2026-07-16`. The published theme remains unchanged.

## Scope

The package contains four files and no visible copy, layout, product, cart, or
analytics change:

- `sections/header.liquid`: demote two homepage logo wrappers from H1 to div.
- `sections/herprint-eclat.liquid`: promote the existing visible tagline from p to H1.
- `sections/main-product.liquid`: promote the existing product title from H2 to H1.
- `layout/theme.liquid`: compare `page_title` and `shop.name` in lowercase before appending the brand suffix.

The expected homepage H1 remains the existing tagline:

`Jewelry that marks your every becoming.`

## Deterministic Verification

Run:

```bash
node verify.js
```

The verifier reconstructs every proposal file from the source using only the
approved transformations. It fails if the source has drifted or the proposal
contains an unrelated difference.

After refreshing the current live files, run:

```bash
HERPRINT_LIVE_THEME_SOURCE=/path/to/new-live-snapshot node verify.js
```

Do not bypass a failure. Rebuild the proposal from the refreshed files.

## Release State

Completed:

1. Restored dedicated Theme Access authentication without storing a password in Git.
2. Confirmed live theme `141871349952` and pulled the four exact assets.
3. Re-ran `verify.js` against the refreshed snapshot with a PASS result.
4. Created unpublished duplicate theme `154908491968`.
5. Applied only the four manifest files and pulled them back for byte-for-byte comparison.
6. Passed desktop/mobile homepage and four-category product browser QA.

Remaining:

1. Review the unpublished preview and record explicit human approval immediately before publication.
2. Publish only after that approval.
3. Run the production smoke test, including checkout handoff, then save the release evidence and SEO changelog entry.

See `manifest.json` for source and proposal hashes, prohibited changes, and the
release gates.
