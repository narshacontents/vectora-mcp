import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareTask, recipes } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import { readIndex } from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';

const prepare = unit => prepareTask({ units: [unit] });
const sources = result => Object.values(result.phaseSources).flat().map(source => source.path);
const formulaSpec = (text = 'A\u2002+\u2002B') => ({
  kind: 'schematic', layout: 'formula', widthMm: 82,
  formula: { version: 1, items: [{ id: 'term', kind: 'text', text }] },
});

test('formula alias selects native formula rules and keeps the D4-06 classification', () => {
  const index = readIndex();
  const spec = formulaSpec();
  spec.formula.items.push({ id: 'fraction', kind: 'fraction', numerator: { text: '4' }, denominator: { text: '2' } });
  const request = { recipe: 'formula', spec };
  const before = structuredClone(request);
  const result = prepare(request);
  const unit = result.resolved[0];
  const paths = sources(result);

  assert.deepEqual(request, before, 'routing preserves caller-owned native content');
  assert.equal(recipes.formula.subtype, 'D4-06_Schematic');
  assert.deepEqual(recipes.formula.nativeKinds, ['schematic']);
  assert.equal(Object.keys(index.subtypes).length, 54);
  assert.equal(index.subtypes['D4-06_Schematic'].type, 'D4_Diagram');
  assert.deepEqual(unit.modules, ['formula-native']);
  assert.ok(paths.includes('execution/modules/formula-native.md'));
  assert.ok(!paths.includes('components/schematic-layout.md'));
  assert.ok(!result.contents.design.includes('explanatory landform or vegetation diagram'));
  assert.deepEqual(unit.inference.filter(item => item.inferred === 'text').map(item => item.path), [
    'units[0].spec.formula.items[0].text',
    'units[0].spec.formula.items[1].numerator.text',
    'units[0].spec.formula.items[1].denominator.text',
  ]);
});

test('nested table, paper, and composition formulas infer text and native underline features', () => {
  const styled = formulaSpec();
  styled.formula.items[0].richText = {
    text: styled.formula.items[0].text,
    styles: [{ start: 0, end: 1, style: { underline: true } }],
  };
  const cases = [
    {
      recipe: 'table',
      spec: { kind: 'table', cells: [{ id: 'formula-cell', content: structuredClone(styled) }] },
      path: 'spec.cells[0].content',
    },
    {
      recipe: 'paper',
      spec: { kind: 'text', variant: 'paper', blocks: [{ type: 'component', id: 'formula-block', spec: structuredClone(styled) }] },
      path: 'spec.blocks[0].spec',
    },
    {
      recipe: 'paper',
      spec: { kind: 'composition', children: [{ id: 'formula-child', spec: structuredClone(styled) }] },
      path: 'spec.children[0].spec',
    },
  ];

  for (const item of cases) {
    const request = { recipe: item.recipe, spec: item.spec };
    const before = structuredClone(request);
    const result = prepare(request);
    const formula = result.resolved.find(unit => unit.specPath === `units[0].${item.path}`);

    assert.deepEqual(request, before, `${item.path} source remains unchanged`);
    assert.ok(formula, item.path);
    assert.equal(formula.recipe, 'formula');
    assert.equal(formula.subtype, 'D4-06_Schematic');
    assert.ok(formula.contains.includes('underline'));
    assert.ok(formula.inference.some(entry => entry.path.endsWith('.formula.items[0].text') && entry.inferred === 'text'));
    assert.ok(formula.inference.some(entry => entry.path.endsWith('.richText.styles[0].style.underline') && entry.inferred === 'underline'));
    assert.ok(formula.modules.includes('formula-native'));
    assert.ok(!formula.modules.includes('schematic-layout'));
    assert.ok(sources(result).includes('core/underline.md'));
    assert.ok(sources(result).includes('execution/modules/formula-native.md'));
  }
});

test('formula display review checks only literal part text and richText aliases without rewriting', () => {
  const spec = {
    ...formulaSpec('A+B'),
    metadata: { text: 'hidden+a' },
    source: 'raw+a',
    formula: {
      version: 1,
      textProfile: 'metadata+a',
      fontPt: 8,
      items: [
        { id: 'text+metadata', kind: 'text', text: 'A+B', richText: { text: 'A+B', styles: [{ start: 0, end: 1, style: { underline: true } }], metadata: { text: 'hidden+b' } }, metadata: { text: 'hidden+c' } },
        { id: 'fraction', kind: 'fraction', numerator: { text: '4×2', richText: { text: '4×2' } }, denominator: { text: 'x-y' } },
      ],
    },
  };
  const request = { recipe: 'formula', spec };
  const before = structuredClone(request);
  const result = prepare(request);
  const review = result.inputReview;

  assert.deepEqual(request, before, 'display review does not normalize source strings or rich-text offsets');
  assert.deepEqual(review.warnings.map(warning => [warning.ruleId, warning.path, warning.offset]), [
    ['display-binary-operator-spacing', 'units[0].spec.formula.items[0].text', 1],
    ['display-binary-operator-spacing', 'units[0].spec.formula.items[1].numerator.text', 1],
  ]);
  assert.deepEqual(review.warnings[0].alsoPaths, ['units[0].spec.formula.items[0].richText.text']);
  assert.deepEqual(review.warnings[1].alsoPaths, ['units[0].spec.formula.items[1].numerator.richText.text']);
  assert.deepEqual(review.scope.inspectedPaths, [
    'units[0].spec.formula.items[0].text',
    'units[0].spec.formula.items[0].richText.text',
    'units[0].spec.formula.items[1].numerator.text',
    'units[0].spec.formula.items[1].numerator.richText.text',
    'units[0].spec.formula.items[1].denominator.text',
  ]);
  assert.ok(!review.scope.inspectedPaths.some(path => /metadata|\.id$|\.source|textProfile|fontPt/.test(path)));
  assert.ok(review.scope.boundary.includes('formula item text and fraction numerator/denominator text'));
  assert.equal(result.resolved[0].inference.some(entry => /metadata|\.source/.test(entry.path)), false);
});

test('formula layout conflicts with tree, Venn, and ordinary schematic bindings', () => {
  for (const recipe of ['tree', 'venn', 'schematic', 'D4-06_Schematic']) {
    assert.throws(
      () => prepare({ recipe, spec: formulaSpec() }),
      new RegExp(`native schematic layout:formula conflicts with recipe ${recipe}`),
    );
  }
  assert.throws(
    () => prepare({ recipe: 'formula', spec: { kind: 'schematic', layout: 'relations' } }),
    /recipe formula requires native schematic layout:formula/,
  );
  assert.throws(() => prepare({
    recipe: 'paper',
    spec: { kind: 'text', variant: 'paper', blocks: [{ type: 'component', spec: formulaSpec() }] },
    specRecipes: { 'spec.blocks[0].spec': 'venn' },
  }), /spec\.blocks\[0\]\.spec: native schematic layout:formula conflicts with recipe venn/);
});

test('ordinary schematics continue through D4-06 and the shared schematic layout module', () => {
  const result = prepare({
    recipe: 'schematic',
    spec: { kind: 'schematic', layout: 'relations', nodes: [{ id: 'a', text: '가' }], edges: [] },
  });
  const paths = sources(result);

  assert.equal(result.resolved[0].subtype, 'D4-06_Schematic');
  assert.ok(result.resolved[0].modules.includes('schematic-layout'));
  assert.ok(!result.resolved[0].modules.includes('formula-native'));
  assert.ok(paths.includes('components/schematic-layout.md'));
  assert.ok(!paths.includes('execution/modules/formula-native.md'));
  assert.ok(result.contents.design.includes('explanatory landform or vegetation diagram'));
});
