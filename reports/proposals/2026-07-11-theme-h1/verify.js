#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const proposalDir = __dirname;
const sourceDir = path.resolve(
  process.env.HERPRINT_LIVE_THEME_SOURCE
    || '/Users/xiaowen/Herprintwebbuilding/live-theme-backups/2026-07-11-dawn-live',
);

const files = {
  'sections/header.liquid': [
    {
      from: '<h1 class="header__heading">',
      to: '<div class="header__heading">',
      count: 2,
    },
    {
      from: "{%- if request.page_type == 'index' -%}\n        </h1>\n      {%- endif -%}",
      to: "{%- if request.page_type == 'index' -%}\n        </div>\n      {%- endif -%}",
      count: 2,
    },
  ],
  'sections/herprint-eclat.liquid': [
    {
      from: '<p class="hp-eclat__tagline">{{ section.settings.tagline | escape }}</p>',
      to: '<h1 class="hp-eclat__tagline">{{ section.settings.tagline | escape }}</h1>',
      count: 1,
    },
  ],
  'sections/main-product.liquid': [
    {
      from: '<h2 style="font-size: 24px; line-height: 1.2;">',
      to: '<h1 style="font-size: 24px; line-height: 1.2;">',
      count: 1,
    },
    {
      from: '                  </h2>\n                </div>',
      to: '                  </h1>\n                </div>',
      count: 1,
    },
  ],
  'layout/theme.liquid': [
    {
      from: '    <title>',
      to: '    {%- assign page_title_downcase = page_title | downcase -%}\n    {%- assign shop_name_downcase = shop.name | downcase -%}\n    <title>',
      count: 1,
    },
    {
      from: '{%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}',
      to: '{%- unless page_title_downcase contains shop_name_downcase %} &ndash; {{ shop.name }}{% endunless -%}',
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
