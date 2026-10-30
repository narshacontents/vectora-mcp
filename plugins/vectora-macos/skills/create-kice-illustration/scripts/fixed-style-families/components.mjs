import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const ids = ['component-caption.v1', 'component-legend.v1', 'component-example.v1'];
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
function literal(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 20000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) fail(`${name}: nonempty literal required`);
}
function rich(value, text, name) {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${name}: object required`);
  if (value.text !== undefined && value.text !== text) fail(`${name}.text must match text`);
  if (['widthMm', 'heightMm', 'maxHeightMm'].some(k => Object.hasOwn(value, k)) || value.autoFit === true) fail(`${name}: fixed frame or shrinking autoFit is not supported`);
}
export function listStyles() {
  return freeze(ids.map(id => { const t = template(id); return {styleID:id, family:t.family, recipe:t.recipe, counts:{minItems:t.minItems, maxItems:t.maxItems}, defaultWidthMm:t.defaultWidthMm, minWidthMm:t.minWidthMm, maxWidthMm:t.maxWidthMm, heightPolicy:'native-content', widthPolicy:'native-max-content'}; }));
}
export function exampleContent(id) {
  const t = template(id);
  return {title:{caption:'〈설명〉', legend:'〈범례〉', example:'〈예시〉'}[t.role], items:[{id:'body', text:'표시할 내용을 입력합니다.'}]};
}
export function buildStyle(request) {
  keys(request, ['styleID', 'content', 'widthMm'], ['styleID', 'content'], 'request');
  const t = template(request.styleID), widthMm = request.widthMm === undefined ? t.defaultWidthMm : request.widthMm;
  if (!Number.isFinite(widthMm) || widthMm < t.minWidthMm || widthMm > t.maxWidthMm) fail(`widthMm must be ${t.minWidthMm}..${t.maxWidthMm}`);
  const input = request.content;
  keys(input, ['title', 'titleRichText', 'items'], ['title', 'items'], 'content');
  literal(input.title, 'title'); rich(input.titleRichText, input.title, 'titleRichText');
  if (!Array.isArray(input.items) || input.items.length < t.minItems || input.items.length > t.maxItems) fail(`items: ${t.minItems}..${t.maxItems} required`);
  for (const item of input.items) {
    keys(item, ['id', 'text', 'richText'], ['id'], 'item');
    if (typeof item.id !== 'string' || !/^[A-Za-z0-9._:-]{1,100}$/.test(item.id)) fail('item.id: stable ASCII ID required');
    literal(item.text ?? item.richText?.text, 'item text'); rich(item.richText, item.text ?? item.richText?.text, 'item.richText');
  }
  if (new Set(input.items.map(i => i.id)).size !== input.items.length) fail('item IDs must be distinct');
  const content = clone(input), spec = {...clone(t.native), widthMm};
  spec.legendFrame.title = content.title;
  if (content.titleRichText !== undefined) spec.legendFrame.titleRichText = clone(content.titleRichText);
  spec.children = content.items.map(item => ({...clone(item), text:item.text ?? item.richText.text}));
  // Only a max width is authored. Native children/legendFrame own all final bounds.
  const geometry = {native:clone(t.native), widthMm, minItems:t.minItems, maxItems:t.maxItems, heightPolicy:'native-content', widthPolicy:'native-max-content'};
  return freeze({styleID:t.styleID, widthMm, content, spec, parts:[], geometry, geometrySignature:hash(geometry), requiresNativePreflight:true, recipe:t.recipe, visualReview:'pending'});
}
export function assertGeometry(bundle) {
  if (!bundle?.styleID) fail('bundle required');
  const expected = buildStyle({styleID:bundle.styleID, content:bundle.content, widthMm:bundle.widthMm});
  for (const key of Object.keys(expected)) if (JSON.stringify(bundle[key]) !== JSON.stringify(expected[key])) fail(`${key}: policy, content or preflight override detected`);
  return true;
}
export async function preflight(bundle, planner) {
  assertGeometry(bundle);
  if (typeof planner !== 'function') fail('native planner(spec) callback required');
  const complete = await planner(clone(bundle.spec));
  if (!complete || complete.kind !== 'composition' || ![complete.widthMm, complete.heightMm, complete.boundsMm?.widthMm, complete.boundsMm?.heightMm].every(n => Number.isFinite(n) && n > 0)) fail('complete native measurement unavailable');
  if (complete.widthMm > bundle.widthMm + .15 || complete.boundsMm.widthMm > bundle.widthMm + .15 || !Array.isArray(complete.warnings) || complete.warnings.length) fail('native frame exceeds requested width or has warnings');
  return {styleID:bundle.styleID, geometrySignature:bundle.geometrySignature, status:'passed', plans:[], complete, visualReview:'pending'};
}
