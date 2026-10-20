#!/usr/bin/env node
// Resolve a production task into phase-specific, deduplicated instructions.
import fs from 'node:fs';
import {inferSpec} from './infer_spec.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {prepareRules, readIndex, skillRoot, filterModuleBlocks} from './prepare_rules.mjs';

export const recipes = {
 'table': {subtype:'D1-01_Flat'}, 'cross-table':{subtype:'D1-03_Cross'},
 'bar':{subtype:'D2-01_Bar'},'stacked-bar':{subtype:'D2-02_StackedBar'},'mosaic':{subtype:'D2-08_Others'},'pie':{subtype:'D2-03_Pie'},
 'line':{subtype:'D2-04_Line'},'scatter':{subtype:'D2-05_Scatter'},'dot':{subtype:'D2-06_Dot'},'radar':{subtype:'D2-07_Radar'},
 'curve':{subtype:'D3-01_Curve'},'frontier':{subtype:'D3-02_Frontier'},'distribution':{subtype:'D3-03_Distribution'},
 'tree':{subtype:'D4-01_Tree'},'network':{subtype:'D4-02_Network'},'flowchart':{subtype:'D4-03_Flowchart'},'venn':{subtype:'D4-04_Venn'},'timeline':{subtype:'D4-05_Timeline'},'schematic':{subtype:'D4-06_Schematic'},
 'photo':{subtype:'photo-original'},'portrait':{subtype:'illustration-portrait'},'object':{subtype:'illustration-object'},'scene':{subtype:'illustration-scene'},
 'locator-map':{subtype:'I3-11_Locator'},'topographic-map':{subtype:'I3-12_Topographic'},'old-map':{subtype:'I3-13_OldMap'},
 'area-map':{subtype:'I3-21_Area'},'route-map':{subtype:'I3-22_Route'},'symbol-map':{subtype:'I3-23_Symbol'},'choropleth':{subtype:'I3-31_Choropleth'},'dot-map':{subtype:'I3-32_Dot'},'proportional-map':{subtype:'I3-33_Proportional'},'isoline-map':{subtype:'I3-34_Isoline'},'flow-map':{subtype:'I3-35_Flow'},
 'vertical-dialogue':{subtype:'ITA-4_DialogueV',people:true},'horizontal-dialogue':{subtype:'ITA-3_DialogueH'},'presentation':{subtype:'ITA-2_Solo'},
 'messenger':{subtype:'ITA-4_DialogueV',features:['messenger']},
 ...Object.fromEntries(['newspaper','screen','paper','scroll','board','worksheet'].map(variant=>[variant,{subtype:'ITA-1_TypeBoard',variant}])),
 'webpage':{subtype:'ITA-1_TypeBoard',variant:'screen'},
 'teacher-board':{subtype:'ITA-5_SoloBoard',variant:'board'},
 ...readIndex().recipeAliases,
 'image-board':{subtype:'ITB-1_ImageBoard'},'figure':{subtype:'ITC-1_Figure'},'costume':{subtype:'ITC-4_Costume'},'original-person':{subtype:'ITC-2_RealPhoto'},
};
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const read=(root,rel)=>{
 const base=fs.realpathSync(root),file=fs.realpathSync(path.resolve(root,rel));
 if(!file.startsWith(base+path.sep))throw new Error('Rule outside installed skill: '+rel);
 return fs.readFileSync(file,'utf8').trim();
};
const textExtras={'prose':'core/prose.md','underline':'core/underline.md','inline-box':'core/inline-box.md','reserve':'core/reserve.md'};
export function prepareTask(request, root=skillRoot){
 if(!request || !Array.isArray(request.units) || !request.units.length)throw new Error('units must contain at least one production unit');
 if(request.client && !['codex','claude','gemini'].includes(request.client))throw new Error('Unknown client');
 const index=readIndex(root),knownModules=new Set(Object.keys(index.modules));
 const phaseSources={design:[],execute:[],deliver:[]},sections={design:[],execute:[],deliver:[]},seen=new Set(),resolved=[],unitIds=new Set();
 function add(phase,relative,unit,enabled){
  let body=read(root,relative);
  if(body.includes('<!-- when-module'))body=filterModuleBlocks(body,enabled||new Set(),knownModules,relative);
  // Same file with a genuinely different conditional body remains unit-specific.
  const key=relative+'\0'+body;
  if(seen.has(key))return;
  seen.add(key);phaseSources[phase].push({path:relative,unit:unit||null});
  sections[phase].push(`<!-- source:${relative}${unit?'; unit:'+unit:''} -->\n${body}`);
 }
 add('design','core/style.md');
 add('execute','execution/base.md');
 if(request.client==='gemini')add('execute','execution/gemini.md');
 if(request.caller==='exam-agent')add('design','execution/caller.md');
 function checkBinding(unit,spec,where){
  const base=own(recipes,unit.recipe)?recipes[unit.recipe]:own(index.subtypes,unit.recipe)?{subtype:unit.recipe}:null;
  if(!base)throw new Error(`Unknown recipe: ${unit.recipe}`);
  const type=index.subtypes[base.subtype].type;
  // A composition explicitly binds an outer shell; it is not a native frame.
  if(spec.kind==='composition'){
   if(!type.startsWith('IT'))throw new Error(`${where}: composition binding requires an explicit IT shell recipe (for example paper)`);
   return {subtype:base.subtype,type};
  }
  // Old-map is an original scan; a native map spec would select regeneration rules.
  const kinds=base.nativeKinds??(base.subtype==='I3-13_OldMap'?['asset']:type==='D1_Table'?['table']:['D2_Chart','D3_Graph'].includes(type)?['graph']:type==='D4_Diagram'?['schematic']:type==='I3_Map'?['map']:type==='ITA_TypeSwap'?['text','dialogue']:type.startsWith('IT')?['text','dialogue','asset']:['asset']);
  if(!kinds.includes(spec.kind))throw new Error(`${where}: recipe ${unit.recipe} is incompatible with native kind ${spec.kind}; expected ${kinds.join('|')}`);
  if(type==='ITA_TypeSwap'){
   const nativeChalkboardText=base.subtype==='ITA-5_SoloBoard'&&spec.kind==='text'&&spec.variant==='chalkboard';
   const expected=base.subtype==='ITA-1_TypeBoard'||nativeChalkboardText?'text':'dialogue';
   if(spec.kind!==expected)throw new Error(`${where}: recipe ${unit.recipe} requires native kind ${expected}`);
  }
  return {subtype:base.subtype,type};
 }
 const queue=request.units.map((unit,n)=>({unit,n}));
 let nativeComposition=false;
 for(let q=0;q<queue.length;q++){
  const {unit:original,n,specPath,inference:prepared}=queue[q];
  const inference=prepared??(original?.spec!==undefined?inferSpec(original,`units[${n}]`,checkBinding):null);
  const unit=inference?{...original,...(inference.rootRecipe?{recipe:inference.rootRecipe}:{}),...(original.dataSource===undefined&&inference.dataSource?{dataSource:inference.dataSource}:{}),contains:inference.contains,people:inference.people?true:original.people}:original;
  if(inference){
   for(const part of inference.supplemental??[])if(textExtras[part]){add('design',textExtras[part]);if(part==='reserve')add('design','core/content-layout.md');}
   nativeComposition ||= inference.composition||(inference.children?.length??0)>0;
   for(const [i,child] of (inference.children??[]).entries())queue.push({unit:{...child,id:`${unit.id||`unit-${n+1}`}:native-${i+1}`},n,specPath:child.specPath,inference:child.inference});
  }
  if(!unit || typeof unit!=='object')throw new Error('Invalid unit');
  const id=unit.id||`unit-${n+1}`;
  if(typeof id!=='string'||!id.trim()||unitIds.has(id))throw new Error('Unique nonempty unit IDs required');
  unitIds.add(id);
  const base=own(recipes,unit.recipe)?recipes[unit.recipe]:own(index.subtypes,unit.recipe)?{subtype:unit.recipe}:null;
  if(!base)throw new Error(`Unknown recipe: ${unit.recipe}; use --list`);
  const contains=unit.contains??[];
  if(!Array.isArray(contains)||contains.some(x=>typeof x!=='string'))throw new Error('contains must be an array of component names');
  const features=new Set([...(base.features||[]),...(unit.features||[])]);
  let people=unit.people??base.people??false;
  for(const part of contains){
   if(part==='people')people=true;
   else if(own(textExtras,part)){if(part==='reserve')features.add('reserve');}
   else if(own(index.features,part))features.add(part);
   else if(own(recipes,part)||own(index.subtypes,part))throw new Error(`${part} is a recipe, not a contains component. Use recipe:"${part}" for the appropriate production unit, with a supported variant when required; see --list. The request was not changed.`);
   else throw new Error(`Unknown component: ${part}`);
  }
  if(unit.dataSource==='research')features.add('real-data');
  if(unit.dataSource && !['research','provided','hypothetical','qualitative'].includes(unit.dataSource))throw new Error('Unknown dataSource');
  if(features.has('messenger'))people=false;
  const row=index.subtypes[base.subtype];
  const mode=unit.textMode??(row.type.startsWith('IT')?'prose':'labels');
  if(!['none','labels','prose'].includes(mode))throw new Error('textMode must be none, labels or prose');
  if(mode==='none' && contains.some(x=>['underline','inline-box','prose'].includes(x)))throw new Error('Text components require labels or prose mode');
  // Map labels need the same collision/anchor rules regardless of thematic subtype.
  // Original scanned maps retain the photo contract instead of fabricated overlays.
  if(row.type==='I3_Map' && base.subtype!=='I3-13_OldMap' && mode!=='none')features.add('points');
  const selection={subtype:base.subtype,variant:unit.variant??base.variant,features:[...features],people};
  const selected=prepareRules({...selection,nativeSpec:unit.spec},root);
  const modules=new Set(selected.modules);
  // Actual native kinds can retain subtype contracts instead of an alias's default path.
  const moduleOverride=base.moduleOverrides?.[unit.spec?.kind]??base.moduleOverrides?.default;
  if(moduleOverride?.modules){
   for(const name of row.modules)modules.delete(name);
   for(const name of moduleOverride.modules)modules.add(name);
   for(const feature of features)for(const name of index.features[feature].modules)modules.add(name);
  }
  for(const name of moduleOverride?.omitModules??[])modules.delete(name);
  if(mode!=='none'){
   add('design','core/typography.md');add('execute','execution/text.md');
   if(mode==='prose'||contains.includes('prose'))add('design','core/prose.md');
  }
  if(row.type.startsWith('IT')||row.type==='D1_Table'||features.has('reserve'))add('design','core/content-layout.md');
  for(const [part,file] of Object.entries(textExtras))if(contains.includes(part)||features.has(part))add('design',file);
  add('design',index.types[row.type],id,modules);
  add('design',row.file,id,modules);
  for(const name of modules){
   const file=index.modules[name];
   const phase=file.startsWith('execution/')?'execute':'design';
   add(phase,file,id,modules);
  }
  if(selected.hasPeople)add('design',index.people.file,id,modules);
  if(modules.has('artwork')||modules.has('photo')||selected.hasPeople)add('execute','execution/assets.md');
  resolved.push({id,recipe:unit.recipe,subtype:selected.subtype,type:selected.type,variant:selected.variant,features:selected.features,people:selected.hasPeople,textMode:mode,contains,modules:[...modules],...(unit.dataSource?{dataSource:unit.dataSource}:{}),...(inference?{inference:inference.provenance}:{}),...(specPath?{specPath}:{})});
 }
 if(request.units.length>1||nativeComposition){
  add('design','core/composition.md');
  add('execute',index.modules.composition);
 }
 add('deliver','core/review.md');add('deliver','execution/delivery.md');
 const header=`# 이번 그림의 작업 지침\n\n이 문서는 요청의 실제 구성에 따라 조립했다. 분류 코드는 메타데이터이며 읽기 순서나 MCP kind가 아니다. 명시 요청·의미 보존을 우선하고 기본값/조건/임시 우회책을 구별한다. 선택 목록이 원 요청의 인물·원화/사진·실자료·밑줄·문단 박스·예약 영역을 빠뜨리지 않았는지 먼저 대조한다.\n\n${resolved.map(u=>`- ${u.id}: ${u.recipe}; 분류 ${u.subtype}${u.variant?' / '+u.variant:''}; 인물 ${u.people?'있음':'없음'}; 문자 ${u.textMode}; 구성요소 ${u.contains.join(', ')||'기본'}; 조건 ${u.features.join(', ')||'기본'}`).join('\n')}\n`;
 const contents={
  design:header+'\n## 제작 순서\n\n원문·자료·최종 폭 확정 → 실제 내용/자산 측정 → 자료 좌표와 외피·인물 배치 → 이번 형식의 검수 항목 확인. 아래에는 해당 작업의 원칙만 포함된다.\n\n'+sections.design.join('\n\n'),
  execute:'# 선택한 도구의 실행 계약\n\n실행 직전에 읽고 설치 앱의 실제 스키마로 확인한다. 응답 유실/리비전 오류가 있을 때만 execution/recovery.md를 읽는다. 임시 우회는 해당 증상이 재현된 경우에만 적용한다.\n\n'+sections.execute.join('\n\n'),
  deliver:'# 완성 검수와 납품\n\n원본·JPEG를 같은 최종 상태로 만들고 실제 JPEG를 직접 확인한다. 기술 검증만으로 시각 통과를 선언하지 않는다.\n\n'+sections.deliver.join('\n\n'),
 };
 const signature=createHash('sha256').update(JSON.stringify({request,contents})).digest('hex').slice(0,16);
 return {signature,resolved,phaseSources,contents};
}
export function writeTask(request,out,root=skillRoot){
 if(!out)throw new Error('--out must be an internal temporary directory');
 const result=prepareTask(request,root),dir=path.resolve(out),base=fs.realpathSync(root);
 let ancestor=dir;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
 const planned=path.resolve(fs.realpathSync(ancestor),path.relative(ancestor,dir));
 if(planned===base||planned.startsWith(base+path.sep))throw new Error('Output must be outside installed skill');
 fs.mkdirSync(dir,{recursive:true});
 const files={};
 for(const phase of ['design','execute','deliver']){
  const file=path.join(dir,`task-${result.signature}-${phase}.md`);
  try{fs.writeFileSync(file,result.contents[phase]+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST'||fs.readFileSync(file,'utf8')!==result.contents[phase]+'\n')throw e;}
  files[phase]=file;
 }
 return {signature:result.signature,selected:result.resolved,readNow:[files.design],beforeExecute:[files.execute],beforeDeliver:[files.deliver],sources:result.phaseSources,characters:Object.fromEntries(Object.entries(result.contents).map(([k,v])=>[k,v.length]))};
}
function main(args){
 if(args.includes('--list')){const i=readIndex();console.log(JSON.stringify({recipes,additionalRecipes:Object.keys(i.subtypes),components:['people','prose','underline','inline-box',...Object.keys(i.features)],variants:Object.fromEntries(Object.entries(i.subtypes).filter(([,r])=>r.variants).map(([k,r])=>[k,Object.keys(r.variants)]))},null,2));return;}
 if(args.includes('--help')){console.log('node scripts/prepare_task.mjs --request <JSON file> --out <internal dir>\nJSON: {client?:"codex"|"claude"|"gemini", caller?:"exam-agent", units:[{id,recipe,variant?,contains?:[],features?:[],people?,textMode?:"none"|"labels"|"prose",dataSource?:"research"|"provided"|"hypothetical"|"qualitative",spec?:ProductionSpec,specRecipes?:{"spec.blocks[0].spec":"table"|{recipe,variant?,people?,dataSource?,textMode?,contains?,features?}}}]}\nUse --list for recipes, variants and components. Read the returned phase files when their phase starts.');return;}
 let input,out;
 for(let j=0;j<args.length;j++){
  const key=args[j],val=args[++j];if(!val||val.startsWith('--'))throw new Error('Missing option value');
  if(key==='--request')input=val;else if(key==='--out')out=val;else throw new Error('Unknown option: '+key);
 }
 if(!input)throw new Error('--request required');
 console.log(JSON.stringify(writeTask(JSON.parse(fs.readFileSync(input,'utf8')),out),null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
}
