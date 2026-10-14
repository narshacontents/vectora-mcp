import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_MANIFEST = '.codex-plugin/plugin.json';
const CODEX_CATALOG = '.agents/plugins/marketplace.json';
const CLAUDE_CATALOG = '.claude-plugin/marketplace.json';
const CLAUDE_PLUGIN_MANIFEST = '.claude-plugin/plugin.json';
const CODEX_PLUGINS = ['vectora-macos', 'vectora-windows'];
const CLAUDE_PLUGIN = 'vectora';

function pathStat(file) {
  try {
    return lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function requireRegularFile(file) {
  const stat = pathStat(file);
  assert.ok(stat?.isFile() && !stat.isSymbolicLink(), `Expected a regular file: ${file}`);
  return file;
}

function readJson(file) {
  return JSON.parse(readFileSync(requireRegularFile(file), 'utf8'));
}

function optionalVersion(value, version, label) {
  if (value !== undefined) assert.equal(value, version, `${label} version must match the root manifest.`);
}

function listTreeFiles(directory, prefix = '') {
  const rootStat = lstatSync(directory);
  assert.ok(rootStat.isDirectory() && !rootStat.isSymbolicLink(), `Expected a real marketplace tree: ${directory}`);
  const files = [];
  for (const name of readdirSync(directory).sort((left, right) => left.localeCompare(right, 'en'))) {
    const absolute = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(absolute);
    assert.equal(stat.isSymbolicLink(), false, `Marketplace trees cannot contain symlinks: ${absolute}`);
    if (stat.isDirectory()) files.push(...listTreeFiles(absolute, relative));
    else {
      assert.ok(stat.isFile(), `Unsupported marketplace tree entry: ${absolute}`);
      files.push(relative);
    }
  }
  return files;
}

function treeSha256(directory) {
  const hash = createHash('sha256');
  for (const relative of listTreeFiles(directory)) {
    const content = readFileSync(path.join(directory, relative));
    hash.update(relative).update('\0').update(String(content.length)).update('\0').update(content).update('\0');
  }
  return hash.digest('hex');
}

function fileSha256(file) {
  return createHash('sha256').update(readFileSync(requireRegularFile(file))).digest('hex');
}

function validateCatalogSource(source, expectedPath, label, sourceType) {
  if (typeof source === 'string') {
    assert.equal(source, expectedPath, `${label} source must be ${expectedPath}.`);
    return;
  }
  assert.ok(source && typeof source === 'object', `${label} must declare its local source.`);
  if (sourceType) assert.equal(source.source, sourceType, `${label} source type must be ${sourceType}.`);
  assert.equal(source.path, expectedPath, `${label} source must be ${expectedPath}.`);
}

function validateMarketplace(root) {
  const rootManifest = readJson(path.join(root, ROOT_MANIFEST));
  assert.equal(rootManifest.name, 'vectora', 'Root plugin manifest name must be vectora.');
  assert.match(rootManifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Root plugin manifest must declare a release version.');
  const { version } = rootManifest;

  const codexCatalog = readJson(path.join(root, CODEX_CATALOG));
  assert.equal(codexCatalog.name, rootManifest.name, 'Codex marketplace name must match the root plugin manifest.');
  optionalVersion(codexCatalog.version, version, 'Codex marketplace');
  assert.ok(Array.isArray(codexCatalog.plugins), 'Codex marketplace must declare its plugins.');
  assert.deepEqual(
    codexCatalog.plugins.map((plugin) => plugin?.name).sort(),
    [...CODEX_PLUGINS].sort(),
    'Codex marketplace must contain exactly the macOS and Windows Vectora plugins.',
  );

  const codexPlugins = CODEX_PLUGINS.map((name) => {
    const entry = codexCatalog.plugins.find((plugin) => plugin.name === name);
    validateCatalogSource(entry.source, `./plugins/${name}`, `Codex plugin ${name}`, 'local');
    optionalVersion(entry.version, version, `Codex catalog entry ${name}`);
    const manifestPath = path.join(root, 'plugins', name, '.codex-plugin/plugin.json');
    const manifest = readJson(manifestPath);
    assert.equal(manifest.name, name, `${name} plugin manifest name must match its catalog entry.`);
    assert.equal(manifest.version, version, `${name} plugin version must match the root manifest.`);
    return { name, path: `plugins/${name}`, version: manifest.version, sha256: treeSha256(path.dirname(path.dirname(manifestPath))) };
  });

  const claudeCatalog = readJson(path.join(root, CLAUDE_CATALOG));
  assert.equal(claudeCatalog.name, rootManifest.name, 'Claude marketplace name must match the root plugin manifest.');
  optionalVersion(claudeCatalog.version, version, 'Claude marketplace');
  assert.ok(Array.isArray(claudeCatalog.plugins), 'Claude marketplace must declare its plugins.');
  assert.deepEqual(claudeCatalog.plugins.map((plugin) => plugin?.name), [CLAUDE_PLUGIN], 'Claude marketplace must contain only the Vectora plugin.');
  const claudeEntry = claudeCatalog.plugins[0];
  validateCatalogSource(claudeEntry.source, './plugins/vectora', 'Claude plugin vectora');
  optionalVersion(claudeEntry.version, version, 'Claude catalog entry vectora');
  const claudeManifest = readJson(path.join(root, 'plugins', CLAUDE_PLUGIN, CLAUDE_PLUGIN_MANIFEST));
  assert.equal(claudeManifest.name, CLAUDE_PLUGIN, 'Claude plugin manifest name must match its catalog entry.');
  assert.equal(claudeManifest.version, version, 'Claude plugin version must match the root manifest.');

  const geminiManifestPath = 'gemini-extension.json';
  const geminiManifest = readJson(path.join(root, geminiManifestPath));
  assert.equal(geminiManifest.name, 'vectora', 'Gemini extension name must be vectora.');
  assert.equal(geminiManifest.version, version, 'Gemini extension version must match the root manifest.');
  assert.equal(geminiManifest.contextFileName, 'GEMINI.md');
  assert.equal(geminiManifest.mcpServers?.vectora?.command, 'node');
  assert.deepEqual(geminiManifest.mcpServers.vectora.args, ['${extensionPath}/scripts/gemini/gemini-mcp-launcher.mjs']);
  for (const file of ['GEMINI.md', 'scripts/gemini/gemini-mcp-launcher.mjs', 'scripts/gemini/run-helper.mjs']) {
    requireRegularFile(path.join(root, file));
  }

  const rootGuide = requireRegularFile(path.join(root, 'CLAUDE_INSTALLATION.md'));
  const docsGuide = requireRegularFile(path.join(root, 'docs/CLAUDE_INSTALLATION.md'));
  assert.deepEqual(readFileSync(rootGuide), readFileSync(docsGuide), 'Keep docs/CLAUDE_INSTALLATION.md identical to the root Claude installation guide.');

  return {
    version,
    rootManifest: { path: ROOT_MANIFEST, name: rootManifest.name, version },
    extensions: [{
      name: geminiManifest.name, client: 'gemini-cli', path: geminiManifestPath, version,
      sha256: fileSha256(path.join(root, geminiManifestPath)),
      contextSha256: fileSha256(path.join(root, 'GEMINI.md')),
      skillsSha256: treeSha256(path.join(root, 'skills')),
      launcherSha256: fileSha256(path.join(root, 'scripts/gemini/gemini-mcp-launcher.mjs')),
      helperSha256: fileSha256(path.join(root, 'scripts/gemini/run-helper.mjs')),
    }],
    catalogs: [
      { path: CODEX_CATALOG, sha256: fileSha256(path.join(root, CODEX_CATALOG)) },
      { path: CLAUDE_CATALOG, sha256: fileSha256(path.join(root, CLAUDE_CATALOG)) },
    ],
    plugins: [
      ...codexPlugins,
      {
        name: CLAUDE_PLUGIN,
        path: 'plugins/vectora',
        version: claudeManifest.version,
        sha256: treeSha256(path.join(root, 'plugins', CLAUDE_PLUGIN)),
      },
    ],
  };
}

function ensureDirectory(directory) {
  const current = pathStat(directory);
  if (!current) mkdirSync(directory);
  const stat = pathStat(directory);
  assert.ok(stat?.isDirectory() && !stat.isSymbolicLink(), `Expected a real directory: ${directory}`);
}

export function stageRelease({ root = PLUGIN_ROOT } = {}) {
  const repoRoot = path.resolve(root);
  const git = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(git('status', '--porcelain'), '', 'Commit the reviewed source changes before staging a release.');

  const marketplace = validateMarketplace(repoRoot);
  const buildCheck = path.join(repoRoot, 'scripts/build-marketplace.mjs');
  requireRegularFile(buildCheck);
  execFileSync(process.execPath, [buildCheck, '--check'], { cwd: repoRoot, encoding: 'utf8' });

  const notesSource = requireRegularFile(path.join(repoRoot, 'RELEASE_NOTES.md'));
  const firstTitle = readFileSync(notesSource, 'utf8').split(/\r?\n/).find((line) => /^#\s+\S/.test(line));
  assert.ok(firstTitle, 'RELEASE_NOTES.md must begin with a Markdown title.');
  const escapedVersion = marketplace.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(firstTitle, new RegExp(`(?:^|[^0-9A-Za-z.])v?${escapedVersion}(?:$|[^0-9A-Za-z.])`), 'The first release notes title must match the root plugin version.');
  const sourceCommit = git('rev-parse', 'HEAD');
  const releaseRoot = path.join(repoRoot, 'release');
  ensureDirectory(releaseRoot);
  const parent = path.join(releaseRoot, 'staging');
  ensureDirectory(parent);
  const destination = path.join(parent, marketplace.version);
  const prior = pathStat(destination);
  assert.ok(!prior || (prior.isDirectory() && !prior.isSymbolicLink()), `Refusing to replace non-directory staging path: ${destination}`);

  const temporary = mkdtempSync(path.join(parent, '.vectora-'));
  try {
    copyFileSync(notesSource, path.join(temporary, 'RELEASE_NOTES.md'));
    const evidence = {
      purpose: 'internal-only; do not upload to the GitHub release',
      plugin: 'vectora',
      version: marketplace.version,
      distribution: 'marketplace-only',
      sourceCommit,
      assets: [],
      verification: {
        cleanWorkingTree: true,
        marketplaceCheck: 'passed',
        claudeGuideMatchesRoot: true,
      },
      rootManifest: marketplace.rootManifest,
      catalogs: marketplace.catalogs,
      plugins: marketplace.plugins,
      extensions: marketplace.extensions,
    };
    writeFileSync(path.join(temporary, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

    rmSync(destination, { recursive: true, force: true });
    renameSync(temporary, destination);
    return {
      directory: destination,
      version: marketplace.version,
      sourceCommit,
      distribution: 'marketplace-only',
      assets: [],
      preparedFiles: ['RELEASE_NOTES.md', 'evidence.json'],
      evidence: path.join(destination, 'evidence.json'),
    };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(stageRelease(), null, 2)}\n`);
}
