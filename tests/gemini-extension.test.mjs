import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import {
  chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync,
  readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildGeminiExtension } from '../scripts/build-gemini-extension.mjs';
import { launchVectoraMcp } from '../scripts/gemini/gemini-mcp-launcher.mjs';
import { createHelperSpec, runHelper } from '../scripts/gemini/run-helper.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const helperRelative = 'plugins/vectora/skills/create-kice-illustration';
const bridgeFiles = [
  'scripts/build-gemini-extension.mjs',
  'scripts/gemini/gemini-mcp-launcher.mjs',
  'scripts/gemini/run-helper.mjs',
  'scripts/gemini/process-utils.mjs',
  'scripts/claude/claude-mcp-launcher.mjs',
  'scripts/start-mcp.sh',
  'scripts/start-mcp.ps1',
  'GEMINI.md',
];

function temporary(t) {
  const directory = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'Vectora Gemini 한글 space-')));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function put(root, relative, contents) {
  const target = path.join(root, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
  return target;
}

function copyBridge(root) {
  for (const relative of bridgeFiles) {
    mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    cpSync(path.join(repositoryRoot, relative), path.join(root, relative));
  }
}

function snapshot(root, prefix = '') {
  return readdirSync(root).sort().flatMap((name) => {
    const absolute = path.join(root, name);
    const relative = path.join(prefix, name);
    const stat = lstatSync(absolute);
    if (stat.isDirectory()) return snapshot(absolute, relative);
    return [{ relative, mtime: stat.mtimeMs, hash: createHash('sha256').update(readFileSync(absolute)).digest('hex') }];
  });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 15000, ...options });
  assert.ifError(result.error);
  return { status: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr };
}

function writeVersion(root, version) {
  put(root, '.codex-plugin/plugin.json', JSON.stringify({ name: 'vectora', version }));
}

test('Gemini build writes only the root manifest, retains canonical skills, and reads the current version', (t) => {
  const root = temporary(t);
  writeVersion(root, '9.8.7-test.1');
  put(root, 'skills/use-vectora/SKILL.md', 'canonical skill\n');
  put(root, 'skills/create-kice-illustration/SKILL.md', 'canonical KICE skill\n');
  put(root, 'plugins/vectora/keep.txt', 'existing marketplace payload\n');
  put(root, '.gemini/settings.json', '{"sentinel":true}\n');
  const before = snapshot(root);
  assert.equal(buildGeminiExtension({ root }).version, '9.8.7-test.1');
  assert.deepEqual(snapshot(root).filter(({ relative }) => relative !== 'gemini-extension.json'), before);

  const manifestPath = path.join(root, 'gemini-extension.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.name, 'vectora');
  assert.equal(manifest.version, '9.8.7-test.1');
  assert.equal(manifest.contextFileName, 'GEMINI.md');
  assert.deepEqual(manifest.mcpServers, {
    vectora: {
      command: 'node',
      args: ['${extensionPath}/scripts/gemini/gemini-mcp-launcher.mjs'],
      cwd: '${extensionPath}',
    },
  });
  assert.deepEqual(Object.keys(manifest).sort(), ['contextFileName', 'description', 'mcpServers', 'name', 'version']);
  const built = snapshot(root);
  assert.equal(buildGeminiExtension({ root, check: true }).checked, true);
  buildGeminiExtension({ root });
  assert.deepEqual(snapshot(root), built, 'check and an up-to-date build must not rewrite any file');

  writeVersion(root, '9.8.8');
  assert.throws(() => buildGeminiExtension({ root, check: true }), /missing or stale/);
  assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8')).version, '9.8.7-test.1');
  buildGeminiExtension({ root });
  assert.equal(JSON.parse(readFileSync(manifestPath, 'utf8')).version, '9.8.8');
});

test('Gemini check reports missing, malformed and stale manifests without mutation', (t) => {
  const root = temporary(t);
  writeVersion(root, '1.0.0');
  for (const current of [undefined, '{invalid json', '{"version":"old"}\n']) {
    if (current !== undefined) put(root, 'gemini-extension.json', current);
    const before = snapshot(root);
    assert.throws(() => buildGeminiExtension({ check: true, root }), /gemini-extension.json/);
    assert.deepEqual(snapshot(root), before);
  }
  writeVersion(root, undefined);
  const before = snapshot(root);
  assert.throws(() => buildGeminiExtension({ root }), /Missing Vectora plugin version/);
  assert.deepEqual(snapshot(root), before);
});

test('Gemini build refuses directory and linked output paths', (t) => {
  const root = temporary(t);
  writeVersion(root, '1.0.0');
  const target = path.join(root, 'gemini-extension.json');
  mkdirSync(target);
  for (const check of [false, true]) {
    assert.throws(() => buildGeminiExtension({ root, check }), /non-file or linked/);
  }
  if (process.platform === 'win32') return; // File symlinks can require elevation on Windows.
  rmSync(target, { recursive: true });
  const external = put(root, 'external.json', 'do not overwrite');
  symlinkSync(external, target);
  for (const check of [false, true]) {
    assert.throws(() => buildGeminiExtension({ root, check }), /non-file or linked/);
  }
  assert.equal(readFileSync(external, 'utf8'), 'do not overwrite');
});

test('copied Gemini build CLI is portable and --check never generates missing output', (t) => {
  const root = path.join(temporary(t), 'installed extension 한글');
  copyBridge(root);
  writeVersion(root, '2.3.4');
  const builder = path.join(root, 'scripts/build-gemini-extension.mjs');
  const before = snapshot(root);
  const checked = run(process.execPath, [builder, '--check'], { cwd: os.tmpdir() });
  assert.equal(checked.status, 1);
  assert.match(checked.stderr, /missing or stale/);
  assert.deepEqual(snapshot(root), before);
  assert.equal(run(process.execPath, [builder, '--unknown']).status, 1);
  assert.deepEqual(snapshot(root), before);
  const built = run(process.execPath, [builder], { cwd: os.tmpdir() });
  assert.equal(built.status, 0, built.stderr);
  assert.equal(JSON.parse(built.stdout).version, '2.3.4');
  const generated = snapshot(root);
  assert.equal(run(process.execPath, [builder, '--check']).status, 0);
  assert.deepEqual(snapshot(root), generated);
});

test('importing copied Gemini entrypoints is safe without a real invocation path', (t) => {
  const root = temporary(t);
  copyBridge(root);
  const before = snapshot(root);
  for (const entry of [undefined, '-', path.join(root, 'removed-entry.mjs')]) {
    const source = `process.argv[1] = ${JSON.stringify(entry) ?? 'undefined'};
      for (const url of ${JSON.stringify(bridgeFiles.filter((file) => file.endsWith('.mjs') && !file.includes('/claude/')).map((file) => pathToFileURL(path.join(root, file)).href))}) await import(url);`;
    const result = run(process.execPath, ['--input-type=module', '-e', source]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  }
  assert.deepEqual(snapshot(root), before);
});

test('Gemini launcher retains literal Unicode/spaced paths and established Windows process flags', async () => {
  const root = path.join(path.parse(repositoryRoot).root, 'Gemini 한글 space $() & path');
  for (const platform of ['darwin', 'win32']) {
    for (const systemRoot of ['', path.join(path.parse(root).root, 'Windows 경로')]) {
      const env = { SystemRoot: systemRoot, ELECTRON_RUN_AS_NODE: '1', PATH: 'keep-this' };
      const child = new EventEmitter();
      const calls = [];
      const launched = await launchVectoraMcp({ platform, root, env,
        spawnProcess(command, args, options) {
          calls.push({ command, args, options });
          return child;
        },
      });
      assert.equal(launched, child);
      assert.equal(calls.length, 1);
      const { command, args, options } = calls[0];
      assert.equal(command, platform === 'darwin' ? '/bin/sh' : systemRoot
        ? path.join(systemRoot, 'System32/WindowsPowerShell/v1.0/powershell.exe') : 'powershell.exe');
      assert.deepEqual(args, platform === 'darwin' ? [path.join(root, 'scripts/start-mcp.sh')] : [
        '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts/start-mcp.ps1'),
      ]);
      assert.deepEqual(options.env, { SystemRoot: systemRoot, PATH: 'keep-this' });
      assert.equal(env.ELECTRON_RUN_AS_NODE, '1');
      assert.equal(options.stdio, 'inherit');
      assert.equal(options.windowsHide, true);
      assert.ok(!options.shell);
    }
  }
});

test('Gemini launcher rejects unsupported platforms before spawning with accurate client diagnostics', async () => {
  for (const platform of ['linux', 'freebsd']) {
    await assert.rejects(launchVectoraMcp({ platform, spawnProcess() { assert.fail('must not launch'); } }), (error) => {
      assert.match(error.message, new RegExp(`Gemini CLI.*unsupported platform: ${platform}`));
      assert.doesNotMatch(error.message, /Claude/);
      return true;
    });
  }
});

test('copied launcher CLI reports an unsupported OS without stdout or an import stack trace', (t) => {
  const root = temporary(t);
  copyBridge(root);
  const launcher = path.join(root, 'scripts/gemini/gemini-mcp-launcher.mjs');
  const source = `Object.defineProperty(process, 'platform', {value: 'linux'});
    process.argv[1] = ${JSON.stringify(launcher)};
    await import(${JSON.stringify(pathToFileURL(launcher).href)});`;
  const result = run(process.execPath, ['--input-type=module', '-e', source]);
  assert.equal(result.status, 69);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'Vectora Gemini MCP launcher: Vectora MCP for Gemini CLI supports macOS and Windows; unsupported platform: linux\n');
});

test('copied launcher and symlink reach a stub app through the persisted path with exact stdio and exit status', {
  skip: process.platform !== 'darwin' && 'macOS app-finder execution requires macOS; Windows launch specification is tested separately',
}, (t) => {
  const temporaryRoot = temporary(t);
  const root = path.join(temporaryRoot, 'extension 한글 $() & space');
  copyBridge(root);
  const fakeHome = path.join(temporaryRoot, 'isolated home');
  const app = path.join(temporaryRoot, "Vectora 한글 ' $() & space.app");
  put(app, 'Contents/Info.plist', '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleShortVersionString</key><string>1.4.3</string></dict></plist>');
  const executable = put(app, 'Contents/MacOS/Vectora', `#!/bin/sh
if [ -n "\${ELECTRON_RUN_AS_NODE:-}" ]; then exit 90; fi
printf 'stub:%s:%s:%s\n' "$#" "$1" "$PWD"
cat
printf 'stub diagnostic\n' >&2
exit 37
`);
  chmodSync(executable, 0o755);
  put(fakeHome, 'Library/Application Support/Vectora/mcp-app-path', `${app}\n`);
  const launcher = path.join(root, 'scripts/gemini/gemini-mcp-launcher.mjs');
  const link = path.join(temporaryRoot, 'linked launcher.mjs');
  symlinkSync(launcher, link);
  for (const entry of [launcher, link]) {
    const result = run(process.execPath, [entry], {
      cwd: temporaryRoot,
      input: 'json-rpc request 한글\n',
      env: { HOME: fakeHome, PATH: process.env.PATH, ELECTRON_RUN_AS_NODE: '1' },
    });
    assert.equal(result.status, 37, result.stderr);
    assert.equal(result.stdout, `stub:1:--mcp-stdio:${temporaryRoot}\njson-rpc request 한글\n`);
    assert.equal(result.stderr, 'stub diagnostic\n');
  }
});

test('Gemini helper dispatcher is bounded and uses Python only for audit', () => {
  for (const name of [undefined, '', '../build_graph.mjs', 'scripts/build_graph.mjs', '/tmp/audit_svg.py',
    'prepare_rules.mjs', 'map-template-edit.py', '__proto__', '--help', 'build_graph.mjs;echo injected']) {
    assert.throws(() => runHelper(name, [], { spawnProcess() { assert.fail('must not spawn'); } }), /Usage:/);
  }
  const args = ['--spec', '한글 input ; $().json', '--output', 'space output.svg', '', '--force'];
  for (const name of ['build_graph.mjs', 'build_text_frame.mjs', 'trace_artwork.mjs', 'audit_svg.py']) {
    for (const platform of ['darwin', 'win32']) {
      const spec = createHelperSpec(name, args, platform);
      const helper = path.join(repositoryRoot, helperRelative, 'scripts', name);
      assert.equal(spec.command, name === 'audit_svg.py' ? platform === 'win32' ? 'py' : 'python3' : process.execPath);
      assert.deepEqual(spec.args, [...(name === 'audit_svg.py' ? [...(platform === 'win32' ? ['-3'] : []), '-I', '-S', '-B'] : []), helper, ...args]);
      const child = new EventEmitter();
      assert.equal(runHelper(name, args, { platform, spawnProcess(command, childArgs, options) {
        assert.equal(command, spec.command);
        assert.deepEqual(childArgs, spec.args);
        assert.equal(options.cwd, undefined, 'inherit the caller working directory');
        assert.ok(!options.shell);
        assert.equal(options.stdio, 'inherit');
        return child;
      } }), child);
    }
  }
});

test('copied helper wrapper preserves arbitrary arguments, stdin, numeric failures and signal failures', (t) => {
  const root = temporary(t);
  copyBridge(root);
  put(root, `${helperRelative}/scripts/build_text_frame.mjs`, `import {readFileSync} from 'node:fs';
    process.stdout.write(JSON.stringify({args:process.argv.slice(2), cwd:process.cwd(), input:readFileSync(0,'utf8')}));
    process.stderr.write('helper diagnostic\\n');
    if(process.argv[2]==='signal')process.kill(process.pid,'SIGTERM');
    else process.exitCode=23;`);
  const wrapper = path.join(root, 'scripts/gemini/run-helper.mjs');
  const modes = process.platform === 'win32' ? ['exit'] : ['exit', 'signal'];
  for (const mode of modes) {
    const args = [mode, '', '한글 spaced ; $() & argument', '--literal-option'];
    const result = run(process.execPath, [wrapper, 'build_text_frame.mjs', ...args], { cwd: root, input: 'stdin 한글\n' });
    assert.equal(result.status, mode === 'signal' ? null : 23);
    assert.equal(result.signal, mode === 'signal' ? 'SIGTERM' : null);
    assert.deepEqual(JSON.parse(result.stdout), { args, cwd: root, input: 'stdin 한글\n' });
    assert.equal(result.stderr, 'helper diagnostic\n');
  }
});

test('copied helper payload preserves real outputs, failures and cwd without root dependencies or client docs', async (t) => {
  const base = temporary(t);
  const root = path.join(base, 'portable extension');
  copyBridge(root);
  const localSkill = path.join(root, helperRelative);
  for (const relative of ['scripts', 'node_modules', 'vendor/python']) {
    const target = path.join(localSkill, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(repositoryRoot, helperRelative, relative), target, { recursive: true,
      filter: (source) => !source.split(path.sep).includes('__pycache__') && !source.endsWith('.pyc'),
    });
  }
  assert.ok(!existsSync(path.join(root, 'node_modules')));
  assert.ok(!existsSync(path.join(root, 'src')));
  assert.ok(!existsSync(path.join(localSkill, 'SKILL.md')));
  assert.ok(!existsSync(path.join(localSkill, 'references')));
  const cwd = path.join(base, 'working 한글 directory');
  mkdirSync(cwd);
  const wrapper = path.join(root, 'scripts/gemini/run-helper.mjs');
  const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
  const pythonPrefix = [...(process.platform === 'win32' ? ['-3'] : []), '-I', '-S', '-B'];

  function compare(name, args, outputs = [], extraOptions = {}) {
    const direct = run(name.endsWith('.py') ? pythonCommand : process.execPath,
      [...(name.endsWith('.py') ? pythonPrefix : []), path.join(localSkill, 'scripts', name), ...args], { cwd, ...extraOptions });
    const expectedFiles = outputs.map((relative) => {
      const filename = path.join(cwd, relative);
      const bytes = readFileSync(filename);
      rmSync(filename);
      return bytes;
    });
    const wrapped = run(process.execPath, [wrapper, name, ...args], { cwd, ...extraOptions });
    assert.deepEqual(wrapped, direct);
    outputs.forEach((relative, i) => assert.deepEqual(readFileSync(path.join(cwd, relative)), expectedFiles[i]));
    return wrapped;
  }

  await t.test('Node helpers execute without Python and frame output paths stay relative to caller', () => {
    const env = { ...process.env, PATH: '' };
    assert.equal(compare('build_graph.mjs', ['--help'], [], { env }).status, 0);
    put(cwd, '입력 ; $().json', JSON.stringify({ variant: 'scroll', widthMm: 60, contentHeightMm: 25 }));
    const args = ['--spec', '입력 ; $().json', '--output', '결과 space.svg'];
    const result = compare('build_text_frame.mjs', args, ['결과 space.svg', '결과 space.layout.json'], { env });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).svg, path.join(cwd, '결과 space.svg'));
    const collision = compare('build_text_frame.mjs', args, [], { env });
    assert.equal(collision.status, 1);
    assert.match(collision.stderr, /Output already exists/);
    assert.equal(compare('build_text_frame.mjs', [...args, '--force'], ['결과 space.svg', '결과 space.layout.json'], { env }).status, 0);
    const invalid = compare('build_graph.mjs', [], [], { env });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /Use --spec and --output/);
  });

  await t.test('vendored raster tracing resolves dependencies after copy and retains arguments', () => {
    const makePng = `const {createRequire}=require('node:module');
      const req=createRequire(process.argv[1]); const {PNG}=req('pngjs');
      const png=new PNG({width:32,height:32});
      for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,v=x>=8&&x<24&&y>=8&&y<24?0:255;png.data.set([v,v,v,255],i);}
      require('node:fs').writeFileSync('입력 image.png',PNG.sync.write(png));`;
    assert.equal(run(process.execPath, ['-e', makePng, path.join(localSkill, 'scripts/trace_artwork.mjs')], { cwd }).status, 0);
    const args = ['입력 image.png', 'trace 한글.svg', '--width-mm', '42', '--colors', '4', '--ink', '0'];
    const traced = compare('trace_artwork.mjs', args, ['trace 한글.svg', 'trace 한글.trace.json'], { env: { ...process.env, PATH: '' } });
    assert.equal(traced.status, 0, traced.stderr);
    assert.equal(JSON.parse(traced.stdout).widthMm, 42);
    assert.equal(JSON.parse(traced.stdout).grayLevels, 4);
    assert.match(readFileSync(path.join(cwd, 'trace 한글.svg'), 'utf8'), /<path\b/);
    const collision = compare('trace_artwork.mjs', args);
    assert.equal(collision.status, 1);
    assert.match(collision.stderr, /Output exists/);
  });

  await t.test('Python audit uses vendored fontTools and retains success, report and argparse failures', () => {
    put(cwd, 'audit 한글.svg', '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L5 5"/></svg>');
    const passed = compare('audit_svg.py', ['audit 한글.svg', '--output', 'report 한글.json'], ['report 한글.json']);
    assert.equal(passed.status, 0, passed.stderr);
    assert.equal(JSON.parse(passed.stdout)[0].passed, true);
    put(cwd, 'bad.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>');
    const failed = compare('audit_svg.py', ['bad.svg', '--output', 'bad report.json'], ['bad report.json']);
    assert.equal(failed.status, 1);
    assert.equal(JSON.parse(failed.stdout)[0].passed, false);
    assert.equal(compare('audit_svg.py', ['--unknown']).status, 2);
    assert.ok(!snapshot(localSkill).some(({ relative }) => relative.includes('__pycache__')));
  });

  await t.test('graph uses copied fontkit and production sources with an explicit test font', () => {
    // Synthetic metrics fixture only; this does not validate installed UND fonts.
    const fontSource = `import sys
sys.path.insert(0, sys.argv[1])
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
b = FontBuilder(1000, isTTF=True)
cmap = {code: "glyph" + str(code) for code in range(32, 127)}
glyphs = [".notdef", *cmap.values()]
b.setupGlyphOrder(glyphs)
b.setupCharacterMap(cmap)
b.setupGlyf({name: TTGlyphPen(None).glyph() for name in glyphs})
b.setupHorizontalMetrics({name: (600, 0) for name in glyphs})
b.setupHorizontalHeader(ascent=800, descent=-200)
b.setupNameTable({"familyName": "TestOnly", "styleName": "Regular", "psName": "UNDv30-Regular"})
b.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
b.setupPost()
b.setupMaxp()
b.save(sys.argv[2])
`;
    const fontResult = run(pythonCommand, [...pythonPrefix, '-c', fontSource, path.join(localSkill, 'vendor/python'), 'fixture 한글.ttf'], { cwd });
    assert.equal(fontResult.status, 0, fontResult.stderr);
    put(cwd, 'graph input.json', JSON.stringify({ type: 'bar', layout: 'horizontal', dataFidelity: 'exact',
      categories: ['A'], series: [{ label: 'B', fill: '#AAAAAA', values: [10] }],
      domain: [0, 10], ticks: [0, 5, 10], grid: true, unit: '%', legend: 'none' }));
    const args = ['--spec', 'graph input.json', '--output', 'graph 한글.svg', '--font', 'fixture 한글.ttf'];
    const result = compare('build_graph.mjs', args, ['graph 한글.svg', 'graph 한글.layout.json']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).requiresVisualReview, true);
    const wrongFont = compare('build_graph.mjs', [...args.slice(0, -1), 'missing.ttf', '--force']);
    assert.equal(wrongFont.status, 1);
    assert.match(wrongFont.stderr, /missing.ttf/);
  });

  await t.test('missing Python reports failure without auto-installing or changing the extension', {
    skip: process.platform === 'win32' && 'Windows can resolve py.exe from system directories even with an empty PATH',
  }, () => {
    const before = snapshot(root);
    const result = run(process.execPath, [wrapper, 'audit_svg.py', '--help'], { cwd, env: { ...process.env, PATH: '' } });
    assert.equal(result.status, 69);
    assert.match(result.stderr, /Vectora Gemini helper:.*ENOENT/);
    assert.deepEqual(snapshot(root), before);
  });

  await t.test('allowlist rejects traversal and CLI options before starting a helper', () => {
    for (const name of ['../audit_svg.py', 'prepare_rules.mjs', '--eval']) {
      const result = run(process.execPath, [wrapper, name], { cwd });
      assert.equal(result.status, 64);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Usage:/);
    }
  });
});
