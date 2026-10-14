#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inheritExit, isDirectInvocation } from './process-utils.mjs';

const HELPER_ROOT = fileURLToPath(new URL('../../plugins/vectora/skills/create-kice-illustration/scripts/', import.meta.url));
const HELPERS = new Set(['build_graph.mjs', 'build_text_frame.mjs', 'trace_artwork.mjs', 'audit_svg.py']);

export function createHelperSpec(name, args = [], platform = process.platform) {
  if (!HELPERS.has(name)) {
    throw new Error(`Usage: node scripts/gemini/run-helper.mjs <${[...HELPERS].join('|')}> [helper arguments]`);
  }
  const helperPath = path.join(HELPER_ROOT, name);
  if (name === 'audit_svg.py') {
    // Its bundled fontTools is self-contained; do not import site/user packages,
    // write bytecode into the extension, or install a Python interpreter.
    return {
      command: platform === 'win32' ? 'py' : 'python3',
      args: [...(platform === 'win32' ? ['-3'] : []), '-I', '-S', '-B', helperPath, ...args],
    };
  }
  return { command: process.execPath, args: [helperPath, ...args] };
}

export function runHelper(name, args = [], { platform = process.platform, spawnProcess = spawn } = {}) {
  const spec = createHelperSpec(name, args, platform);
  // Keep cwd and arguments intact, so relative source/output paths retain meaning.
  return inheritExit(spawnProcess(spec.command, spec.args, {
    stdio: 'inherit',
    windowsHide: true,
  }), 'Vectora Gemini helper');
}

if (isDirectInvocation(import.meta.url)) {
  try {
    runHelper(process.argv[2], process.argv.slice(3));
  } catch (error) {
    process.stderr.write(`Vectora Gemini helper: ${error.message}\n`);
    process.exitCode = 64;
  }
}
