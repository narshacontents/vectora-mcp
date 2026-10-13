import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildClaudePlugin } from '../scripts/build-claude-packages.mjs';
import { prepareRules, readIndex, writePreparedRules } from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill=path.join(repo,'skills/create-kice-illustration');
const read=rel=>readFileSync(path.join(skill,rel),'utf8');
const index=readIndex();
const approvedLeaves = {
  "D1_Table": [
    "D1-01_Flat",
    "D1-02_MultiFlat",
    "D1-03_Cross",
    "D1-04_Nested",
    "D1-05_Checklist",
    "D1-06_Others"
  ],
  "D2_Chart": [
    "D2-01_Bar",
    "D2-02_StackedBar",
    "D2-03_Pie",
    "D2-04_Line",
    "D2-05_Scatter",
    "D2-06_Dot",
    "D2-07_Radar",
    "D2-08_Others"
  ],
  "D3_Graph": [
    "D3-01_Curve",
    "D3-02_Frontier",
    "D3-03_Distribution",
    "D3-04_Others"
  ],
  "D4_Diagram": [
    "D4-01_Tree",
    "D4-02_Network",
    "D4-03_Flowchart",
    "D4-04_Venn",
    "D4-05_Timeline",
    "D4-06_Schematic",
    "D4-07_Others"
  ],
  "I1_Photo": [],
  "I2_Illustration": [],
  "I3_Map": [
    "I3-11_Locator",
    "I3-12_Topographic",
    "I3-13_OldMap",
    "I3-14_Others",
    "I3-21_Area",
    "I3-22_Route",
    "I3-23_Symbol",
    "I3-31_Choropleth",
    "I3-32_Dot",
    "I3-33_Proportional",
    "I3-34_Isoline",
    "I3-35_Flow"
  ],
  "ITA_TypeSwap": [
    "ITA-1_TypeBoard",
    "ITA-2_Solo",
    "ITA-3_DialogueH",
    "ITA-4_DialogueV",
    "ITA-5_SoloBoard",
    "ITA-6_GroupBoard"
  ],
  "ITB_ImageSwap": [
    "ITB-1_ImageBoard",
    "ITB-2_SoloImageBoard",
    "ITB-3_GroupImageBoard"
  ],
  "ITC_Fixed": [
    "ITC-1_Figure",
    "ITC-2_RealPhoto",
    "ITC-3_Place",
    "ITC-4_Costume"
  ]
};

const corpusKeys=Object.values(approvedLeaves).flat().sort();
const executionKeys=['photo-original','illustration-portrait','illustration-object','illustration-scene'];
const make=(subtype,extra={})=>prepareRules({subtype,...extra});

test('v3 taxonomy keeps ten types and all 50 corpus leaves, plus four explicitly execution-only paths',()=>{
 assert.deepEqual(Object.keys(index.types).sort(),Object.keys(approvedLeaves).sort());
 assert.deepEqual(Object.keys(index.subtypes).filter(x=>!executionKeys.includes(x)).sort(),corpusKeys);
 for(const [type,leaves] of Object.entries(approvedLeaves)) for(const leaf of leaves)assert.equal(index.subtypes[leaf].type,type);
 for(const [key,row] of Object.entries(index.subtypes)) {
  assert.ok(existsSync(path.join(skill,row.file)),key);
  assert.ok(read(row.file).length>30,key);
 }
 for(const rel of Object.values(index.modules))assert.ok(existsSync(path.join(skill,rel)),rel);
 assert.equal(new Set(Object.values(index.modules)).size,Object.keys(index.modules).length,'one canonical file per block');
 assert.match(read('references/types/I1_Photo.md'),/자료 분류에는 하위 코드가 없다/);
 assert.match(read('references/types/I2_Illustration.md'),/자료 분류에는 하위 코드가 없/);
});

test('every subtype and supported variant prepares a complete third-level document',t=>{
 const temporary=mkdtempSync(path.join(os.tmpdir(),'kice-rule-paths-'));let count=0;
 try {
  for(const [subtype,row] of Object.entries(index.subtypes)) for(const variant of row.variants?Object.keys(row.variants):[undefined]) {
   const result=writePreparedRules({subtype,variant},temporary);
   assert.equal(result.read.length,row.peopleRequired?4:3,subtype);
   assert.equal(result.read[0],path.join(skill,'SKILL.md'));
   assert.equal(result.read[1],path.join(skill,index.types[row.type]));
   const leaf=readFileSync(result.subtypeFile,'utf8');
   assert.match(leaf,/세 번째 지침/);assert.ok(leaf.length>200,subtype);
   assert.equal(new Set(result.modules).size,result.modules.length);
   if(row.peopleRequired)assert.equal(result.read[3],path.join(skill,'references/people.md'));
   count++;
  }
  t.diagnostic(`${count} complete selection routes verified`);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});

test('common file excludes subtype-only style, media and map contracts',()=>{
 const root=read('SKILL.md');
 assert.ok(root.length<18000);assert.equal(root.split('<!-- VECTORA_CLIENT_BOUNDARY -->').length,2);
 for(const token of ['STYLE CONTRACT:', 'map-korea-sido-2025','bodyHeight','boundaryDashPt','barWidthMm','신문 외피','두루마리 외피','승인 원화와 읽기 전용 계획'])assert.ok(!root.includes(token),token);
 for(const token of ['108mm','UNDv30-Regular','charSpacing:-60','scale:4','transparent:false','실제 JPEG','prepare_rules.mjs'])assert.ok(root.includes(token),token);
});

test('representative selections contain required rules and exclude unrelated sibling rules',()=>{
 const pie=make('D2-03_Pie').content;
 assert.match(pie,/각도=비율×360/);assert.match(pie,/#EEEEEE/);
 assert.doesNotMatch(pie,/Y지표명|yTitleOrientation|barWidthMm|보조 파선 선/);
 assert.doesNotMatch(read('references/types/D2_Chart.md'),/보조 파선을 기본|이중 축은|축 눈금·부호/);
 assert.doesNotMatch(read('SKILL.md'),/oceanFill|highlightFill|Native graph\/map production/);
 const line=make('D2-04_Line').content;
 for(const token of ['0.4pt','1.5/1pt','가로 보조 파선','chartStyle:"line"','xNumeric'])assert.ok(line.includes(token),token);
 assert.doesNotMatch(line,/barWidthMm|dumbbell에서만|radarStartAngle/);
 const oldMap=make('I3-13_OldMap').content;
 assert.match(oldMap,/실제 원본을 이미지 개체로 유지/);assert.doesNotMatch(oldMap,/vectora_list_presets|mapSchemaVersion|등고선은 검증 가능한/);
 const locator=make('I3-11_Locator').content;
 assert.match(locator,/vectora_list_presets/);assert.doesNotMatch(locator,/map-korea-sido-2025|PaleoMIST|등고선은 검증 가능한/);
 const korea=make('I3-31_Choropleth',{features:['korea','real-data']}).content;
 for(const token of ['229','252','map-korea-sido-2025','구간','exact','approximate'])assert.ok(korea.includes(token),token);
 const newspaper=make('ITA-1_TypeBoard',{variant:'newspaper',features:['reserve']});
 assert.equal(newspaper.hasPeople,false);
 for(const token of ['신문','frameBounds.heightMm','heightMm와 lines를 함께 보내지 않는다'])assert.ok(newspaper.content.includes(token),token);
 assert.doesNotMatch(newspaper.content,/STYLE CONTRACT|mapSchemaVersion|머리 크기|윗말이|dumbbell/);
 const messenger=make('ITA-4_DialogueV',{features:['messenger']});
 assert.equal(messenger.hasPeople,false);assert.doesNotMatch(messenger.content,/STYLE CONTRACT|headBounds|흉상 칸을|자기 얼굴\/입|꼬리 끝↔자기 화자 머리/);
 const person=make('ITA-3_DialogueH');
 assert.equal(person.hasPeople,true);for(const token of ['2.5–5mm','0.8–1.5mm','reviewed:true','headBounds'])assert.ok(person.content.includes(token),token);
 const photo=make('ITC-2_RealPhoto',{variant:'horizontal'});
 assert.equal(photo.hasPeople,true);assert.match(photo.content,/실제 원본을 이미지 개체로 유지/);assert.doesNotMatch(photo.content,/새 인물·사물·장면은/);
 const photoPresenter=make('ITC-2_RealPhoto',{variant:'presentation'}).content;
 assert.match(photoPresenter,/사진을 재생성해 해결하지 않는다/);
 assert.doesNotMatch(photoPresenter,/그 배치에 맞는 인물을 새로 생성|다시 생성한다/);
 const fixedScene=make('ITC-4_Costume',{variant:'scene'}).content;assert.match(fixedScene,/STYLE CONTRACT: Draw a clean grayscale/);
 const scene=make('illustration-scene',{people:true});assert.equal(scene.hasPeople,true);
 assert.match(scene.content,/STYLE CONTRACT: Draw a clean grayscale/);assert.doesNotMatch(scene.content,/전체 그림의 좌우 끝에 붙이며|registerAsset/);
});

test('people style is single-source and only the explicit people exception adds a file',()=>{
 assert.match(read('references/people.md'),/STYLE CONTRACT: Draw a living human character/);
 assert.match(read('references/people.md'),/statues, sculptural busts/);
 assert.match(read('references/people.md'),/원본 인물 사진·기존 작품/);
 assert.match(read('references/people.md'),/이 절의 화풍·생성·수정 생성 검사는 새로 그린 인물/);
 assert.match(read('references/rules/person-speech.md'),/실제 사진·기존 작품의 인물은 원본 충실도로 승인/);
 assert.doesNotMatch(read('SKILL.md'),/STYLE CONTRACT:/);
 const portrait=make('illustration-portrait');assert.equal(portrait.hasPeople,true);
 assert.equal(make('illustration-object').hasPeople,false);
 assert.equal(make('photo-original',{people:true}).hasPeople,true);
});

test('preparer rejects missing choices and invalid scopes without dumping every rule',()=>{
 assert.throws(()=>make('ITA-1_TypeBoard'),/requires --variant/);
 assert.throws(()=>make('D2-03_Pie',{variant:'newspaper'}),/no --variant/);
 assert.throws(()=>make('D1-01_Flat',{features:['korea']}),/does not apply/);
 assert.throws(()=>make('I3-13_OldMap',{features:['dem']}),/original old-map/);
 assert.throws(()=>make('ITA-4_DialogueV',{people:true,features:['messenger']}),/people-free/);
 assert.throws(()=>make('ITC-2_RealPhoto',{variant:'horizontal',features:['artwork']}),/actual portrait/);
 assert.throws(()=>make('ITA-3_DialogueH',{features:['speech-vertical']}),/Conflicting layouts/);
 assert.throws(()=>make('ITA-4_DialogueV',{features:['messenger','speech-horizontal']}),/Conflicting layouts/);
 assert.throws(()=>make('bad'),/Unknown subtype/);
 assert.throws(()=>make('D1-01_Flat',{features:['typo']}),/Unknown feature/);
});

test('prepared files are deterministic, cannot overwrite user files or alter installed rules',()=>{
 const temporary=mkdtempSync(path.join(os.tmpdir(),'kice-rule-write-'));
 try {
  const selection={subtype:'D2-04_Line'};
  const first=writePreparedRules(selection,temporary),second=writePreparedRules(selection,temporary);
  assert.equal(first.subtypeFile,second.subtypeFile);assert.equal(first.read.length,3);
  writeFileSync(first.subtypeFile,'user content');
  assert.throws(()=>writePreparedRules(selection,temporary));assert.equal(readFileSync(first.subtypeFile,'utf8'),'user content');
  const invalid=path.join(skill,'should-not-be-created');
  assert.throws(()=>writePreparedRules(selection,invalid),/outside/);assert.equal(existsSync(invalid),false);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});

test('circled marker spacing retains native Alt+Space and body-only underline',()=>{
 const root=read('SKILL.md');
 for(const token of ['Alt+Space','U+2002','㉠\u2002본문'.replace('\\u2002','\u2002'),'일반 공백 폭의 절반','원문자와 반칸은 밑줄 범위에서 제외','textRange/underlines 위치를 다시 계산'])assert.ok(root.includes(token),token);
});

test('portable helper and Claude packaging keep the same three-file routing',()=>{
 const help=execFileSync(process.execPath,[path.join(skill,'scripts/prepare_rules.mjs'),'--help'],{encoding:'utf8'});
 for(const token of ['--out','--variant','--features','--people','I3-13_OldMap','photo-original'])assert.ok(help.includes(token));
 const temporary=mkdtempSync(path.join(os.tmpdir(),'kice-claude-routing-'));
 try{
  buildClaudePlugin(path.join(temporary,'plugin'));
  const staged=path.join(temporary,'plugin/skills/create-kice-illustration');
  const root=readFileSync(path.join(staged,'SKILL.md'),'utf8');
  assert.match(root,/Claude 로컬 실행 경계/);assert.match(root,/이미지 생성 모델을 포함하지 않는다/);
  const result=writePreparedRules({subtype:'D2-03_Pie'},path.join(temporary,'prepared'),staged);
  assert.equal(result.read.length,3);
  assert.ok(result.read.every(p=>realpathSync(p).startsWith(realpathSync(temporary))));
  assert.match(readFileSync(result.subtypeFile,'utf8'),/각도=비율×360/);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});
