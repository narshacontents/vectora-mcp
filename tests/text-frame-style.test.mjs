import assert from 'node:assert/strict';
import test from 'node:test';
import {buildTextFrame, variants} from '../src/production/frames-core.mjs';

const specs = {
  'newspaper-wave': {contentHeightMm: 30},
  'newspaper-band': {contentHeightMm: 30},
  scroll: {contentHeightMm: 30},
  browser: {contentHeightMm: 30},
  noticeboard: {contentHeightMm: 30},
};

function namedElement(svg, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = svg.match(new RegExp(`<([a-z]+)\\b([^>]*\\bdata-name="${escaped}"[^>]*)\\s*/>`));
  assert.ok(match, `expected an SVG element named ${name}`);
  return Object.fromEntries([...match[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
}

test('all text-frame variants use a black 0.3 pt structural outer stroke', () => {
  assert.deepEqual([...variants].sort(), Object.keys(specs).sort());

  const outerNames = {
    'newspaper-wave': 'paper',
    'newspaper-band': 'paper',
    scroll: 'scroll-paper',
    browser: 'browser-window',
    noticeboard: 'board',
  };

  for (const variant of variants) {
    const {svg} = buildTextFrame({variant, ...specs[variant]});
    const outer = namedElement(svg, outerNames[variant]);
    assert.equal(outer.stroke, '#000000', `${variant} outer stroke`);
    assert.equal(Number(outer['stroke-width']), 0.4, `${variant} outer stroke width in 96 dpi SVG px`);
  }
});

test('newspaper masthead rules use the same black 0.3 pt boundary stroke', () => {
  for (const [variant, names] of [
    ['newspaper-wave', ['masthead-rule']],
    ['newspaper-band', ['masthead-rule-top', 'masthead-rule-bottom']],
  ]) {
    const {svg} = buildTextFrame({variant, ...specs[variant]});
    for (const name of names) {
      const rule = namedElement(svg, name);
      assert.equal(rule.stroke, '#000000', `${name} stroke`);
      assert.equal(Number(rule['stroke-width']), 0.4, `${name} stroke width`);
    }
  }
});

test('decorative gray fills, local shadows, and explicitly colored browser details remain intact', () => {
  const wave = buildTextFrame({variant: 'newspaper-wave', ...specs['newspaper-wave']}).svg;
  assert.equal(namedElement(wave, 'shadow').fill, '#B8B8B8');
  assert.equal(namedElement(wave, 'shadow').stroke, 'none');

  const band = buildTextFrame({variant: 'newspaper-band', ...specs['newspaper-band']}).svg;
  assert.equal(namedElement(band, 'masthead-band').fill, '#CCCCCC');
  assert.equal(namedElement(band, 'masthead-band').stroke, 'none');

  const board = buildTextFrame({variant: 'noticeboard', ...specs.noticeboard}).svg;
  assert.equal(namedElement(board, 'board').fill, '#DEDEDE');
  assert.equal(namedElement(board, 'bevel-top').fill, '#BBBBBB');
  assert.equal(namedElement(board, 'paper-shadow').fill, '#A8A8A8');
  assert.equal(namedElement(board, 'paper-shadow').stroke, 'none');

  const browser = buildTextFrame({variant: 'browser', ...specs.browser}).svg;
  assert.equal(namedElement(browser, 'tab-strip').fill, '#B6B6B6');
  assert.equal(namedElement(browser, 'scrollbar-thumb').fill, '#CCCCCC');
  assert.equal(namedElement(browser, 'scrollbar-thumb').stroke, '#000000');
  assert.equal(Number(namedElement(browser, 'scrollbar-thumb')['stroke-width']), 0.4);
  assert.equal(namedElement(browser, 'navigation-shaft').stroke, '#666666');
});
