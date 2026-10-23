import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { buildClaudePlugin } from '../scripts/build-claude-packages.mjs';
import { patchWindowsGraphFontLookup, PLUGIN_ROOT } from '../scripts/build-packages.mjs';
import { findFont as findCanonicalFont } from '../skills/create-kice-illustration/scripts/build_graph.mjs';

const sourceSkill = path.join(PLUGIN_ROOT, 'skills', 'create-kice-illustration');
const spec = {
  type: 'bar', dataFidelity: 'exact', layout: 'horizontal', categories: ['A'],
  series: [{ label: 'A', values: [1] }], domain: [0, 1], ticks: [0, 1],
  legend: 'none', widthMm: 60, plotHeightMm: 20,
};
const makeFontSource = `
import sys
vendor, output, family, postscript = sys.argv[1:]
sys.path.insert(0, vendor)
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

glyphs = ['.notdef', 'A', 'zero', 'one']
builder = FontBuilder(1000, isTTF=True)
builder.setupGlyphOrder(glyphs)
builder.setupCharacterMap({ord('A'): 'A', ord('0'): 'zero', ord('1'): 'one'})
builder.setupGlyf({name: TTGlyphPen(None).glyph() for name in glyphs})
builder.setupHorizontalMetrics({name: (600, 0) for name in glyphs})
builder.setupHorizontalHeader(ascent=800, descent=-200)
builder.setupNameTable({'familyName': family, 'styleName': 'Regular', 'psName': postscript})
builder.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
builder.setupPost()
builder.setupMaxp()
builder.save(output)
font = TTFont(output)
assert font['name'].getDebugName(6) == postscript
assert font.getBestCmap() == {ord('A'): 'A', ord('0'): 'zero', ord('1'): 'one'}
`;

function createFont(output, vendorRoot, family, postscript) {
  mkdirSync(path.dirname(output), { recursive: true });
  const command = process.platform === 'win32' ? 'py' : 'python3';
  const prefix = process.platform === 'win32' ? ['-3'] : [];
  execFileSync(command, [
    ...prefix, '-I', '-S', '-B', '-c', makeFontSource,
    vendorRoot, output, family, postscript,
  ], { encoding: 'utf8' });
}

function withEnvironment(changes, callback) {
  const previous = new Map(Object.keys(changes).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { return callback(); }
  finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('graph helper defaults to v3.1, preserves explicit v3.0, and adapts portable package paths', async (t) => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'vectora-graph-font-closeout-'));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const pluginRoot = path.join(temporary, 'claude-plugin');
  buildClaudePlugin(pluginRoot);
  const skillRoot = path.join(pluginRoot, 'skills', 'create-kice-illustration');
  const helperPath = path.join(skillRoot, 'scripts', 'build_graph.mjs');
  const vendorRoot = path.join(skillRoot, 'vendor', 'python');
  const portable = await import(pathToFileURL(helperPath).href);
  const canonicalV31 = path.join(temporary, 'home', 'Library', 'Fonts', 'UNDv31-Regular.ttf');
  const canonicalV30 = path.join(temporary, 'home', 'Library', 'Fonts', 'UNDv30-Regular.otf');
  const explicitV30 = path.join(temporary, 'explicit', 'legacy-face.otf');
  createFont(canonicalV31, vendorRoot, 'UND v3.1', 'UNDv31-Regular');
  createFont(canonicalV30, vendorRoot, 'UND v3.0', 'UNDv30-Regular');
  createFont(explicitV30, vendorRoot, 'UND v3.0', 'UNDv30-Regular');

  const originalHome = Object.getOwnPropertyDescriptor(os, 'homedir');
  Object.defineProperty(os, 'homedir', { configurable: true, value: () => path.join(temporary, 'home') });
  try {
    assert.equal(findCanonicalFont(), canonicalV31);
    assert.equal(portable.findFont(), canonicalV31);
    assert.equal(portable.findFont(explicitV30), explicitV30);
    const v31Graph = portable.buildGraph(spec);
    assert.equal(v31Graph.report.fontFace, 'UNDv31-Regular');
    assert.deepEqual(
      Object.fromEntries(['textProfile','fontFamily','fontPt','charSpacing','horizontalScale','leadingPercent'].map(key=>[key,v31Graph.report[key]])),
      {textProfile:'und-dotum-8-default-v1',fontFamily:'UND v3.1',fontPt:8,charSpacing:0,horizontalScale:100,leadingPercent:130},
    );
    assert.match(v31Graph.svg, /letter-spacing="0"/);
    assert.match(v31Graph.svg, /font-family="UND v3\.1"/);
    const pointsGraph = portable.buildGraph({
      type: 'points', dataFidelity: 'exact', series: [{ label: 'A', points: [{ x: 0, y: 0 }] }],
      xDomain: [0, 1], yDomain: [0, 1], xTicks: [0, 1], yTicks: [0, 1],
      legend: 'none', grid: false, widthMm: 70, plotHeightMm: 30,
    });
    assert.equal(pointsGraph.report.fontFace, 'UNDv31-Regular');
    assert.deepEqual(
      Object.fromEntries(['textProfile','fontPt','charSpacing','horizontalScale','leadingPercent'].map(key=>[key,pointsGraph.report[key]])),
      {textProfile:'und-dotum-8-default-v1',fontPt:8,charSpacing:0,horizontalScale:100,leadingPercent:130},
    );
    assert.match(pointsGraph.svg, /letter-spacing="0"/);
    assert.match(pointsGraph.svg, /font-family="UND v3\.1"/);
    const v30Graph = portable.buildGraph(spec, { fontPath: explicitV30 });
    assert.equal(v30Graph.report.fontFace, 'UNDv30-Regular');
    assert.equal(v30Graph.report.charSpacing, -60);
    assert.match(v30Graph.svg, /letter-spacing="-0\.64"/);
    assert.match(v30Graph.svg, /font-family="UND v3\.0"/);

    rmSync(canonicalV31);
    assert.throws(() => portable.findFont(), /UNDv31-Regular\.ttf.*no UND v3\.0 fallback/i);
    assert.throws(() => findCanonicalFont(), /UNDv31-Regular\.ttf.*no UND v3\.0 fallback/i);

    const localAppData = path.join(temporary, 'windows-local-app-data');
    const windowsFonts = path.join(localAppData, 'Microsoft', 'Windows', 'Fonts');
    const windowsDir = path.join(temporary, 'windows');
    const windowsSystemFonts = path.join(windowsDir, 'Fonts');
    const windowsUserFont = path.join(windowsFonts, 'UNDv31-Regular.ttf');
    const windowsSystemFont = path.join(windowsSystemFonts, 'UNDv31-Regular.ttf');
    createFont(windowsUserFont, vendorRoot, 'UND v3.1', 'UNDv31-Regular');
    createFont(windowsSystemFont, vendorRoot, 'UND v3.1', 'UNDv31-Regular');
    withEnvironment({ LOCALAPPDATA: localAppData, WINDIR: windowsDir }, () => {
      assert.equal(portable.findFont(), windowsUserFont);
      rmSync(windowsUserFont);
      assert.equal(portable.findFont(), windowsSystemFont);
      rmSync(windowsSystemFont);
      assert.throws(() => portable.findFont(), /UNDv31-Regular\.ttf.*no UND v3\.0 fallback/i);
    });
  } finally {
    if (originalHome) Object.defineProperty(os, 'homedir', originalHome);
  }
});

test('Windows package adapter tracks the canonical helper and reports source drift', async (t) => {
  const temporary = mkdtempSync(path.join(os.tmpdir(), 'vectora-windows-graph-font-'));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const helperRelative = 'skills/create-kice-illustration/scripts/build_graph.mjs';
  const helperPath = path.join(temporary, helperRelative);
  mkdirSync(path.dirname(helperPath), { recursive: true });
  cpSync(path.join(sourceSkill, 'scripts', 'build_graph.mjs'), helperPath);
  const productionRoot = path.join(temporary, 'src', 'production');
  mkdirSync(productionRoot, { recursive: true });
  for (const filename of ['graphs-core.mjs', 'graphs-points.mjs']) {
    cpSync(path.join(PLUGIN_ROOT, 'src', 'production', filename), path.join(productionRoot, filename));
  }
  patchWindowsGraphFontLookup(temporary);
  const windows = await import(`${pathToFileURL(helperPath).href}?windows-adapter`);
  const localAppData = path.join(temporary, 'local-app-data');
  const windowsFonts = path.join(localAppData, 'Microsoft', 'Windows', 'Fonts');
  const windowsDir = path.join(temporary, 'windows');
  const windowsSystemFonts = path.join(windowsDir, 'Fonts');
  const userFont = path.join(windowsFonts, 'UNDv31-Regular.ttf');
  const systemFont = path.join(windowsSystemFonts, 'UNDv31-Regular.ttf');
  mkdirSync(windowsFonts, { recursive: true });
  writeFileSync(userFont, 'fixture font path');
  withEnvironment({ LOCALAPPDATA: localAppData, WINDIR: windowsDir }, () => {
    assert.equal(windows.findFont(), userFont);
    rmSync(userFont);
    mkdirSync(windowsSystemFonts, { recursive: true });
    writeFileSync(systemFont, 'fixture font path');
    assert.equal(windows.findFont(), systemFont);
    rmSync(systemFont);
    mkdirSync(windowsSystemFonts, { recursive: true });
    writeFileSync(path.join(windowsSystemFonts, 'UNDv30-Regular.otf'), 'legacy face must not be a default');
    assert.throws(() => windows.findFont(), /UNDv31-Regular\.ttf.*%LOCALAPPDATA%.*%WINDIR%.*no UND v3\.0 fallback/i);
    const explicit = path.join(temporary, 'explicit-old-font.otf');
    assert.equal(windows.findFont(explicit), explicit);
  });

  const drifted = path.join(temporary, 'drifted');
  const driftedHelper = path.join(drifted, helperRelative);
  mkdirSync(path.dirname(driftedHelper), { recursive: true });
  writeFileSync(driftedHelper, readFileSync(path.join(sourceSkill, 'scripts', 'build_graph.mjs'), 'utf8')
    .replace('UNDv31-Regular.ttf', 'UNDv31-renamed.ttf'));
  assert.throws(() => patchWindowsGraphFontLookup(drifted), /Expected exactly one canonical UND v3\.1 font lookup block/);
});
