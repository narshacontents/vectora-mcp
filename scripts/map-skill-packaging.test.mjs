import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const skillRoots = [
  ['canonical', 'skills/create-kice-illustration'],
  ['marketplace vectora', 'plugins/vectora/skills/create-kice-illustration'],
  ['marketplace vectora-macos', 'plugins/vectora-macos/skills/create-kice-illustration'],
  ['marketplace vectora-windows', 'plugins/vectora-windows/skills/create-kice-illustration'],
];

function collectEntries(directory, relative = '') {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryRelative = path.join(relative, entry.name);
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectEntries(absolute, entryRelative)
      : [entryRelative];
  });
}

const textExtensions = new Set([
  '.html', '.js', '.json', '.md', '.mdx', '.mjs', '.py', '.sh', '.toml', '.ts', '.txt', '.xml', '.yaml', '.yml',
]);

test('map skills keep live preset routing without packaging duplicate map data', () => {
  for (const [name, relativeRoot] of skillRoots) {
    const skillRoot = path.join(repoRoot, relativeRoot);
    assert.equal(existsSync(path.join(skillRoot, 'assets/maps')), false, `${name} must not include assets/maps`);
    const entries = collectEntries(skillRoot);
    const helperReferences = entries.filter((relative) => {
      if (relative.includes('map-template-edit.py')) return true;
      if (!textExtensions.has(path.extname(relative).toLowerCase())) return false;
      return readFileSync(path.join(skillRoot, relative), 'utf8').includes('map-template-edit.py');
    });
    assert.deepEqual(helperReferences, [], `${name} must not package or refer to map-template-edit.py`);

    const presetGuide = readFileSync(
      path.join(skillRoot, 'execution/modules/map-preset.md'),
      'utf8',
    );
    const koreaGuide = readFileSync(
      path.join(skillRoot, 'components/map-korea.md'),
      'utf8',
    );

    for (const [label, content] of [['map-preset.md', presetGuide], ['map-korea.md', koreaGuide]]) {
      assert.doesNotMatch(content, /map-template-edit\.py/i, `${name}/${label} must not refer to the removed editor`);
      assert.doesNotMatch(content, /assets\/maps\b/i, `${name}/${label} must not refer to local map assets`);
    }

    assert.match(presetGuide, /vectora_list_presets\s*\(\s*\{\s*\}\s*\)/, `${name} must query the live preset list`);
    assert.match(presetGuide, /vectora_map_plan/, `${name} must route through the live map planner`);
    assert.match(presetGuide, /vectora_inspect/, `${name} must inspect the selected native preset`);
    assert.match(presetGuide, /vectora_new_document/, `${name} must create registered maps in a new document`);
    assert.match(presetGuide, /vectora_create_preset/, `${name} must document the ordinary preset fallback`);
    for (const field of ['source', 'notes', 'registration', 'assetHash', 'sidecarHash', 'projection']) {
      assert.ok(presetGuide.includes(field), `${name} must retain live ${field} validation`);
    }
  }
});
