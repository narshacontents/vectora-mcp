import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const richCell = {
  text: '\uFFFC 핵심',
  richText: {
    text: '\uFFFC 핵심',
    underlines: [{ start: 2, end: 4 }],
    inlineBoxes: [{ at: 0, label: '가', widthMm: 4 }],
  },
};

test('native chalkboard routes to teacher-board and visits nested merged table text conditions', () => {
  const request = {
    units: [{
      recipe: 'paper',
      specRecipes: { 'spec.children[0].spec.blocks[1].spec': 'table' },
      spec: {
        kind: 'composition',
        layout: 'column',
        children: [
          {
            id: 'board',
            spec: {
              kind: 'text',
              variant: 'chalkboard',
              widthMm: 90,
              title: { text: '관찰 결과' },
              blocks: [
                { type: 'text', id: 'instruction', text: { text: '자료를 보고 조건을 확인한다.', underlines: [{ start: 0, end: 2 }] } },
                {
                  type: 'component',
                  id: 'evidence-table',
                  spec: {
                    kind: 'table',
                    rows: [{ id: 'r1' }, { id: 'r2' }],
                    columns: [{ id: 'c1' }, { id: 'c2' }],
                    cells: [
                      { id: 'merged', rowId: 'r1', columnId: 'c1', rowSpan: 2, ...richCell },
                      { id: 'r1c2', rowId: 'r1', columnId: 'c2', text: '값' },
                      { id: 'r2c2', rowId: 'r2', columnId: 'c2', text: '비교' },
                    ],
                  },
                },
                { type: 'reserve', id: 'answer-space', reserve: { heightMm: 5 } },
              ],
            },
          },
          {
            id: 'teacher',
            spec: {
              kind: 'dialogue',
              layout: 'presentation',
              speakers: [{ id: 'teacher', label: '교사', assetId: 'teacher-image' }],
              turns: [{ id: 'teacher-line', speakerId: 'teacher', text: '자료를 근거로 설명해 봅시다.' }],
            },
          },
        ],
      },
    }],
  };
  const before = structuredClone(request);
  const result = prepareTask(request);
  assert.deepEqual(request, before, 'inference leaves the caller-owned native spec unchanged');

  const board = result.resolved.find(unit => unit.specPath === 'units[0].spec.children[0].spec');
  assert.ok(board);
  assert.equal(board.recipe, 'teacher-board');
  assert.equal(board.subtype, 'ITA-5_SoloBoard');
  assert.equal(board.variant, 'board');
  assert.equal(board.textMode, 'prose');
  for (const feature of ['underline', 'reserve']) assert.ok(board.contains.includes(feature), feature);
  assert.ok(board.inference.some(item => item.path.endsWith('.title.text') && item.inferred === 'text'));
  assert.ok(board.inference.some(item => item.path.endsWith('.blocks[0].text.underlines') && item.inferred === 'underline'));
  assert.ok(result.phaseSources.design.some(source => source.path === 'recipes/layouts/board.md'));
  assert.ok(result.phaseSources.design.some(source => source.path === 'recipes/ITA_TypeSwap/ITA-5_SoloBoard.md'));
  assert.match(result.contents.design, /본문 변경 때 외피·말풍선·교사가 함께 재배치되게 한다/);
  assert.match(result.contents.design, /고정 y 좌표와 수동 이동/);

  const table = result.resolved.find(unit => unit.specPath === 'units[0].spec.children[0].spec.blocks[1].spec');
  assert.ok(table);
  assert.equal(table.subtype, 'D1-04_Nested', 'the merged native table selects nested-table guidance');
  assert.ok(table.contains.includes('underline'));
  assert.ok(table.contains.includes('inline-box'));
  assert.ok(table.inference.some(item => item.path.endsWith('.cells[0].richText.inlineBoxes')));

  const teacher = result.resolved.find(unit => unit.specPath === 'units[0].spec.children[1].spec');
  assert.ok(teacher);
  assert.equal(teacher.recipe, 'presentation');
  assert.equal(teacher.subtype, 'ITA-2_Solo');
  assert.ok(result.phaseSources.design.some(source => source.path === 'core/composition.md'));
});

test('teacher-board accepts a native chalkboard text owner while noticeboard keeps its route', () => {
  const chalkboard = prepareTask({ units: [{
    recipe: 'teacher-board',
    spec: { kind: 'text', variant: 'chalkboard', title: '수업 자료', body: '관찰 내용을 확인한다.' },
  }] });
  assert.equal(chalkboard.resolved[0].subtype, 'ITA-5_SoloBoard');
  assert.equal(chalkboard.resolved[0].variant, 'board');

  const noticeboard = prepareTask({ units: [{
    recipe: 'board',
    spec: { kind: 'text', variant: 'noticeboard', cards: [{ id: 'card', body: '기존 게시판 카드' }] },
  }] });
  assert.equal(noticeboard.resolved[0].subtype, 'ITA-1_TypeBoard');
  assert.equal(noticeboard.resolved[0].variant, 'board');
});
