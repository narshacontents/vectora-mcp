#!/usr/bin/env node
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectInvocation } from './gemini/process-utils.mjs';

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function buildGeminiExtension({ check = false, root = PLUGIN_ROOT } = {}) {
  const { version } = JSON.parse(readFileSync(path.join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
  if (typeof version !== 'string' || !version.trim()) {
    throw new Error('Missing Vectora plugin version in .codex-plugin/plugin.json.');
  }
  const manifest = {
    name: 'vectora',
    version,
    description: 'Local Vectora MCP and illustration skills for Gemini CLI on macOS and Windows.',
    contextFileName: 'GEMINI.md',
    mcpServers: {
      vectora: {
        command: 'node',
        args: ['${extensionPath}/scripts/gemini/gemini-mcp-launcher.mjs'],
        cwd: '${extensionPath}',
      },
    },
  };
  // Gemini discovers the existing root skills/ directory; no client skill copies.
  const expected = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestPath = path.join(root, 'gemini-extension.json');
  let stat;
  try {
    stat = lstatSync(manifestPath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (stat && (!stat.isFile() || stat.isSymbolicLink())) {
    throw new Error(`Refusing non-file or linked Gemini manifest: ${manifestPath}`);
  }
  const current = stat ? readFileSync(manifestPath, 'utf8') : undefined;
  if (check && current !== expected) {
    throw new Error('Gemini extension manifest is missing or stale: gemini-extension.json. Run node scripts/build-gemini-extension.mjs.');
  }
  if (!check && current !== expected) writeFileSync(manifestPath, expected, 'utf8');
  return { checked: check, version, manifest: 'gemini-extension.json' };
}

if (isDirectInvocation(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || args.some((arg) => arg !== '--check')) {
      throw new Error('Usage: node scripts/build-gemini-extension.mjs [--check]');
    }
    process.stdout.write(`${JSON.stringify(buildGeminiExtension({ check: args.includes('--check') }), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`Vectora Gemini extension: ${error.message}\n`);
    process.exitCode = 1;
  }
}
