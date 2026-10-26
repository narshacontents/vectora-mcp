import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

test('diagonal table header strings use display-text traversal without mutation or recipe guessing', () => {
  const request = {units: [{recipe: 'table', spec: {
    kind: 'table',
    cells: [{
      id: 'header-cell',
      text: '',
      diagonalHeader: {
        upperRight: '○○신문: 자료 `inline:code` https://example.test/path?q=1:2',
        lowerLeft: '12:30',
        metadata: {text: '숨김: 대각선 메타데이터'},
        extra: '숨김: 추가 필드',
        arbitrary: {text: '숨김: 임의 객체'},
      },
      metadata: {text: '숨김: 셀 메타데이터'},
      source: {text: '숨김: 원문 출처'},
    }],
  }}]};
  const before = structuredClone(request);
  const result = prepareTask(request);
  const unit = result.resolved[0];
  const paths = {
    upperRight: 'units[0].spec.cells[0].diagonalHeader.upperRight',
    lowerLeft: 'units[0].spec.cells[0].diagonalHeader.lowerLeft',
  };

  assert.deepEqual(request, before, 'preparation leaves source strings and metadata unchanged');
  assert.deepEqual(unit.inference.filter(item => item.inferred === 'text').map(item => item.path), [
    paths.upperRight,
    paths.lowerLeft,
  ]);
  assert.equal(unit.subtype, 'D1-01_Flat', 'diagonal labels alone do not select Cross');
  assert.deepEqual(result.inputReview.scope.inspectedPaths, [
    'units[0].spec.cells[0].text',
    paths.upperRight,
    paths.lowerLeft,
  ]);
  assert.deepEqual(result.inputReview.warnings.map(({ruleId, path, missing}) => [ruleId, path, missing]), [
    ['display-colon-spacing', paths.upperRight, ['before-U+2002']],
    ['symbol-label-half-space', paths.upperRight, ['between-symbol-group-and-Hangul-U+2002']],
    ['display-colon-spacing', paths.lowerLeft, ['before-U+2002', 'after-U+2002']],
  ]);
  assert.equal(result.inputReview.autoFixApplied, false);
  assert.ok(!unit.inference.some(item => /metadata|source|arbitrary|\.extra/u.test(item.path)));
  assert.ok(!result.inputReview.scope.inspectedPaths.some(path => /metadata|source|arbitrary|\.extra/u.test(path)));
  assert.ok(!result.inputReview.warnings.some(warning => warning.excerpt.includes('숨김')),
    'inline code, URLs, and non-display metadata stay outside spacing review');

  for (const recipe of ['D1-03_Cross', 'D1-04_Nested']) {
    const explicit = prepareTask({units: [{recipe, spec: structuredClone(request.units[0].spec)}]}).resolved[0];
    assert.equal(explicit.recipe, recipe);
    assert.equal(explicit.subtype, recipe);
  }

  const omitted = prepareTask({units: [{recipe: 'table', spec: {
    kind: 'table',
    cells: [{text: '', metadata: {text: '숨김: 메타데이터'}}],
  }}]});
  assert.deepEqual(omitted.inputReview.scope.inspectedPaths, ['units[0].spec.cells[0].text']);
  assert.deepEqual(omitted.inputReview.warnings, []);
  assert.deepEqual(omitted.resolved[0].inference, []);
  assert.equal(omitted.resolved[0].subtype, 'D1-01_Flat');
});
