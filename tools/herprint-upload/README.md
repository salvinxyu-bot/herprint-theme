# Herprint product uploader (Shopify Admin API)

Hands-off product upload: one command creates products **with images, prices, variants,
inventory, SEO, alt text, and a `Details` metafield, and publishes them to the Online
Store** — no manual Files upload / CSV import / channel-publish.

Copy is written in **session mode** (Claude Code) to `generated/<handle>.json`; this
script only reads those files and talks to Shopify. It does **not** use any Anthropic API key.

## One-time setup
1. Shopify admin → Settings → Apps → **Develop apps → Create app** ("Herprint Uploader").
2. Configure Admin API scopes:
   `write_products, read_products, write_files, write_inventory, read_inventory,
   read_locations, write_publications, read_publications,
   write_metafield_definitions, read_metafield_definitions`
3. Install the app → reveal the **Admin API access token** (`shpat_…`).
4. Add to `~/.env` (already gitignored):
   ```
   SHOPIFY_SHOP_DOMAIN=15icsx-ru.myshopify.com
   SHOPIFY_ADMIN_TOKEN=shpat_xxxxxxxx
   SHOPIFY_API_VERSION=2024-10
   # optional: only if the Online Store channel isn't auto-detected (e.g. localized admin)
   # SHOPIFY_PUBLICATION_ID=gid://shopify/Publication/xxxx
   ```
   (Location id + Online Store publication id are auto-detected; the publication
   lookup is locale-aware, incl. "在线商店". If it can't find it, the error lists every
   publication + id so you can set `SHOPIFY_PUBLICATION_ID`.)
   Requires **Node 18+** (uses global `fetch`/`FormData`/`Blob`).

## Workflow
**1. Copy (in Claude Code):** point Claude at a category/folder; it reads each `_W` image
and writes `generated/<handle>.json`. Schema:
```json
{ "handle":"", "category":"RG|NC|BC|ER", "baseId":"RG_01", "title":"",
  "storyHtml":"<p>lead</p><p><em>tagline</em></p>", "detailsBullets":["…"],
  "tags":["…"], "productType":"Rings", "price":59.9,
  "seo":{"title":"","description":""}, "alt":"", "options":{"name":"Size","values":["6","7","8"]} }
```
`options` is optional (defaults from `config.js` per category).

**2. Upload (the script):**
```bash
node tools/herprint-upload/upload.js <target> [--dry] [--mode=create|update] [--only=<handle>] [--limit=N]
```
- `<target>`: `all | RG|NC|BC|ER | rings|necklaces|bracelets|earrings`
- `--dry`: print the plan, no token/writes needed
- `--mode=create` (default) skips existing handles; `--mode=update` overwrites them
- `--remedia`: also re-upload images on `--mode=update` (default preserves existing media)
- `--only=<handle>` / `--limit=N`: scope a test run

## Examples
```bash
node tools/herprint-upload/upload.js rings --dry            # preview
node tools/herprint-upload/upload.js --only=<handle> --limit=1   # live-test ONE product
node tools/herprint-upload/upload.js all                    # full catalog
node tools/herprint-upload/upload.js earrings --mode=update # re-apply copy/price changes
```

## Per-product info sheet (optional)
Want to set prices/names/sizes yourself for a batch? Copy `product-info.template.csv`
to `product-info.csv`, fill one row per product, and the copy step reads it as
**overrides** — any blank cell falls back to the smart default.

| column | blank → default | example |
|--------|-----------------|---------|
| `baseId` | *required* — maps to the image folder + category | `RG_07` |
| `name` | auto-generated title | `Lucky Gourd Pink Necklace` |
| `price` | category band | `64.90` |
| `metal` | inferred from photo | `gold` / `silver` / `resin` |
| `color` | inferred from photo | `pink` |
| `sizes` | category default (RG 6/7/8, NC 40/45cm, BC·ER one-size) | `6,7,8` or `one-size` |
| `inventory` | 50 | `30` |
| `notes` | — | free hints for copy (motif, naming, materials) |

Delete the EXAMPLE rows in the template before use. You only need rows for products
you want to customize — anything not listed is generated entirely from its photo.

## Files
- `config.js` — shop, categories, variant options, price bands, SKU/metafield config, paths
- `lib/shopify.js` — Admin GraphQL client (proxy + THROTTLED backoff) + product/media/inventory/publish helpers
- `lib/images.js` — SOP-ordered image discovery (`W_detail > W_whole > W`, then `ON_*`)
- `lib/copy.js` — load/validate `generated/*.json`
- `upload.js` — orchestrator (dedupe → stage media → productSet → inventory → publish → manifest)
- `generated/*.json` — per-product copy (editable; re-run to re-apply)
- `manifest.json` — `baseId → {productId, handle, variantIds}` (idempotency/resume)

## Notes
- Idempotent: dedupes by handle; `--mode=update` edits in place (no duplicates).
- Images: includes **all** on-model shots found (NC_06/NC_07 have ~10) — prune in admin or cap in `lib/images.js` if desired.
- Token is product-scoped; theme edits still go through ShopMCP.
- `seed-from-csv` was used once to backfill `generated/*.json` from the original import CSVs.
