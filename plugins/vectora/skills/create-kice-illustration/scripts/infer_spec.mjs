// Selection hints only: the installed runtime remains the native schema authority.
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const list=v=>Array.isArray(v)?v:[];
const nonempty=v=>typeof v==='string'&&v.length>0;
export function inferSpec(unit, prefix, checkBinding=()=>{}){
 let contains=new Set(unit.contains??[]);
 const provenance=[],children=[],used=new Set(),active=new Set();
 const sharedScalarTargets=new Map(),scalarSourceKinds=new Set(['provided','hypothetical']);
 function indexSharedScalarTargets(s,relative,scanActive=new WeakSet()){
  if(!object(s)||scanActive.has(s))return;
  scanActive.add(s);
  if(s.kind==='composition'){
   for(const binding of list(s.sharedScalar?.bindings)){
    const ids=binding?.target?.childIds;
    if(Array.isArray(ids)&&ids.length&&ids.every(nonempty)){
     let current=s,path=relative,found=true;
     for(let i=0;i<ids.length;i++){
      if(current?.kind!=='composition'){found=false;break;}
      const matches=list(current.children).map((child,index)=>({child,index})).filter(x=>x.child?.id===ids[i]&&object(x.child?.spec));
      if(matches.length!==1){found=false;break;}
      path+=`.children[${matches[0].index}].spec`;
      current=matches[0].child.spec;
      if(i<ids.length-1&&current.sharedScalar!==undefined){found=false;break;}
     }
     if(found&&current?.kind==='map'&&object(current.scalar)){
      const entries=sharedScalarTargets.get(path)??[];
      entries.push({bindingId:binding.id,childIds:[...ids]});
      sharedScalarTargets.set(path,entries);
     }
    }
   }
   list(s.children).forEach((child,i)=>indexSharedScalarTargets(child?.spec,`${relative}.children[${i}].spec`,scanActive));
  }
  scanActive.delete(s);
 }
 indexSharedScalarTargets(unit.spec,'spec');
 let rootRecipe;
 const mappings=unit.specRecipes??{};
 if(!object(mappings))throw new Error('specRecipes must map spec-relative paths to recipes');
 const note=(path,condition,inferred,evidence)=>{const entry={path,condition,inferred,...(evidence===undefined?{}:{evidence})};provenance.push(entry);if(localProvenance!==provenance)localProvenance.push(entry);};
 const add=(part,path,condition)=>{contains.add(part);note(path,condition,part);};
 let hasText=false,people=false,composition=false,localProvenance=provenance,localDataSource;
 const supplemental=[];
 function style(s,p){if(!object(s))return;for(const k of ['underline','doubleUnderline'])if(s[k]===true)add('underline',`${p}.${k}`,'true');if(object(s.vectoraInlineBox))add('inline-box',`${p}.vectoraInlineBox`,'native inline box');}
 function text(v,p){
  if(nonempty(v)){hasText=true;note(p,'nonempty text','text');return;}
  if(!object(v))return;
  if(nonempty(v.text)){hasText=true;note(`${p}.text`,'nonempty text','text');}
  if(object(v.textFlow))add('text-flow',`${p}.textFlow`,'native TextFrameSpec.textFlow');
  for(const [k,part] of [['underlines','underline'],['inlineBoxes','inline-box'],['inlineBlanks','inline-box']])if(list(v[k]).length)add(part,`${p}.${k}`,'nonempty array');
  style(v,p);
  if(Array.isArray(v.styles))v.styles.forEach((run,i)=>style(run?.style,`${p}.styles[${i}].style`));
  else if(object(v.styles))for(const [line,chars] of Object.entries(v.styles))if(/^\d+$/.test(line)&&object(chars))for(const [char,s] of Object.entries(chars))if(/^\d+$/.test(char))style(s,`${p}.styles.${line}.${char}`);
 }
 function textBlock(block,p){
  if(!object(block))return;
  text(block.text,`${p}.text`);
  if(block.richText!==undefined)text(block.richText,`${p}.richText`);
 }
 function reserve(v,p){if(v!==undefined){if(!object(v))throw new Error(`${p}: reserve must be an object; runtime validates reservation dimensions`);add('reserve',p,'native reserve');}}
 function scopedReserve(v,p){
  if(v===undefined)return;
  const saved={contains,hasText,people,localProvenance,localDataSource};
  contains=new Set();hasText=false;people=false;localProvenance=[];localDataSource=undefined;
  reserve(v,p);
  for(const part of contains)supplemental.push(part);
  ({contains,hasText,people,localProvenance,localDataSource}=saved);
 }
 function recipe(s){
  if(s.kind==='map'&&object(s.scalar))return 'isoline-map';
  if(s.kind==='graph'){
   if(s.type==='surface')return 'surface';
   if(s.chartStyle!==undefined)return ({column:'bar',bar:'bar','stacked-column':'stacked-bar','stacked-bar':'stacked-bar','percent-column':'stacked-bar','percent-bar':'stacked-bar',line:'line','smooth-line':'line','step-line':'line',radar:'radar',mosaic:'mosaic'})[s.chartStyle];
   if(s.type==='bar')return s.layout===undefined||['horizontal','mirror'].includes(s.layout)?'bar':undefined;
   if(s.type==='pie')return 'pie';
   if(s.type==='line')return 'line';
  }
  if(s.kind==='text')return ({'newspaper-wave':'newspaper','newspaper-band':'newspaper',browser:'screen',scroll:'scroll','scroll-screen':'scroll',noticeboard:'board',chalkboard:'teacher-board',worksheet:'worksheet'})[s.variant];
  if(s.kind==='dialogue')return ({vertical:'vertical-dialogue',horizontal:'horizontal-dialogue',presentation:'presentation'})[s.layout];
  // A native table does not distinguish flat/cross/nested/checklist semantics.
 }
 function visit(s,relative,root=false,depth=0){
  const p=prefix+'.'+relative;
  if(!object(s)||typeof s.kind!=='string')throw new Error(`${p}: expected native ProductionSpec with kind`);
  if(depth>32||active.has(s))throw new Error(`${p}: cyclic or excessively deep native spec`);
  active.add(s);
  const saved={contains,hasText,people,localProvenance,localDataSource};
  let binding=root?unit:null;
  const explicit=!root&&Object.hasOwn(mappings,relative);
  if(explicit){
   const value=mappings[relative];
   binding=typeof value==='string'?{recipe:value}:value;
   const allowed=['recipe','variant','people','dataSource','textMode','contains','features'];
   if(!object(binding)||!nonempty(binding.recipe)||Object.keys(binding).some(k=>!allowed.includes(k))||binding.people!==undefined&&typeof binding.people!=='boolean')throw new Error(`${p}: specRecipes mapping requires a recipe string or {recipe,variant?,people?,dataSource?,textMode?,contains?,features?}`);
   used.add(relative);
  }else if(!root&&s.kind!=='composition')binding={recipe:recipe(s)};
  if(root&&s.kind==='map'&&object(s.scalar)&&!binding?.recipe){
   binding={...unit,recipe:'isoline-map'};
   rootRecipe='isoline-map';
  }
  if(!root){
   if(binding&&!nonempty(binding.recipe))throw new Error(`${p}: cannot uniquely select recipe for kind ${s.kind}; set unit.specRecipes[${JSON.stringify(relative)}] to an explicit recipe`);
   contains=new Set(binding?.contains??[]);hasText=false;people=false;localProvenance=[];
  }
  const mergedSpans=s.kind==='table'?list(s.cells).flatMap((c,i)=>['rowSpan','colSpan'].filter(k=>typeof c?.[k]==='number'&&Number.isFinite(c[k])&&c[k]>1).map(k=>`${p}.cells[${i}].${k}`)):[];
  for(const path of mergedSpans)note(path,'numeric span > 1','D1-04_Nested');
  if(mergedSpans.length&&binding?.recipe==='table'){
   binding={...binding,recipe:'D1-04_Nested'};
   if(root)rootRecipe=binding.recipe;
  }
  const child=binding&&!root?{...binding,spec:s,specPath:p,inference:null}:null;
  if(child)children.push(child);
  if(binding){
   const selection=checkBinding(binding,s,p);
   if(s.kind==='map'&&object(s.scalar)&&selection?.type==='I3_Map'&&selection.subtype!=='I3-34_Isoline')throw new Error(`${p}.scalar: native scalar maps use the isoline-map recipe`);
   if(mergedSpans.length&&s.kind==='table'&&selection?.type==='D1_Table'&&selection.subtype!=='D1-04_Nested')throw new Error(`${p}: merged native table cells at ${mergedSpans.join(', ')} conflict with explicit ${selection.subtype}; use D1-04_Nested`);
   if(!root)note(p,explicit?'explicit specRecipes mapping':`native ${s.kind}${s.chartStyle?':'+s.chartStyle:s.type?':'+s.type:''}`,binding.recipe);
  }
  switch(s.kind){
   case 'text':
    if(s.variant!==undefined&&!['newspaper-wave','newspaper-band','scroll','scroll-screen','browser','noticeboard','chalkboard','worksheet'].includes(s.variant))throw new Error(`${p}.variant: unsupported native text frame variant ${s.variant}; use a supported native text frame variant`);
    if(s.variant==='browser'&&object(s.aside)&&s.aside.layout==='wrap'&&nonempty(s.aside.anchorBlockId))add('text-flow',`${p}.aside.layout`,'native browser aside.layout === "wrap" with nonempty anchorBlockId');
    for(const k of ['title','body'])text(s[k],`${p}.${k}`);
    if(s.variant==='worksheet'&&object(s.worksheet)){
     list(s.worksheet.fields).forEach((field,i)=>{text(field?.label,`${p}.worksheet.fields[${i}].label`);text(field?.value,`${p}.worksheet.fields[${i}].value`);});
     text(s.worksheet.footer,`${p}.worksheet.footer`);
    }
    for(const k of ['masthead','date','tabTitle'])text(s.background?.[k],`${p}.background.${k}`);
    list(s.cards).forEach((c,i)=>{for(const k of ['title','body','author'])text(c?.[k],`${p}.cards[${i}].${k}`);});
    reserve(s.reserve,`${p}.reserve`);
    list(s.blocks).forEach((b,i)=>{const r=`${relative}.blocks[${i}]`;if(b?.type==='text')text(b.text,`${prefix}.${r}.text`);else if(b?.type==='response'&&s.variant==='worksheet'){text(b.text,`${prefix}.${r}.text`);text(b.label,`${prefix}.${r}.label`);for(const k of ['widthMm','heightMm','lines'])if(b[k]!==undefined)add('reserve',`${prefix}.${r}.${k}`,`explicit worksheet response ${k}`);}else if(b?.type==='reserve')reserve(b.reserve,`${prefix}.${r}.reserve`);else if(b?.type==='graph')visit(b.graph,r+'.graph',false,depth+1);else if(b?.type==='component')visit(b.spec,r+'.spec',false,depth+1);else throw new Error(`${prefix}.${r}: unsupported block type`);});
    list(s.graphSlots).forEach((slot,i)=>visit(slot?.graph,`${relative}.graphSlots[${i}].graph`,false,depth+1));break;
   case 'composition':
    composition=true;
    if(object(s.sharedScalar)){
     note(`${p}.sharedScalar`,'native composition shared scalar owner','shared-scalar-owner',s.sharedScalar.schema);
     for(const k of ['quantity','unit'])if(s.sharedScalar[k]!==undefined)note(`${p}.sharedScalar.${k}`,'composition-owned scalar metadata','shared-scalar-owner',s.sharedScalar[k]);
     note(`${p}.sharedScalar.scale`,'sole editable scale source for bound scalar maps','shared-scalar-owner');
     note(`${p}.sharedScalar.legend`,'single composition-owned native legend','shared-scalar-owner');
     text(s.sharedScalar.legend?.title,`${p}.sharedScalar.legend.title`);
     text(s.sharedScalar.legend?.highLabel,`${p}.sharedScalar.legend.highLabel`);
     text(s.sharedScalar.legend?.lowLabel,`${p}.sharedScalar.legend.lowLabel`);
     list(s.sharedScalar.scale?.bands).forEach((band,i)=>text(band?.label,`${p}.sharedScalar.scale.bands[${i}].label`));
     list(s.sharedScalar.bindings).forEach((binding,i)=>{
      const ids=binding?.target?.childIds;
      if(Array.isArray(ids))note(`${p}.sharedScalar.bindings[${i}].target.childIds`,'stable composition child ID path to a scalar map',`shared-scalar-target:${binding?.id??i}`,ids);
     });
    }
    list(s.children).forEach((c,i)=>{const r=`${relative}.children[${i}]`;scopedReserve(c?.reserve,`${prefix}.${r}.reserve`);if(c?.spec!==undefined)visit(c.spec,r+'.spec',false,depth+1);else textBlock(c,`${prefix}.${r}`);});break;
   case 'dialogue':
    if(nonempty(s.sharedScene?.artwork?.assetId)){people=true;note(`${p}.sharedScene.artwork.assetId`,'nonempty shared-scene artwork asset reference','people');}
    list(s.speakers).forEach((v,i)=>{text(v?.label,`${p}.speakers[${i}].label`);if(nonempty(v?.assetId)){people=true;note(`${p}.speakers[${i}].assetId`,'portrait asset reference','people');}});
    list(s.turns).forEach((v,i)=>{text(v?.text,`${p}.turns[${i}].text`);text(v?.richText,`${p}.turns[${i}].richText`);});
    text(s.screenText,`${p}.screenText`);text(s.screenRichText,`${p}.screenRichText`);
    text(s.sharedScene?.board?.title,`${p}.sharedScene.board.title`);text(s.sharedScene?.board?.titleRichText,`${p}.sharedScene.board.titleRichText`);
    list(s.sharedScene?.artwork?.dataRegions).forEach((region,i)=>{const r=`${relative}.sharedScene.artwork.dataRegions[${i}]`;if(region?.spec!==undefined)visit(region.spec,`${r}.spec`,false,depth+1);else textBlock(region,`${prefix}.${r}`);});
    if(s.screenGraph!==undefined)visit(s.screenGraph,relative+'.screenGraph',false,depth+1);break;
   case 'table':list(s.cells).forEach((c,i)=>{text(c?.text,`${p}.cells[${i}].text`);text(c?.richText,`${p}.cells[${i}].richText`);if(c?.content!==undefined)visit(c.content,`${relative}.cells[${i}].content`,false,depth+1);});break;
   case 'graph':
    for(const k of ['xTitle','yTitle','unit','xUnit','yUnit'])text(s[k],`${p}.${k}`);
    for(const k of ['title','note','legendTitle','secondaryTitle','sizeLegendTitle'])text(s.chartOptions?.[k],`${p}.chartOptions.${k}`);
    for(const k of ['categories','x'])list(s[k]).forEach((v,i)=>text(v,`${p}.${k}[${i}]`));
    list(s.panels).forEach((v,i)=>text(v?.label,`${p}.panels[${i}].label`));
    for(const k of ['annotations','categoryGroups','sizeLegend'])list(s.chartOptions?.[k]).forEach((v,i)=>text(v?.label,`${p}.chartOptions.${k}[${i}].label`));
    list(s.chartOptions?.radarAxisLabels).forEach((v,i)=>text(v,`${p}.chartOptions.radarAxisLabels[${i}]`));
    list(s.series).forEach((v,i)=>{text(v?.label,`${p}.series[${i}].label`);list(v?.labels).forEach((x,j)=>text(x,`${p}.series[${i}].labels[${j}]`));list(v?.points).forEach((x,j)=>text(x?.label,`${p}.series[${i}].points[${j}].label`));});break;
   case 'verticalText':case 'pathText':text(s,p);break;
   case 'map':
    if(list(s.locators).length)add('inset',`${p}.locators`,'owned native map locators');
    list(s.overlays).forEach((v,i)=>{if(v?.kind==='label')text(v.text,`${p}.overlays[${i}].text`);});
    if(object(s.scalar)){
     add('statistics',`${p}.scalar`,'native scalar grid map');
     if(s.scalar.grid?.provenance!==undefined){
      note(`${p}.scalar.grid.provenance`,'native scalar source provenance','map-source-provenance',s.scalar.grid.provenance);
      if(scalarSourceKinds.has(s.scalar.grid.provenance?.kind)){
       localDataSource=s.scalar.grid.provenance.kind;
       note(`${p}.scalar.grid.provenance.kind`,'matches task dataSource vocabulary',`dataSource:${localDataSource}`,localDataSource);
      }
     }
     for(const k of ['quantity','unit'])if(s.scalar.grid?.[k]!==undefined)note(`${p}.scalar.grid.${k}`,'preserve native scalar metadata','map-scalar-metadata',s.scalar.grid[k]);
     const bound=sharedScalarTargets.get(relative);
     if(bound){
      note(`${p}.scalar.scale`,'bound cache; composition.sharedScalar is the sole editable scale', 'shared-scalar-cache',bound);
      note(`${p}.scalar.legend.placement`,'bound map suppresses its local legend', 'shared-scalar-local-legend',bound);
     }
     if(s.scalar.legend?.placement!=='none'){
      text(s.scalar.legend?.title,`${p}.scalar.legend.title`);
      text(s.scalar.legend?.highLabel,`${p}.scalar.legend.highLabel`);
      text(s.scalar.legend?.lowLabel,`${p}.scalar.legend.lowLabel`);
      list(s.scalar.scale?.bands).forEach((band,i)=>text(band?.label,`${p}.scalar.scale.bands[${i}].label`));
     }
    }
    break;
   case 'asset':case 'schematic':break;
   default:throw new Error(`${p}: unsupported native kind ${s.kind}; rule preparation does not validate native specs`);
  }
  if(binding?.textMode==='none'&&hasText)throw new Error(`${p}: textMode:none contradicts actual text at ${localProvenance.find(x=>x.inferred==='text').path}`);
  if(binding?.people===false&&people){const source=localProvenance.find(x=>x.inferred==='people');const kind=source.path.endsWith('.sharedScene.artwork.assetId')?'shared-scene artwork asset':'portrait asset';throw new Error(`${p}: people:false contradicts ${kind} at ${source.path}`);}
  if(people&&(binding?.recipe==='messenger'||(binding?.features??[]).includes('messenger')))throw new Error(`${p}: messenger contradicts portrait assets`);
  if(child)child.inference={contains:[...contains],people,provenance:localProvenance,...(localDataSource?{dataSource:localDataSource}:{})};
  if(!binding)for(const part of contains)supplemental.push(part);
  const unboundContent=!binding?{contains:[...contains],hasText,provenance:[...localProvenance]}:null;
  if(!root){
   ({contains,hasText,people,localProvenance,localDataSource}=saved);
   if(unboundContent){
    for(const part of unboundContent.contains)contains.add(part);
    if(unboundContent.hasText)hasText=true;
    if(localProvenance!==provenance)localProvenance.push(...unboundContent.provenance);
   }
  }
  active.delete(s);
 }
 visit(unit.spec,'spec',true);
 for(const key of Object.keys(mappings))if(!used.has(key))throw new Error(`Unused specRecipes mapping: ${key}; use an exact visited child spec path`);
 return {contains:[...contains],people,children,composition,provenance,supplemental,...(localDataSource?{dataSource:localDataSource}:{}),...(rootRecipe?{rootRecipe}:{})};
}
