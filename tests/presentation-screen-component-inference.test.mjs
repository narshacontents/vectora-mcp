import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const formula = {
  kind: 'schematic',
  layout: 'formula',
  formula: { version: 1, items: [
    { id: 'term', kind: 'text', text: 'A+B' },
    { id: 'fraction', kind: 'fraction', numerator: { text: 'x' }, denominator: { text: '2' } },
  ] },
};

test('screen presentation infers chalkboard, merged table, inline styling, and formula rules', () => {
  const request = {
    units: [{
      recipe: 'presentation',
      specRecipes: { 'spec.screenComponent.blocks[1].spec': 'table' },
      spec: {
        kind: 'dialogue',
        layout: 'presentation',
        presentationMode: 'screen',
        presentationOptions: { layout: 'speech-above-board' },
        speakers: [{ id: 'teacher', label: '교사', labelRichText: { text: '교사' } }],
        turns: [{ id: 'turn', speakerId: 'teacher', text: '표를 보고 설명해 봅시다.' }],
        screenComponent: {
          kind: 'text', variant: 'chalkboard', widthMm: 90,
          title: '핵심 자료',
          blocks: [
            { type: 'text', id: 'paragraph', text: {
              text: '자료를 비교한다.', underlines: [{ start: 0, end: 2 }],
              inlineBoxes: [{ at: 0, label: '핵심', widthMm: 8 }],
            } },
            { type: 'component', id: 'table', spec: {
              kind: 'table',
              rows: [{ id: 'r1' }, { id: 'r2' }],
              columns: [{ id: 'c1' }, { id: 'c2' }],
              cells: [
                { id: 'merged', rowId: 'r1', columnId: 'c1', rowSpan: 2, text: '\uFFFC 핵심', richText: {
                  text: '\uFFFC 핵심', underlines: [{ start: 2, end: 4 }],
                  inlineBoxes: [{ at: 0, label: '가', widthMm: 4 }],
                } },
                { id: 'first', rowId: 'r1', columnId: 'c2', text: '증가' },
                { id: 'second', rowId: 'r2', columnId: 'c2', text: '감소' },
              ],
            } },
            { type: 'component', id: 'formula', spec: structuredClone(formula) },
          ],
        },
      },
    }],
  };
  const before = structuredClone(request);
  const result = prepareTask(request);

  assert.deepEqual(request, before, 'inference and review leave the native spec unchanged');
  const presentation = result.resolved.find(unit => unit.recipe === 'presentation');
  const board = result.resolved.find(unit => unit.specPath === 'units[0].spec.screenComponent');
  const table = result.resolved.find(unit => unit.specPath === 'units[0].spec.screenComponent.blocks[1].spec');
  const inferredFormula = result.resolved.find(unit => unit.specPath === 'units[0].spec.screenComponent.blocks[2].spec');

  assert.ok(presentation);
  assert.ok(presentation.contains.includes('speech-solo'));
  assert.ok(presentation.inference.some(item => item.condition === 'native presentation speech-above-board layout renders every speaker turn as a bubble above the board'));
  assert.ok(presentation.inference.some(item => item.path.endsWith('.speakers[0].labelRichText.text')));
  assert.equal(board.recipe, 'teacher-board');
  assert.equal(board.subtype, 'ITA-5_SoloBoard');
  assert.ok(board.contains.includes('underline'));
  assert.ok(board.contains.includes('inline-box'));
  assert.ok(board.inference.some(item => item.path.endsWith('.blocks[0].text.underlines')));
  assert.ok(board.inference.some(item => item.path.endsWith('.blocks[0].text.inlineBoxes')));
  assert.equal(table.recipe, 'D1-04_Nested', 'the exact table specRecipes path selects merged-table guidance');
  assert.equal(table.specPath, 'units[0].spec.screenComponent.blocks[1].spec');
  assert.equal(table.subtype, 'D1-04_Nested');
  assert.ok(table.contains.includes('underline'));
  assert.ok(table.contains.includes('inline-box'));
  assert.ok(table.inference.some(item => item.path.endsWith('.cells[0].richText.inlineBoxes')));
  assert.equal(inferredFormula.recipe, 'formula');
  assert.equal(inferredFormula.subtype, 'D4-06_Schematic');
  assert.ok(inferredFormula.modules.includes('formula-native'));
  assert.ok(inferredFormula.inference.some(item => item.path.endsWith('.formula.items[1].numerator.text')));
  assert.ok(inferredFormula.inference.some(item => item.path.endsWith('.formula.items[1].denominator.text')));

  for (const phase of Object.values(result.phaseSources)) {
    const paths = phase.map(source => source.path);
    assert.equal(new Set(paths).size, paths.length, 'each guide source appears once per phase');
  }
});

test('dialogue input review checks only known visible text, including screenComponent', () => {
  const request = { units: [{ recipe: 'presentation', spec: {
    kind: 'dialogue', layout: 'presentation', presentationMode: 'screen',
    speakers: [{ label: '교사:값', labelRichText: { text: '교사:값' }, metadata: { text: '숨김:값' } }],
    turns: [{ text: '조건:값', richText: { text: '조건:값' }, metadata: { text: '숨김:값' } }],
    screenText: '화면:값', screenRichText: { text: '화면:값' },
    screenComponent: { kind: 'text', variant: 'chalkboard', title: '칠판:값', source: 'raw:code', metadata: { text: '숨김:값' } },
    metadata: { text: '숨김:값' }, source: 'raw:code',
    sharedScene: { board: { title: '제외:문구' }, artwork: { assetId: 'scene', imageText: '제외:OCR' } },
  } }] };
  const before = structuredClone(request);
  const result = prepareTask(request);
  const review = result.inputReview;
  const inspected = review.scope.inspectedPaths;
  const warningPaths = new Set(review.warnings.map(warning => warning.path));

  assert.deepEqual(request, before, 'review never rewrites visible or hidden source fields');
  for (const path of [
    'units[0].spec.speakers[0].label',
    'units[0].spec.speakers[0].labelRichText.text',
    'units[0].spec.turns[0].text',
    'units[0].spec.turns[0].richText.text',
    'units[0].spec.screenText',
    'units[0].spec.screenRichText.text',
    'units[0].spec.screenComponent.title',
  ]) {
    assert.ok(inspected.includes(path), path);
    assert.ok(warningPaths.has(path), `colon spacing warning for ${path}`);
  }
  assert.ok(!inspected.some(path => /metadata|\.source|sharedScene|imageText/.test(path)));
  assert.ok(review.scope.boundary.includes('sharedScene artwork/image text'));
  assert.equal(review.blocking, false);
  assert.equal(review.autoFixApplied, false);
});

test('legacy dialogue screenText and screenGraph remain classified as visible display text', () => {
  const result = prepareTask({ units: [{ recipe: 'presentation', spec: {
    kind: 'dialogue', layout: 'presentation', presentationMode: 'screen',
    speakers: [], turns: [],
    screenText: '슬라이드:내용',
    screenGraph: {
      kind: 'graph', type: 'bar',
      chartOptions: { title: '그래프:제목' },
      categories: ['첫 항목'], series: [{ id: 's1', label: '계열:이름', data: [1] }],
    },
  } }] });
  const review = result.inputReview;
  const inspected = review.scope.inspectedPaths;

  assert.ok(inspected.includes('units[0].spec.screenText'));
  assert.ok(inspected.includes('units[0].spec.screenGraph'));
  assert.ok(inspected.includes('units[0].spec.screenGraph.chartOptions.title'));
  assert.ok(inspected.includes('units[0].spec.screenGraph.categories[0]'));
  assert.ok(review.warnings.some(warning => warning.path === 'units[0].spec.screenText'));
  assert.ok(review.warnings.some(warning => warning.path === 'units[0].spec.screenGraph.chartOptions.title'));
});
