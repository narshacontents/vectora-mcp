import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { stageRelease } from '../scripts/stage-release.mjs';

const version = '1.0.4';

function writeJson(root, relative, value) {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture({ wrongCodexSource = false, notesVersion = version } = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'vectora-stage-release-'));
  const rootManifest = { name: 'vectora', version };
  writeJson(root, '.codex-plugin/plugin.json', rootManifest);
  writeJson(root, '.agents/plugins/marketplace.json', {
    name: 'vectora',
    plugins: ['vectora-macos', 'vectora-windows'].map((name) => ({
      name,
      source: { source: 'local', path: `./plugins/${wrongCodexSource && name === 'vectora-macos' ? 'wrong-plugin' : name}` },
    })),
  });
  writeJson(root, '.claude-plugin/marketplace.json', {
    name: 'vectora',
    plugins: [{ name: 'vectora', source: './plugins/vectora', version }],
  });

  for (const name of ['vectora-macos', 'vectora-windows']) {
    writeJson(root, `plugins/${name}/.codex-plugin/plugin.json`, { name, version });
    writeFileSync(path.join(root, `plugins/${name}/runtime.txt`), `${name} runtime\n`);
  }
  writeJson(root, 'plugins/vectora/.claude-plugin/plugin.json', { name: 'vectora', version });
  writeFileSync(path.join(root, 'plugins/vectora/runtime.txt'), 'claude runtime\n');
  writeJson(root, 'gemini-extension.json', {
    name: 'vectora', version, contextFileName: 'GEMINI.md',
    mcpServers: { vectora: { command: 'node', args: ['${extensionPath}/scripts/gemini/gemini-mcp-launcher.mjs'] } },
  });
  writeFileSync(path.join(root, 'GEMINI.md'), '# Vectora Gemini CLI\n');
  mkdirSync(path.join(root, 'scripts/gemini'), { recursive: true });
  writeFileSync(path.join(root, 'scripts/gemini/gemini-mcp-launcher.mjs'), '// test launcher\n');
  writeFileSync(path.join(root, 'scripts/gemini/run-helper.mjs'), '// test helper\n');
  mkdirSync(path.join(root, 'skills'), { recursive: true });
  writeFileSync(path.join(root, 'skills/SKILL.md'), 'test skills\n');
  writeFileSync(path.join(root, 'CLAUDE_INSTALLATION.md'), '# Claude install\n');
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  writeFileSync(path.join(root, 'docs/CLAUDE_INSTALLATION.md'), '# Claude install\n');
  writeFileSync(path.join(root, 'RELEASE_NOTES.md'), `# Vectora MCP ${notesVersion}\n\nMarketplace-only.\n`);
  mkdirSync(path.join(root, 'scripts'), { recursive: true });
  writeFileSync(path.join(root, 'scripts/build-marketplace.mjs'), "if (process.argv[2] !== '--check') process.exit(1);\n");
  mkdirSync(path.join(root, 'release'), { recursive: true });

  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Vectora Test'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'vectora-test@example.invalid'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}

test('stages only release notes and internal evidence for marketplace-only distribution', (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const result = stageRelease({ root });
  assert.equal(result.version, version);
  assert.equal(result.distribution, 'marketplace-only');
  assert.deepEqual(result.assets, []);
  assert.deepEqual(readdirSync(result.directory).sort(), ['RELEASE_NOTES.md', 'evidence.json']);
  assert.deepEqual(readFileSync(path.join(result.directory, 'RELEASE_NOTES.md')), readFileSync(path.join(root, 'RELEASE_NOTES.md')));

  const evidence = JSON.parse(readFileSync(result.evidence, 'utf8'));
  assert.equal(evidence.purpose, 'internal-only; do not upload to the GitHub release');
  assert.equal(evidence.sourceCommit, result.sourceCommit);
  assert.equal(evidence.distribution, 'marketplace-only');
  assert.deepEqual(evidence.assets, []);
  assert.deepEqual(evidence.plugins.map(({ name }) => name), ['vectora-macos', 'vectora-windows', 'vectora']);
  assert.ok(evidence.catalogs.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  assert.ok(evidence.plugins.every(({ sha256 }) => /^[a-f0-9]{64}$/.test(sha256)));
  assert.equal(evidence.extensions[0].client, 'gemini-cli');
  assert.equal(evidence.extensions[0].version, version);
  assert.match(evidence.extensions[0].skillsSha256, /^[a-f0-9]{64}$/);
});

test('rejects a Codex catalog source that does not point to its runtime tree', (t) => {
  const root = createFixture({ wrongCodexSource: true });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  assert.throws(() => stageRelease({ root }), /Codex plugin vectora-macos source must be \.\/plugins\/vectora-macos/);
});

test('rejects release notes whose first title has a different version', (t) => {
  const root = createFixture({ notesVersion: '1.0.3' });
  t.after(() => rmSync(root, { recursive: true, force: true }));

  assert.throws(() => stageRelease({ root }), /first release notes title must match the root plugin version/);
});

test('refuses to stage from a dirty source checkout', (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, 'RELEASE_NOTES.md'), 'uncommitted change\n');

  assert.throws(() => stageRelease({ root }), /Commit the reviewed source changes before staging a release/);
});

test('rejects a Gemini manifest version that differs from the release', (t) => {
  const root = createFixture();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'gemini-extension.json');
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  manifest.version = '0.0.1';
  writeFileSync(file, JSON.stringify(manifest));
  execFileSync('git', ['add', 'gemini-extension.json'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'wrong Gemini version'], { cwd: root });
  assert.throws(() => stageRelease({ root }), /Gemini extension version must match/);
});
