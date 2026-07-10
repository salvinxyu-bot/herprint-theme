'use strict';
const fs = require('fs');
const path = require('path');
const cfg = require('../config');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const mimeOf = (f) => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';

// numeric suffix of an _ON file, e.g. ER_01_ON_03 -> 3, ER_04_ON -> 0
function onSeq(name) {
  const m = name.match(/_ON(?:_(\d+))?\.(jpg|jpeg|png|webp)$/i);
  return m ? (m[1] ? parseInt(m[1], 10) : 0) : 9999;
}

// List product folders for a category prefix (RG/NC/BC/ER).
// Returns [{ baseId, folder, num }] sorted by num; baseId strips a trailing _X.
function listProductFolders(category) {
  const dir = path.join(cfg.paths.materials, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith(category + '_'))
    .map((d) => {
      const folder = path.join(dir, d.name);
      const baseId = d.name.replace(/_X$/, '');
      const num = parseInt((d.name.match(/_(\d+)/) || [])[1] || '0', 10);
      const hasFiles = fs.readdirSync(folder).some((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
      return { baseId, folder, num, empty: !hasFiles };
    })
    .filter((x) => !x.empty)
    .sort((a, b) => a.num - b.num);
}

// Resolve the SOP-ordered image list for a base id (e.g. "RG_01" / "BC_02").
// Order: W_detail > W_whole > plain W (studio shots), then ON_* ascending.
function imagesForBase(category, baseId) {
  const folders = listProductFolders(category);
  const hit = folders.find((f) => f.baseId === baseId);
  if (!hit) throw new Error(`No image folder for ${baseId} under ${category}/`);
  const files = fs
    .readdirSync(hit.folder)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  const find = (re) => files.filter((f) => re.test(f));
  const detail = find(new RegExp(`^${baseId}_+W_detail\\.`, 'i'));
  const whole = find(new RegExp(`^${baseId}_+W_whole\\.`, 'i'));
  // plain W = a _W shot that is neither detail nor whole
  const plainW = files.filter(
    (f) => new RegExp(`^${baseId}_+W\\.`, 'i').test(f)
  );
  const ons = find(new RegExp(`^${baseId}_ON`, 'i')).sort((a, b) => onSeq(a) - onSeq(b));

  const ordered = [];
  for (const f of [...detail, ...whole, ...plainW, ...ons]) {
    if (!ordered.includes(f)) ordered.push(f);
  }
  return ordered.map((f) => ({
    path: path.join(hit.folder, f),
    filename: f,
    mimeType: mimeOf(f),
  }));
}

module.exports = { listProductFolders, imagesForBase };
