'use strict';
const fs = require('fs');
const path = require('path');
const cfg = require('../config');

const REQUIRED = ['handle', 'category', 'baseId', 'title', 'storyHtml', 'detailsBullets', 'price'];

function validateSeoAndClaims(c, file) {
  const label = path.basename(file);
  const seoTitle = String(c.seo && c.seo.title || '');
  const seoDescription = String(c.seo && c.seo.description || '');
  if (!seoTitle) throw new Error(`${label}: missing required field "seo.title"`);
  if (!seoDescription) throw new Error(`${label}: missing required field "seo.description"`);
  if (/&amp;(?:amp;)?/i.test(`${seoTitle} ${seoDescription}`)) {
    throw new Error(`${label}: SEO fields contain an encoded ampersand; use plain text and let Shopify escape it`);
  }

  const factualCopy = [c.storyHtml, ...(c.detailsBullets || []), seoDescription].join(' ');
  const prohibited = [
    [/\b(?:solid gold|pure gold)\b/i, 'unsupported solid/pure gold claim'],
    [/\b14k gold\b(?!\s*(?:-|–)?\s*plat(?:ed|ing)\b)/i, '14k gold material copy without plated disclosure'],
    [/\bduties included\b/i, 'unsupported duties-included claim'],
    [/\bdiamonds?\b/i, 'unsupported diamond claim'],
  ];
  for (const [pattern, message] of prohibited) {
    if (pattern.test(factualCopy)) throw new Error(`${label}: ${message}`);
  }

  const tags = (c.tags || []).join(' ');
  const details = (c.detailsBullets || []).join(' ');
  if (/\bgold\b/i.test(tags) && !/gold-plated|resin|wood/i.test(details)) {
    throw new Error(`${label}: gold-tagged product details must disclose a plated or verified non-metal material`);
  }
  if (seoTitle.length < 20 || seoTitle.length > 65) {
    console.warn(`  WARN ${c.handle}: SEO title length ${seoTitle.length} is outside the 20-65 review guide`);
  }
  if (seoDescription.length < 70 || seoDescription.length > 170) {
    console.warn(`  WARN ${c.handle}: SEO description length ${seoDescription.length} is outside the 70-170 review guide`);
  }
}

function validate(c, file) {
  for (const k of REQUIRED) {
    if (c[k] === undefined || c[k] === null || c[k] === '') {
      throw new Error(`${path.basename(file)}: missing required field "${k}"`);
    }
  }
  if (!Array.isArray(c.detailsBullets) || c.detailsBullets.length === 0) {
    throw new Error(`${path.basename(file)}: detailsBullets must be a non-empty array`);
  }
  if (!cfg.categories[c.category]) {
    throw new Error(`${path.basename(file)}: unknown category "${c.category}"`);
  }
  // soft price sanity check against band
  const band = cfg.priceBands[c.category] || [];
  const price = Number(c.price);
  if (band.length && (price < band[0] - 20 || price > band[band.length - 1] + 30)) {
    console.warn(`  ⚠ ${c.handle}: price ${price} is outside the ${c.category} band ${band.join('/')}`);
  }
  // defaults
  c.tags = c.tags || [];
  c.productType = c.productType || cfg.categories[c.category].type;
  c.seo = c.seo || {};
  c.alt = c.alt || c.title;
  c.options = c.options !== undefined ? c.options : cfg.categories[c.category].options;
  validateSeoAndClaims(c, file);
  return c;
}

function loadCopy(handle) {
  const file = path.join(cfg.paths.generated, `${handle}.json`);
  if (!fs.existsSync(file)) throw new Error(`No copy JSON for "${handle}" at ${file}`);
  return validate(JSON.parse(fs.readFileSync(file, 'utf8')), file);
}

function loadAll(categoryFilter) {
  const dir = cfg.paths.generated;
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => validate(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), f))
    .filter((c) => !categoryFilter || c.category === categoryFilter)
    .sort((a, b) => a.baseId.localeCompare(b.baseId, undefined, { numeric: true }));
}

module.exports = { loadCopy, loadAll };
