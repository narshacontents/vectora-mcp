import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createMcpConfig, PLUGIN_ROOT } from '../scripts/build-packages.mjs';

function makeMacApp(parent, version) {
  const app = path.join(parent, 'Vectora — 테스트 위치.app');
  const contents = path.join(app, 'Contents');
  const executable = path.join(contents, 'MacOS', 'Vectora');
  mkdirSync(path.dirname(executable), { recursive: true });
  writeFileSync(path.join(contents, 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleShortVersionString</key><string>${version}</string></dict></plist>`);
  writeFileSync(executable, '#!/bin/sh\nprintf "vectora-stdout:%s" "$1"\nprintf "vectora-stderr" >&2\n');
  chmodSync(executable, 0o755);
  return app;
}

function runMacLauncher({ appPath, extraEnv = {} }) {
  const config = createMcpConfig('macos').mcpServers.vectora;
  return spawnSync(config.command, config.args, {
    encoding: 'utf8',
    timeout: 5000,
    env: {
      ...process.env,
      VECTORA_APP_PATH: appPath ?? '',
      ELECTRON_RUN_AS_NODE: '1',
      ...extraEnv,
    },
  });
}

test('macOS MCP launcher passes the stdio argument and keeps diagnostics on stderr', { skip: process.platform !== 'darwin' }, (t) => {
  const temporaryRoot = mkdtempSync(path.join(PLUGIN_ROOT, '.launcher-test-'));
  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));
  const app = makeMacApp(temporaryRoot, '1.0.0');
  const result = runMacLauncher({ appPath: app });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, 'vectora-stdout:--mcp-stdio');
  assert.equal(result.stderr, 'vectora-stderr');
});

test('macOS MCP launcher rejects older and prerelease app versions without writing to stdout', { skip: process.platform !== 'darwin' }, (t) => {
  const temporaryRoot = mkdtempSync(path.join(PLUGIN_ROOT, '.launcher-test-'));
  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));
  for (const version of ['0.9.3', '1.0.0-beta.1']) {
    const app = makeMacApp(path.join(temporaryRoot, version), version);
    const result = runMacLauncher({ appPath: app });
    assert.equal(result.status, 69, `${version}: ${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /1\.0\.0 or later/);
  }
});

test('Windows MCP config uses built-in PowerShell and literal per-user install paths', () => {
  const config = createMcpConfig('windows').mcpServers.vectora;
  assert.equal(config.command, 'powershell.exe');
  assert.deepEqual(config.args.slice(0, 4), ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command']);
  const script = config.args[4];
  assert.match(script, /VECTORA_APP_PATH/);
  assert.match(script, /APPDATA/);
  assert.match(script, /LOCALAPPDATA/);
  assert.match(script, /ProgramFiles/);
  assert.match(script, /Vectora\\mcp-app-path/);
  assert.match(script, /Programs\\Vectora\\Vectora\.exe/);
  assert.match(script, /--mcp-stdio/);
  assert.match(script, /System\.Diagnostics\.Process\]::Start/);
  assert.match(script, /BaseStream\.CopyToAsync/);
  assert.match(script, /exit \$exitCode/);
  assert.match(script, /Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue/);
  assert.ok(script.indexOf('Remove-Item Env:ELECTRON_RUN_AS_NODE') < script.indexOf('[System.Diagnostics.Process]::Start'));
  assert.doesNotMatch(script, /Start-Process/);
  assert.match(script, /Console\]::Error/);
  assert.doesNotMatch(script, /Write-Output|Write-Host|node\.exe|python\.exe/i);
});

test('canonical Windows config fixture matches the launcher config exactly', () => {
  const fixturePath = path.join(PLUGIN_ROOT, 'tests', 'fixtures', 'windows-mcp.json');
  const fixtureText = readFileSync(fixturePath, 'utf8');
  assert.equal(fixtureText, `${JSON.stringify(createMcpConfig('windows'), null, 2)}\n`);
  assert.equal(createHash('sha256').update(fixtureText).digest('hex'), '1fe33cc0aa166e77b9829a9988cdfeb70c906faf494682aa65586d8efb3b589b');
  const decoded = JSON.parse(fixtureText);
  const server = decoded.mcpServers.vectora;
  assert.equal(server.command, 'powershell.exe');
  assert.deepEqual(server.args.slice(0, 4), ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command']);
  assert.match(server.args[4], /VECTORA_APP_PATH/);
  assert.match(server.args[4], /--mcp-stdio/);
});

test('macOS and Windows MCP configs are valid Codex plugin JSON with isolated commands', () => {
  for (const platform of ['macos', 'windows']) {
    const encoded = JSON.stringify(createMcpConfig(platform));
    const decoded = JSON.parse(encoded);
    assert.deepEqual(Object.keys(decoded.mcpServers), ['vectora']);
    assert.ok(decoded.mcpServers.vectora.args.length > 1);
  }
  const windowsText = readFileSync(path.join(PLUGIN_ROOT, 'scripts/start-mcp.ps1'), 'utf8');
  assert.ok(windowsText.includes('VECTORA_APP_PATH'));
});
