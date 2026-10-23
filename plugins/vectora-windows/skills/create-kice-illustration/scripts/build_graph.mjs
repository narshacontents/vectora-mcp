#!/usr/bin/env node
/** Node/fontkit adapter for the shared editable graph builder. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {buildGraphCore, palette} from '../../../src/production/graphs-core.mjs';
const require=createRequire(import.meta.url);
const check=(ok,message)=>{if(!ok)throw new Error(message);};
export {palette};
export function findFont(explicit){
  if(explicit)return explicit;
  const directories=[
    process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Microsoft','Windows','Fonts'),
    process.env.WINDIR&&path.join(process.env.WINDIR,'Fonts'),
  ].filter(Boolean);
  for(const dir of directories){
    const file=fs.existsSync(dir)&&fs.readdirSync(dir).find(n=>/^UNDv31-Regular\.ttf$/i.test(n));
    if(file)return path.join(dir,file);
  }
  check(false,'Installed UNDv31-Regular.ttf not found in %LOCALAPPDATA%/Microsoft/Windows/Fonts or %WINDIR%/Fonts. Supply --font; no UND v3.0 fallback is used.');
}
function adapter(fontPath){
  let fontkit;
  try { fontkit=require('fontkit'); } catch (error) {
    if(error.code==='MODULE_NOT_FOUND')throw new Error('This optional Node graph helper requires fontkit. Install fontkit in the plugin directory, or use vectora_production(kind: graph) without separate Node dependencies.');
    throw error;
  }
  const font=fontkit.openSync(findFont(fontPath));
  check(font.postscriptName==='UNDv31-Regular'||font.postscriptName==='UNDv30-Regular','The actual font face must be UNDv31-Regular by default or UNDv30-Regular when explicitly requested.');
  return {postscriptName:font.postscriptName,
    normalize(value,substitutions){let text=value;if(text.includes('−')&&!font.hasGlyphForCodePoint(0x2212)){substitutions.push({from:text,to:text.replaceAll('−','-'),reason:'UND lacks U+2212; same numeric sign'});text=text.replaceAll('−','-');}for(const c of text)check(c==='\n'||font.hasGlyphForCodePoint(c.codePointAt(0)),`Unsupported UND glyph ${JSON.stringify(c)} in ${JSON.stringify(text)}`);return text;},
    measure(text,fontPx,trackingPx){return font.layout(text).positions.reduce((sum,p)=>sum+p.xAdvance,0)*fontPx/font.unitsPerEm+Math.max(0,[...text].length-1)*trackingPx;}};
}
export function buildGraph(input,{fontPath}={}){return buildGraphCore(input,{fontAdapter:adapter(fontPath)});}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{
  const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
  if(args.includes('--help')){console.log('node build_graph.mjs --spec input.json --output graph.svg [--font UNDv31-Regular.ttf|UND-v3.0-Regular.otf] [--force]\nInput JSON: type=bar|pie|line|points; dataFidelity=exact|approximate|relative; series=[{label,fill,pattern:none|dots|hatch,line:solid|dash|dash-dot,marker:circle|triangle|square|open-square,values?}]. widthMm=40..108, plotHeightMm=15..200, strokePt=0.6|0.7|0.8, legend=none|right|center, domain=[min,max], ticks=ascending values, grid=true for numeric comparisons, unit=original unit.\nBar layout horizontal: categories and series.values, domain starts at zero. panels: panels=[{label,values}] in series order, 1..4 common-scale panels. mirror: exactly two panels, positive values, legend:none.\nPie: panels=[{label,values,outside?}], each sum exactly 100; outside contains series indexes; labelMode=category-percent|percent. No normalization, relative data, or pie hatching.\nLine: x labels, optional increasing numeric xValues, series.values (null gaps); xAxis=zero|bottom, xLabelsAt=axis|bottom, yTitle/xTitle, arrows, labelMode=end|legend, valueLabels and series.labels. labelOffsets[series][point]=[dx,dy] uses document px.\nPoints: xDomain/yDomain, xTicks/yTicks, series.points=[{x,y,label?}], optional axisBreaks.\nOptional panelGapMm and source (report metadata). Output is mm SVG plus .layout.json; requires visual review and import/save in Vectora. UNDv31-Regular.ttf is selected by default from ~/Library/Fonts; explicit UNDv30-Regular remains supported. fontkit is required and no v3.0 fallback is used. Unsupported combinations error. Use production chartStyle for current supported styles; this helper is a legacy optional fallback, not full feature or layout parity with native production.');process.exit(0);}
  check(args.includes('--spec')&&args.includes('--output'),'Use --spec and --output; see --help.');
  const out=path.resolve(get('--output')),meta=out.replace(/\.svg$/i,'')+'.layout.json';
  check(out.endsWith('.svg'),'Output must end in .svg.');
  check(args.includes('--force')||(!fs.existsSync(out)&&!fs.existsSync(meta)),'Output exists. Choose another name or explicitly use --force.');
  const {svg,report}=buildGraph(JSON.parse(fs.readFileSync(get('--spec'),'utf8')),{fontPath:args.includes('--font')?get('--font'):undefined});
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,svg);fs.writeFileSync(meta,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({svg:out,report:meta,widthMm:report.widthMm,heightMm:report.heightMm,requiresVisualReview:true}));
}catch(error){console.error(error.message);process.exitCode=1;}}
