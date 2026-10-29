import {readIndex, skillRoot} from './prepare_rules.mjs';

const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

function invalid(path,detail){
 throw new Error(`Invalid recipeAliases.${path}: ${detail}`);
}

function validateRecipeAliases(index){
 const recipes=index.recipeAliases;
 if(!isObject(recipes))throw new Error('Invalid recipeAliases in references/rule-index.json: expected an object');
 for(const [name,recipe] of Object.entries(recipes)){
  if(!name.trim())invalid('<empty>','recipe name must not be empty');
  if(!isObject(recipe))invalid(name,'expected an object');
  if(typeof recipe.subtype!=='string'||!recipe.subtype.trim())invalid(`${name}.subtype`,'expected a nonempty subtype ID');
  const subtype=index.subtypes?.[recipe.subtype];
  if(!isObject(subtype))invalid(`${name}.subtype`,`unknown subtype ${JSON.stringify(recipe.subtype)}`);
  if(recipe.variant!==undefined){
   if(typeof recipe.variant!=='string'||!own(subtype.variants??{},recipe.variant))invalid(`${name}.variant`,`unknown variant ${JSON.stringify(recipe.variant)} for ${recipe.subtype}`);
  }
  if(recipe.people!==undefined&&typeof recipe.people!=='boolean')invalid(`${name}.people`,'expected a boolean');
  if(recipe.features!==undefined){
   if(!Array.isArray(recipe.features)||recipe.features.some(feature=>typeof feature!=='string'))invalid(`${name}.features`,'expected an array of feature names');
   for(const feature of recipe.features)if(!own(index.features??{},feature))invalid(`${name}.features`,`unknown feature ${JSON.stringify(feature)}`);
  }
  if(recipe.nativeKinds!==undefined&&(!Array.isArray(recipe.nativeKinds)||recipe.nativeKinds.some(kind=>typeof kind!=='string'||!kind.trim())))invalid(`${name}.nativeKinds`,'expected an array of nonempty kind names');
  if(recipe.moduleOverrides!==undefined){
   if(!isObject(recipe.moduleOverrides))invalid(`${name}.moduleOverrides`,'expected an object');
   for(const [kind,override] of Object.entries(recipe.moduleOverrides)){
    if(!isObject(override))invalid(`${name}.moduleOverrides.${kind}`,'expected an object');
    for(const key of ['modules','omitModules'])if(override[key]!==undefined){
     if(!Array.isArray(override[key])||override[key].some(module=>typeof module!=='string'))invalid(`${name}.moduleOverrides.${kind}.${key}`,'expected an array of module names');
     for(const module of override[key])if(!own(index.modules??{},module))invalid(`${name}.moduleOverrides.${kind}.${key}`,`unknown module ${JSON.stringify(module)}`);
    }
   }
  }
 }
 return recipes;
}

export function readRecipeRegistry(root=skillRoot){
 const index=readIndex(root);
 return {index,recipes:validateRecipeAliases(index)};
}

export function resolveRecipe(name,registry){
 if(typeof name!=='string')return null;
 if(own(registry.recipes,name))return registry.recipes[name];
 if(own(registry.index.subtypes??{},name))return {subtype:name};
 return null;
}
