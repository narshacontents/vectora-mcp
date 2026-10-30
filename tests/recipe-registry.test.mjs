import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {prepareTask, recipes} from '../skills/create-kice-illustration/scripts/prepare_task.mjs';
import {readRecipeRegistry} from '../skills/create-kice-illustration/scripts/recipe_registry.mjs';
import {skillRoot} from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';

test('registry preserves every pre-refactor route and representative alias contracts',()=>{
 assert.equal(Object.keys(recipes).length,73);
 assert.deepEqual(recipes['caption-frame'],{subtype:'ITA-1_TypeBoard',variant:'caption',nativeKinds:['composition']});
 const previousRecipes=Object.fromEntries(Object.entries(recipes).filter(([name])=>name!=='caption-frame'));
 assert.equal(createHash('sha256').update(JSON.stringify(previousRecipes)).digest('hex'),'04b67ab7828b03ef0671a685829e56d6ebc1ddfadbb187ac333c65c1c7de8fce');
 assert.deepEqual(recipes.comparison,{subtype:'D4-07_Others',features:['node']});
 assert.deepEqual(recipes['site-plan'].nativeKinds,['schematic','map']);
 assert.deepEqual(recipes.place,{subtype:'ITC-3_Place'});
 assert.deepEqual(recipes['image-board'],{subtype:'ITB-1_ImageBoard'});
 assert.deepEqual(recipes['original-person'],{subtype:'ITC-2_RealPhoto'});
 const list=JSON.parse(execFileSync(process.execPath,['skills/create-kice-illustration/scripts/prepare_task.mjs','--list'],{encoding:'utf8'}));
 assert.deepEqual(list.recipes,recipes);
});

test('registered aliases target existing subtypes, files, features, variants, and modules',()=>{
 const {index,recipes:registry}=readRecipeRegistry();
 for(const [name,recipe] of Object.entries(registry)){
  const subtype=index.subtypes[recipe.subtype];
  assert.ok(subtype,`${name} -> ${recipe.subtype}`);
  assert.ok(existsSync(path.join(skillRoot,subtype.file)),`${name} file ${subtype.file}`);
  for(const feature of recipe.features??[])assert.ok(index.features[feature],`${name} feature ${feature}`);
  if(recipe.variant!==undefined)assert.ok(Object.hasOwn(subtype.variants??{},recipe.variant),`${name} variant ${recipe.variant}`);
  for(const override of Object.values(recipe.moduleOverrides??{})){
   for(const module of [...(override.modules??[]),...(override.omitModules??[])])assert.ok(index.modules[module],`${name} module ${module}`);
  }
 }
});

test('legacy subtype variants and module overrides still drive task routing',()=>{
 for(const [recipe,subtype,variant] of [
  ['newspaper','ITA-1_TypeBoard','newspaper'],['webpage','ITA-1_TypeBoard','screen'],
  ['teacher-board','ITA-5_SoloBoard','board'],['book','ITA-1_TypeBoard','paper'],
  ['projection-screen','ITA-1_TypeBoard','scroll'],
 ]){
  const selected=prepareTask({units:[{recipe}]}).resolved[0];
  assert.equal(selected.subtype,subtype,recipe);
  assert.equal(selected.variant,variant,recipe);
 }
 const formula=prepareTask({units:[{recipe:'formula'}]}).resolved[0];
 assert.ok(formula.modules.includes('formula-native'));
 const surface=prepareTask({units:[{recipe:'surface'}]}).resolved[0];
 for(const module of ['data-surface','graph-style','surface-graph-api'])assert.ok(surface.modules.includes(module),module);
});

test('prepareTask and native binding resolve aliases from the supplied skill root',()=>{
 const temporary=mkdtempSync(path.join(os.tmpdir(),'vectora-recipe-root-'));
 const customRoot=path.join(temporary,'skill');
 try{
  cpSync(skillRoot,customRoot,{recursive:true});
  const indexPath=path.join(customRoot,'references/rule-index.json');
  const index=JSON.parse(readFileSync(indexPath,'utf8'));
  index.recipeAliases['custom-local-diagram']={subtype:'D4-06_Schematic',nativeKinds:['schematic']};
  writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');

  const {recipes:customRegistry}=readRecipeRegistry(customRoot);
  assert.equal(customRegistry['custom-local-diagram'].subtype,'D4-06_Schematic');
  const result=prepareTask({units:[{recipe:'custom-local-diagram',spec:{
   kind:'schematic',layout:'relations',widthMm:100,
   nodes:[{id:'left',text:'가',shape:'rect'},{id:'right',text:'나',shape:'rect'}],
   edges:[{id:'pair',from:'left',to:'right',direction:'none',routing:'straight'}],
  }}]},customRoot);
  assert.equal(result.resolved[0].recipe,'custom-local-diagram');
  assert.equal(result.resolved[0].subtype,'D4-06_Schematic');
  assert.ok(result.phaseSources.design.some(source=>source.path==='recipes/D4_Diagram/D4-06_Schematic.md'));
 }finally{
  rmSync(temporary,{recursive:true,force:true});
 }
});

test('unknown recipes and malformed registered targets fail with actionable errors',()=>{
 assert.throws(()=>prepareTask({units:[{recipe:'not-registered'}]}),/Unknown recipe: not-registered; use --list/);
 const temporary=mkdtempSync(path.join(os.tmpdir(),'vectora-recipe-invalid-'));
 try{
  const references=path.join(temporary,'references');
  mkdirSync(references);
  writeFileSync(path.join(references,'rule-index.json'),JSON.stringify({
   recipeAliases:{broken:{subtype:'D9-99_Missing'}},subtypes:{},features:{},modules:{},
  }));
  assert.throws(()=>readRecipeRegistry(temporary),/Invalid recipeAliases\.broken\.subtype: unknown subtype "D9-99_Missing"/);
 }finally{
  rmSync(temporary,{recursive:true,force:true});
 }
});
