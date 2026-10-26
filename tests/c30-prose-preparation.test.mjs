import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {prepareProse} from '../skills/create-kice-illustration/scripts/prepare_prose.mjs';

const LEGACY_BODY = 'UND v3.0 Body';
const SCRIPT = fileURLToPath(new URL('../skills/create-kice-illustration/scripts/prepare_prose.mjs', import.meta.url));
const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROVENANCE_SCHEMA = 'vectora.style-provenance/v1';

function resolveAppRoot() {
  const candidates = [
    process.env.VECTORA_APP_ROOT,
    path.resolve(TEST_DIRECTORY, '../../vectora-source'),
    path.resolve(TEST_DIRECTORY, '../..'),
  ].filter(Boolean).map(candidate => path.resolve(candidate));
  for (const candidate of new Set(candidates)) {
    if (!['src/production/rich-text.ts', 'src/production/text.ts'].every(file => fs.existsSync(path.join(candidate, file)))) continue;
    try {
      const appRequire = createRequire(path.join(candidate, 'src/production/rich-text.ts'));
      for (const dependency of ['fabric', 'esbuild', 'jsdom']) appRequire.resolve(dependency);
      return candidate;
    } catch {
      // A source-only checkout cannot run the actual native integration case.
    }
  }
  return undefined;
}

const APP_ROOT = resolveAppRoot();
const APP_REQUIRE = APP_ROOT ? createRequire(path.join(APP_ROOT, 'src/production/rich-text.ts')) : undefined;
const APP_SKIP_REASON = APP_ROOT ? false : 'Private Vectora app source/dependencies absent; set VECTORA_APP_ROOT to enable native integration.';
const FRAME_TEXT_KEYS = new Set([
  'text', 'underlines', 'inlineBlanks', 'verticalGroups', 'fontWeight', 'fontStyle',
  'inlineBoxes', 'inlineBoxSpacing', 'styles', 'styleProvenance', 'widthMm', 'fontPt',
  'tracking', 'lineHeight', 'textAlign', 'fill', 'fontFamily', 'textFlow', 'textFlowBounds',
  'textProfile', 'horizontalScale', 'leadingPercent', 'leadingPt', 'paragraphLayouts', 'paragraphIndents',
]);

function graphemes(text) {
  return Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(text.replace(/\r\n|\r/gu, '\n')), item => item.segment);
}

function indexOfGrapheme(text, substring) {
  const chars = graphemes(text);
  const sub = graphemes(substring);
  outer: for (let start = 0; start <= chars.length - sub.length; start += 1) {
    for (let offset = 0; offset < sub.length; offset += 1) if (chars[start + offset] !== sub[offset]) continue outer;
    return start;
  }
  throw new Error(`Substring not found: ${substring}`);
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

let actualAppPromise;
async function actualApp() {
  actualAppPromise ??= (async () => {
    const {JSDOM} = APP_REQUIRE('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    const fabric = APP_REQUIRE('fabric');
    const esbuild = APP_REQUIRE('esbuild');
    const NodeModule = APP_REQUIRE('node:module').Module;

    async function compileAppModule(relativePath) {
      const filename = path.join(APP_ROOT, relativePath);
      const result = await esbuild.build({
        entryPoints: [filename], bundle: true, write: false,
        platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent',
      });
      const compiled = new NodeModule(filename);
      compiled.filename = filename;
      compiled.paths = NodeModule._nodeModulePaths(path.dirname(filename));
      compiled._compile(result.outputFiles[0].text, filename);
      return compiled.exports;
    }

    return {
      fabric,
      richText: await compileAppModule('src/production/rich-text.ts'),
      text: await compileAppModule('src/production/text.ts'),
    };
  })();
  return actualAppPromise;
}

test('mixed prose, CRLF, combining graphemes, and inline metadata pass through without typography edits', () => {
  const text = '한글 X재 12 + cafe\u0301\r\nR&D\u2002Z\uFFFC끝';
  const boxAt = indexOfGrapheme(text, '\uFFFC');
  const xAt = indexOfGrapheme(text, 'X');
  const input = deepFreeze({
    text,
    inlineBoxes: [{at: boxAt, label: '(가)', widthMm: 8}],
    inlineBlanks: [{at: graphemes(text).length, widthMm: 12, underline: true}],
    underlines: [{start: xAt, end: xAt + 1}],
  });
  const original = structuredClone(input);
  const result = prepareProse(input);

  assert.deepEqual(result, original);
  assert.deepEqual(input, original, 'the helper does not mutate the supplied object');
  assert.equal(result.text, text, 'CRLF and source text are preserved byte-for-byte');
  assert.equal(graphemes('e\u0301').length, 1, 'a decomposed accented letter is one logical grapheme');
  assert.equal(Object.hasOwn(result, 'styles'), false, 'unstyled prose receives no inferred character styles');
  assert.equal(Object.hasOwn(result, 'fontFamily'), false);
});

test('supplied text profile and explicit typography and paragraph metadata pass through without defaults', () => {
  const input = {
    text: '본문\u2002다음',
    textProfile: 'und-batang-body-11_5-v1',
    fontPt: 12.25,
    horizontalScale: 93,
    leadingPt: 13.125,
    paragraphLayouts: [{paragraphStart: 0, at: 0, end: 4, paragraphEnd: 5, firstLineIndentMm: 2}],
    paragraphIndents: [{paragraphStart: 0, at: 0, xMm: 1}],
    underlines: [{start: 0, end: 2}],
    inlineBlanks: [{at: 5, widthMm: 10}],
  };
  assert.deepEqual(prepareProse(input), input);

  const plain = prepareProse({text: '별도 프로필 없는 산문'});
  assert.equal(Object.hasOwn(plain, 'fontPt'), false, 'the helper does not inject the historical 8pt size');
  assert.equal(Object.hasOwn(plain, 'textProfile'), false);
});

test('new text profile identifiers pass through unchanged without inferred typography or defaults', () => {
  // Replaces unknown-ID rejection: only the connected app can validate its current profile registry.
  for (const textProfile of ['new-registered-style-v2', 'und-unknown-v1', 'custom-serif-bold-18pt-v2', ' profile-v2 ', 'p'.repeat(256)]) {
    const input = deepFreeze({text: '본문', textProfile});
    assert.deepEqual(prepareProse(input), input);
  }

  const explicit = deepFreeze({
    text: '본문', textProfile: 'new-registered-style-v2', leadingPt: 13.125,
    fontFamily: 'Explicit Family', fontPt: 12.25, horizontalScale: 93,
    styles: {0: {0: {fontWeight: 700}}},
  });
  assert.deepEqual(prepareProse(explicit), explicit, 'a new profile name does not override supplied fields or styles');
});

test('text profile identifiers reject nonstrings, empty or whitespace-only values, and excessive length', () => {
  for (const textProfile of [undefined, null, false, 0, [], {}, '', ' \t\n ', 'p'.repeat(257)]) {
    assert.throws(() => prepareProse({text: '본문', textProfile}), {
      name: 'TypeError', message: /textProfile.*nonempty string.*256/u,
    });
  }
  assert.deepEqual(prepareProse({text: '본문'}), {text: '본문'}, 'an omitted profile remains optional');
});

test('the original four text profile identifiers remain compatible without adding defaults', () => {
  // Historical compatibility fixtures, not a registry used to accept or reject newer profiles.
  for (const textProfile of ['und-illust-8-v1', 'und-box-prose-10-v1', 'und-batang-body-11_5-v1', 'und-batang-table-10-v1']) {
    const input = {text: '본문', textProfile};
    assert.deepEqual(prepareProse(input), input);
  }
});

test('current FrameText leadingPercent is accepted and validates finite positive percentage bounds', () => {
  for (const leadingPercent of [0.01, 130, 10000]) {
    const input = {text: '본문', leadingPercent};
    assert.deepEqual(prepareProse(input), input, 'the helper preserves an explicit valid percentage');
  }
  for (const leadingPercent of [0, -1, 10000.01, NaN, Infinity, '130', null]) {
    assert.throws(() => prepareProse({text: '본문', leadingPercent}), {
      name: 'TypeError', message: /leadingPercent.*finite.*greater than 0.*at most 10000/u,
    });
  }
});

test('FrameText rejects general-style leading and preserves explicit leadingPt, profile, and styles without defaults', () => {
  assert.throws(() => prepareProse({text: '본문', leading: 17.5}), /Unsupported FrameText field: leading/u);

  const input = {
    text: '본문',
    textProfile: 'und-batang-body-11_5-v1',
    leadingPt: 13.125,
    fontPt: 12.25,
    horizontalScale: 93,
    styles: [{start: 0, end: 1, style: {fontWeight: 700}}],
  };
  assert.deepEqual(prepareProse(input), {
    text: '본문',
    textProfile: 'und-batang-body-11_5-v1',
    leadingPt: 13.125,
    fontPt: 12.25,
    horizontalScale: 93,
    styles: {0: {0: {fontWeight: 700}}},
  });
});

test('Fabric serialized ranges become line/character styles while explicit formatting and inline tokens remain intact', () => {
  const text = 'Cafe\u0301\r\nX\uFFFC Y재';
  const boxAt = indexOfGrapheme(text, '\uFFFC');
  const input = {
    text,
    textProfile: 'und-box-prose-10-v1',
    fontPt: 9.5,
    horizontalScale: 96,
    leadingPt: 15.25,
    styles: [
      {start: 0, end: 4, style: {fontWeight: 700, fontStyle: 'italic', horizontalScale: 95}},
      {start: 4, end: 5, style: {fontFamily: LEGACY_BODY, fontWeight: 600}},
      {start: 7, end: 8, style: {fontStyle: 'italic'}},
    ],
    inlineBoxes: [{at: boxAt, label: '(가)', widthMm: 8}],
  };
  const originalJson = JSON.stringify(input);
  const result = prepareProse(input);

  assert.equal(JSON.stringify(input), originalJson, 'the original serialized payload remains unchanged');
  assert.equal(result.textProfile, input.textProfile);
  assert.equal(result.fontPt, input.fontPt);
  assert.equal(result.horizontalScale, input.horizontalScale);
  assert.equal(result.leadingPt, input.leadingPt);
  assert.ok(!Array.isArray(result.styles));
  assert.equal(Object.hasOwn(result, 'styleProvenance'), false, 'the helper does not invent provenance for input styles');
  assert.deepEqual(result.styles, {
    0: {
      0: {fontWeight: 700, fontStyle: 'italic', horizontalScale: 95},
      1: {fontWeight: 700, fontStyle: 'italic', horizontalScale: 95},
      2: {fontWeight: 700, fontStyle: 'italic', horizontalScale: 95},
      3: {fontWeight: 700, fontStyle: 'italic', horizontalScale: 95},
    },
    1: {
      0: {fontFamily: LEGACY_BODY, fontWeight: 600},
      3: {fontStyle: 'italic'},
    },
  });
  assert.equal(result.styles[1][1], undefined, 'the U+FFFC inline token is not styled by inference');
  assert.equal(result.styles[1][2], undefined, 'the space remains unstyled');
  assert.deepEqual(result.inlineBoxes, input.inlineBoxes);
  assert.equal(result.text, text, 'CRLF remains in the original text');
  assert.deepEqual(prepareProse(result), result, 'the map form is stable when passed through again');
  assert.deepEqual(result.styles[0][0], input.styles[0].style, 'an existing 95% scale is preserved exactly');
  assert.ok(!Object.values(result.styles[1]).some(style => Object.hasOwn(style, 'horizontalScale')),
    'the helper does not add horizontal scale to other style fields');

  const multiline = prepareProse({text: 'A\nB', styles: [{start: 1, end: 2, style: {fontWeight: 700}}]});
  assert.deepEqual(multiline.styles, {1: {0: {fontWeight: 700}}}, 'Fabric array index 1 maps to B because newlines are excluded');
});

test('serialized and logical ranges reject invalid bounds, newline crossings, and ambiguous source newlines', () => {
  assert.throws(() => prepareProse({text: 'abc', styles: [{start: 1, end: 4, style: {fontWeight: 700}}]}), /in-bounds/u);
  assert.throws(() => prepareProse({text: 'abc', styles: [{start: 2, end: 2, style: {fill: '#000'}}]}), /in-bounds/u);
  assert.throws(() => prepareProse({text: 'A\nB', styles: [{start: 2, end: 3, style: {fontWeight: 700}}]}), /newlines excluded/u);
  assert.throws(() => prepareProse({text: 'A\nB', styles: [
    {start: 0, end: 2, style: {fontWeight: 700}}, {start: 1, end: 2, style: {fontStyle: 'italic'}},
  ]}), /sorted and non-overlapping/u);
  assert.throws(() => prepareProse({text: 'A\nB', styles: [
    {start: 1, end: 2, style: {fontWeight: 700}}, {start: 0, end: 1, style: {fontStyle: 'italic'}},
  ]}), /sorted and non-overlapping/u);
  assert.throws(() => prepareProse({text: 'a\nb', underlines: [{start: 0, end: 3}]}), /cannot cross/u);
  assert.throws(() => prepareProse({text: 'abc', underlines: [{start: 1, end: 4}]}), /in-bounds/u);
  assert.throws(() => prepareProse({text: 'a\rb'}), /bare CR/u);
  assert.throws(() => prepareProse({text: 'abc', styleProvenance: {schema: 'wrong', explicit: [], automatic: []}}), /styleProvenance/u);
});

test('existing legacy Body styles and their provenance are preserved without spreading to nearby text', () => {
  const arrayInput = {
    text: 'A B C',
    styles: [{start: 0, end: 2, style: {fontFamily: LEGACY_BODY, fontWeight: 700}}],
    styleProvenance: {
      schema: PROVENANCE_SCHEMA,
      explicit: ['styles.0.style.fontWeight'],
      automatic: ['fontPt', 'styles.0.style.fontFamily', 'styles.0.start', 'styles.0.end', 'fontPt'],
    },
  };
  const result = prepareProse(arrayInput);

  assert.deepEqual(result.styles, {
    0: {
      0: {fontFamily: LEGACY_BODY, fontWeight: 700},
      1: {fontFamily: LEGACY_BODY, fontWeight: 700},
    },
  });
  assert.deepEqual(result.styleProvenance, {
    schema: PROVENANCE_SCHEMA,
    explicit: ['styles.0.0.fontWeight', 'styles.0.1.fontWeight'],
    automatic: ['fontPt', 'styles.0.0.fontFamily', 'styles.0.1.fontFamily', 'fontPt'],
  });
  assert.equal(result.styles[0][2], undefined, 'characters outside the input run stay unstyled');
  assert.equal(result.styles[0][4], undefined, 'later Latin text receives no replayed automatic style');
  assert.deepEqual(prepareProse(result), result);

  const automaticTrace = {
    text: 'A B',
    styles: {0: {0: {fontFamily: LEGACY_BODY}}},
    styleProvenance: {
      schema: PROVENANCE_SCHEMA,
      explicit: [],
      automatic: ['styles.0.0.fontFamily'],
    },
  };
  assert.deepEqual(prepareProse(automaticTrace), automaticTrace,
    'an existing automatically attributed Body character remains local and is not applied again');

  const explicitBase = {
    text: 'Latin 한글',
    fontFamily: LEGACY_BODY,
    styleProvenance: {schema: PROVENANCE_SCHEMA, explicit: ['fontFamily'], automatic: []},
  };
  assert.deepEqual(prepareProse(explicitBase), explicitBase, 'an explicit legacy base family is preserved');

  assert.throws(() => prepareProse({
    text: 'A', styles: [{start: 0, end: 1, style: {fontWeight: 700}}],
    styleProvenance: {schema: PROVENANCE_SCHEMA, explicit: ['styles.4.style.fontWeight'], automatic: []},
  }), /cannot be mapped exactly/u);
});

test('actual Vectora normalization and Fabric agree on multiline style maps', {skip: APP_SKIP_REASON}, async () => {
  const text = 'Bold cafe\u0301\nX\uFFFC Y재';
  const input = {
    text,
    styles: [
      {start: 0, end: 4, style: {fontWeight: 700, fontStyle: 'italic', underline: true}},
      {start: 5, end: 9, style: {fontStyle: 'italic'}},
      {start: 9, end: 10, style: {fontFamily: 'Example Serif', fontWeight: 600}},
    ],
    inlineBoxes: [{at: indexOfGrapheme(text, '\uFFFC'), label: '(가)', widthMm: 8}],
  };
  const actual = await actualApp();
  const fabricMap = actual.fabric.util.stylesFromArray(input.styles, input.text);
  const directNormalized = actual.richText.normalizeRichTextSpec(input);
  const directStylesWithoutBoxMetadata = structuredClone(directNormalized.styles);
  delete directStylesWithoutBoxMetadata[1][1].vectoraInlineBox;
  if (!Object.keys(directStylesWithoutBoxMetadata[1][1]).length) delete directStylesWithoutBoxMetadata[1][1];
  assert.deepEqual(directStylesWithoutBoxMetadata, fabricMap);

  const prepared = prepareProse(input);
  const nativeNormalized = actual.richText.normalizeRichTextSpec(prepared);
  const nativeStylesWithoutBoxMetadata = structuredClone(nativeNormalized.styles);
  delete nativeStylesWithoutBoxMetadata[1][1].vectoraInlineBox;
  if (!Object.keys(nativeStylesWithoutBoxMetadata[1][1]).length) delete nativeStylesWithoutBoxMetadata[1][1];
  assert.deepEqual(prepared.styles, fabricMap);
  assert.deepEqual(actual.fabric.util.stylesFromArray(prepared.styles, prepared.text), nativeStylesWithoutBoxMetadata);
  assert.equal(nativeNormalized.styles[1][1].vectoraInlineBox.label, '(가)');

  assert.deepEqual(actual.fabric.util.stylesFromArray([{start: 1, end: 2, style: {fontWeight: 700}}], 'A\nB'), {
    1: {0: {fontWeight: 700}},
  });
  await assert.rejects(actual.text.measureText({text: 'a\nb', widthMm: 40, underlines: [{start: 0, end: 3}]}), /강제 개행/u);
});

test('CLI preserves plain text and converts rich serialized styles without typography defaults', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vectora-prose-helper-'));
  const textFile = path.join(directory, 'prose.txt');
  const text = '한글 e\u0301cole\r\n2026!';
  fs.writeFileSync(textFile, text);
  try {
    const child = spawnSync(process.execPath, [SCRIPT, '--text-file', textFile], {encoding: 'utf8'});
    assert.equal(child.status, 0, child.stderr);
    const result = JSON.parse(child.stdout);
    assert.deepEqual(result, {text});
    for (const key of Object.keys(result)) assert.ok(FRAME_TEXT_KEYS.has(key), `supported FrameText field ${key}`);

    const rich = {
      text: '한 A',
      styles: [{start: 1, end: 2, style: {fontFamily: LEGACY_BODY, horizontalScale: 95}}],
    };
    const jsonChild = spawnSync(process.execPath, [SCRIPT, '--input', '-'], {
      input: JSON.stringify(rich), encoding: 'utf8',
    });
    assert.equal(jsonChild.status, 0, jsonChild.stderr);
    const richResult = JSON.parse(jsonChild.stdout);
    assert.deepEqual(richResult.styles, {0: {1: {fontFamily: LEGACY_BODY, horizontalScale: 95}}});
    assert.equal(Object.hasOwn(richResult.styles[0][0] ?? {}, 'horizontalScale'), false);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
