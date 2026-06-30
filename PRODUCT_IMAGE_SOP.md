# Herprint — Product Image Naming SOP

Standard operating procedure for naming, organizing, and mapping product photos to
Shopify when bulk-uploading products.

## 1. Folder structure

```
herprint_product_materials/
├─ Product/
│  ├─ NC/   ← Necklaces
│  ├─ ER/   ← Earrings
│  ├─ BC/   ← Bracelets
│  └─ RG/   ← Rings
└─ BG/      ← Background / scene images (NOT products — ignore for upload)
```

Each product lives in its own numbered folder: `{CAT}_{NN}` (e.g. `RG_01`, `NC_06`).
A `_X` suffix on the folder (e.g. `RG_08_X`) marks a product that has **no `ON`
(worn) shot** — white/studio photos only. *(observed convention)*

## 2. Category prefixes

| Prefix | Category   |
|--------|------------|
| `NC`   | Necklace   |
| `ER`   | Earring    |
| `BC`   | Bracelet   |
| `RG`   | Ring       |

## 3. Photo-type suffixes

There are two top-level photo types — **`W`** (white/studio) and **`ON`** (worn):

| Suffix | Meaning                         | Typical Shopify use                         |
|--------|---------------------------------|---------------------------------------------|
| `W`    | Basic white-background / studio | **Primary photo** (default)                 |
| `ON`   | Worn / "on" the model           | Secondary "step" photos — how it looks worn |

**`whole` and `detail` are sub-types *under* `W`** (not standalone types) — they
describe which kind of white/studio shot it is, written as `W_whole` / `W_detail`:

| Sub-type     | Meaning                  | Use                                       |
|--------------|--------------------------|-------------------------------------------|
| `W_whole`    | Full / whole studio view | Standard primary                          |
| `W_detail`   | Close-up studio view     | **Primary when present** (preferred over `W_whole`) |

All combine with a sequence number, e.g.
`RG_01_ON_01.jpg`, `BC_02_W_detail.jpg`, `BC_02_W_whole.jpg`, `NC_07_ON_09.jpg`.
A plain `W` with no sub-type (e.g. `RG_01_W.jpg`) is just the studio shot.

## 4. Primary-image selection priority

When choosing the **primary** (main) image for a product, in order:

1. **`W_detail`** (close-up studio shot) — if it exists, it is the primary.
2. **`W_whole`** / plain **`W`** (studio shot) — otherwise the primary.
3. **`ON`** worn shots are **never primary** — they follow as the step/lifestyle
   images, in numeric order (`ON_01`, `ON_02`, …).

Both `W` sub-types are studio shots, so a product with `W_detail` + `W_whole` uses
`W_detail` as primary and `W_whole` as the next image; `ON` shots come after.

## 5. Shopify mapping (CSV import)

- `Image Position 1` = the primary per §4.
- `Image Position 2+` = remaining shots: any other studio/whole views first, then
  `ON` worn shots in numeric order.
- `Image Src` uses the Shopify Files CDN URL (predictable, no version param needed):
  `https://cdn.shopify.com/s/files/1/0688/1437/3056/files/<FILENAME>`
- Images must be uploaded to **Shopify admin → Content → Files** before import
  (the ShopMCP connector cannot upload binary images; `create_product` /
  `update_product` have no image field).

## 6. Quick examples

| Folder        | Files                                  | Primary            | Then…                    |
|---------------|----------------------------------------|--------------------|--------------------------|
| `RG_01`       | `RG_01_W`, `RG_01_ON_01..05`           | `RG_01_W`          | `RG_01_ON_01..05`        |
| `RG_08_X`     | `RG_08_W`                              | `RG_08_W`          | —                        |
| `BC_02_X`     | `BC_02_W_detail`, `BC_02_W_whole`      | `BC_02_W_detail`   | `BC_02_W_whole`          |
| `NC_07`       | `NC_07_W`, `NC_07_ON_01..09`           | `NC_07_W`          | `NC_07_ON_01..09`        |
