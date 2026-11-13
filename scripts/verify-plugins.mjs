// Check of the published Vectora MCP tree (narshacontents/vectora-mcp), copied there as scripts/verify-plugins.mjs by
// vectora-studio rust/packaging/vectora-mcp-layout.mjs. Node built-ins only; it reads files and changes nothing:
//   node scripts/verify-plugins.mjs
// vectora-release.json lists every published file with its SHA-256 and the source commit of vectora-studio. The check:
// the tree holds exactly those files (besides the maintainer files of KEEP), each with its recorded bytes and the
// executable bit on every launcher; every manifest carries the release version; each multi-system launcher folder has
// the POSIX selector and the binary of every system it names; no fonts, Node runtimes or Node launchers are published.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file).toString('utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const release = json('vectora-release.json');
assert.equal(release.kind, 'vectora.mcp-release-tree');
assert.match(release.version, /^\d+\.\d+\.\d+$/);
const KEEP = new Set(release.keep);

function walk(relative = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const file = relative ? relative + '/' + entry.name : entry.name;
    if (!relative && (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'artifacts' || entry.name === 'release')) continue;
    if (entry.name === '.DS_Store') continue;
    assert(!entry.isSymbolicLink(), 'Symbolic link: ' + file);
    if (entry.isDirectory()) out.push(...walk(file)); else out.push(file);
  }
  return out;
}
const kept = file => KEEP.has(file) || [...KEEP].some(k => k.endsWith('/') && file.startsWith(k));
const present = walk().filter(f => !kept(f) && f !== 'vectora-release.json').sort();
const listed = Object.keys(release.files).sort();
assert.deepEqual(present.filter(f => !listed.includes(f)), [], 'Files not in vectora-release.json');
assert.deepEqual(listed.filter(f => !present.includes(f)), [], 'Files of vectora-release.json missing');
for (const [file, entry] of Object.entries(release.files)) {
  assert.equal(sha256(read(file)), entry.sha256, 'Changed: ' + file);
  if (entry.executable && process.platform !== 'win32') assert(fs.statSync(path.join(root, file)).mode & 0o100, 'Not executable: ' + file);
}
for (const file of listed) {
  assert(!/\.(otf|ttf|ttc|otc|dfont|woff2?)$/i.test(file), 'Font: ' + file);
  assert(!file.includes('/node_modules/') && !/\.(mjs|cjs)$/.test(file), 'Node runtime or script: ' + file);
}
for (const manifest of release.manifests) {
  const value = json(manifest);
  if ('version' in value || manifest.endsWith('plugin.json') || manifest.endsWith('gemini-extension.json')) assert.equal(value.version, release.version, manifest);
}
for (const [folder, systems] of Object.entries(release.launchers)) {
  for (const tool of ['vectora-mcp-launch', 'vectora-skill']) {
    for (const system of systems) {
      const file = system === 'windows-x86_64' ? folder + '/' + tool + '.exe' : folder + '/' + system + '/' + tool;
      assert(Object.hasOwn(release.files, file), 'Missing ' + file);
    }
    if (systems.some(s => s !== 'windows-x86_64')) {
      const selector = read(folder + '/' + tool).toString('utf8');
      assert(selector.startsWith('#!/bin/sh\n'), folder + '/' + tool + ' is the POSIX selector');
      for (const system of systems.filter(s => s !== 'windows-x86_64')) assert(selector.includes('platform=' + system), folder + '/' + tool + ': ' + system);
    }
  }
}
console.log('Vectora MCP ' + release.version + ': ' + listed.length + ' published files match vectora-release.json (vectora-studio ' + release.source.commit.slice(0, 12) + ').');
