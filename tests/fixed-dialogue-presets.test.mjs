import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFixedStyle, listFixedStyles, exampleContent, assertFixedGeometry, preflightFixedStyle, bindFixedStyleSpeakerAssets as bindSpeakerAssets} from '../skills/create-kice-illustration/scripts/fixed_styles.mjs';
import {prepareTask} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
const styles = listFixedStyles().filter(s => s.family === 'dialogue');
const build = (styleID=styles[0].styleID, content=exampleContent(styleID), widthMm) => buildFixedStyle({styleID, content, ...(widthMm === undefined ? {} : {widthMm})});
const bind = bundle => bindSpeakerAssets(bundle, bundle.content.speakers.map(s => ({speakerId:s.id, assetId:`approved-${s.id}`})).reverse());
function plan(s) {
  return {schema:'vectora.dialogue-plan/v1', phase:'awaiting-approved-artwork', widthMm:s.widthMm, estimatedHeightMm:50, speakers:s.speakers.map(s => ({speakerId:s.id})), turns:s.turns.map(t => ({turnId:t.id, speakerId:t.speakerId, text:t.text, textWidthMm:20, textHeightMm:10, bubbleWidthMm:24, bubbleHeightMm:14})), warnings:['This measured planning brief reserves artwork space. Final composition measures approved artwork and may change height.']};
}

test('four source-free native presets have distinct counts, layouts and no static geometry', () => {
  assert.equal(styles.length, 4);
  for (const entry of styles) {
    const b = build(entry.styleID);
    assertFixedGeometry(b);
    assert.equal(b.spec.kind, 'dialogue');
    assert.equal(b.spec.speakers.length, entry.counts.speakers);
    assert.equal(b.spec.turns.length, entry.counts.turns);
    assert.equal(b.assetBindings.status, 'awaiting-assets');
    assert.equal(b.assetBindings.missingSpeakerIds.length, entry.counts.speakers);
    assert.equal(b.requiresApprovedAssets, true);
    assert.equal(b.spec.heightMm, undefined);
    assert.equal(b.spec.frameDecorations, undefined);
    assert.equal(b.spec.sharedScene, undefined);
    assert.equal(b.spec.children, undefined);
    assert.ok(b.spec.speakers.every(s => s.namePlacement === 'outer' && !('assetId' in s) && !('headWidthMm' in s)));
    assert.ok(Object.isFrozen(b.spec.turns));
    const options = b.spec[b.spec.layout + 'Options'];
    assert.equal(options.layoutVersion, 2);
    if (b.spec.layout === 'horizontal') assert.equal(options.arrangement, 'shared-row');
    else { assert.equal(options.columnAlignment, 'shared-v1'); assert.equal(options.portraitSizing, 'two-line-body-v1'); assert.equal(options.tailPlacement, 'reviewed-head-v1'); }
    const prepared = prepareTask({units:[{id:'talk', recipe:entry.recipe, fixedStyle:{styleID:entry.styleID, content:b.content}}]});
    assert.deepEqual(prepared.fixedStyles[0].spec, b.spec);
    assert.equal(prepared.fixedStyles[0].requiresApprovedAssets,true);
    assert.equal(prepared.resolved[0].people,true);
    assert.ok(prepared.resolved[0].modules.includes('artwork'));
    assert.ok(prepared.resolved[0].modules.includes('dialogue-native'));
    assert.ok(!prepared.resolved[0].modules.includes('vertical-messenger'));
    assert.throws(()=>prepareTask({units:[{recipe:entry.recipe,people:false,fixedStyle:{styleID:entry.styleID,content:b.content}}]}),/requires people/);
  }
});

test('binding/rebinding uses speaker IDs and preserves every non-asset source field', () => {
  for (const entry of styles) {
    const before = build(entry.styleID), snapshot = JSON.stringify(before), after = bind(before);
    assert.equal(JSON.stringify(before), snapshot);
    assert.equal(after.geometrySignature, before.geometrySignature);
    assert.equal(after.assetBindings.status, 'bound');
    assert.deepEqual(after.spec.turns, before.spec.turns);
    assert.deepEqual(after.spec.speakers.map(({assetId, ...s}) => s), before.spec.speakers);
    assert.ok(after.spec.speakers.every(s => s.assetId === `approved-${s.id}`));
    const replaced = bindSpeakerAssets(after, after.content.speakers.map(s => ({speakerId:s.id, assetId:`replacement-${s.id}`})));
    assert.deepEqual(replaced.spec.turns, before.spec.turns);
    assert.equal(replaced.geometrySignature, before.geometrySignature);
  }
});

test('preserves literal whitespace, explicit breaks, supplied rich typography and stable identity', () => {
  const c = exampleContent(styles[0].styleID);
  const text = '  첫 문장\n\n다음 문장.  ';
  c.turns[0] = {id:'authored-turn', speakerId:c.speakers[0].id, richText:{text, fontPt:10, leadingPercent:145, underlines:[{start:2,end:4}], paragraphLayouts:[{paragraphStart:0,firstLineIndentMm:1}]}};
  c.speakers[0].crop = 'full'; c.speakers[0].side = 'left';
  const snapshot = JSON.stringify(c), b = build(styles[0].styleID, c);
  assert.equal(JSON.stringify(c), snapshot);
  assert.equal(b.spec.turns[0].text, text);
  assert.deepEqual(b.spec.turns[0].richText, c.turns[0].richText);
  assert.deepEqual(b.content, c);
  assert.equal(b.spec.speakers[0].crop, 'full');
  const longer = structuredClone(c); longer.turns[1].text = '긴 문장입니다. '.repeat(100);
  assert.equal(build(styles[0].styleID, longer).geometrySignature, b.geometrySignature);
});

test('rejects duplicate identities, labels, assets, unknown turns and hidden scene/geometry inputs', () => {
  const mutations = [
    c => c.speakers.pop(), c => c.turns.pop(),
    c => c.speakers[1].id = c.speakers[0].id,
    c => c.speakers[1].label = c.speakers[0].label,
    c => c.speakers.forEach(s => s.assetId = 'same-portrait'),
    c => c.speakers[0].label = '', c => c.speakers[0].label = ' 갑 ',
    c => c.turns[1].id = c.turns[0].id,
    c => c.turns[1].speakerId = c.turns[0].speakerId,
    c => c.turns[0].speakerId = 'missing', c => c.turns[0].text = '',
    c => c.turns[0].richText = {text:'different'},
    c => c.turns[0].richText = {widthMm:10},
    c => c.turns[0].richText = {autoFit:true},
    c => c.speakers[0].crop = 'invented', c => c.speakers[0].headWidthMm = 12,
    c => c.sharedScene = {version:1}, c => c.turns[0].heightMm = 10,
  ];
  for (const mutate of mutations) { const c = exampleContent(styles[0].styleID); mutate(c); assert.throws(() => build(styles[0].styleID, c), /FIXED_STYLE_CONSTRAINT/); }
  const b = build();
  for (const bindings of [[], [{speakerId:'unknown',assetId:'a'},{speakerId:'speaker-2',assetId:'b'}], [{speakerId:'speaker-1',assetId:'a'},{speakerId:'speaker-1',assetId:'b'}], [{speakerId:'speaker-1',assetId:'same'},{speakerId:'speaker-2',assetId:'same'}]]) assert.throws(() => bindSpeakerAssets(b, bindings), /FIXED_STYLE_CONSTRAINT/);
});

test('width policy and tamper guards protect native ownership and pending asset status', () => {
  for (const entry of styles) {
    assert.doesNotThrow(() => build(entry.styleID, undefined, entry.minWidthMm));
    assert.doesNotThrow(() => build(entry.styleID, undefined, entry.maxWidthMm));
    for (const width of [0, NaN, Infinity, '96', null, entry.minWidthMm - .1, entry.maxWidthMm + .1]) assert.throws(() => build(entry.styleID, undefined, width), /widthMm/);
  }
  for (const mutate of [b => b.spec.heightMm = 20, b => b.spec.turns[0].text = 'patched', b => b.spec.speakers[0].assetId = 'injected', b => b.parts.push({}), b => b.assetBindings.status = 'bound', b => b.requiresApprovedAssets = false, b => b.requiresNativePreflight = false, b => b.geometry.native.layout = 'presentation']) {
    const b = structuredClone(build()); mutate(b); assert.throws(() => assertFixedGeometry(b), /override detected/);
  }
});

test('preflight preserves planning state even with bound asset references; no execution approval', async () => {
  for (const b of [build(), bind(build())]) {
    const snapshot = JSON.stringify(b);
    const result = await preflightFixedStyle(b, async spec => { const r = plan(spec); spec.turns[0].text = 'callback mutation'; return r; });
    assert.equal(result.status, 'awaiting-approved-artwork');
    assert.equal(result.visualReview, 'pending');
    assert.equal(JSON.stringify(b), snapshot);
  }
  for (const mutate of [p => p.phase = 'complete', p => p.estimatedHeightMm = NaN, p => p.widthMm = 200, p => p.speakers.pop(), p => p.turns[0].speakerId = 'missing', p => p.turns[0].text = 'lost source', p => p.turns[0].bubbleWidthMm = 200, p => p.turns[0].textHeightMm = 0, p => p.warnings.push('overflow')]) {
    await assert.rejects(preflightFixedStyle(build(), async s => { const p = plan(s); mutate(p); return p; }), /FIXED_STYLE_CONSTRAINT/);
  }
  await assert.rejects(preflightFixedStyle(build(), async () => ({})), /measurement unavailable/);
});
