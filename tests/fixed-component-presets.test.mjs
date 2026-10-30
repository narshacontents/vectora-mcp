import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFixedStyle, listFixedStyles, exampleContent, assertFixedGeometry, preflightFixedStyle} from '../skills/create-kice-illustration/scripts/fixed_styles.mjs';
const styles = listFixedStyles().filter(s => s.family === 'components');
const build = (styleID=styles[0].styleID, content=exampleContent(styleID), widthMm) => buildFixedStyle({styleID, content, ...(widthMm === undefined ? {} : {widthMm})});
const measured = (s, h=10) => ({kind:'composition', widthMm:Math.min(24,s.widthMm), heightMm:h, boundsMm:{widthMm:Math.min(24,s.widthMm),heightMm:h}, warnings:[]});

test('three independent native frames own editable title/body with no fixed child dimensions', () => {
  assert.equal(styles.length, 3);
  for (const entry of styles) {
    const b = build(entry.styleID);
    assertFixedGeometry(b);
    assert.equal(b.spec.kind, 'composition');
    assert.equal(b.spec.layout, 'column');
    assert.equal(b.spec.legendFrame.title, b.content.title);
    assert.equal(b.spec.frameDecorations, undefined);
    assert.equal(b.spec.heightMm, undefined);
    assert.ok(b.spec.children.every(c => !('widthMm' in c) && !('heightMm' in c) && !('reserve' in c)));
    assert.equal(b.spec.children[0].id, 'body');
    const prepared=prepareTask({units:[{recipe:entry.recipe,fixedStyle:{styleID:entry.styleID,content:b.content}}]});
    assert.deepEqual(prepared.resolved[0].modules,['caption-frame']);
    assert.deepEqual(prepared.fixedStyles[0].spec,b.spec);
    assert.equal(b.visualReview, 'pending');
  }
});

test('full source text/rich text is preserved; content changes do not freeze frame geometry', () => {
  for (const entry of styles) {
    const c = exampleContent(entry.styleID);
    c.title = '사용자 제목'; c.titleRichText = {text:c.title, fontPt:10};
    c.items[0] = {id:'source-copy', richText:{text:'  원문\n\n다음 문장  ', fontPt:9, underlines:[{start:2,end:4}]}};
    const snapshot = JSON.stringify(c), b = build(entry.styleID, c);
    assert.equal(JSON.stringify(c), snapshot);
    assert.deepEqual(b.content, c);
    assert.equal(b.spec.children[0].text, c.items[0].richText.text);
    assert.deepEqual(b.spec.children[0].richText, c.items[0].richText);
    assert.deepEqual(b.spec.legendFrame.titleRichText, c.titleRichText);
    assert.equal(b.geometrySignature, build(entry.styleID).geometrySignature);
  }
});

test('legend accepts independently identified repeated rows without flattening or forced breaks', () => {
  const c = {title:'〈기호〉', items:[{id:'solid',text:'실선: 현재 상태'},{id:'dashed',text:'점선: 이후 상태'}]};
  const b = build('component-legend.v1', c);
  assert.deepEqual(b.spec.children, c.items);
  assert.equal(b.geometrySignature, build('component-legend.v1').geometrySignature);
  assert.throws(() => build('component-caption.v1', c), /items/);
  assert.throws(() => build('component-example.v1', c), /items/);
});

test('rejects identity collisions, source mismatches, overrides, fixed heights and invalid widths', () => {
  for (const mutate of [c => c.title = '', c => c.titleRichText = {text:'wrong'}, c => c.items = [], c => c.items[0].id = '', c => c.items[0].text = '', c => c.items[0].heightMm = 20, c => c.items[0].richText = {text:'wrong'}, c => c.items[0].richText = {autoFit:true}, c => c.items[0].richText = {widthMm:2}, c => c.frameDecorations = []]) {
    const c = exampleContent(styles[0].styleID); mutate(c); assert.throws(() => build(styles[0].styleID,c), /FIXED_STYLE_CONSTRAINT/);
  }
  assert.throws(() => build('component-legend.v1',{title:'기호',items:[{id:'x',text:'A'},{id:'x',text:'B'}]}), /distinct/);
  for (const width of [NaN, Infinity, 0, null, '36', 15.9, 108.1]) assert.throws(() => build(undefined,undefined,width), /widthMm/);
  for (const mutate of [b => b.spec.heightMm = 20, b => b.spec.legendFrame.title = 'injected', b => b.spec.children[0].widthMm = 10, b => b.parts.push({}), b => b.requiresNativePreflight = false]) {
    const b = structuredClone(build()); mutate(b); assert.throws(() => assertFixedGeometry(b), /override detected/);
  }
});

test('preflight accepts natural short/tall frames and rejects overflow/incomplete measurements', async () => {
  for (const height of [5, 100]) {
    const b = build(), snapshot = JSON.stringify(b), r = await preflightFixedStyle(b, async s => measured(s,height));
    assert.equal(r.status,'passed'); assert.equal(r.visualReview,'pending'); assert.equal(JSON.stringify(b),snapshot);
  }
  for (const change of [r => r.widthMm = 200, r => r.boundsMm.widthMm = 200, r => r.heightMm = 0, r => r.boundsMm.heightMm = NaN, r => r.warnings.push('overflow')]) await assert.rejects(preflightFixedStyle(build(), async s => {const r = measured(s);change(r);return r;}), /FIXED_STYLE_CONSTRAINT/);
  await assert.rejects(preflightFixedStyle(build(), async () => ({})), /measurement unavailable/);
});
