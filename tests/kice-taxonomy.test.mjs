import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildClaudePlugin } from '../scripts/build-claude-packages.mjs';
import { filterModuleBlocks, prepareRules, readIndex, writePreparedRules } from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';
import { prepareTask, writeTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
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
// Semantic assertions inspect the task that a producer actually receives.
const make=(subtype,extra={})=>{
 const task=prepareTask({units:[{id:'subject',recipe:subtype,...extra}]});
 const selected=task.resolved[0];
 return {...selected,hasPeople:selected.people,task,content:Object.values(task.contents).join('\n\n')};
};
const combinedRules=result=>result.content;
test('v3 taxonomy keeps ten types and all 50 corpus leaves, plus four explicitly execution-only paths',()=>{
 assert.deepEqual(Object.keys(index.types).sort(),Object.keys(approvedLeaves).sort());
 assert.deepEqual(Object.keys(index.subtypes).filter(x=>!executionKeys.includes(x)).sort(),corpusKeys);
 for(const [type,leaves] of Object.entries(approvedLeaves)) for(const leaf of leaves)assert.equal(index.subtypes[leaf].type,type);
 for(const [key,row] of Object.entries(index.subtypes)) {
  assert.ok(existsSync(path.join(skill,row.file)),key);
  assert.ok(read(row.file).length>30,key);
 }
 const visit=(value,field='index')=>{
  if(Array.isArray(value))value.forEach((item,n)=>visit(item,`${field}[${n}]`));
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))visit(item,`${field}.${key}`);
  else if(typeof value==='string' && (/^(?:references|recipes|components|execution|core|assets|scripts)\//.test(value)||/\.(?:md|json|mjs|js|py|svg|png|jpg)$/.test(value)))assert.ok(existsSync(path.join(skill,value)),`${field}: ${value}`);
 };
 visit(index);
 assert.equal(new Set(Object.values(index.modules)).size,Object.keys(index.modules).length,'one canonical file per block');
 const taxonomy=read('references/taxonomy.md');
 for(const type of ['I1_Photo','I2_Illustration']){
  const section=taxonomy.match(new RegExp(`## ${type}[^\\n]*\\n([\\s\\S]*?)(?=\\n## |$)`));
  assert.ok(section,type);assert.match(section[1],/자료 분류에는 하위 코드가 없/,type);
 }
});

test('every subtype and supported variant retains its selected production rules',t=>{
 let count=0;
 for(const [subtype,row] of Object.entries(index.subtypes))for(const variant of row.variants?Object.keys(row.variants):[undefined]){
  const result=make(subtype,{variant});
  const sources=Object.values(result.task.phaseSources).flat().map(source=>source.path);
  assert.ok(sources.includes(index.types[row.type]),subtype);
  assert.ok(sources.includes(row.file),subtype);
  assert.ok(result.content.includes(read(row.file).split('\n')[0]),subtype);
  assert.ok(result.content.length>200,subtype);
  assert.equal(new Set(result.modules).size,result.modules.length);
  for(const module of result.modules)assert.ok(sources.includes(index.modules[module]),`${subtype}: ${module}`);
  assert.equal(sources.includes(index.people.file),result.hasPeople,subtype);
  for(const source of sources){
   const expected=filterModuleBlocks(read(source).trim(),new Set(result.modules),new Set(Object.keys(index.modules)),source);
   assert.ok(result.content.includes(expected),`${subtype}: complete content of ${source}`);
  }
  count++;
 }
 t.diagnostic(`${count} complete selection routes verified`);
});

test('common file excludes subtype-only style, media and map contracts',()=>{
 const root=read('SKILL.md');
 assert.ok(root.length<18000);assert.equal(root.split('<!-- VECTORA_CLIENT_BOUNDARY -->').length,2);
 for(const token of ['STYLE CONTRACT:', 'map-korea-sido-2025','bodyHeight','boundaryDashPt','barWidthMm','신문 외피','두루마리 외피','승인 원화와 읽기 전용 계획'])assert.ok(!root.includes(token),token);
 const task=make('ITA-1_TypeBoard',{variant:'newspaper'}).task;
 // Shared design selects typography by role instead of injecting the old blanket metrics.
 for(const token of ['108mm','textProfiles.catalog','역할에 맞게 선택','실제 설치된 UND v3.1','Regular·Bold·Italic·BoldItalic','기존 문서의 명시 서식은 요청 없이 바꾸지 않는다'])assert.ok(task.contents.design.includes(token),token);
 assert.doesNotMatch(task.contents.design,/장평\s*95\s*%|charSpacing\s*:\s*-60\b/);
 for(const token of ['rasterScale:4','실제 JPEG'])assert.ok(task.contents.deliver.includes(token),token);
 assert.ok(task.onDemand.some(item=>item.path==='execution/delivery-manual.md'));
 for(const token of ['scale:4','transparent:false'])assert.ok(read('execution/delivery-manual.md').includes(token),token);
 assert.ok(root.includes('prepare_task.mjs'));
});

test('representative selections contain required rules and exclude unrelated sibling rules',()=>{
 const pieSelection=make('D2-03_Pie'),pie=pieSelection.content;
 assert.ok(!pieSelection.task.phaseSources.design.some(source=>source.path===index.modules['chart-axes']));
 assert.match(pie,/각도=비율×360/);assert.match(pie,/#EEEEEE/);
 assert.doesNotMatch(pie,/Y지표명|yTitleOrientation|barWidthMm|보조 파선 선/);
 assert.doesNotMatch(read(index.types.D2_Chart),/보조 파선을 기본|이중 축은|축 눈금·부호/);
 assert.doesNotMatch(read('SKILL.md'),/oceanFill|highlightFill|Native graph\/map production/);
 const lineSelection=make('D2-04_Line'),line=lineSelection.content;
 assert.ok(lineSelection.task.phaseSources.design.some(source=>source.path===index.modules['chart-axes']));
 assert.match(lineSelection.task.contents.design,/주요 Y눈금의 가로 파선/);
 for(const token of ['0.4pt','1.5/1pt','chartStyle:"line"','xNumeric'])assert.ok(line.includes(token),token);
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
 const fixedScene=make('ITC-4_Costume',{variant:'scene'}).content;assert.match(fixedScene,/STYLE CONTRACT: Draw the requested subject and action as a restrained grayscale/);
 const scene=make('illustration-scene',{people:true});assert.equal(scene.hasPeople,true);
 assert.match(scene.content,/STYLE CONTRACT: Draw the requested subject and action as a restrained grayscale/);assert.doesNotMatch(scene.content,/전체 그림의 좌우 끝에 붙이며|registerAsset/);
});

test('migrated rules preserve key behavior, allowed selection scope and selected family rules',()=>{
 const removed=['flat-table','bar-options','dot-options','concept-options','continuous-api','presentation-photo'];
 for(const name of removed){
  assert.equal(index.modules[name],undefined,`${name} has no module reference`);
  assert.equal(existsSync(path.join(skill,`references/rules/${name}.md`)),false,`${name} source was removed`);
 }
 const flatHeading='## 단일 머리의 목록표 공통 — Flat·MultiFlat';
 const flat01=make('D1-01_Flat'),flat02=make('D1-02_MultiFlat');
 for(const result of [flat01,flat02]){
  const aggregate=combinedRules(result);
  assert.ok(aggregate.includes(flatHeading));
  assert.match(aggregate,/rowId\/columnId/);
  assert.match(aggregate,/전치로 의미가 달라지는 표를 교차표로 취급하지 않는다/);
  assert.ok(aggregate.includes(read('core/style.md').trim()));
 }
 for(const subtype of approvedLeaves.D1_Table){
  const selected=make(subtype);
  assert.equal(selected.modules.includes('flat-table-layout'),['D1-01_Flat','D1-02_MultiFlat'].includes(subtype),subtype);
  assert.ok(selected.modules.includes('table-api'),subtype);
  assert.ok(selected.task.contents.execute.includes(read(index.modules['table-api']).trim()),subtype);
  assert.doesNotMatch(read(index.subtypes[subtype].file),/## 단일 머리의 목록표 공통/);
 }
 assert.match(read(index.modules['flat-table-layout']),/rowId\/columnId/);
 assert.equal(combinedRules(make('D1-03_Cross')).includes(flatHeading),false,'cross tables exclude the flat-only rule');

 const bar01=make('D2-01_Bar'),bar02=make('D2-02_StackedBar');
 for(const result of [bar01,bar02]){
  const aggregate=combinedRules(result);
  assert.match(aggregate,/- `barWidthMm`는 막대 하나\(또는 누적 묶음 하나\)의 폭, `groupGapMm`는/);
  assert.match(aggregate,/`barGapRatio`는 0–3이다/);
  assert.ok(aggregate.includes(read('core/style.md').trim()));
 }
 for(const subtype of approvedLeaves.D2_Chart){
  const selected=make(subtype);
  assert.equal(selected.modules.includes('bar-sizing'),['D2-01_Bar','D2-02_StackedBar'].includes(subtype),subtype);
  assert.equal(selected.modules.includes('continuous-graph-api'),false,subtype);
  assert.doesNotMatch(read(index.subtypes[subtype].file),/barWidthMm|barGapRatio/);
 }
 assert.match(read(index.modules['bar-sizing']),/`barGapRatio`는 0–3이다/);
 assert.equal(combinedRules(make('D2-03_Pie')).includes('- `barWidthMm`는 막대 하나'),false,'pie charts exclude bar options');

 const dot=combinedRules(make('D2-06_Dot'));
 assert.match(dot,/덤벨 방향: `orientation:"horizontal"\|"vertical"`은 dumbbell에서만 사용한다/);
 assert.equal(combinedRules(make('D2-05_Scatter')).includes('덤벨 방향:'),false,'scatter excludes dot-only options');

 for(const subtype of approvedLeaves.D3_Graph){
  const result=make(subtype),aggregate=combinedRules(result);
  assert.match(aggregate,/chartOptions:\{mode:"concept",semanticLabels:/,subtype);
  assert.match(aggregate,/legacy 연속 선은 폭 40–108mm/,subtype);
  assert.ok(result.modules.includes('continuous-graph-api'),subtype);
  assert.ok(result.task.contents.execute.includes(read(index.modules['continuous-graph-api']).trim()),subtype);
  assert.doesNotMatch(result.task.contents.design,/chartOptions:\{mode:"concept"|legacy 연속 선은 폭/);
  assert.match(aggregate,/## 연속 관계의 공통 규칙/,subtype);
  assert.ok(aggregate.includes(read('core/style.md').trim()),`${subtype} includes shared style`);
  assert.ok(aggregate.includes('# D3_Graph'),`${subtype} includes selected family`);
  const recipeSource=read(index.subtypes[subtype].file).trim();
  const selectedRecipe=filterModuleBlocks(recipeSource,new Set(result.modules),new Set(Object.keys(index.modules)),index.subtypes[subtype].file);
  assert.ok(result.task.contents.design.includes(selectedRecipe),`${subtype} includes its applicable recipe guidance`);
  assert.equal(index.subtypes[subtype].modules.some(module=>removed.includes(module)),false,`${subtype} has no migrated rule modules`);
 }
 const chartAggregate=combinedRules(make('D2-04_Line'));
 assert.doesNotMatch(chartAggregate,/chartOptions:\{mode:"concept",semanticLabels:/);
 assert.doesNotMatch(chartAggregate,/legacy 연속 선은 폭 40–108mm/);

 const photoScene=make('ITC-2_RealPhoto',{variant:'scene'});
 const photoHorizontal=make('ITC-2_RealPhoto',{variant:'horizontal'});
 const photoPresentation=make('ITC-2_RealPhoto',{variant:'presentation'});
 const photoHeading='## 실제 인물 사진의 발표 배치';
 assert.equal(combinedRules(photoScene).includes(photoHeading),false);
 assert.equal(combinedRules(photoHorizontal).includes(photoHeading),false);
 assert.ok(combinedRules(photoPresentation).includes(photoHeading));
 assert.match(combinedRules(photoPresentation),/원본 보존과 지정 치수가 충돌하면 충돌을 밝히며 사진을 재생성해 해결하지 않는다/);
 assert.equal(photoPresentation.modules.includes('presentation-photo'),false);
 assert.equal(photoPresentation.modules.includes('presentation-artwork'),false);
 const generatedPresenter=make('ITA-2_Solo');
 assert.ok(generatedPresenter.modules.includes('presentation-artwork'));
 assert.match(generatedPresenter.content,/새 발표자 원화 제작/);
});

test('conditional module blocks reject absent conditions and unclosed markers clearly',()=>{
 const known=new Set(Object.keys(index.modules));
 const enabled=new Set(['presentation']);
 assert.equal(filterModuleBlocks('before<!-- when-module:presentation -->photo<!-- /when-module -->after',enabled,known),'beforephotoafter');
 assert.equal(filterModuleBlocks('before<!-- when-module:presentation -->photo<!-- /when-module -->after',new Set(),known),'beforeafter');
 assert.throws(()=>filterModuleBlocks('<!-- when-module:missing -->x<!-- /when-module -->',enabled,known),/Unknown conditional module.*missing/);
 assert.throws(()=>filterModuleBlocks('<!-- when-module:presentation -->x',enabled,known),/Unclosed when-module:presentation/);
 assert.throws(()=>filterModuleBlocks('<!-- when-module -->x<!-- /when-module -->',enabled,known),/Malformed conditional module marker/);
 assert.throws(()=>filterModuleBlocks('<!-- /when-module -->',enabled,known),/close without open/);
 assert.throws(()=>filterModuleBlocks('<!-- when-module: -->x<!-- /when-module -->',enabled,known),/Invalid conditional module/);
});

test('people component retains artwork style and original-photo exemptions',()=>{
 assert.match(read(index.people.file),/STYLE CONTRACT: Draw a living human character/);
 assert.match(read(index.people.file),/statues, sculptural busts/);
 assert.match(read(index.people.file),/원본 인물 사진·기존 작품/);
 assert.match(read(index.people.file),/이 절의 화풍·생성·수정 생성 검사는 새로 그린 인물/);
 assert.match(read(index.modules['person-speech']),/실제 사진·기존 작품은 원본 충실도로 승인하고 새 화풍이나 수정 생성을 요구하지 않는다/);
 assert.doesNotMatch(read('SKILL.md'),/STYLE CONTRACT:/);
 const portrait=make('illustration-portrait');assert.equal(portrait.hasPeople,true);
 assert.equal(make('illustration-object').hasPeople,false);
 assert.equal(make('photo-original',{people:true}).hasPeople,true);
});

test('preparer rejects missing choices and invalid scopes without dumping every rule',()=>{
 const prepareRulesSelection=(subtype,extra={})=>prepareRules({subtype,...extra});
 assert.throws(()=>prepareRulesSelection('ITA-1_TypeBoard'),/requires --variant/);
 assert.throws(()=>prepareRulesSelection('D2-03_Pie',{variant:'newspaper'}),/no --variant/);
 assert.throws(()=>prepareRulesSelection('D1-01_Flat',{features:['korea']}),/does not apply/);
 assert.throws(()=>prepareRulesSelection('I3-13_OldMap',{features:['dem']}),/original old-map/);
 assert.throws(()=>prepareRulesSelection('ITA-4_DialogueV',{people:true,features:['messenger']}),/people-free/);
 assert.throws(()=>prepareRulesSelection('ITC-2_RealPhoto',{variant:'horizontal',features:['artwork']}),/actual portrait/);
 assert.throws(()=>prepareRulesSelection('ITA-3_DialogueH',{features:['speech-vertical']}),/Conflicting layouts/);
 assert.throws(()=>prepareRulesSelection('ITA-4_DialogueV',{features:['messenger','speech-horizontal']}),/Conflicting layouts/);
 assert.throws(()=>prepareRulesSelection('bad'),/Unknown subtype/);
 assert.throws(()=>prepareRulesSelection('D1-01_Flat',{features:['typo']}),/Unknown feature/);
});

test('prepared files are deterministic, cannot overwrite user files or alter installed rules',()=>{
 const temporary=mkdtempSync(path.join(os.tmpdir(),'kice-rule-write-'));
 try {
  const selection={subtype:'D2-04_Line'};
  const first=writePreparedRules(selection,temporary),second=writePreparedRules(selection,temporary);
  assert.equal(first.subtypeFile,second.subtypeFile);assert.ok(first.read.every(file=>existsSync(file)));
  writeFileSync(first.subtypeFile,'user content');
  assert.throws(()=>writePreparedRules(selection,temporary));assert.equal(readFileSync(first.subtypeFile,'utf8'),'user content');
  const invalid=path.join(skill,'should-not-be-created');
  assert.throws(()=>writePreparedRules(selection,invalid),/outside/);assert.equal(existsSync(invalid),false);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});

test('circled marker spacing retains native Alt+Space and body-only underline',()=>{
 const root=prepareTask({units:[{recipe:'vertical-dialogue',contains:['underline']}]}).contents.design;
 for(const token of ['Alt+Space','U+2002','㉠\u2002본문'.replace('\\u2002','\u2002'),'일반 공백 폭의 절반','원문자·반칸은 밑줄 범위에서 제외','최종 문자열의 논리 grapheme 인덱스로 범위를 계산'])assert.ok(root.includes(token),token);
 assert.match(root,/원문자 자체가 답란 중앙[\s\S]*원문자 전체에 밑줄/);
});

test('portable task helper and Claude packaging preserve selected rules',()=>{
 const help=execFileSync(process.execPath,[path.join(skill,'scripts/prepare_task.mjs'),'--help'],{encoding:'utf8'});
 for(const token of ['--request','--out','recipe','variant','features','people'])assert.ok(help.includes(token),token);
 const temporary=mkdtempSync(path.join(os.tmpdir(),'kice-claude-routing-'));
 try{
  buildClaudePlugin(path.join(temporary,'plugin'));
  const staged=path.join(temporary,'plugin/skills/create-kice-illustration');
  const root=readFileSync(path.join(staged,'SKILL.md'),'utf8');
  assert.match(root,/Claude 로컬 실행 경계/);assert.match(root,/이미지 생성 모델을 포함하지 않는다/);
  const result=writeTask({client:'claude',units:[{recipe:'pie'}]},path.join(temporary,'prepared'),staged);
  const files=[...result.readNow,...result.beforeExecute,...result.beforeDeliver];
  assert.ok(files.every(p=>realpathSync(p).startsWith(realpathSync(temporary))));
  assert.match(readFileSync(result.readNow[0],'utf8'),/각도=비율×360/);
 }finally{rmSync(temporary,{recursive:true,force:true});}
});
