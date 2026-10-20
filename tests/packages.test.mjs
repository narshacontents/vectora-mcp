import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, {after} from 'node:test';
import { PLUGIN_ROOT, PLUGIN_VERSION } from '../scripts/build-packages.mjs';
import {buildClaudePlugin} from '../scripts/build-claude-packages.mjs';

// Test a fresh package without changing checked-in or installed distributions.
const packageFixture=mkdtempSync(path.join(os.tmpdir(),'vectora-package-contracts-'));
after(()=>rmSync(packageFixture,{recursive:true,force:true}));
const plugin=path.join(packageFixture,'vectora');
buildClaudePlugin(plugin);
const skill = path.join(plugin, 'skills', 'create-kice-illustration');
const json = (relative) => JSON.parse(readFileSync(path.join(PLUGIN_ROOT, relative), 'utf8'));

function listFiles(directory, prefix = '') {
  return readdirSync(directory).sort().flatMap(name => {
    const full = path.join(directory, name), relative = prefix ? `${prefix}/${name}` : name;
    const stat = lstatSync(full); assert(!stat.isSymbolicLink(), relative);
    return stat.isDirectory() ? listFiles(full, relative) : [relative];
  });
}

test('Claude marketplace installs one self-contained plugin with three skills and portable launchers', () => {
  const catalog = json('.claude-plugin/marketplace.json');
  assert.equal(catalog.name, 'vectora');
  assert.deepEqual(catalog.plugins.map(({ name, source }) => ({ name, source })), [{ name: 'vectora', source: './plugins/vectora' }]);
  const manifest = JSON.parse(readFileSync(path.join(plugin,'.claude-plugin/plugin.json'),'utf8'));
  assert.equal(manifest.name, 'vectora'); assert.equal(manifest.version, PLUGIN_VERSION);
  const server = JSON.parse(readFileSync(path.join(plugin,'.mcp.json'),'utf8')).mcpServers.vectora;
  assert.equal(server.command, 'node');
  assert.deepEqual(server.args, ['${CLAUDE_PLUGIN_ROOT}/scripts/claude/claude-mcp-launcher.mjs']);
  assert.deepEqual(readdirSync(path.join(plugin, 'skills')).sort(), ['create-kice-illustration', 'create-kice-science-illustration', 'use-vectora']);
  for (const file of ['start-mcp.sh', 'start-mcp.ps1', 'configure-app.sh', 'configure-app.ps1', 'claude/claude-mcp-launcher.mjs']) {
    assert.deepEqual(readFileSync(path.join(plugin, 'scripts', file)), readFileSync(path.join(PLUGIN_ROOT, 'scripts', file)), file);
  }
  for (const file of listFiles(plugin)) {
    assert.doesNotMatch(file, /\.(?:node|so|dylib|dll|pyd|exe|pyc|ttf|otf)$/i, file);
    assert.doesNotMatch(file, /(?:^|\/)(?:__pycache__|\.git)(?:\/|$)/, file);
  }
  assert.match(readFileSync(path.join(skill, 'vendor/python/fonttools-4.63.0.dist-info/WHEEL'), 'utf8'), /^Tag: py3-none-any$/m);
});

test('the science skill stays metadata-only in every marketplace plugin', () => {
  const relative = 'skills/create-kice-science-illustration/SKILL.md';
  const source = readFileSync(path.join(PLUGIN_ROOT, relative), 'utf8');
  assert.match(source, /^---\nname: create-kice-science-illustration\n/);
  assert.match(source, /^disable-model-invocation: true$/m);
  assert.equal(source.replace(/^---\n[\s\S]*?\n---\n/, '').trim(), '');
  for (const id of ['vectora', 'vectora-macos', 'vectora-windows']) {
    assert.equal(readFileSync(path.join(PLUGIN_ROOT, 'plugins', id, relative), 'utf8'), source, id);
  }
  assert.deepEqual(listFiles(path.join(plugin, 'skills/create-kice-science-illustration')), ['SKILL.md']);
});

test('Claude adaptations preserve the assessment artwork rules', () => {
  const sourceSkill=path.join(PLUGIN_ROOT,'skills/create-kice-illustration');
  const documents=listFiles(sourceSkill).filter(file=>file.endsWith('.md') && /^(?:references|core|recipes|components|execution)\//.test(file));
  assert.equal(documents.filter(file=>file.startsWith('references/families/')).length,10);
  assert.equal(documents.filter(file=>/^recipes\/[^/]+\/[^/]+\.md$/.test(file)&&!file.startsWith('recipes/layouts/')).length,54);
  for(const relative of [...documents,'references/rule-index.json','scripts/prepare_task.mjs','scripts/prepare_rules.mjs']){
    const expected=readFileSync(path.join(sourceSkill,relative),'utf8')
      .replaceAll('node skills/create-kice-illustration/scripts/', 'node scripts/')
      .replaceAll('python3 skills/create-kice-illustration/scripts/', 'python3 scripts/');
    assert.equal(readFileSync(path.join(skill,relative),'utf8'),expected,relative);
  }
  const root = readFileSync(path.join(skill, 'SKILL.md'), 'utf8');
  assert.match(root, /Claude 로컬 실행 경계/);
  assert.match(root, /이미지 생성 모델을 포함하지 않는다/);
  assert.match(readFileSync(path.join(skill,'components/people.md'),'utf8'), /STYLE CONTRACT: Draw a living human character/);
  assert.ok(readFileSync(path.join(skill,'components/free-art.md'),'utf8').includes('STYLE CONTRACT: Draw the requested subject and action as a restrained grayscale editorial ink illustration'));
});

test('copied Claude helpers parse fonts and trace PNG without source-workspace dependencies', (t) => {
  const temporary = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'Vectora 한글 plugin ')));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const copied = path.join(temporary, 'vectora'); cpSync(plugin, copied, { recursive: true });
  const localSkill = path.join(copied, 'skills/create-kice-illustration');
  for (const name of ['build_text_frame.mjs', 'build_graph.mjs']) {
    const help = execFileSync(process.execPath, [path.join(localSkill, 'scripts', name), '--help'], { cwd: temporary, encoding: 'utf8' });
    assert.match(help, /--spec/);
  }
  const python = `import sys
sys.path.insert(0, sys.argv[1])
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
glyphs = [".notdef", "A"]
b = FontBuilder(1000, isTTF=True)
b.setupGlyphOrder(glyphs)
b.setupCharacterMap({65: "A"})
b.setupGlyf({name: TTGlyphPen(None).glyph() for name in glyphs})
b.setupHorizontalMetrics({name: (600, 0) for name in glyphs})
b.setupHorizontalHeader(ascent=800, descent=-200)
b.setupNameTable({"familyName": "PortableSmoke", "styleName": "Regular"})
b.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=800, usWinDescent=200)
b.setupPost()
b.setupMaxp()
b.save(sys.argv[2])
assert TTFont(sys.argv[2]).getBestCmap() == {65: "A"}
`;
  const fontPath = path.join(temporary, 'fixture.ttf');
  const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
  const prefix = process.platform === 'win32' ? ['-3'] : [];
  execFileSync(pythonCommand, [...prefix, '-I', '-S', '-B', '-c', python, path.join(localSkill, 'vendor/python'), fontPath], { cwd: temporary });
  execFileSync(pythonCommand, [...prefix, '-I', '-S', '-B', path.join(localSkill, 'scripts/audit_svg.py'), '--help'], { cwd: temporary });
  const node = `const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const local=require('node:module').createRequire(path.join(process.argv[1],'scripts/build_graph.mjs'));
const font=local('fontkit').openSync(process.argv[2]);
assert.equal(font.unitsPerEm,1000);assert.equal(font.layout('A').positions[0].xAdvance,600);
local('imagetracerjs');local('jpeg-js');
const {PNG}=local('pngjs'), png=new PNG({width:32,height:32});
for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,g=(x>=8&&x<24&&y>=8&&y<24)?0:255;png.data[i]=png.data[i+1]=png.data[i+2]=g;png.data[i+3]=255;}
fs.writeFileSync(process.argv[3],PNG.sync.write(png));`;
  const input = path.join(temporary, 'fixture.png'), output = path.join(temporary, 'fixture.svg');
  execFileSync(process.execPath, ['-e', node, localSkill, fontPath, input], { cwd: temporary });
  execFileSync(process.execPath, [path.join(localSkill, 'scripts/trace_artwork.mjs'), input, output], { cwd: temporary });
  assert.match(readFileSync(output, 'utf8'), /<path\b/);
  assert.doesNotMatch(readFileSync(output, 'utf8'), /<image\b/);
});
