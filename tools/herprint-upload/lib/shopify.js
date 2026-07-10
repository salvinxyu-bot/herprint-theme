'use strict';
const fs = require('fs');
const { randomUUID } = require('crypto');
const { setGlobalDispatcher, ProxyAgent } = require('undici');
const cfg = require('../config');

// Route all fetch traffic through the proxy (same pattern as ~/index.js).
if (cfg.proxy) setGlobalDispatcher(new ProxyAgent(cfg.proxy));

const ENDPOINT = `https://${cfg.shop}/admin/api/${cfg.apiVersion}/graphql.json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let _token = cfg.token || null;
let _tokenExp = 0;

// Returns a usable Admin API token. Prefers a static SHOPIFY_ADMIN_TOKEN (shpat_);
// otherwise mints one from SHOPIFY_CLIENT_ID/SECRET via the client_credentials grant
// (Dev Dashboard apps, post-2026) and caches it until shortly before it expires.
async function getToken() {
  if (cfg.token) return cfg.token;
  if (_token && Date.now() < _tokenExp - 60000) return _token;
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error(
      "No SHOPIFY_ADMIN_TOKEN, and no SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_SECRET to mint one. " +
      "Add the app's Client ID + Client Secret (from the Dev Dashboard) to ~/.env."
    );
  }
  const res = await fetch(`https://${cfg.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  let j = {};
  try { j = await res.json(); } catch {}
  if (!res.ok || !j.access_token) {
    throw new Error(`client_credentials token mint failed (HTTP ${res.status}): ${JSON.stringify(j).slice(0, 300)}`);
  }
  _token = j.access_token;
  _tokenExp = Date.now() + ((j.expires_in || 3600) * 1000);
  return _token;
}

// GraphQL with cost-aware retry on THROTTLED + transient network errors.
async function gql(query, variables = {}, attempt = 1) {
  const token = await getToken();
  let res, body;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    if (attempt <= 5) { await sleep(500 * attempt); return gql(query, variables, attempt + 1); }
    throw e;
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Shopify auth failed (HTTP ${res.status}). Check SHOPIFY_ADMIN_TOKEN and that the app has the required scopes.`);
  }
  try {
    body = await res.json();
  } catch (e) {
    if (!res.ok && attempt <= 5) { await sleep(500 * attempt); return gql(query, variables, attempt + 1); }
    throw new Error(`Shopify returned non-JSON (HTTP ${res.status}).`);
  }

  const throttled = (body.errors || []).some(
    (e) => (e.extensions && e.extensions.code) === 'THROTTLED'
  );
  if (throttled && attempt <= 6) {
    const need = body.extensions?.cost?.requestedQueryCost || 100;
    const avail = body.extensions?.cost?.throttleStatus?.currentlyAvailable || 0;
    const restore = body.extensions?.cost?.throttleStatus?.restoreRate || 50;
    const waitMs = Math.max(1000, Math.ceil(((need - avail) / restore) * 1000));
    await sleep(waitMs);
    return gql(query, variables, attempt + 1);
  }
  if (body.errors && body.errors.length) {
    throw new Error('GraphQL errors: ' + JSON.stringify(body.errors));
  }
  return body.data;
}

function userErr(payload, label) {
  const errs = (payload && payload.userErrors) || [];
  if (errs.length) throw new Error(`${label} userErrors: ` + JSON.stringify(errs));
  return payload;
}

// ---- lookups (cached) ----
let _locationId, _onlineStorePubId;

async function getLocationId() {
  if (_locationId) return _locationId;
  const d = await gql(`{ locations(first:1, query:"status:active") { nodes { id name } } }`);
  _locationId = d.locations.nodes[0]?.id;
  if (!_locationId) throw new Error('No active location found.');
  return _locationId;
}

async function getOnlineStorePublicationId() {
  if (_onlineStorePubId) return _onlineStorePubId;
  if (process.env.SHOPIFY_PUBLICATION_ID) {
    _onlineStorePubId = process.env.SHOPIFY_PUBLICATION_ID;
    return _onlineStorePubId;
  }
  const d = await gql(`{ publications(first:50) { nodes { id name } } }`);
  const nodes = d.publications.nodes;
  // Publication.name is locale-dependent (e.g. "在线商店" on a Chinese admin).
  const re = /online store|在线商店|온라인 스토어|boutique en ligne|tienda online|onlineshop|オンラインストア/i;
  const node = nodes.find((n) => re.test(n.name));
  _onlineStorePubId = node && node.id;
  if (!_onlineStorePubId) {
    throw new Error(
      'Online Store publication not auto-detected. Set SHOPIFY_PUBLICATION_ID in ~/.env to one of: ' +
      nodes.map((n) => `"${n.name}"=${n.id}`).join(' | ')
    );
  }
  return _onlineStorePubId;
}

async function productIdByHandle(handle) {
  const d = await gql(
    `query($q:String!){ products(first:1, query:$q){ nodes { id handle } } }`,
    { q: `handle:${handle}` }
  );
  const n = d.products.nodes[0];
  return n && n.handle === handle ? n.id : null;
}

// ---- media staged upload ----
async function stageUploads(files) {
  // files: [{ filename, mimeType }]
  const d = await gql(
    `mutation($input:[StagedUploadInput!]!){
       stagedUploadsCreate(input:$input){
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    {
      input: files.map((f) => ({
        filename: f.filename,
        mimeType: f.mimeType,
        resource: 'IMAGE',
        httpMethod: 'POST',
      })),
    }
  );
  userErr(d.stagedUploadsCreate, 'stagedUploadsCreate');
  return d.stagedUploadsCreate.stagedTargets;
}

async function uploadToTarget(target, filePath, mimeType) {
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  const buf = fs.readFileSync(filePath);
  form.append('file', new Blob([buf], mimeType ? { type: mimeType } : undefined), filePath.split('/').pop());
  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`staged upload failed (${res.status}) for ${filePath}`);
  return target.resourceUrl;
}

// ---- product write ----
const PRODUCT_SET = `
mutation productSet($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
  productSet(input: $input, identifier: $identifier, synchronous: true) {
    product {
      id handle
      variants(first: 50) { nodes { id sku title inventoryItem { id } } }
    }
    userErrors { field message }
  }
}`;

// identifier (2026-04+) targets create/update by {handle} (upsert) or {id}; this
// replaces the now-deprecated ProductSetInput.id.
async function productSet(input, identifier) {
  const d = await gql(PRODUCT_SET, { input, identifier: identifier || null });
  return userErr(d.productSet, 'productSet').product;
}

async function setInventory(items) {
  // items: [{ inventoryItemId, quantity }]
  // A freshly created variant's inventory item is NOT stocked at the location, so
  // inventorySetQuantities fails with ITEM_NOT_STOCKED_AT_LOCATION (removed only in
  // 2026-10). inventoryActivate connects the item to the location AND sets `available`.
  // As of 2026-04 inventoryActivate REQUIRES the @idempotent directive (runtime error
  // otherwise); the key is generated once per call and reused across gql() retries.
  const locationId = await getLocationId();
  for (const it of items) {
    const d = await gql(
      `mutation($id:ID!, $loc:ID!, $qty:Int, $key:String!){
         inventoryActivate(inventoryItemId:$id, locationId:$loc, available:$qty) @idempotent(key:$key){
           inventoryLevel { id }
           userErrors { field message }
         }
       }`,
      { id: it.inventoryItemId, loc: locationId, qty: it.quantity, key: randomUUID() }
    );
    userErr(d.inventoryActivate, 'inventoryActivate');
  }
  return true;
}

async function publishToOnlineStore(productId) {
  const pubId = await getOnlineStorePublicationId();
  const d = await gql(
    `mutation($id:ID!, $input:[PublicationInput!]!){
       publishablePublish(id:$id, input:$input){ userErrors { field message } }
     }`,
    { id: productId, input: [{ publicationId: pubId }] }
  );
  return userErr(d.publishablePublish, 'publishablePublish');
}

async function ensureDetailsMetafieldDefinition() {
  // idempotent: ignore "already exists" (TAKEN) error
  const d = await gql(
    `mutation($def: MetafieldDefinitionInput!){
       metafieldDefinitionCreate(definition:$def){
         createdDefinition { id }
         userErrors { field message code }
       }
     }`,
    {
      def: {
        name: 'Details',
        namespace: cfg.metafield.namespace,
        key: cfg.metafield.key,
        type: cfg.metafield.type,
        ownerType: 'PRODUCT',
        // NOTE: do NOT set `access` here. In 2024-10 the Admin API cannot set
        // storefront/admin access on a merchant-owned ("custom") namespace, and
        // `admin` would be required if `access` is present. Liquid reads the
        // metafield regardless of Storefront-API access, so this is unneeded.
      },
    }
  );
  const errs = d.metafieldDefinitionCreate.userErrors || [];
  const onlyTaken = errs.every((e) => e.code === 'TAKEN');
  if (errs.length && !onlyTaken) {
    throw new Error('metafieldDefinitionCreate: ' + JSON.stringify(errs));
  }
  return true;
}

module.exports = {
  gql, getLocationId, getOnlineStorePublicationId, productIdByHandle,
  stageUploads, uploadToTarget, productSet, setInventory, publishToOnlineStore,
  ensureDetailsMetafieldDefinition,
};
