/** Scatter/points graphs with explicit piecewise mappings for omitted ranges. */
const mm=value=>value*96/25.4,pt=value=>value*96/72,fmt=value=>Number(value.toFixed(6));
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const attrs=values=>Object.entries(values).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}="${esc(typeof v==='number'?fmt(v):v)}"`).join(' ');
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const check=(value,message)=>{if(!value)throw new Error(message);};
const overlaps=(a,b,pad=0)=>a.x<b.x+b.w+pad&&b.x<a.x+a.w+pad&&a.y<b.y+b.h+pad&&b.y<a.y+a.h+pad;

export function buildPointsGraph(spec,{fontAdapter,fontFamily,widthMm,plotMm,strokePt,palette,typography}){
  const allowed=new Set(['type','dataFidelity','series','widthMm','plotHeightMm','strokePt','legend','grid','xTitle','yTitle','unit','source','xDomain','yDomain','xTicks','yTicks','axisBreaks','labelOffsets']);
  Object.keys(spec).forEach(key=>check(allowed.has(key),`Unknown points option: ${key}`));
  check(spec.dataFidelity==='exact'||spec.dataFidelity==='approximate','Points need dataFidelity: exact | approximate.');
  check(spec.layout===undefined,'Points graphs do not use layout.');
  check(spec.valueLabels===undefined,'Points use explicit per-point labels, not valueLabels.');
  check(spec.series.every(series=>Object.keys(series).every(key=>['id','label','fill','pattern','line','marker','points','labels'].includes(key))),'Points series accept id, label, fill, pattern, marker, points and labels.');
  check(spec.series.every(series=>series.pattern==='none'||series.pattern===undefined),'Point marker patterns are unsupported.');
  check(spec.series.every(series=>series.line==='solid'||series.line===undefined),'Points are never joined by lines.');
  check(spec.xDomain?.length===2&&spec.xDomain.every(finite)&&spec.xDomain[0]<spec.xDomain[1],'Points need an increasing xDomain.');
  check(spec.yDomain?.length===2&&spec.yDomain.every(finite)&&spec.yDomain[0]<spec.yDomain[1],'Points need an increasing yDomain.');
  const font=fontAdapter,sw=pt(strokePt),axisSw=pt(.4),ruleSw=pt(.3),F=pt(typography.fontPt),LH=F*typography.leadingPercent/100,track=typography.charSpacing*F/1000,W=mm(widthMm),pad=mm(2),gap=mm(3);
  const normalize=value=>font.normalize(String(value).normalize('NFC'),[]);
  const measure=value=>Math.max(0,...normalize(value).split('\n').map(line=>font.measure(line,F,track)));
  const boxes=[],parts=[],geometry=[];
  const box=(value,x,y,anchor='middle')=>{const lines=normalize(value).split('\n'),w=measure(value),h=lines.length*LH;return{x:x-(anchor==='middle'?w/2:anchor==='end'?w:0),y:y-h/2,w,h};};
  const text=(name,value,x,y,anchor='middle')=>{
    const normalized=normalize(value),b=box(normalized,x,y,anchor);boxes.push({...b,name,text:normalized});
    normalized.split('\n').forEach((line,index)=>parts.push(`<text ${attrs({'data-name':name,x,y:b.y+index*LH+F*.9,'text-anchor':anchor,'font-family':fontFamily,'font-weight':400,'font-style':'normal','font-size':F,'letter-spacing':track,fill:'#000000'})}>${esc(line)}</text>`));
  };
  const line=(name,x1,y1,x2,y2,stroke=ruleSw,dash)=>parts.push(`<line ${attrs({'data-name':name,x1,y1,x2,y2,stroke:'#000000','stroke-width':stroke,'stroke-dasharray':dash,fill:'none'})}/>`);
  const marker=(name,x,y,series)=>{
    const r=pt(1.65),fill=series.marker==='open-square'?'#FFFFFF':series.fill,stroke=series.marker==='open-square'?'#000000':'none';
    if(series.marker==='circle')parts.push(`<circle ${attrs({'data-name':name,cx:x,cy:y,r,fill,stroke,'stroke-width':series.marker==='open-square'?ruleSw:0})}/>`);
    else if(series.marker==='triangle')parts.push(`<path ${attrs({'data-name':name,d:`M ${x} ${y-r*1.2} L ${x+r*1.15} ${y+r} L ${x-r*1.15} ${y+r} Z`,fill,stroke,'stroke-width':0})}/>`);
    else parts.push(`<rect ${attrs({'data-name':name,x:x-r,y:y-r,width:2*r,height:2*r,fill,stroke,'stroke-width':series.marker==='open-square'?ruleSw:0})}/>`);
  };
  const all=[];spec.series.forEach((series,seriesIndex)=>{
    check(Array.isArray(series.points)&&series.points.length>0&&series.points.length<=2000,`Series ${series.label} needs 1..2000 point objects.`);
    check(series.labels===undefined||(Array.isArray(series.labels)&&series.labels.length===series.points.length&&series.labels.every(v=>typeof v==='string')),'Series labels must match their point count.');
    series.points.forEach((point,index)=>{
      check(point&&typeof point==='object'&&!Array.isArray(point)&&Object.keys(point).every(key=>['x','y','label'].includes(key))&&finite(point.x)&&finite(point.y),'Each point needs finite x/y values and an optional string label.');
      check(point.label===undefined||typeof point.label==='string','Point label must be a string.');
      check(point.x>=spec.xDomain[0]&&point.x<=spec.xDomain[1]&&point.y>=spec.yDomain[0]&&point.y<=spec.yDomain[1],'A point lies outside its axis domain.');
      all.push({series:seriesIndex,index,...point});
    });
  });
  check(all.length<=5000,'A points graph supports up to 5000 points.');
  const tick=(values,domain,label)=>{
    check(values===undefined||Array.isArray(values),'Ticks must be arrays.');const actual=values??[];
    check(actual.every(finite)&&actual.every(v=>v>=domain[0]&&v<=domain[1])&&actual.every((v,i)=>i===0||v>actual[i-1]),`${label} must be unique, increasing and inside its domain.`);return actual;
  };
  const xTicks=tick(spec.xTicks,spec.xDomain,'xTicks'),yTicks=tick(spec.yTicks,spec.yDomain,'yTicks');
  const breakFor=(axis,domain,values,ticks)=>{
    const value=spec.axisBreaks?.[axis];if(value===undefined)return null;
    check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>['from','to','gapMm'].includes(key)),'Axis breaks accept from, to and optional gapMm.');
    check(finite(value.from)&&finite(value.to)&&value.from>domain[0]&&value.to<domain[1]&&value.from<value.to,`${axis} axis break must be a strict interval inside its domain.`);
    check(value.gapMm===undefined||(finite(value.gapMm)&&value.gapMm>=1&&value.gapMm<=8),'Axis-break gapMm must be 1..8.');
    check(values.every(v=>v<=value.from||v>=value.to),`A point lies inside the omitted ${axis} interval.`);
    check(ticks.every(v=>v<=value.from||v>=value.to),`A tick lies inside the omitted ${axis} interval.`);
    return{from:value.from,to:value.to,gapPx:mm(value.gapMm??2)};
  };
  check(spec.axisBreaks===undefined||(spec.axisBreaks&&typeof spec.axisBreaks==='object'&&!Array.isArray(spec.axisBreaks)&&Object.keys(spec.axisBreaks).every(key=>key==='x'||key==='y')),'axisBreaks supports only x and y.');
  const xb=breakFor('x',spec.xDomain,all.map(p=>p.x),xTicks),yb=breakFor('y',spec.yDomain,all.map(p=>p.y),yTicks);
  const legend=spec.legend??'right';check(['none','right'].includes(legend),'Points legend must be none or right.');
  const legendWidth=legend==='none'?0:Math.max(...spec.series.map(v=>measure(v.label)))+mm(10),legendHeight=spec.series.length*(LH+mm(1))+mm(3);
  const top=pad+LH*1.5,plotHeight=mm(plotMm),bottom=top+plotHeight;
  const maxY=Math.max(F,...yTicks.map(v=>measure(String(v)))),maxXTick=Math.max(0,...xTicks.map(v=>measure(String(v)))),
    x0=pad+maxY+mm(2)+maxXTick/2,
    x1=W-pad-(legendWidth?legendWidth+gap:0)-(spec.unit?measure(spec.unit)+mm(2):0)-maxXTick/2;
  check(x1-x0>mm(25),'Insufficient points plot width; wrap labels or move the legend.');
  const map=(domain,start,length,br)=>{
    if(!br)return value=>start+(value-domain[0])/(domain[1]-domain[0])*length;
    const direction=Math.sign(length),usable=Math.abs(length)-br.gapPx,units=domain[1]-domain[0]-(br.to-br.from);check(usable>0&&units>0,'Axis break leaves no drawable range.');
    const scale=usable/units,left=start+direction*(br.from-domain[0])*scale,right=left+direction*br.gapPx;
    return value=>value<=br.from?start+direction*(value-domain[0])*scale:value>=br.to?right+direction*(value-br.to)*scale:NaN;
  };
  const xMap=map(spec.xDomain,x0,x1-x0,xb),yMap=map(spec.yDomain,bottom,-plotHeight,yb);
  if(spec.grid!==false){yTicks.forEach(v=>line(`grid-y-${v}`,x0,yMap(v),x1,yMap(v),ruleSw,`${pt(1.5)} ${pt(1)}`));xTicks.forEach(v=>line(`grid-x-${v}`,xMap(v),top,xMap(v),bottom,ruleSw,`${pt(1.5)} ${pt(1)}`));}
  const breakAxis=(axis,br,mapValue)=>{
    if(!br)return;
    const a=mapValue(br.from),b=mapValue(br.to),lo=Math.min(a,b),hi=Math.max(a,b),mid=(lo+hi)/2,half=mm(.9),rise=mm(.55);
    if(axis==='x'){
      line('x-axis',x0,bottom,mid-half,bottom,axisSw);line('x-axis',mid+half,bottom,x1,bottom,axisSw);
      parts.push(`<path ${attrs({'data-name':'x-axis-break',d:`M ${mid-half} ${bottom-rise} L ${mid-half/2} ${bottom+rise} L ${mid} ${bottom-rise} L ${mid+half/2} ${bottom+rise} L ${mid+half} ${bottom-rise}`,fill:'none',stroke:'#000000','stroke-width':axisSw})}/>`);
    }else{
      line('y-axis',x0,top,x0,lo-half,axisSw);line('y-axis',x0,hi+half,x0,bottom,axisSw);
      parts.push(`<path ${attrs({'data-name':'y-axis-break',d:`M ${x0-rise} ${mid-half} L ${x0+rise} ${mid-half/2} L ${x0-rise} ${mid} L ${x0+rise} ${mid+half/2} L ${x0-rise} ${mid+half}`,fill:'none',stroke:'#000000','stroke-width':axisSw})}/>`);
    }
  };
  if(!xb)line('x-axis',x0,bottom,x1,bottom,axisSw);if(!yb)line('y-axis',x0,top,x0,bottom,axisSw);
  breakAxis('x',xb,xMap);breakAxis('y',yb,yMap);
  xTicks.forEach(v=>{const x=xMap(v);line(`x-tick-${v}`,x,bottom-mm(.6),x,bottom+mm(.6));text(`x-tick-label-${v}`,v,x,bottom+LH/2);});
  yTicks.forEach(v=>{const y=yMap(v);line(`y-tick-${v}`,x0-mm(.6),y,x0+mm(.6),y);text(`y-tick-label-${v}`,v,x0-mm(1),y,'end');});
  if(spec.xTitle)text('x-title',spec.xTitle,(x0+x1)/2,bottom+LH*1.5);
  if(spec.yTitle)text('y-title',normalize(spec.yTitle).split(' ').map(word=>[...word].join('\n')).join('\n\n'),pad+F/2,(top+bottom)/2);
  if(spec.unit)text('unit',spec.unit,x1+mm(1),bottom+LH/2,'start');
  const laidOut=all.map(p=>({...p,xPx:xMap(p.x),yPx:yMap(p.y)}));
  laidOut.forEach(p=>{const series=spec.series[p.series];marker(`point-${series.id}-${p.index}`,p.xPx,p.yPx,series);geometry.push({role:'point',seriesId:series.id,index:p.index,x:p.x,y:p.y,xPx:p.xPx,yPx:p.yPx});});
  for(const point of laidOut){
    const label=point.label??spec.series[point.series].labels?.[point.index];if(label===undefined)continue;
    const seriesId=spec.series[point.series].id;
    // Stable-ID offsets survive a series reorder; numeric keys remain supported
    // for saved specifications created before stable IDs were exposed.
    const offset=spec.labelOffsets?.[seriesId]?.[point.index]??spec.labelOffsets?.[point.series]?.[point.index];let placed;
    for(const [dx,dy] of offset?[offset]:[[0,-LH],[0,LH],[LH,-LH],[-LH,LH]]){
      check(Array.isArray([dx,dy])&&finite(dx)&&finite(dy),'labelOffsets use finite [dx,dy] document-pixel values.');
      const b=box(label,point.xPx+dx,point.yPx+dy);
      if(b.x>=pad&&b.y>=pad&&b.x+b.w<=W-pad&&b.y+b.h<=bottom+LH*3&&!boxes.some(old=>overlaps(old,b,1))&&!laidOut.some(other=>overlaps({x:other.xPx-3,y:other.yPx-3,w:6,h:6},b,1))){placed={x:point.xPx+dx,y:point.yPx+dy};break;}
    }
    check(placed,`Point label ${label} needs a different labelOffsets entry or more plot height.`);text(`point-label-${spec.series[point.series].id}-${point.index}`,label,placed.x,placed.y);
  }
  if(legendWidth){
    const x=W-pad-legendWidth,y=top+Math.max(0,(plotHeight-legendHeight)/2);
    parts.push(`<rect ${attrs({'data-name':'legend-box',x,y,width:legendWidth,height:legendHeight,fill:'#FFFFFF',stroke:'#000000','stroke-width':ruleSw})}/>`);
    spec.series.forEach((series,index)=>{const cy=y+mm(1.5)+(LH+mm(1))*(index+.5);marker(`legend-${series.id}-marker`,x+mm(4.25),cy,series);text(`legend-${series.id}-label`,series.label,x+mm(8),cy,'start');});
  }
  const collisions=[];for(let i=0;i<boxes.length;i++){const b=boxes[i];check(b.x>=-.01&&b.y>=-.01&&b.x+b.w<=W+.01&&b.y+b.h<=bottom+LH*3,`Clipped text: ${b.name}. Increase the plot height or revise labels.`);for(let j=0;j<i;j++)if(overlaps(b,boxes[j],.2))collisions.push([boxes[j].name,b.name]);}
  check(!collisions.length,`Text collisions: ${JSON.stringify(collisions)}.`);
  const height=Math.max(bottom+pad+LH*2,spec.xTitle?bottom+LH*2+pad:0,legendWidth?top+legendHeight+pad:0),heightMm=height*25.4/96;
  const axisBreakMapping={...(xb?{x:{from:xb.from,to:xb.to,gapMm:xb.gapPx*25.4/96}}:{}),...(yb?{y:{from:yb.from,to:yb.to,gapMm:yb.gapPx*25.4/96}}:{})};
  const report={type:'points',dataFidelity:spec.dataFidelity,source:spec.source??null,widthMm,heightMm,fontFace:font.postscriptName,...typography.report,strokePt,legend,geometry,textBounds:boxes,axisBreakMapping,resolvedSeries:spec.series.map(({id,label,fill,pattern,line,marker})=>({id,label,fill,pattern,line,marker})),checks:{numericDomain:true,textInsidePage:true,textTextCollisions:0},requiresVisualReview:true};
  const ids=new Map(),identified=parts.map(part=>{
    const match=part.match(/^<(\w+)\s+[^>]*data-name="([^"]+)"/);if(!match)return part;
    const [,tag,name]=match,count=(ids.get(name)??0)+1;ids.set(name,count);
    return part.replace(`<${tag} `,`<${tag} id="vgraph.${encodeURIComponent(name)}.${count}" `);
  });
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(widthMm)}mm" height="${fmt(heightMm)}mm" viewBox="0 0 ${fmt(W)} ${fmt(height)}">\n<rect id="vgraph.background.1" data-name="graph-background" x="0" y="0" width="${fmt(W)}" height="${fmt(height)}" fill="#FFFFFF"/>\n${identified.join('\n')}\n</svg>\n`;
  return{svg,report};
}
