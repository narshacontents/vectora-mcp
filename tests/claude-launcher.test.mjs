import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createLaunchSpec, launchVectoraMcp } from '../plugins/vectora/scripts/claude/claude-mcp-launcher.mjs';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, '..');
const marketplacePluginRoot = path.join(repositoryRoot, 'plugins', 'vectora');
const marketplaceLauncher = path.join(marketplacePluginRoot, 'scripts', 'claude', 'claude-mcp-launcher.mjs');

function makeMacApp(parent) {
  const app = path.join(parent, 'Vectora — 테스트 위치.app');
  const contents = path.join(app, 'Contents');
  const executable = path.join(contents, 'MacOS', 'Vectora');
  mkdirSync(path.dirname(executable), { recursive: true });
  writeFileSync(
    path.join(contents, 'Info.plist'),
    '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleShortVersionString</key><string>1.1.2</string></dict></plist>',
  );
  writeFileSync(
    executable,
    '#!/bin/sh\nif [ -n "${ELECTRON_RUN_AS_NODE:-}" ]; then printf "unexpected Electron child mode" >&2; exit 90; fi\nprintf "vectora-stdout:%s" "$1"\nprintf "vectora-stderr" >&2\n',
  );
  chmodSync(executable, 0o755);
  return app;
}

test('Claude macOS launcher passes Unicode and spaced paths as a single shell argument', () => {
  const root = path.join(path.parse(process.cwd()).root, 'Vectora plugin 한글 경로 with spaces');
  const spec = createLaunchSpec('darwin', root);
  assert.equal(spec.command, '/bin/sh');
  assert.deepEqual(spec.args, [path.join(root, 'scripts', 'start-mcp.sh')]);
});

test('Claude Windows launcher passes PowerShell script path as one literal argument', () => {
  const root = path.join(path.parse(process.cwd()).root, 'Vectora plugin 한글 경로 with spaces');
  const spec = createLaunchSpec('win32', root, '');
  assert.equal(spec.command, 'powershell.exe');
  assert.deepEqual(spec.args.slice(0, 5), ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass']);
  assert.equal(spec.args[5], '-File');
  assert.equal(spec.args[6], path.join(root, 'scripts', 'start-mcp.ps1'));
  assert.match(spec.args[6], /한글 경로 with spaces/);
});

test('Claude launcher rejects platforms without a packaged app runner', () => {
  assert.throws(() => createLaunchSpec('freebsd', '/tmp/vectora'), /unsupported platform: freebsd/);
});

test('checked-in Claude marketplace config resolves to a complete plugin and its colocated launcher', () => {
  const catalog = JSON.parse(readFileSync(path.join(repositoryRoot, '.claude-plugin', 'marketplace.json'), 'utf8'));
  const catalogEntry = catalog.plugins?.find((plugin) => plugin.name === 'vectora');
  assert.ok(catalogEntry, 'Claude marketplace catalog must list the Vectora plugin');
  assert.equal(path.resolve(repositoryRoot, catalogEntry.source), marketplacePluginRoot);

  const pluginManifest = JSON.parse(readFileSync(path.join(marketplacePluginRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(pluginManifest.name, catalogEntry.name);
  assert.match(pluginManifest.version, /^\d+\.\d+\.\d+$/);

  const config = JSON.parse(readFileSync(path.join(marketplacePluginRoot, '.mcp.json'), 'utf8'));
  const server = config.mcpServers?.vectora;
  assert.ok(server, 'Claude plugin must configure the vectora MCP server');
  assert.equal(server.type, 'stdio');
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/scripts/claude/claude-mcp-launcher.mjs']);
  const configuredLauncher = server.args[0].replace('${CLAUDE_PLUGIN_ROOT}', marketplacePluginRoot);
  assert.equal(configuredLauncher, marketplaceLauncher);

  for (const relativePath of [
    '.claude-plugin/plugin.json',
    '.mcp.json',
    'CLAUDE_INSTALLATION.md',
    'scripts/claude/claude-mcp-launcher.mjs',
    'scripts/configure-app.sh',
    'scripts/configure-app.ps1',
    'scripts/start-mcp.sh',
    'scripts/start-mcp.ps1',
    'skills/use-vectora/SKILL.md',
    'skills/create-kice-illustration/SKILL.md',
  ]) {
    assert.ok(existsSync(path.join(marketplacePluginRoot, relativePath)), `missing marketplace plugin file: ${relativePath}`);
  }

  const spawnCalls = [];
  const child = { once() { return this; } };
  const launchedChild = launchVectoraMcp({
    platform: 'darwin',
    root: marketplacePluginRoot,
    env: { SystemRoot: '', ELECTRON_RUN_AS_NODE: '1', VECTORA_LAUNCHER_TEST: 'preserved' },
    spawnProcess(command, args, options) {
      spawnCalls.push({ command, args, options });
      return child;
    },
  });
  assert.equal(launchedChild, child);
  assert.equal(spawnCalls.length, 1);
  assert.equal(spawnCalls[0].command, '/bin/sh');
  assert.deepEqual(spawnCalls[0].args, [path.join(marketplacePluginRoot, 'scripts', 'start-mcp.sh')]);
  assert.equal(spawnCalls[0].options.env.ELECTRON_RUN_AS_NODE, undefined);
  assert.equal(spawnCalls[0].options.env.VECTORA_LAUNCHER_TEST, 'preserved');
  assert.equal(spawnCalls[0].options.stdio, 'inherit');
  assert.equal(spawnCalls[0].options.windowsHide, true);
});

test('checked-in Claude marketplace launcher reaches a stub Vectora app through the packaged shell script', {
  skip: process.platform === 'darwin' ? false : 'The executable launcher smoke test requires macOS; the portable marketplace contract runs on every platform.',
}, (t) => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'Vectora Claude 경로 with spaces-'));
  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));
  const appPath = makeMacApp(temporaryRoot);
  const installedPluginRoot = path.join(temporaryRoot, 'Claude 플러그인 설치 경로 with spaces');
  const installedLauncher = path.join(installedPluginRoot, 'scripts', 'claude', 'claude-mcp-launcher.mjs');
  const installedStartScript = path.join(installedPluginRoot, 'scripts', 'start-mcp.sh');
  mkdirSync(path.dirname(installedLauncher), { recursive: true });
  mkdirSync(path.dirname(installedStartScript), { recursive: true });
  copyFileSync(marketplaceLauncher, installedLauncher);
  copyFileSync(path.join(marketplacePluginRoot, 'scripts', 'start-mcp.sh'), installedStartScript);

  const result = spawnSync(process.execPath, [installedLauncher], {
    encoding: 'utf8',
    timeout: 5000,
    env: {
      ...process.env,
      VECTORA_APP_PATH: appPath,
      ELECTRON_RUN_AS_NODE: '1',
    },
  });
  const context = JSON.stringify({ status: result.status, error: result.error?.message, stdout: result.stdout, stderr: result.stderr });
  assert.equal(result.status, 0, context);
  assert.equal(result.stdout, 'vectora-stdout:--mcp-stdio', context);
  assert.equal(result.stderr, 'vectora-stderr', context);
});
