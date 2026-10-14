import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Imports (including node -e, stdin and removed entrypoints) must not launch a CLI.
export function isDirectInvocation(url) {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(url));
  } catch {
    return false;
  }
}

export function inheritExit(child, label) {
  child.once('error', (error) => {
    process.stderr.write(`${label}: ${error.message}\n`);
    process.exitCode = 69;
  });
  child.once('exit', (code, signal) => {
    if (signal) {
      // Retain signal failures as well as numeric exit codes for CLI callers.
      process.exitCode = 1;
      process.kill(process.pid, signal);
    } else {
      process.exitCode = Number.isInteger(code) ? code : 1;
    }
  });
  return child;
}
