import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createMcpConfig,
  patchWindowsAuditFontLookup,
  patchWindowsGraphFontLookup,
  PLUGIN_ROOT,
  PLUGIN_VERSION,
} from '../scripts/build-packages.mjs';

const marketplacePath = path.join(PLUGIN_ROOT, '.agents', 'plugins', 'marketplace.json');
const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8'));
const sourceManifest = JSON.parse(readFileSync(path.join(PLUGIN_ROOT, '.codex-plugin', 'plugin.json'), 'utf8'));
const generated = [
  { id: 'vectora-macos', platform: 'macos', displayName: 'Vectora (macOS)', script: 'sh' },
  { id: 'vectora-windows', platform: 'windows', displayName: 'Vectora (Windows)', script: 'ps1' },
];
const excludedSegments = new Set(['.git', '.obsidian', 'node_modules', 'release', 'tests', '__pycache__']);
const windowsAdaptedHelpers = [
  'create-kice-illustration/scripts/audit_svg.py',
  'create-kice-illustration/scripts/build_graph.mjs',
];

function listFiles(directory, prefix = '') {
  const result = [];
  for (const name of readdirSync(directory).sort()) {
    const fullPath = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(fullPath);
    assert.equal(stat.isSymbolicLink(), false, `symlink: ${fullPath}`);
    if (stat.isDirectory()) result.push(...listFiles(fullPath, relative));
    else if (stat.isFile()) result.push(relative);
  }
  return result;
}

function packagable(relativePath) {
  const segments = relativePath.split('/');
  const base = segments.at(-1);
  return !segments.some((segment) => excludedSegments.has(segment))
    && base !== '.DS_Store'
    && !base.endsWith('.pyc');
}

function treeHash(root) {
  const hash = createHash('sha256');
  for (const file of listFiles(root)) {
    hash.update(file).update('\0').update(readFileSync(path.join(root, file))).update('\0');
  }
  return hash.digest('hex');
}

function expectedWindowsSkillHelpers() {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'vectora-marketplace-windows-adapter-'));
  try {
    for (const helper of windowsAdaptedHelpers) {
      const expectedPath = path.join(temporary, 'skills', helper);
      mkdirSync(path.dirname(expectedPath), { recursive: true });
      writeFileSync(expectedPath, readFileSync(path.join(PLUGIN_ROOT, 'skills', helper)));
    }
    patchWindowsAuditFontLookup(temporary);
    patchWindowsGraphFontLookup(temporary);
    return new Map(windowsAdaptedHelpers.map(helper => [
      helper,
      readFileSync(path.join(temporary, 'skills', helper)),
    ]));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

test('marketplace catalog uses the two local plugin IDs and requested install policy', () => {
  assert.equal(marketplace.name, 'vectora');
  assert.equal(marketplace.interface.displayName, 'Vectora');
  assert.deepEqual(marketplace.plugins.map(({ name }) => name), generated.map(({ id }) => id));
  for (const plugin of marketplace.plugins) {
    assert.deepEqual(plugin.source, { source: 'local', path: `./plugins/${plugin.name}` });
    assert.deepEqual(plugin.policy, { installation: 'AVAILABLE', authentication: 'ON_INSTALL' });
    assert.equal(plugin.category, 'Productivity');
    assert.equal(Object.hasOwn(plugin.policy, 'products'), false);
  }
});

test('platform plugin manifests match their folders, display names, and source version', () => {
  for (const { id, displayName } of generated) {
    const target = path.join(PLUGIN_ROOT, 'plugins', id);
    const manifest = JSON.parse(readFileSync(path.join(target, '.codex-plugin', 'plugin.json'), 'utf8'));
    const expected = structuredClone(sourceManifest);
    expected.name = id;
    expected.version = PLUGIN_VERSION;
    expected.interface.displayName = displayName;
    assert.deepEqual(manifest, expected);
    assert.equal(manifest.name, path.basename(target));
  }
});

test('Windows packaged helpers exactly match the exported font lookup adaptations', () => {
  const expectedWindows = expectedWindowsSkillHelpers();
  for (const helper of windowsAdaptedHelpers) {
    const canonical = readFileSync(path.join(PLUGIN_ROOT, 'skills', helper));
    const macos = readFileSync(path.join(PLUGIN_ROOT, 'plugins/vectora-macos/skills', helper));
    const windows = readFileSync(path.join(PLUGIN_ROOT, 'plugins/vectora-windows/skills', helper));
    assert.deepEqual(macos, canonical, `vectora-macos: skills/${helper}`);
    assert.notDeepEqual(expectedWindows.get(helper), canonical, `${helper}: Windows adapter must change the font lookup`);
    assert.deepEqual(windows, expectedWindows.get(helper), `vectora-windows: skills/${helper}`);
  }
});

test('each plugin embeds its matching native launcher config without adding a Node launcher', () => {
  for (const { id, platform, script } of generated) {
    const target = path.join(PLUGIN_ROOT, 'plugins', id);
    const configText = readFileSync(path.join(target, '.mcp.json'), 'utf8');
    assert.deepEqual(JSON.parse(configText), createMcpConfig(platform));
    assert.equal(configText, `${JSON.stringify(createMcpConfig(platform), null, 2)}\n`);
    const server = JSON.parse(configText).mcpServers.vectora;
    assert.equal(server.command, platform === 'macos' ? '/bin/sh' : 'powershell.exe');
    assert.equal(readFileSync(path.join(target, 'scripts', `start-mcp.${script}`), 'utf8'), readFileSync(path.join(PLUGIN_ROOT, 'scripts', `start-mcp.${script}`), 'utf8'));
    assert.equal(readFileSync(path.join(target, 'scripts', `configure-app.${script}`), 'utf8'), readFileSync(path.join(PLUGIN_ROOT, 'scripts', `configure-app.${script}`), 'utf8'));
    assert.equal(listFiles(path.join(target, 'scripts')).some((file) => /\.m?js$/i.test(file)), false);
  }
  const windowsLauncher = readFileSync(path.join(PLUGIN_ROOT, 'plugins', 'vectora-windows', 'scripts', 'start-mcp.ps1'), 'utf8');
  assert.match(windowsLauncher, /NamedPipeServerStream/);
  assert.match(windowsLauncher, /--mcp-pipe=/);
  assert.match(windowsLauncher, /PipeSecurity/);
});

test('generated trees contain the complete canonical skills and runtime allowlist only', () => {
  const sourceSkillsRoot = path.join(PLUGIN_ROOT, 'skills');
  const expectedSkills = listFiles(sourceSkillsRoot).filter(packagable).map((file) => `skills/${file}`);
  const windowsHelpers = expectedWindowsSkillHelpers();
  const productionFiles = [
    'src/production/frames-core.mjs',
    'src/production/graphs-core.mjs',
    'src/production/graphs-points.mjs',
  ];

  for (const { id, platform, script } of generated) {
    const target = path.join(PLUGIN_ROOT, 'plugins', id);
    const actual = listFiles(target);
    const expected = [
      '.codex-plugin/plugin.json', '.mcp.json', 'README.md', 'assets/vectora.png',
      ...expectedSkills,
      ...productionFiles,
      `scripts/configure-app.${script}`, `scripts/start-mcp.${script}`,
    ].sort();
    assert.deepEqual(actual, expected, id);
    for (const file of listFiles(sourceSkillsRoot).filter(packagable)) {
      const canonical = readFileSync(path.join(sourceSkillsRoot, file));
      const expectedSkill = id === 'vectora-windows' ? windowsHelpers.get(file) ?? canonical : canonical;
      assert.deepEqual(
        readFileSync(path.join(target, 'skills', file)),
        expectedSkill,
        `${id}: skills/${file}`,
      );
    }
    assert.equal(readFileSync(path.join(target, 'README.md'), 'utf8'), readFileSync(path.join(PLUGIN_ROOT, 'README.md'), 'utf8'));
    for (const file of actual) {
      assert.doesNotMatch(file, /(?:^|\/)(?:apps?|fonts?|secrets?|tests?|\.obsidian|node_modules|__pycache__)(?:\/|$)/i, `${id}: ${file}`);
      assert.doesNotMatch(file, /\.(?:node|so|dylib|dll|pyd|exe|o|a|lib|pyc|ttf|otf)$/i, `${id}: ${file}`);
    }
    assert.equal(actual.some((file) => file.startsWith('src/production/')),
      productionFiles.every((file) => actual.includes(file)), `${id} runtime modules`);
    assert.ok(createMcpConfig(platform));
  }
});

test('generation is idempotent and --check detects drift without changing outputs', () => {
  const script = path.join(PLUGIN_ROOT, 'scripts', 'build-marketplace.mjs');
  const outputs = [
    ...generated.map(({ id }) => path.join(PLUGIN_ROOT, 'plugins', id)),
    path.dirname(marketplacePath),
    path.join(PLUGIN_ROOT, 'plugins/vectora'),
    path.join(PLUGIN_ROOT, '.claude-plugin'),
  ];
  execFileSync(process.execPath, [script], { cwd: PLUGIN_ROOT });
  const afterFirstBuild = outputs.map(treeHash);
  execFileSync(process.execPath, [script], { cwd: PLUGIN_ROOT });
  const afterSecondBuild = outputs.map(treeHash);
  assert.deepEqual(afterSecondBuild, afterFirstBuild);
  execFileSync(process.execPath, [script, '--check'], { cwd: PLUGIN_ROOT });
  assert.deepEqual(outputs.map(treeHash), afterSecondBuild);

  const skillCopy = path.join(PLUGIN_ROOT, 'plugins', 'vectora', 'skills', 'use-vectora', 'SKILL.md');
  const original = readFileSync(skillCopy);
  try {
    writeFileSync(skillCopy, Buffer.concat([original, Buffer.from('\nmarketplace drift fixture\n')]));
    const drift = spawnSync(process.execPath, [script, '--check'], { cwd: PLUGIN_ROOT, encoding: 'utf8' });
    assert.notEqual(drift.status, 0);
    assert.match(drift.stderr, /plugins\/vectora/);
  } finally {
    writeFileSync(skillCopy, original);
  }
  execFileSync(process.execPath, [script, '--check'], { cwd: PLUGIN_ROOT });
  assert.deepEqual(outputs.map(treeHash), afterSecondBuild);
});
