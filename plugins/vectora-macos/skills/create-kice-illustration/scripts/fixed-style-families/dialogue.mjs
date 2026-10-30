import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const ids = ['dialogue-horizontal-2.v1', 'dialogue-horizontal-3.v1', 'dialogue-vertical-2.v1', 'dialogue-vertical-3.v1'];
const clone = value => structuredClone(value);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const templates = new Map(ids.map(id => [id, freeze(JSON.parse(readFileSync(new URL(`../../assets/fixed-styles/${id}.json`, import.meta.url), 'utf8')))]));
function fail(message) { throw new Error(`FIXED_STYLE_CONSTRAINT: ${message}`); }
function template(id) { const t = templates.get(id); if (!t) fail(`unknown styleID ${id}`); return t; }
function keys(value, allowed, required, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k)) || required.some(k => !Object.hasOwn(value, k))) fail(`${name}: allowed keys ${allowed.join(', ')}; required ${required.join(', ')}`);
}
function identity(value, name) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/.test(value)) fail(`${name}: stable ASCII ID required`);
}
function literal(value, name, max = 20000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) fail(`${name}: nonempty literal required`);
}
function distinct(values, name) { if (new Set(values).size !== values.length) fail(`${name} must be distinct`); }
function contentFor(t, input) {
  keys(input, ['speakers', 'turns'], ['speakers', 'turns'], 'content');
  if (!Array.isArray(input.speakers) || input.speakers.length !== t.counts.speakers || !Array.isArray(input.turns) || input.turns.length !== t.counts.turns) fail(`exactly ${t.counts.speakers} speakers and one turn per speaker required`);
  for (const s of input.speakers) {
    keys(s, ['id', 'label', 'assetId', 'crop', 'side'], ['id', 'label'], 'speaker');
    identity(s.id, 'speaker.id'); literal(s.label, 'speaker.label', 100);
    if (s.label !== s.label.trim() || /[\r\n\t]/.test(s.label)) fail('speaker.label must be a single unpadded name');
    if (s.assetId !== undefined) { literal(s.assetId, 'speaker.assetId', 256); if (s.assetId !== s.assetId.trim()) fail('speaker.assetId must be unpadded'); }
    if (s.crop !== undefined && !['face', 'bust', 'full'].includes(s.crop)) fail('speaker.crop must be face, bust or full');
    if (s.side !== undefined && !['left', 'right'].includes(s.side)) fail('speaker.side must be left or right');
  }
  distinct(input.speakers.map(s => s.id), 'speaker IDs');
  distinct(input.speakers.map(s => s.label), 'speaker labels');
  distinct(input.speakers.filter(s => s.assetId !== undefined).map(s => s.assetId), 'speaker assets');
  for (const turn of input.turns) {
    keys(turn, ['id', 'speakerId', 'text', 'richText'], ['id', 'speakerId'], 'turn');
    identity(turn.id, 'turn.id');
    if (!input.speakers.some(s => s.id === turn.speakerId)) fail('turn.speakerId must reference a provided speaker');
    if (turn.richText !== undefined) {
      if (!turn.richText || typeof turn.richText !== 'object' || Array.isArray(turn.richText)) fail('turn.richText must be an object');
      // Preserve native typography/ranges verbatim; never impose a fixed text frame.
      if (['widthMm', 'heightMm', 'maxHeightMm'].some(k => Object.hasOwn(turn.richText, k)) || turn.richText.autoFit === true) fail('turn.richText: fixed frame or shrinking autoFit is not supported');
      if (turn.text !== undefined && turn.richText.text !== undefined && turn.richText.text !== turn.text) fail('turn.richText.text must match text');
    }
    literal(turn.text ?? turn.richText?.text, 'turn text');
  }
  distinct(input.turns.map(t => t.id), 'turn IDs');
  distinct(input.turns.map(t => t.speakerId), 'turn speakers');
  return clone(input);
}
export function listStyles() {
  return freeze(ids.map(id => { const t = template(id); return {styleID:id, family:t.family, recipe:t.recipe, counts:clone(t.counts), defaultWidthMm:t.defaultWidthMm, minWidthMm:t.minWidthMm, maxWidthMm:t.maxWidthMm, heightPolicy:'native-content', assetPolicy:'distinct-speaker-assets', supportsSourceFreePlanning:true}; }));
}
export function exampleContent(id) {
  const t = template(id);
  return {speakers:Array.from({length:t.counts.speakers}, (_, i) => ({id:`speaker-${i + 1}`, label:['갑','을','병'][i]})), turns:Array.from({length:t.counts.turns}, (_, i) => ({id:`turn-${i + 1}`, speakerId:`speaker-${i + 1}`, text:`화자 ${i + 1}의 발언을 입력합니다.`}))};
}
export function buildStyle(request) {
  keys(request, ['styleID', 'content', 'widthMm'], ['styleID', 'content'], 'request');
  const t = template(request.styleID), widthMm = request.widthMm === undefined ? t.defaultWidthMm : request.widthMm;
  if (!Number.isFinite(widthMm) || widthMm < t.minWidthMm || widthMm > t.maxWidthMm) fail(`widthMm must be ${t.minWidthMm}..${t.maxWidthMm}`);
  const content = contentFor(t, request.content);
  const spec = {...clone(t.native), widthMm, speakers:content.speakers.map(s => ({...clone(t.speakerDefaults??{}), ...clone(s), namePlacement:t.namePlacement})), turns:content.turns.map(turn => ({...clone(turn), text:turn.text ?? turn.richText.text}))};
  // This signature fixes the reusable layout policy, NOT measured bubble geometry.
  // Text, speaker identity, crop/side and registered artwork remain native inputs.
  const geometry = {native:clone(t.native), widthMm, counts:clone(t.counts), speakerDefaults:clone(t.speakerDefaults??{}), namePlacement:t.namePlacement, heightPolicy:'native-content'};
  const missingSpeakerIds = content.speakers.filter(s => !s.assetId).map(s => s.id);
  return freeze({styleID:t.styleID, widthMm, content, spec, parts:[], geometry, geometrySignature:hash(geometry), requiresNativePreflight:true, requiresApprovedAssets:true, assetBindings:{status:missingSpeakerIds.length ? 'awaiting-assets' : 'bound', missingSpeakerIds}, recipe:t.recipe, visualReview:'pending'});
}
export function assertGeometry(bundle) {
  if (!bundle?.styleID) fail('bundle required');
  const expected = buildStyle({styleID:bundle.styleID, content:bundle.content, widthMm:bundle.widthMm});
  for (const key of Object.keys(expected)) if (JSON.stringify(bundle[key]) !== JSON.stringify(expected[key])) fail(`${key}: policy, content, asset or preflight override detected`);
  return true;
}
// Bind/rebind document-local approved asset IDs by identity, never by array order.
// This checks distinct references; native registration/creation validates actual assets.
export function bindSpeakerAssets(bundle, bindings) {
  assertGeometry(bundle);
  if (!Array.isArray(bindings) || bindings.length !== bundle.content.speakers.length) fail('one asset binding per speaker required');
  for (const binding of bindings) {
    keys(binding, ['speakerId', 'assetId'], ['speakerId', 'assetId'], 'binding');
    if (!bundle.content.speakers.some(s => s.id === binding.speakerId)) fail('unknown binding speakerId');
    literal(binding.assetId, 'binding.assetId', 256);
  }
  distinct(bindings.map(b => b.speakerId), 'binding speaker IDs');
  const byID = new Map(bindings.map(b => [b.speakerId, b.assetId]));
  const content = clone(bundle.content);
  content.speakers = content.speakers.map(s => ({...s, assetId:byID.get(s.id)}));
  return buildStyle({styleID:bundle.styleID, widthMm:bundle.widthMm, content});
}
export async function preflight(bundle, planner) {
  assertGeometry(bundle);
  if (typeof planner !== 'function') fail('native planner(spec) callback required');
  const complete = await planner(clone(bundle.spec));
  if (complete?.schema !== 'vectora.dialogue-plan/v1' || complete.phase !== 'awaiting-approved-artwork' || !Number.isFinite(complete.widthMm) || Math.abs(complete.widthMm - bundle.widthMm) > .15 || !Number.isFinite(complete.estimatedHeightMm) || complete.estimatedHeightMm <= 0) fail('native pre-artwork dialogue measurement unavailable');
  if (!Array.isArray(complete.speakers) || complete.speakers.length !== bundle.spec.speakers.length || !Array.isArray(complete.turns) || complete.turns.length !== bundle.spec.turns.length) fail('native plan identity mismatch');
  for (const s of bundle.spec.speakers) if (complete.speakers.filter(p => p.speakerId === s.id).length !== 1) fail('native plan speaker identity mismatch');
  for (const t of bundle.spec.turns) {
    const p = complete.turns.find(p => p.turnId === t.id);
    if (!p || complete.turns.filter(p => p.turnId === t.id).length !== 1 || p.speakerId !== t.speakerId || p.text !== t.text) fail('native plan turn identity/text mismatch');
    for (const field of ['textWidthMm', 'textHeightMm', 'bubbleWidthMm', 'bubbleHeightMm']) if (!Number.isFinite(p[field]) || p[field] <= 0) fail('native turn measurement unavailable');
    if (p.bubbleWidthMm > bundle.widthMm + .15) fail('native bubble exceeds requested width');
  }
  const briefWarning = 'This measured planning brief reserves artwork space. Final composition measures approved artwork and may change height.';
  if (!Array.isArray(complete.warnings) || complete.warnings.some(w => w !== briefWarning)) fail('native dialogue warnings require review');
  return {styleID:bundle.styleID, geometrySignature:bundle.geometrySignature, status:'awaiting-approved-artwork', assetBindings:clone(bundle.assetBindings), plans:[], complete, visualReview:'pending'};
}
