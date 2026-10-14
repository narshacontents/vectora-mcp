#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDirectInvocation } from './process-utils.mjs';

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function launchVectoraMcp({ platform = process.platform, root = PLUGIN_ROOT, ...options } = {}) {
  if (platform !== 'darwin' && platform !== 'win32') {
    throw new Error(`Vectora MCP for Gemini CLI supports macOS and Windows; unsupported platform: ${platform}`);
  }
  // Load only when launching: the shared executable also has its own CLI guard.
  // Retain its tested Windows process flags and pass this extension's root explicitly.
  const portable = await import('../claude/claude-mcp-launcher.mjs');
  return portable.launchVectoraMcp({ ...options, platform, root });
}

if (isDirectInvocation(import.meta.url)) {
  try {
    await launchVectoraMcp();
  } catch (error) {
    process.stderr.write(`Vectora Gemini MCP launcher: ${error.message}\n`);
    process.exitCode = 69;
  }
}
