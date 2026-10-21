import {
  cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClaudePlugin } from './build-claude-packages.mjs';
import { buildGeminiExtension } from './build-gemini-extension.mjs';
import { copyCodexPlugin, PLUGIN_ROOT } from './build-packages.mjs';

const PLUGINS_ROOT = path.join(PLUGIN_ROOT, 'plugins');
const CODEX_CATALOG = path.join(PLUGIN_ROOT, '.agents', 'plugins', 'marketplace.json');
const CLAUDE_CATALOG = path.join(PLUGIN_ROOT, '.claude-plugin', 'marketplace.json');
const CODEX_PLUGINS = [
  { id: 'vectora-macos', platform: 'macos', displayName: 'Vectora (macOS)' },
  { id: 'vectora-windows', platform: 'windows', displayName: 'Vectora (Windows)' },
];
const CLAUDE_PLUGIN = { id: 'vectora' };

function codexMarketplaceText() {
  return `${JSON.stringify({
    name: 'vectora',
    description: '벡터 편집·평가원 제작 MCP와 세 스킬. 앱 2.0은 UND v3.1 Main에서만 (가)~(하)를 문맥에 따라 고정 표시하고 Batang은 세 문자 원문으로 표시합니다. 문자 프리셋 4종·비율 행간·통합 문단 고정을 지원합니다. 새 기능은 live schema를 확인하세요.',
    interface: { displayName: 'Vectora' },
    plugins: CODEX_PLUGINS.map(({ id }) => ({
      name: id,
      description: '벡터 편집·평가원 제작 MCP와 세 스킬. 앱 2.0은 UND v3.1 Main에서만 (가)~(하)를 문맥에 따라 고정 표시하고 Batang은 세 문자 원문으로 표시합니다. 문자 프리셋 4종·비율 행간·통합 문단 고정을 지원합니다. 새 기능은 live schema를 확인하세요.',
      source: { source: 'local', path: `./plugins/${id}` },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      category: 'Productivity',
    })),
  }, null, 2)}\n`;
}

function claudeMarketplaceText() {
  return `${JSON.stringify({
    name: 'vectora',
    owner: { name: 'Vectora' },
    description: 'Vectora MCP and three illustration skills. App 2.0 limits contextual fixed glyphs for (가)–(하) to UND v3.1 Main; Batang displays the literal three characters. It adds four text presets, percentage leading, and unified paragraph anchoring. Check live schemas before using new fields.',
    plugins: [{ name: 'vectora', source: './plugins/vectora' }],
  }, null, 2)}\n`;
}

function optionalStat(target) {
  try {
    return lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function requireDirectoryIfPresent(target) {
  const stat = optionalStat(target);
  if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
    throw new Error(`Refusing to use non-directory or linked output path: ${target}`);
  }
}

function validateCatalog(pathname, expectedName, allowedPlugins) {
  const stat = optionalStat(pathname);
  if (!stat) return;
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Refusing to replace non-file or linked catalog: ${pathname}`);
  const current = JSON.parse(readFileSync(pathname, 'utf8'));
  if (current.name !== expectedName) throw new Error(`Refusing to replace marketplace '${current.name}' at ${pathname}.`);
  const names = current.plugins?.map((entry) => entry?.name) ?? [];
  if (names.some((name) => !allowedPlugins.includes(name)) || new Set(names).size !== names.length) {
    throw new Error(`Refusing to replace unexpected plugin entries in ${pathname}.`);
  }
}

function validatePluginOutput(id, manifestRelativePath) {
  const target = path.join(PLUGINS_ROOT, id);
  const stat = optionalStat(target);
  if (!stat) return;
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Refusing to replace non-directory or linked plugin output: ${target}`);
  const manifestPath = path.join(target, manifestRelativePath);
  if (!existsSync(manifestPath)) throw new Error(`Refusing to replace plugin output without its manifest: ${target}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.name !== id) throw new Error(`Refusing to replace ${target}; its manifest name is '${manifest.name}'.`);
}

function validateOutputLocations() {
  requireDirectoryIfPresent(PLUGINS_ROOT);
  for (const folder of [path.join(PLUGIN_ROOT, '.agents'), path.dirname(CODEX_CATALOG), path.dirname(CLAUDE_CATALOG)]) {
    requireDirectoryIfPresent(folder);
  }
  for (const { id } of CODEX_PLUGINS) validatePluginOutput(id, '.codex-plugin/plugin.json');
  validatePluginOutput(CLAUDE_PLUGIN.id, '.claude-plugin/plugin.json');
  validateCatalog(CODEX_CATALOG, 'vectora', CODEX_PLUGINS.map(({ id }) => id));
  validateCatalog(CLAUDE_CATALOG, 'vectora', [CLAUDE_PLUGIN.id]);
}

function listFiles(directory, prefix = '') {
  const files = [];
  for (const name of readdirSync(directory).sort()) {
    const fullPath = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(fullPath);
    if (stat.isSymbolicLink()) throw new Error(`Generated marketplace trees cannot contain symlinks: ${fullPath}`);
    if (stat.isDirectory()) files.push(...listFiles(fullPath, relative));
    else if (stat.isFile()) files.push(relative);
    else throw new Error(`Unsupported generated filesystem entry: ${fullPath}`);
  }
  return files;
}

function treesMatch(actualRoot, expectedRoot) {
  const actualStat = optionalStat(actualRoot);
  if (!actualStat?.isDirectory() || actualStat.isSymbolicLink()) return false;
  let actualFiles;
  let expectedFiles;
  try {
    actualFiles = listFiles(actualRoot);
    expectedFiles = listFiles(expectedRoot);
  } catch {
    return false;
  }
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) return false;
  return actualFiles.every((file) => readFileSync(path.join(actualRoot, file)).equals(readFileSync(path.join(expectedRoot, file))));
}

function stageMarketplace(stageRoot) {
  for (const plugin of CODEX_PLUGINS) {
    copyCodexPlugin(path.join(stageRoot, plugin.id), plugin.platform, plugin);
  }
  buildClaudePlugin(path.join(stageRoot, CLAUDE_PLUGIN.id));
}

export function buildMarketplace({ check = false } = {}) {
  validateOutputLocations();
  const stageRoot = mkdtempSync(path.join(os.tmpdir(), 'vectora-marketplace-'));
  try {
    stageMarketplace(stageRoot);
    const expectedCatalogs = new Map([
      [CODEX_CATALOG, codexMarketplaceText()],
      [CLAUDE_CATALOG, claudeMarketplaceText()],
    ]);
    const plugins = [...CODEX_PLUGINS.map(({ id }) => id), CLAUDE_PLUGIN.id];

    if (check) {
      const drift = [];
      for (const id of plugins) {
        if (!treesMatch(path.join(PLUGINS_ROOT, id), path.join(stageRoot, id))) drift.push(`plugins/${id}`);
      }
      for (const [pathname, expected] of expectedCatalogs) {
        const stat = optionalStat(pathname);
        if (!stat?.isFile() || stat.isSymbolicLink() || !readFileSync(pathname).equals(Buffer.from(expected))) {
          drift.push(path.relative(PLUGIN_ROOT, pathname).split(path.sep).join('/'));
        }
      }
      if (drift.length) throw new Error(`Marketplace output is stale: ${drift.join(', ')}. Run node scripts/build-marketplace.mjs.`);
      buildGeminiExtension({ check: true });
      return { checked: true, plugins, catalogs: ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json'], extensions: ['gemini-extension.json'] };
    }

    mkdirSync(PLUGINS_ROOT, { recursive: true });
    for (const id of plugins) {
      const target = path.join(PLUGINS_ROOT, id);
      rmSync(target, { recursive: true, force: true });
      cpSync(path.join(stageRoot, id), target, { recursive: true });
    }
    for (const [pathname, contents] of expectedCatalogs) {
      mkdirSync(path.dirname(pathname), { recursive: true });
      writeFileSync(pathname, contents, 'utf8');
    }
    buildGeminiExtension();
    return { checked: false, plugins, catalogs: ['.agents/plugins/marketplace.json', '.claude-plugin/marketplace.json'], extensions: ['gemini-extension.json'] };
  } finally {
    rmSync(stageRoot, { recursive: true, force: true });
  }
}

const invokedPath = process.argv[1] && path.resolve(process.argv[1]);
if (invokedPath === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--check') || args.length > 1) {
    throw new Error('Usage: node scripts/build-marketplace.mjs [--check]');
  }
  const result = buildMarketplace({ check: args.includes('--check') });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
