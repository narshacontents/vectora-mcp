import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixtures/c30-worksheet-request.json', import.meta.url), 'utf8'));

test('native worksheet routing preserves rich text and existing table/graph child inference', () => {
  const request = structuredClone(fixture);
  const result = prepareTask(request);
  assert.deepEqual(request, fixture);
  assert.deepEqual(result.resolved.map(unit => unit.recipe), ['worksheet', 'bar', 'table']);

  const worksheet = result.resolved[0];
  assert.equal(worksheet.variant, 'worksheet');
  assert.ok(worksheet.contains.includes('underline'));
  assert.ok(worksheet.contains.includes('inline-box'));
  assert.ok(worksheet.contains.includes('reserve'));
  for (const path of [
    'units[0].spec.worksheet.fields[0].label.underlines',
    'units[0].spec.worksheet.fields[0].value.inlineBoxes',
    'units[0].spec.worksheet.footer.styles[0].style.doubleUnderline',
    'units[0].spec.blocks[0].text.underlines',
    'units[0].spec.blocks[4].text.underlines',
    'units[0].spec.blocks[4].label.underlines',
    'units[0].spec.blocks[4].lines',
  ]) assert.ok(worksheet.inference.some(item => item.path === path), path);

  assert.ok(result.resolved[2].contains.includes('underline'));
  assert.ok(result.resolved[2].inference.some(item => item.path.endsWith('.cells[0].richText.underlines')));
});

test('response placeholders stay distinct from inline boxes; only explicit dimensions or lines infer reservation', () => {
  const plain = prepareTask({units: [{
    recipe: 'worksheet',
    spec: {kind: 'text', variant: 'worksheet', blocks: [{type: 'response', id: 'plain', text: '(가)'}]},
  }]});
  assert.ok(!plain.resolved[0].contains.includes('inline-box'));
  assert.ok(!plain.resolved[0].contains.includes('reserve'));
  assert.throws(() => prepareTask({units: [{
    recipe: 'newspaper',
    spec: {kind: 'text', variant: 'newspaper-wave', blocks: [{type: 'response', id: 'unsupported', text: '(가)'}]},
  }]}), /unsupported block type/);

  for (const [key, value] of [['widthMm', 36], ['heightMm', 12], ['lines', 2]]) {
    const result = prepareTask({units: [{
      recipe: 'worksheet',
      spec: {kind: 'text', variant: 'worksheet', blocks: [{type: 'response', id: 'explicit', text: '(가)', [key]: value}]},
    }]});
    assert.ok(result.resolved[0].contains.includes('reserve'), key);
    assert.ok(result.resolved[0].inference.some(item => item.path.endsWith(`.blocks[0].${key}`) && item.inferred === 'reserve'), key);
    assert.ok(!result.resolved[0].contains.includes('inline-box'), key);
  }
});
