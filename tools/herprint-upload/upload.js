#!/usr/bin/env node
'use strict';
/*
 * Herprint hands-off product uploader (Shopify Admin API).
 *
 * Usage:
 *   node tools/herprint-upload/upload.js <target> [--dry] [--mode=create|update] [--only=<handle>] [--limit=N]
 *   <target> = all | RG|NC|BC|ER | rings|necklaces|bracelets|earrings
 *
 * Copy comes from generated/<handle>.json (written in Claude Code session mode).
 * --dry prints the planned product WITHOUT a token or any writes.
 */
const fs = require('fs');
const cfg = require('./config');
const copyLib = require('./lib/copy');
const images = require('./lib/images');

const ALIAS = { rings: 'RG', necklaces: 'NC', bracelets: 'BC', earrings: 'ER' };

function parseArgs(argv) {
  const a = { mode: 'create', dry: false, only: null, limit: 0, target: 'all' };
  for (const t of argv) {
    if (t === '--dry') a.dry = true;
    else if (t === '--json') a.json = true;
    else if (t === '--remedia') a.remedia = true;
    else if (t.startsWith('--mode=')) a.mode = t.split('=')[1];
    else if (t.startsWith('--only=')) a.only = t.split('=')[1];
    else if (t.startsWith('--limit=')) a.limit = parseInt(t.split('=')[1], 10) || 0;
    else if (!t.startsWith('--')) a.target = t;
  }
  a.category = a.target === 'all' ? null : (ALIAS[a.target.toLowerCase()] || a.target.toUpperCase());
  return a;
}

const skuBase = (baseId) => baseId.replace('_', '-'); // RG_01 -> RG-01

// Pure: build the ProductSetInput minus media (files added at upload time).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildBaseInput(c) {
  // Details bullets go in the description as a <ul>; the theme splits them into the
  // "Details" accordion. Avoids needing metafield-definition scopes.
  const ul = '<ul>' + c.detailsBullets.map((b) => `<li>${esc(b)}</li>`).join('') + '</ul>';
  const input = {
    handle: c.handle,
    title: c.title,
    descriptionHtml: c.storyHtml + '\n' + ul,
    vendor: cfg.vendor,
    productType: c.productType,
    status: 'ACTIVE',
    tags: c.tags,
    seo: { title: c.seo.title || c.title, description: c.seo.description || '' },
  };

  const base = skuBase(c.baseId);
  if (c.options && c.options.values && c.options.values.length) {
    input.productOptions = [{ name: c.options.name, values: c.options.values.map((v) => ({ name: v })) }];
    input.variants = c.options.values.map((v) => ({
      optionValues: [{ optionName: c.options.name, name: v }],
      price: String(c.price),
      sku: `${base}-${v}`,
      inventoryItem: { tracked: true },
    }));
  } else {
    input.productOptions = [{ name: 'Title', values: [{ name: 'Default Title' }] }];
    input.variants = [{
      optionValues: [{ optionName: 'Title', name: 'Default Title' }],
      price: String(c.price),
      sku: base,
      inventoryItem: { tracked: true },
    }];
  }
  return input;
}

function planLine(c) {
  const imgs = images.imagesForBase(c.category, c.baseId);
  const vs = (c.options && c.options.values) ? c.options.values.join('/') : 'one-size';
  return [
    `• ${c.handle}`,
    `    title:   ${c.title}`,
    `    type:    ${c.productType}   price: $${c.price}   sku: ${skuBase(c.baseId)}`,
    `    variants:${vs}`,
    `    images:  ${imgs.length} (${imgs.map((i) => i.filename).join(', ')})`,
    `    details: ${c.detailsBullets.length} bullets`,
    `    seo:     ${(c.seo.title || c.title)}`,
  ].join('\n');
}

async function uploadOne(shopify, c, mode, remedia) {
  const input = buildBaseInput(c);

  // dedupe
  const existingId = await shopify.productIdByHandle(c.handle);
  if (existingId && mode === 'create') {
    console.log(`  ↷ skip ${c.handle} (exists; use --mode=update to overwrite)`);
    return { skipped: true };
  }
  // productSet targets by identifier:{handle} (upsert) — see productSet() call below.
  // Media: attach on CREATE, or on update only with --remedia. productSet list
  // fields are declarative — sending fresh staged files on every update would
  // delete + recreate ALL media. Omit files on update to preserve existing media.
  if (!existingId || remedia) {
    const imgs = images.imagesForBase(c.category, c.baseId);
    const targets = await shopify.stageUploads(imgs.map((i) => ({ filename: i.filename, mimeType: i.mimeType })));
    const sources = [];
    for (let i = 0; i < imgs.length; i++) sources.push(await shopify.uploadToTarget(targets[i], imgs[i].path, imgs[i].mimeType));
    input.files = sources.map((src) => ({ originalSource: src, alt: c.alt, contentType: 'IMAGE' }));
  }

  const product = await shopify.productSet(input, { handle: c.handle });
  const variantNodes = product.variants.nodes;
  const qty = Number.isFinite(c.inventory) ? c.inventory : cfg.defaultInventory;
  await shopify.setInventory(variantNodes.map((v) => ({ inventoryItemId: v.inventoryItem.id, quantity: qty })));
  await shopify.publishToOnlineStore(product.id);

  return { product, variantIds: variantNodes.map((v) => v.id) };
}

function writeManifest(entries) {
  let m = {};
  try { m = JSON.parse(fs.readFileSync(cfg.paths.manifest, 'utf8')); } catch {}
  Object.assign(m, entries);
  fs.writeFileSync(cfg.paths.manifest, JSON.stringify(m, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let list = copyLib.loadAll(args.category);
  if (args.only) list = list.filter((c) => c.handle === args.only);
  if (args.limit) list = list.slice(0, args.limit);

  if (!list.length) {
    console.log('No matching products in generated/. Write copy JSON first (session mode).');
    return;
  }

  console.log(`${args.dry ? '[DRY] ' : ''}${list.length} product(s) — target=${args.target} mode=${args.mode}\n`);

  if (args.dry) {
    for (const c of list) {
      if (args.json) {
        const imgs = images.imagesForBase(c.category, c.baseId);
        const input = buildBaseInput(c);
        input.files = imgs.map((im) => ({ originalSource: `«staged:${im.filename}»`, alt: c.alt, contentType: 'IMAGE' }));
        console.log(`# ${c.handle} → productSet(input, synchronous:true)`);
        console.log(JSON.stringify(input, null, 2) + '\n');
      } else {
        console.log(planLine(c) + '\n');
      }
    }
    console.log('[DRY] No changes made. Add SHOPIFY_ADMIN_TOKEN to ~/.env and drop --dry to apply.');
    return;
  }

  const shopify = require('./lib/shopify');

  const manifest = {};
  let ok = 0, skip = 0, fail = 0;
  for (const c of list) {
    try {
      const r = await uploadOne(shopify, c, args.mode, args.remedia);
      if (r.skipped) { skip++; continue; }
      manifest[c.baseId] = { productId: r.product.id, handle: r.product.handle, variantIds: r.variantIds };
      ok++;
      console.log(`  ✓ ${c.handle} → ${r.product.id}`);
    } catch (e) {
      fail++;
      console.error(`  ✗ ${c.handle}: ${e.message}`);
    }
  }
  if (Object.keys(manifest).length) writeManifest(manifest);
  console.log(`\nDone. created/updated:${ok} skipped:${skip} failed:${fail}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
