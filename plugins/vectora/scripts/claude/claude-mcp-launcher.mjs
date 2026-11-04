#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function createLaunchSpec(platform, root, systemRoot = process.env.SystemRoot) {
  const scriptRoot = path.join(root, 'scripts');
  if (platform === 'darwin' || platform === 'linux') {
    return {
      command: '/bin/sh',
      args: [path.join(scriptRoot, 'start-mcp.sh')],
    };
  }
  if (platform === 'win32') {
    const command = systemRoot
      ? path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      : 'powershell.exe';
    return {
      command,
      args: ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(scriptRoot, 'start-mcp.ps1')],
    };
  }
  throw new Error(`Vectora MCP supports Claude Desktop and Claude Code on macOS, Windows and Linux (Claude Code); unsupported platform: ${platform}`);
}

export function launchVectoraMcp({ platform = process.platform, root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), env = process.env, spawnProcess = spawn } = {}) {
  const spec = createLaunchSpec(platform, root, env.SystemRoot);
  const childEnv = { ...env };
  delete childEnv.ELECTRON_RUN_AS_NODE;
  const child = spawnProcess(spec.command, spec.args, {
    env: childEnv,
    stdio: 'inherit',
    windowsHide: true,
  });
  child.once('error', (error) => {
    process.stderr.write(`Vectora MCP launcher: ${error.message}\n`);
    process.exitCode = 69;
  });
  child.once('exit', (code, signal) => {
    process.exitCode = Number.isInteger(code) ? code : signal ? 1 : 0;
  });
  return child;
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    launchVectoraMcp();
  } catch (error) {
    process.stderr.write(`Vectora MCP launcher: ${error.message}\n`);
    process.exitCode = 69;
  }
}
