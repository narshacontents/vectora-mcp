import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLUGIN_VERSION = JSON.parse(
  readFileSync(path.join(PLUGIN_ROOT, '.codex-plugin', 'plugin.json'), 'utf8'),
).version;

export function createMcpConfig(platform) {
  if (platform === 'macos') {
    const command = readFileSync(path.join(PLUGIN_ROOT, 'scripts', 'start-mcp.sh'), 'utf8').trimEnd();
    return {
      mcpServers: {
        vectora: {
          command: '/bin/sh',
          args: ['-c', command],
        },
      },
    };
  }

  if (platform === 'windows') {
    const command = readFileSync(path.join(PLUGIN_ROOT, 'scripts', 'start-mcp.ps1'), 'utf8').trimEnd();
    return {
      mcpServers: {
        vectora: {
          command: 'powershell.exe',
          args: ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command],
        },
      },
    };
  }

  throw new Error(`Unsupported Vectora MCP platform: ${platform}`);
}

export function patchWindowsGraphFontLookup(targetRoot) {
  const helperPath = path.join(targetRoot, 'skills', 'create-kice-illustration', 'scripts', 'build_graph.mjs');
  const value = readFileSync(helperPath, 'utf8');
  const oldFontSearch = `export function findFont(explicit){
  if(explicit)return explicit;
  const dir=path.join(os.homedir(),'Library','Fonts');
  const file=fs.existsSync(dir)&&fs.readdirSync(dir).find(n=>/^UNDv31-Regular\\.ttf$/i.test(n));
  check(file,'Installed UNDv31-Regular.ttf not found in ~/Library/Fonts. Supply --font; no UND v3.0 fallback is used.');
  return path.join(dir,file);
}`;
  const newFontSearch = `export function findFont(explicit){
  if(explicit)return explicit;
  const directories=[
    process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Microsoft','Windows','Fonts'),
    process.env.WINDIR&&path.join(process.env.WINDIR,'Fonts'),
  ].filter(Boolean);
  for(const dir of directories){
    const file=fs.existsSync(dir)&&fs.readdirSync(dir).find(n=>/^UNDv31-Regular\\.ttf$/i.test(n));
    if(file)return path.join(dir,file);
  }
  check(false,'Installed UNDv31-Regular.ttf not found in %LOCALAPPDATA%/Microsoft/Windows/Fonts or %WINDIR%/Fonts. Supply --font; no UND v3.0 fallback is used.');
}`;
  if (value.split(oldFontSearch).length !== 2) {
    throw new Error('Expected exactly one canonical UND v3.1 font lookup block before applying the Windows font-path adapter.');
  }
  writeFileSync(helperPath, value.replace(oldFontSearch, newFontSearch), 'utf8');
}

export function patchWindowsAuditFontLookup(targetRoot) {
  const helperPath = path.join(targetRoot, 'skills', 'create-kice-illustration', 'scripts', 'audit_svg.py');
  let value = readFileSync(helperPath, 'utf8');
  const importLine = 'import json\n';
  const oldAnchors = '    anchors = [Path.home() / "Library" / "Fonts"]\n';
  const newAnchors = `    anchors = [
        Path.home() / "Library" / "Fonts",
        Path.home() / "AppData" / "Local" / "Microsoft" / "Windows" / "Fonts",
        Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts",
    ]
`;
  if (value.split(importLine).length !== 2 || value.includes('import os\n')) {
    throw new Error('Expected one canonical audit helper import block before Windows adaptation.');
  }
  if (value.split(oldAnchors).length !== 2) {
    throw new Error('Expected one canonical audit font anchor before Windows adaptation.');
  }
  value = value.replace(importLine, `${importLine}import os\n`)
    .replace(oldAnchors, newAnchors);
  writeFileSync(helperPath, value, 'utf8');
}

export function copyCodexPlugin(targetRoot, platform, { id, displayName }) {
  mkdirSync(targetRoot, { recursive: true });
  const extension = platform === 'macos' ? 'sh' : 'ps1';
  const entries = [
    '.codex-plugin/plugin.json',
    'README.md',
    'assets/vectora.png',
    'skills',
    'src/production/frames-core.mjs',
    'src/production/graphs-core.mjs',
    'src/production/graphs-points.mjs',
    `scripts/start-mcp.${extension}`,
    `scripts/configure-app.${extension}`,
  ];

  for (const name of entries) {
    const source = path.join(PLUGIN_ROOT, name);
    const destination = path.join(targetRoot, name);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, {
      recursive: true,
      filter(sourcePath) {
        const relative = path.relative(PLUGIN_ROOT, sourcePath).split(path.sep).join('/');
        const segments = relative.split('/');
        const base = segments.at(-1) ?? '';
        return !segments.some((segment) => ['.git', 'node_modules', 'release', 'tests', '__pycache__'].includes(segment))
          && base !== '.DS_Store'
          && !base.endsWith('.pyc');
      },
    });
  }

  if (platform === 'windows') {
    patchWindowsGraphFontLookup(targetRoot);
    patchWindowsAuditFontLookup(targetRoot);
  }

  const manifestPath = path.join(targetRoot, '.codex-plugin', 'plugin.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.name = id;
  manifest.version = PLUGIN_VERSION;
  manifest.interface.displayName = displayName;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(path.join(targetRoot, '.mcp.json'), `${JSON.stringify(createMcpConfig(platform), null, 2)}\n`);
}
