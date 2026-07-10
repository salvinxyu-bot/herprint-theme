'use strict';
const path = require('path');
const os = require('os');

// .env lives in the root workspace (~/.env): ANTHROPIC_API_KEY, HTTPS_PROXY,
// SHOPIFY_SHOP_DOMAIN, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION
require('dotenv').config({ path: path.join(os.homedir(), '.env') });

const HOME = os.homedir();

module.exports = {
  shop: process.env.SHOPIFY_SHOP_DOMAIN || '15icsx-ru.myshopify.com',
  apiVersion: process.env.SHOPIFY_API_VERSION || '2026-04',
  token: process.env.SHOPIFY_ADMIN_TOKEN || '',
  // Dev Dashboard apps (post-2026) mint a token from client id + secret instead
  // of a static shpat_. If these are set and `token` is empty, the client uses them.
  clientId: process.env.SHOPIFY_CLIENT_ID || '',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  proxy: process.env.https_proxy || process.env.HTTPS_PROXY || '',
  vendor: 'herprint',

  paths: {
    materials: path.join(HOME, 'Documents/herprint_product_materials/Product'),
    repo: path.join(HOME, 'Herprintwebbuilding'),
    generated: path.join(__dirname, 'generated'),
    manifest: path.join(__dirname, 'manifest.json'),
  },

  // Folder prefix -> Shopify product_type + variant options.
  // options:null => single default variant (one-size). Edit values to taste.
  categories: {
    RG: { type: 'Rings',     options: { name: 'Size',   values: ['6', '7', '8'] } },
    NC: { type: 'Necklaces', options: { name: 'Length', values: ['40cm', '45cm'] } },
    BC: { type: 'Bracelets', options: null },
    ER: { type: 'Earrings',  options: null },
  },

  // Reference price bands per category (copy JSON sets the actual price; used for validation warnings).
  priceBands: {
    RG: [49.9, 59.9, 69.9],
    NC: [54.9, 64.9, 74.9],
    BC: [49.9, 54.9, 59.9],
    ER: [39.9, 49.9, 59.9],
  },

  defaultInventory: 50,
  metafield: { namespace: 'custom', key: 'details', type: 'list.single_line_text_field' },

  // category prefix -> collection handle (for post-run verification only)
  collectionHandles: { RG: 'rings', NC: 'necklace', BC: 'bracelets', ER: 'earrings' },
};
