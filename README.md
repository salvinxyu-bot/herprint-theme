# Herprint Theme

Source for the Herprint Shopify storefront (a customized [Dawn](https://github.com/Shopify/dawn) theme) plus a small utility for previewing the live theme.

## Repository layout

| Path | Description |
| --- | --- |
| `theme/` | Shopify theme source (sections, snippets, assets, templates). |
| `preview.js` | Captures full-page screenshots of key store pages from a theme preview. |
| `screenshots/` | Output folder for `preview.js`. |

## Preview screenshots

`preview.js` opens a set of store pages against a specific theme preview ID and
saves a full-page screenshot of each to `screenshots/`.

### Requirements

- [Node.js](https://nodejs.org/)
- [Playwright](https://playwright.dev/) with Chromium installed:

  ```bash
  npm install playwright
  npx playwright install chromium
  ```

- A local HTTP proxy listening on `127.0.0.1:7890` (see `proxy` in `preview.js`).

### Usage

```bash
node preview.js
```

Each run prints the URL it visits and the file it saves, for example:

```
→ 01-homepage  https://15icsx-ru.myshopify.com/?preview_theme_id=153670156480
  ✅ saved screenshots/01-homepage.png
```

To change which theme or pages are captured, edit the `THEME_ID`, `STORE`, and
`pages` values near the top of `preview.js`.
