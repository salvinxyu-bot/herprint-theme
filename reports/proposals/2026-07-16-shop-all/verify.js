#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const proposalDir = __dirname;
const sourceDir = path.resolve(process.env.HERPRINT_LIVE_THEME_SOURCE || path.join(proposalDir, 'source'));

const files = {
  'layout/theme.liquid': [
    {
      from: "    {%- assign page_title_downcase = page_title | downcase -%}\n    {%- assign shop_name_downcase = shop.name | downcase -%}",
      to: "    {%- liquid\n      assign seo_page_title = page_title\n      assign seo_page_description = page_description\n      if request.page_type == 'collection' and collection.handle == 'all'\n        assign seo_page_title = 'Dainty Jewelry: Rings, Necklaces & More'\n        assign seo_page_description = \"Shop Herprint's collection of dainty rings, necklaces, earrings, and bracelets for everyday wear, thoughtful gifts, and meaningful moments online.\"\n      endif\n      assign page_title_downcase = seo_page_title | downcase\n      assign shop_name_downcase = shop.name | downcase\n    -%}",
      count: 1,
    },
    {
      from: '      {{ page_title }}',
      to: '      {{ seo_page_title }}',
      count: 1,
    },
    {
      from: '    {% if page_description %}\n      <meta name="description" content="{{ page_description | escape }}">\n    {% endif %}',
      to: '    {% if seo_page_description %}\n      <meta name="description" content="{{ seo_page_description | escape }}">\n    {% endif %}',
      count: 1,
    },
    {
      from: "    {% render 'meta-tags' %}",
      to: "    {% render 'meta-tags', page_title: seo_page_title, page_description: seo_page_description %}",
      count: 1,
    },
  ],
  'sections/main-collection-banner.liquid': [
    {
      from: '{%- endstyle -%}\n\n<div class="collection-hero',
      to: `{%- endstyle -%}\n\n{%- liquid\n  assign collection_heading = collection.title\n  assign collection_intro = collection.description\n  if collection.handle == 'all'\n    assign collection_heading = 'All Jewelry'\n    assign collection_intro = "Explore Herprint's dainty rings, necklaces, earrings, and bracelets for everyday moments, thoughtful gifts, quiet celebrations, and every chapter of becoming."\n  endif\n-%}\n\n<div class="collection-hero`,
      count: 1,
    },
    {
      from: '{{- collection.title | escape -}}',
      to: '{{- collection_heading | escape -}}',
      count: 1,
    },
    {
      from: '<div class="collection-hero__description rte">{{ collection.description }}</div>',
      to: '<div class="collection-hero__description rte">{{ collection_intro }}</div>',
      count: 1,
    },
  ],
};

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function replaceExact(input, file, transform) {
  const occurrences = input.split(transform.from).length - 1;
  if (occurrences !== transform.count) {
    throw new Error(`${file}: expected ${transform.count} occurrence(s), found ${occurrences}`);
  }
  return input.split(transform.from).join(transform.to);
}

const results = Object.entries(files).map(([file, transforms]) => {
  const source = fs.readFileSync(path.join(sourceDir, file), 'utf8');
  const proposal = fs.readFileSync(path.join(proposalDir, file), 'utf8');
  const expected = transforms.reduce((value, transform) => replaceExact(value, file, transform), source);
  if (proposal !== expected) throw new Error(`${file}: proposal contains an unapproved difference`);
  return {
    file,
    approvedTransformations: transforms.reduce((sum, transform) => sum + transform.count, 0),
    sourceSha256: sha256(source),
    proposalSha256: sha256(proposal),
  };
});

process.stdout.write(`${JSON.stringify({ status: 'PASS', sourceDir, proposalDir, files: results }, null, 2)}\n`);
