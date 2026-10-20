#!/usr/bin/env node
/** Validate a selected prose FrameText payload and normalize Fabric style ranges. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const PROVENANCE_SCHEMA = 'vectora.style-provenance/v1';
const FRAME_TEXT_KEYS = new Set([
  'text', 'underlines', 'inlineBlanks', 'verticalGroups', 'fontWeight', 'fontStyle',
  'inlineBoxes', 'inlineBoxSpacing', 'styles', 'styleProvenance', 'widthMm', 'fontPt',
  'tracking', 'lineHeight', 'textAlign', 'fill', 'fontFamily', 'textFlow', 'textFlowBounds',
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function fail(message) {
  throw new TypeError(message);
}

function segmentGraphemes(text) {
  if (typeof Intl.Segmenter !== 'function') fail('Intl.Segmenter is required to index logical graphemes safely.');
  const normalized = text.replace(/\r\n|\r/gu, '\n');
  return Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(normalized), item => item.segment);
}

function positionsFor(graphemes) {
  let line = 0;
  let column = 0;
  return graphemes.map(value => {
    const position = {line, column};
    if (value === '\n') {
      line += 1;
      column = 0;
    } else {
      column += 1;
    }
    return position;
  });
}

function validateRange(range, label, length, {cannotCrossNewline = false, graphemes} = {}) {
  if (!isRecord(range) || !Number.isInteger(range.start) || !Number.isInteger(range.end)
      || range.start < 0 || range.end <= range.start || range.end > length) {
    fail(`${label} must use an in-bounds logical grapheme range.`);
  }
  if (cannotCrossNewline && graphemes.slice(range.start, range.end).includes('\n')) {
    fail(`${label} cannot cross an explicit newline.`);
  }
}

function validateProvenance(value) {
  if (!isRecord(value) || value.schema !== PROVENANCE_SCHEMA || !Array.isArray(value.explicit)
      || !Array.isArray(value.automatic)
      || ![...value.explicit, ...value.automatic].every(path => typeof path === 'string' && path.length <= 500)) {
    fail(`styleProvenance must use ${PROVENANCE_SCHEMA} with explicit and automatic string arrays.`);
  }
}

function nativeArrayPositions(graphemes, positions) {
  const result = [];
  for (let index = 0; index < graphemes.length; index += 1) {
    if (graphemes[index] !== '\n') result.push(positions[index]);
  }
  return result;
}

function validateInput(input, graphemes, positions, nativePositions) {
  if (!isRecord(input)) fail('Input must be one FrameText rich-text object with a text string.');
  for (const key of Object.keys(input)) {
    if (!FRAME_TEXT_KEYS.has(key)) fail(`Unsupported FrameText field: ${key}`);
    if (['__proto__', 'prototype', 'constructor'].includes(key)) fail(`Unsafe FrameText field: ${key}`);
  }
  if (typeof input.text !== 'string') fail('FrameText.text must be a string.');
  if (/\r(?!\n)/u.test(input.text)) fail('FrameText.text contains a bare CR whose line indexing differs between Vectora and Fabric; resolve it in the source first.');
  if (input.fontFamily !== undefined && typeof input.fontFamily !== 'string') fail('FrameText.fontFamily must be a string when present.');
  if (input.styleProvenance !== undefined) validateProvenance(input.styleProvenance);

  for (const [key, noNewline] of [['underlines', true], ['verticalGroups', true]]) {
    if (input[key] === undefined) continue;
    if (!Array.isArray(input[key])) fail(`FrameText.${key} must be an array.`);
    for (const [index, range] of input[key].entries()) {
      validateRange(range, `FrameText.${key}[${index}]`, graphemes.length, {
        cannotCrossNewline: noNewline, graphemes,
      });
      if (key === 'underlines' && range.double !== undefined && typeof range.double !== 'boolean') {
        fail(`FrameText.underlines[${index}].double must be a boolean.`);
      }
    }
  }
  if (input.inlineBlanks !== undefined) {
    if (!Array.isArray(input.inlineBlanks)) fail('FrameText.inlineBlanks must be an array.');
    for (const [index, blank] of input.inlineBlanks.entries()) {
      if (!isRecord(blank) || !Number.isInteger(blank.at) || blank.at < 0 || blank.at > graphemes.length) {
        fail(`FrameText.inlineBlanks[${index}].at must be an in-bounds logical grapheme position.`);
      }
    }
  }
  if (input.inlineBoxes !== undefined) {
    if (!Array.isArray(input.inlineBoxes)) fail('FrameText.inlineBoxes must be an array.');
    const seen = new Set();
    for (const [index, box] of input.inlineBoxes.entries()) {
      if (!isRecord(box) || !Number.isInteger(box.at) || box.at < 0 || graphemes[box.at] !== '\uFFFC' || seen.has(box.at)) {
        fail(`FrameText.inlineBoxes[${index}].at must uniquely address a U+FFFC grapheme.`);
      }
      seen.add(box.at);
    }
  }

  const styles = input.styles;
  if (styles === undefined) return;
  if (Array.isArray(styles)) {
    let previousEnd = 0;
    for (const [index, run] of styles.entries()) {
      if (!isRecord(run) || Object.keys(run).some(key => !['start', 'end', 'style'].includes(key)) || !isRecord(run.style)) {
        fail(`FrameText.styles[${index}] must contain only start, end, and a style object.`);
      }
      if (!Number.isInteger(run.start) || !Number.isInteger(run.end) || run.start < 0
          || run.end <= run.start || run.end > nativePositions.length) {
        fail(`FrameText.styles[${index}] must use an in-bounds Fabric serialized grapheme range (newlines excluded).`);
      }
      if (run.start < previousEnd) {
        fail('FrameText.styles array ranges must be sorted and non-overlapping, as required by Fabric stylesFromArray.');
      }
      previousEnd = run.end;
    }
    return;
  }
  if (!isRecord(styles)) fail('FrameText.styles must be a range array or a line/character style map.');
  const validPositions = new Set();
  positions.forEach((position, index) => {
    if (graphemes[index] !== '\n') validPositions.add(`${position.line}:${position.column}`);
  });
  for (const [lineKey, lineStyles] of Object.entries(styles)) {
    if (!/^(0|[1-9]\d*)$/u.test(lineKey) || !isRecord(lineStyles)) fail('FrameText.styles map keys must be numeric line and character indexes.');
    const line = Number(lineKey);
    for (const [columnKey, style] of Object.entries(lineStyles)) {
      if (!/^(0|[1-9]\d*)$/u.test(columnKey) || !isRecord(style)) fail('FrameText.styles map keys must be numeric line and character indexes.');
      const column = Number(columnKey);
      if (!validPositions.has(`${line}:${column}`)) {
        fail(`FrameText.styles[${lineKey}][${columnKey}] is outside the text.`);
      }
    }
  }
}

function leafPaths(value, prefix = '') {
  const result = [];
  const visit = (item, currentPath) => {
    if (item && typeof item === 'object') {
      for (const [key, child] of Object.entries(item)) {
        if (!currentPath && key === 'styleProvenance') continue;
        visit(child, currentPath ? `${currentPath}.${key}` : key);
      }
    } else if (item !== undefined) {
      result.push(currentPath);
    }
  };
  visit(value, prefix);
  return result;
}

function mapPathForNativeIndex(nativeIndex, nativePositions) {
  const position = nativePositions[nativeIndex];
  return `styles.${position.line}.${position.column}`;
}

function arrayStylesToMap(styles, nativePositions) {
  const mapped = {};
  for (const run of styles) {
    for (let index = run.start; index < run.end; index += 1) {
      const position = nativePositions[index];
      mapped[position.line] ??= {};
      mapped[position.line][position.column] = structuredClone(run.style);
    }
  }
  return mapped;
}

function remapArrayProvenance(paths, styles, nativePositions) {
  const mapped = [];
  for (const provenancePath of paths) {
    const structural = /^styles\.(\d+)\.(?:start|end)$/u.exec(provenancePath);
    if (structural) {
      if (Number(structural[1]) >= styles.length) fail(`styleProvenance references missing array range: ${provenancePath}`);
      continue;
    }
    const styleValue = /^styles\.(\d+)\.style\.(.+)$/u.exec(provenancePath);
    if (styleValue) {
      const runIndex = Number(styleValue[1]);
      const run = styles[runIndex];
      if (!run || !leafPaths(run.style).includes(styleValue[2])) {
        fail(`styleProvenance array style path cannot be mapped exactly: ${provenancePath}`);
      }
      for (let index = run.start; index < run.end; index += 1) {
        mapped.push(`${mapPathForNativeIndex(index, nativePositions)}.${styleValue[2]}`);
      }
      continue;
    }
    if (provenancePath.startsWith('styles.')) {
      fail(`styleProvenance array path cannot be mapped exactly: ${provenancePath}`);
    }
    mapped.push(provenancePath);
  }
  return mapped;
}

function normalizedProvenance(input, stylesAreArray, nativePositions) {
  const prior = input.styleProvenance;
  const explicit = prior ? [...prior.explicit] : leafPaths(input);
  const automatic = prior ? [...prior.automatic] : [];
  return {
    schema: PROVENANCE_SCHEMA,
    explicit: stylesAreArray ? remapArrayProvenance(explicit, input.styles, nativePositions) : explicit,
    automatic: stylesAreArray ? remapArrayProvenance(automatic, input.styles, nativePositions) : automatic,
  };
}

/** Pure transformation for one already-selected prose FrameText payload. */
export function prepareProse(input) {
  if (!isRecord(input) || typeof input.text !== 'string') fail('Input must be one FrameText rich-text object with a text string.');
  const graphemes = segmentGraphemes(input.text);
  const positions = positionsFor(graphemes);
  const nativePositions = nativeArrayPositions(graphemes, positions);
  validateInput(input, graphemes, positions, nativePositions);

  const isArrayStyles = Array.isArray(input.styles);
  const output = structuredClone(input);
  if (isArrayStyles) {
    output.styles = arrayStylesToMap(input.styles, nativePositions);
    if (input.styleProvenance) {
      output.styleProvenance = normalizedProvenance(input, true, nativePositions);
    }
  }
  return output;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/prepare_prose.mjs --input rich-text.json [--output prepared.json]',
    '  node scripts/prepare_prose.mjs --text-file prose.txt [--output prepared.json]',
    '  node scripts/prepare_prose.mjs --text "plain prose" [--output prepared.json]',
    '  node scripts/prepare_prose.mjs --input - < rich-text.json',
    'Input must be one already-selected prose object; output is a validated FrameText rich-text payload.',
    'Existing text and formatting are preserved; Fabric serialized style ranges are mapped to line/character styles.',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help')) {
    console.log(usage());
    return;
  }
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--input', '--text', '--text-file', '--output'].includes(flag)) fail(`Unknown option: ${flag}`);
    if (Object.hasOwn(options, flag)) fail(`Option may be provided once: ${flag}`);
    if (index + 1 >= argv.length) fail(`Missing value for ${flag}`);
    options[flag] = argv[++index];
  }
  const inputFlags = ['--input', '--text', '--text-file'].filter(flag => Object.hasOwn(options, flag));
  if (inputFlags.length !== 1) fail('Choose exactly one of --input, --text, or --text-file.');

  const selected = inputFlags[0];
  let input;
  let inputPath;
  if (selected === '--input') {
    inputPath = options[selected] === '-' ? undefined : path.resolve(options[selected]);
    const raw = options[selected] === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(inputPath, 'utf8');
    input = JSON.parse(raw);
  } else if (selected === '--text-file') {
    inputPath = path.resolve(options[selected]);
    input = {text: fs.readFileSync(inputPath, 'utf8')};
  } else {
    input = {text: options[selected]};
  }

  let outputPath;
  if (options['--output'] !== undefined) {
    outputPath = path.resolve(options['--output']);
    if (inputPath && outputPath === inputPath) fail('Output must not overwrite its input file.');
  }
  const serialized = `${JSON.stringify(prepareProse(input), null, 2)}\n`;
  if (outputPath) fs.writeFileSync(outputPath, serialized, {flag: 'wx'});
  else process.stdout.write(serialized);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
