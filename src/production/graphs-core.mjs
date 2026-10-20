/** Browser-safe geometry and SVG calculation shared by the editor and the Node CLI. */
import {buildPointsGraph} from './graphs-points.mjs';
const mm = x => x * 96 / 25.4, pt = x => x * 96 / 72;
const F = pt(8), TRACK = -.06 * F, LH = F * 1.24;
export const palette = ['#FFFFFF','#EEEEEE','#CCCCCC','#AAAAAA','#666666','#000000'];
const fmt = x => Number(x.toFixed(6));
const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const attrs = a => Object.entries(a).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}="${esc(typeof v==='number'?fmt(v):v)}"`).join(' ');
const finite = x => typeof x==='number' && Number.isFinite(x);
const check = (ok, message) => { if (!ok) throw new Error(message); };
const overlap = (a,b,p=0) => a.x < b.x+b.w+p && b.x < a.x+a.w+p && a.y < b.y+b.h+p && b.y < a.y+a.h+p;
const crosses = (a,b,box) => {
  let t0=0,t1=1;
  for(const [p,q] of [[a.x-b.x,a.x-box.x],[b.x-a.x,box.x+box.w-a.x],[a.y-b.y,a.y-box.y],[b.y-a.y,box.y+box.h-a.y]]) {
    if(p===0){if(q<0)return false;continue;}
    const t=q/p;if(p<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return false;
  }
  return true;
};

export function buildGraphCore(input, {fontAdapter} = {}) {
  const s = structuredClone(input);
  check(s && typeof s==='object' && !Array.isArray(s), 'Expected a JSON object.');
  const keys = new Set(['type','layout','widthMm','plotHeightMm','strokePt','series','panels','categories','domain','ticks','grid','legend','labelMode','unit','yTitle','xTitle','x','xValues','xAxis','xLabelsAt','arrows','valueLabels','dataFidelity','source','labelOffsets','panelGapMm','xDomain','yDomain','xTicks','yTicks','axisBreaks']);
  Object.keys(s).forEach(k=>check(keys.has(k),`Unknown option: ${k}`));
  check(['bar','pie','line','points'].includes(s.type),'type: bar | pie | line | points');
  check(['exact','approximate','relative'].includes(s.dataFidelity),'Specify dataFidelity: exact | approximate | relative.');
  for(const key of ['grid','valueLabels','arrows'])if(s[key]!==undefined)check(typeof s[key]==='boolean',`${key} must be true or false.`);
  const commonKeys=['type','widthMm','plotHeightMm','strokePt','series','legend','dataFidelity','source'];
  const typeKeys={
    bar:['layout','panels','categories','domain','ticks','grid','unit','valueLabels','panelGapMm'],
    pie:['panels','labelMode','panelGapMm'],
    line:['domain','ticks','grid','labelMode','unit','yTitle','xTitle','x','xValues','xAxis','xLabelsAt','arrows','valueLabels','labelOffsets'],
    points:['xDomain','yDomain','xTicks','yTicks','grid','unit','xTitle','yTitle','axisBreaks','labelOffsets'],
  };
  const supported=new Set([...commonKeys,...typeKeys[s.type]]);
  Object.keys(s).forEach(k=>check(supported.has(k),`${k} is not supported for ${s.type} graphs.`));
  const widthMm = s.widthMm ?? 108, plotMm = s.plotHeightMm ?? (s.type==='line'||s.type==='points'?42:37);
  check(finite(widthMm)&&widthMm>=40&&widthMm<=108,'widthMm must be 40..108.');
  check(finite(plotMm)&&plotMm>=15&&plotMm<=200,'plotHeightMm must be 15..200.');
  const strokePt = s.strokePt ?? .6;
  check([.6,.7,.8].includes(strokePt),'strokePt must be .6, .7 or .8.');
  if(s.panelGapMm!==undefined)check(finite(s.panelGapMm)&&s.panelGapMm>=2&&s.panelGapMm<=30,'panelGapMm must be 2..30.');
  const SW = pt(strokePt), AX = pt(.4), RULE = pt(.3), PAD = mm(2), GAP = mm(3);
  const font = fontAdapter;
  check(font && typeof font.normalize === 'function' && typeof font.measure === 'function', 'An actual UND font metrics adapter is required.');
  const fontFamily=font.postscriptName==='UNDv31-Regular'?'UND v3.1':font.postscriptName==='UNDv30-Regular'?'UND v3.0':undefined;
  check(fontFamily,'The actual font face must be UNDv31-Regular by default or UNDv30-Regular when explicitly requested.');
  const W = mm(widthMm), parts = [], boxes = [], geometry = [], substitutions = [], vectorGlyphs = [], idCounts = new Map();
  const normalized = x => font.normalize(String(x).normalize('NFC'), substitutions);
  const measure = str => {
    str=normalized(str);
    if(str.startsWith('[')&&str.endsWith(']'))return measure(str.slice(1,-1))+mm(3);
    return Math.max(0,...str.split('\n').map(line=>font.measure(line,F,TRACK)));
  };
  const box = (str,x,y,anchor='middle') => {
    const w=measure(str), h=String(str).split('\n').length*LH;
    return {x:x-(anchor==='middle'?w/2:anchor==='end'?w:0),y:y-h/2,w,h};
  };
  const add = (tag,a,content) => {
    const name=String(a['data-name']??tag),count=(idCounts.get(name)??0)+1;idCounts.set(name,count);
    const id=`vgraph.${encodeURIComponent(name)}.${count}`,values={id,...a};
    parts.push(content===undefined?`<${tag} ${attrs(values)}/>`:`<${tag} ${attrs(values)}>${content}</${tag}>`);
  };
  const line = (name,x1,y1,x2,y2,sw=RULE,dash) => add('line',{'data-name':name,x1,y1,x2,y2,stroke:'#000000','stroke-width':sw,'stroke-dasharray':dash,fill:'none'});
  const gridDash = `${pt(1.5)} ${pt(1)}`;
  const text = (name,str,x,y,anchor='middle') => {
    str=normalized(str); const b=box(str,x,y,anchor); boxes.push({...b,name,text:str});
    if(str.startsWith('[')&&str.endsWith(']')) {
      check(!str.includes('\n'),'Bracketed captions must be a single line.');
      for(const [xx,dir] of [[b.x,1],[b.x+b.w,-1]])add('path',{'data-name':`${name}-bracket`,d:`M ${xx+dir*mm(.7)} ${b.y+LH*.1} H ${xx} V ${b.y+LH*.9} H ${xx+dir*mm(.7)}`,fill:'none',stroke:'#000000','stroke-width':RULE});
      vectorGlyphs.push({name,source:str,reason:'UND bracket code points render other symbols; retain bracket shape as editable rules'});
      str=str.slice(1,-1);x=b.x+b.w/2;anchor='middle';
    } else check(!/[\[\]]/.test(str),'Embedded square brackets require explicit vector composition in UND.');
    str.split('\n').forEach((l,i)=>add('text',{'data-name':name,x,y:b.y+i*LH+F*.9,'text-anchor':anchor,'font-family':fontFamily,'font-weight':400,'font-style':'normal','font-size':F,'letter-spacing':TRACK,fill:'#000000'},esc(l)));
    return b;
  };
  const rect = (name,x,y,w,h,fill='#FFFFFF',sw=SW) => add('rect',{'data-name':name,x,y,width:w,height:h,fill,stroke:sw?'#000000':'none','stroke-width':sw});
  const point = (cx,cy,r,a) => ({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});
  const arrow = (name,x,y,angle) => {
    const len=pt(4), half=pt(1.25), a=point(x,y,-len,angle), b=point(a.x,a.y,half,angle+Math.PI/2), c=point(a.x,a.y,-half,angle+Math.PI/2);
    add('path',{'data-name':name,d:`M ${x} ${y} L ${b.x} ${b.y} L ${a.x+len*.22*Math.cos(angle)} ${a.y+len*.22*Math.sin(angle)} L ${c.x} ${c.y} Z`,fill:'#000000',stroke:'none'});
  };
  check(Array.isArray(s.series)&&s.series.length>0&&s.series.length<=8,'series must contain 1..8 entries.');
  const series=s.series.map((v,i)=>{
    check(v && typeof v==='object','Invalid series.');
    const seriesKeys={
      bar:['id','label','fill','pattern',...(s.layout==='horizontal'?['values']:[])],
      pie:['id','label','fill','pattern'],
      line:['id','label','fill','pattern','line','marker','values','labels'],
      points:['id','label','fill','pattern','marker','points','labels'],
    }[s.type];
    Object.keys(v).forEach(k=>check(seriesKeys.includes(k),`${k} is not supported for ${s.type} series.`));
    check(typeof v.label==='string'&&v.label.length>0,'Every series needs a label.');
    let hash=2166136261;for(const ch of v.label){hash^=ch.codePointAt(0);hash=Math.imul(hash,16777619);}
    const slug=v.label.normalize('NFKD').replace(/[^\w.-]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'series';
    const id=v.id??`series-${slug}-${(hash>>>0).toString(36)}`;
    check(typeof id==='string'&&/^[A-Za-z0-9._:-]{1,100}$/.test(id),'Series id must contain 1..100 stable ASCII letters, digits, dot, underscore, colon or hyphen.');
    const defaults=['#FFFFFF','#CCCCCC','#AAAAAA','#EEEEEE','#666666'];
    const a={fill:defaults[(hash>>>0)%defaults.length],pattern:'none',line:'solid',marker:'circle',...v,id,fill:v.fill??defaults[(hash>>>0)%defaults.length]};
    check(palette.includes(a.fill),'Only the six graph palette colors are supported.');
    check(['none','dots','hatch'].includes(a.pattern),'pattern: none | dots | hatch');
    check(['solid','dash','dash-dot'].includes(a.line),'line: solid | dash | dash-dot');
    check(['circle','square','open-square','triangle'].includes(a.marker),'marker: circle | square | open-square | triangle');
    return a;
  });
  check(new Set(series.map(v=>v.label)).size===series.length,'Series labels must be unique.');
  check(new Set(series.map(v=>v.id)).size===series.length,'Series ids must be unique.');
  if(s.type==='points')return buildPointsGraph({...s,series},{fontAdapter:font,fontFamily,widthMm,plotMm,strokePt,palette});
  const curveDash = style => style.line==='solid'?undefined:(style.line==='dash'?(strokePt===.8?[3,1.5]:[2,1]):(strokePt===.8?[6,1,1,1]:[5,1,1,1])).map(pt).join(' ');
  const marker = (name,x,y,style) => {
    const r=pt(1.65),common={'data-name':name,fill:'#000000',stroke:'none'};
    if (style.marker==='circle') add('circle',{...common,cx:x,cy:y,r});
    else if (style.marker==='triangle') add('path',{...common,d:`M ${x} ${y-r*1.2} L ${x+r*1.15} ${y+r} L ${x-r*1.15} ${y+r} Z`});
    else add('rect',{...common,x:x-r,y:y-r,width:2*r,height:2*r,...(style.marker==='open-square'?{fill:'#FFFFFF',stroke:'#000000','stroke-width':RULE}:{})});
  };
  const patternRect = (name,x,y,w,h,style) => {
    rect(name,x,y,w,h,style.fill,0);
    if (style.pattern==='dots') {
      const pitch=mm(1.7),r=mm(.14);
      for(let j=0,cy=y+pitch/2;cy<y+h-r;cy+=pitch/2,j++) for(let cx=x+pitch/2+(j%2)*pitch/2;cx<x+w-r;cx+=pitch) add('circle',{'data-name':`${name}-dot`,cx,cy,r,fill:'#000000'});
    } else if (style.pattern==='hatch') {
      for(let k=mm(1.6);k<w+h;k+=mm(1.6)) {
        const x1=Math.max(0,k-h),x2=Math.min(w,k);
        line(`${name}-hatch`,x+x1,y+k-x1,x+x2,y+k-x2);
      }
    }
    rect(`${name}-outline`,x,y,w,h,'none');
  };
  const legendMode = s.legend ?? (s.type==='line'||s.layout==='mirror'?'none':'right');
  check(['none','right','center'].includes(legendMode),'legend: none | right | center');
  check(legendMode!=='center'||s.type==='pie','A central legend is supported for two pies.');
  const legW=legendMode==='none'?0:Math.max(...series.map(v=>measure(v.label)))+mm(10),legH=series.length*(LH+mm(1))+mm(3);
  const legend = (x,y) => {
    rect('legend-box',x,y,legW,legH,'#FFFFFF',RULE);
    series.forEach((v,i)=>{
      const yy=y+mm(1.5)+(LH+mm(1))*(i+.5);
      if(s.type==='line') {line(`legend-${i}-curve`,x+mm(1.5),yy,x+mm(7),yy,SW,curveDash(v));marker(`legend-${i}-marker`,x+mm(4.25),yy,v);}
      else patternRect(`legend-${i}-swatch`,x+mm(1.5),yy-mm(1.3),mm(4.5),mm(2.6),v);
      text(`legend-${i}-label`,v.label,x+mm(8),yy,'start');
    });
  };
  let H;
  const panels = () => {
    check(Array.isArray(s.panels)&&s.panels.length>=1&&s.panels.length<=4,'panels must contain 1..4 entries.');
    for(const p of s.panels) {
      Object.keys(p).forEach(k=>check(['label','values','outside'].includes(k),`Unknown panel option: ${k}`));
      check(typeof p.label==='string'&&Array.isArray(p.values)&&p.values.length===series.length,'Each panel needs label and one value per series.');
      check(p.values.every(v=>finite(v)&&v>=0),'Bar/pie panel values must be nonnegative finite numbers.');
      if(p.outside!==undefined)check(Array.isArray(p.outside)&&p.outside.every(v=>Number.isInteger(v)&&v>=0&&v<series.length),'outside must contain valid series indices.');
    }
    return s.panels;
  };
  const domain = (values,zero=false) => {
    check(Array.isArray(s.domain)&&s.domain.length===2&&s.domain.every(finite)&&s.domain[0]<s.domain[1],'Provide an increasing [min,max] domain.');
    check(!zero||s.domain[0]===0,'These bars require a zero baseline.');
    check(values.every(v=>v===null||(v>=s.domain[0]&&v<=s.domain[1])),'A data value lies outside domain.');
    return s.domain;
  };
  const ticks = (lo,hi) => {
    const t=s.ticks??[];
    check(Array.isArray(t)&&t.every(v=>finite(v)&&v>=lo&&v<=hi)&&t.every((v,i)=>i===0||v>t[i-1]),'ticks must be unique, increasing and inside domain.');
    check(s.dataFidelity!=='relative'||t.length===0,'Relative data must not acquire numeric ticks.');
    return t;
  };

  if(s.type==='bar') {
    check(['horizontal','panels','mirror'].includes(s.layout),'bar layout: horizontal | panels | mirror');
    check(!s.valueLabels||s.dataFidelity!=='relative','Relative bar heights must not acquire numeric labels.');
    check(s.panelGapMm===undefined||s.layout==='panels','panelGapMm is supported only for panel bars.');
    check(s.unit===undefined||s.layout==='horizontal'||s.layout==='mirror','unit is supported only for horizontal or mirrored bars.');
    check(!s.valueLabels||s.layout!=='mirror','valueLabels is not supported for mirrored bars; their exact values are shown outside each bar.');
    check(s.grid===undefined||s.layout==='horizontal','grid is supported only for horizontal bars.');
    check(s.categories===undefined||s.layout==='horizontal','categories is supported only for horizontal bars.');
    check(s.panels===undefined||s.layout!=='horizontal','panels are supported only for panel or mirrored bars.');
    const top=PAD+LH,ph=mm(plotMm),bottom=top+ph;
    H=bottom+2*LH+PAD;
    if(s.layout==='horizontal') {
      check(Array.isArray(s.categories)&&s.categories.length>0,'Horizontal bars need categories.');
      for(const v of series) check(Array.isArray(v.values)&&v.values.length===s.categories.length&&v.values.every(n=>finite(n)&&n>=0),'Series values must match categories and be nonnegative.');
      const [lo,hi]=domain(series.flatMap(v=>v.values),true),ts=ticks(lo,hi);
      const tickEnd=measure(String(hi))/2;
      const x0=PAD+Math.max(...s.categories.map(measure))+mm(2),x1=W-PAD-(legW?legW+GAP:0)-(s.unit?measure(s.unit)+tickEnd+mm(1):0);
      check(x1-x0>mm(25),'Insufficient plot width; change layout or wrap labels.');
      const xp=v=>x0+(v-lo)/(hi-lo)*(x1-x0);
      if(s.grid!==false) for(const t of ts) if(t!==0) line('grid',xp(t),top,xp(t),bottom,RULE,gridDash);
      const rowH=ph/s.categories.length,bh=rowH*.68/series.length;
      s.categories.forEach((c,j)=>{
        const cy=top+rowH*(j+.5);text(`category-${j}`,c,x0-mm(2),cy,'end');
        series.forEach((v,i)=>{
          const y=cy-bh*series.length/2+i*bh,val=v.values[j];
          if(val>0) patternRect(`bar-${j}-${i}`,x0,y,xp(val)-x0,bh,v);
          geometry.push({role:'bar',category:j,series:i,value:val,x:x0,y,width:xp(val)-x0,height:bh});
          if(s.valueLabels) text(`value-${j}-${i}`,val,xp(val)+mm(1),y+bh/2,'start');
        });
      });
      line('y-axis',x0,top,x0,bottom,AX);line('x-axis',x0,bottom,x1,bottom,AX);
      ts.forEach(t=>text(`tick-${t}`,t,xp(t),bottom+LH));
      if(s.unit) text('unit',s.unit,x1+tickEnd+mm(1),bottom+LH,'start');
      if(legW) legend(W-PAD-legW,top);
      H=Math.max(H,top+legH+PAD);
    } else {
      const ps=panels(),[lo,hi]=domain(ps.flatMap(p=>p.values),true);ticks(lo,hi);
      check(!s.ticks?.length,'Panel/mirror bars have no numeric ticks; use horizontal or construct axes explicitly.');
      if(s.layout==='mirror') {
        check(ps.length===2&&legendMode==='none','Mirror bars need two panels and no redundant legend.');
        const centerW=Math.max(...series.map(v=>measure(v.label)))+mm(5),left=(W-centerW)/2,right=(W+centerW)/2;
        const labelW=Math.max(...ps.flatMap(p=>p.values.map(v=>measure(`${v}${s.unit??'%'}`))))+mm(2);
        const span=left-PAD-labelW;check(span>mm(15),'Insufficient room for mirrored bars.');
        const rh=ph/series.length,bh=rh*.46;
        series.forEach((v,i)=>{
          const cy=top+rh*(i+.5);text(`category-${i}`,v.label,W/2,cy);
          ps.forEach((p,j)=>{
            const value=p.values[i],len=value/hi*span,x=j?right:left-len;
            if(value>0)patternRect(`bar-${j}-${i}`,x,cy-bh/2,len,bh,v);
            geometry.push({role:'bar',panel:j,series:i,value,x,y:cy-bh/2,width:len,height:bh});
            if(s.dataFidelity!=='relative')text(`value-${j}-${i}`,`${value}${s.unit??'%'}`,j?right+len+mm(1):x-mm(1),cy,j?'start':'end');
          });
        });
        line('left-axis',left,top,left,bottom,AX);line('right-axis',right,top,right,bottom,AX);
        line('left-base',PAD,bottom,left,bottom,AX);line('right-base',right,bottom,W-PAD,bottom,AX);
        text('left-caption',ps[0].label,(PAD+left)/2,bottom+LH);text('right-caption',ps[1].label,(right+W-PAD)/2,bottom+LH);
      } else {
        const gap=mm(s.panelGapMm??6),available=W-2*PAD-(legW?legW+GAP:0),pw=(available-gap*(ps.length-1))/ps.length;
        check(pw>mm(12),'Insufficient panel width.');
        ps.forEach((p,j)=>{
          const x=PAD+j*(pw+gap),bw=pw/(series.length*1.55+1),step=bw*1.55;
          p.values.forEach((value,i)=>{
            const xx=x+(pw-(series.length-1)*step-bw)/2+i*step,h=value/hi*ph;
            if(value>0)patternRect(`bar-${j}-${i}`,xx,bottom-h,bw,h,series[i]);
            geometry.push({role:'bar',panel:j,series:i,value,x:xx,y:bottom-h,width:bw,height:h});
            if(s.valueLabels)text(`value-${j}-${i}`,value,xx+bw/2,bottom-h-LH*.6);
          });
          const captionH=box(p.label,0,0).h;
          line(`baseline-${j}`,x,bottom,x+pw,bottom,AX);text(`caption-${j}`,p.label,x+pw/2,bottom+PAD+captionH/2);
          H=Math.max(H,bottom+2*PAD+captionH);
        });
        if(legW)legend(W-PAD-legW,top+Math.max(0,(ph-legH)/2));
        H=Math.max(H,top+legH+PAD);
      }
    }
  } else if(s.type==='pie') {
    const ps=panels();check(legendMode!=='center'||ps.length===2,'Center legend needs exactly two pies.');
    check(s.dataFidelity!=='relative','Pie sectors require explicit percentages; do not invent a sum from relative heights.');
    for(const p of ps)check(Math.abs(p.values.reduce((a,b)=>a+b,0)-100)<1e-7,'Each pie must sum to 100. No silent normalization.');
    check(series.every(v=>v.pattern!=='hatch'),'Pie hatch is not supported by this helper; use dots or manually clipped vector lines.');
    const labelMode=s.labelMode??(legendMode==='none'?'category-percent':'percent');
    check(['category-percent','percent'].includes(labelMode),'Pie labelMode: category-percent | percent');
    const gap=mm(s.panelGapMm??6),available=W-2*PAD-(legW?legW+GAP:0),pw=(available-gap*(ps.length-1))/ps.length;
    const R=Math.min((pw-mm(2))/2,mm(plotMm)/2),top=PAD+LH*2,cy=top+R;
    check(R>mm(6),'Insufficient room for pies; wrap captions, move the legend or split into rows.');
    H=cy+R+PAD+LH;
    ps.forEach((p,j)=>{
      const cx=legendMode==='center'?(j===0?PAD+pw/2:W-PAD-pw/2):PAD+pw/2+j*(pw+gap);
      text(`caption-${j}`,p.label,cx,PAD+LH/2);
      let start=-Math.PI/2;
      const sectors=p.values.map((v,i)=>{const out={i,value:v,start,end:start+v/100*Math.PI*2};start=out.end;return out;});
      const labels=[],insideLabels=[],outsideLabels=[];
      const inside=(x,y,a,b,margin=0)=>{
        const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy);let ang=Math.atan2(dy,dx);while(ang<a)ang+=2*Math.PI;
        return r<=R-margin&&ang<=b+1e-8;
      };
      for(const z of sectors) {
        if(z.value===0)continue;
        const mid=(z.start+z.end)/2,label=labelMode==='category-percent'?`${series[z.i].label}\n${z.value}%`:`${z.value}%`;
        let loc;
        if(!p.outside?.includes(z.i))for(const radial of [.58,.68,.77,.84]) {
          const v=point(cx,cy,R*radial,mid),b=box(label,v.x,v.y);
          if([[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]].every(([x,y])=>inside(x,y,z.start,z.end,SW+1))) {loc={...v,anchor:'middle',b};break;}
        }
        if(!loc) {
          const side=Math.cos(mid)>=0?1:-1,tip=point(cx,cy,R*.86,mid);
          const elbow=point(cx,cy,R*1.07,mid),x=cx+side*(R+mm(1.8)),anchor=side>0?'start':'end',b=box(label,x,elbow.y,anchor);
          loc={x,y:elbow.y,anchor,b,tip,elbow,side};
        } else {
          insideLabels.push(loc);
        }
        const placed={...loc,label,series:z.i};labels.push(placed);if(loc.side)outsideLabels.push(placed);
      }
      // Keep outside labels attached to their slices while giving nearby small
      // sectors separate rows. Their leader may bend to reach the chosen row.
      const reserved=[...boxes,...insideLabels.map(label=>label.b)];
      for(const side of [-1,1]) {
        const column=outsideLabels.filter(label=>label.side===side).sort((a,b)=>a.y-b.y);
        for(const label of column) {
          const step=Math.max(label.b.h+mm(1),LH*1.35),maxShift=column.length+2;
          const shifts=[0];for(let n=1;n<=maxShift;n++)shifts.push(n,-n);
          let placed;
          for(const shift of shifts) {
            const y=label.y+shift*step,b=box(label.label??'',label.x,y,label.anchor);
            if(b.x<0||b.x+b.w>W||b.y<PAD||b.y+b.h>cy+R+LH*3||reserved.some(old=>overlap(old,b,mm(.4))))continue;
            placed={y,b};break;
          }
          check(placed,`Outside pie label ${label.label??''} needs a wider graph or fewer small slices.`);
          label.y=placed.y;label.b=placed.b;reserved.push(placed.b);H=Math.max(H,placed.b.y+placed.b.h+PAD);
        }
      }
      for(const z of sectors) {
        if(z.value===0)continue;
        const style=series[z.i],a=point(cx,cy,R,z.start),b=point(cx,cy,R,z.end),name=`pie-${j}-${z.i}`;
        if(z.value===100)add('circle',{'data-name':name,cx,cy,r:R,fill:style.fill});
        else add('path',{'data-name':name,d:`M ${cx} ${cy} L ${a.x} ${a.y} A ${R} ${R} 0 ${z.value>50?1:0} 1 ${b.x} ${b.y} Z`,fill:style.fill,stroke:'none'});
        if(style.pattern==='dots') {
          const pitch=mm(1.7),r=mm(.14),p1=point(cx,cy,1,z.start),p2=point(cx,cy,1,z.end);
          for(let row=0,y=cy-R+pitch/2;y<cy+R-r;y+=pitch/2,row++)for(let x=cx-R+pitch/2+(row%2)*pitch/2;x<cx+R-r;x+=pitch) {
            const nearRay=p=>{const dx=p.x-cx,dy=p.y-cy,vx=x-cx,vy=y-cy;return vx*dx+vy*dy>=0&&Math.abs(vx*dy-vy*dx)<r+SW;};
            if(inside(x,y,z.start,z.end,r+SW)&&!(z.value<100&&(nearRay(p1)||nearRay(p2)))&&!labels.some(l=>overlap({x:x-r,y:y-r,w:2*r,h:2*r},l.b,mm(.4))))add('circle',{'data-name':`${name}-dot`,cx:x,cy:y,r,fill:'#000000'});
          }
        }
        geometry.push({role:'sector',panel:j,series:z.i,value:z.value,cx,cy,radius:R,start:z.start,end:z.end});
      }
      if(sectors.filter(z=>z.value>0).length>1)for(const z of sectors.filter(z=>z.value>0)){const p1=point(cx,cy,R,z.start);line(`pie-${j}-divider`,cx,cy,p1.x,p1.y,SW);}
      add('circle',{'data-name':`pie-${j}-outline`,cx,cy,r:R,fill:'none',stroke:'#000000','stroke-width':SW});
      for(const l of labels) {
        if(l.tip){line('leader',l.tip.x,l.tip.y,l.elbow.x,l.elbow.y);line('leader',l.elbow.x,l.elbow.y,l.x,l.y);}
        text(`pie-${j}-label-${l.series}`,l.label,l.x,l.y,l.anchor);
      }
    });
    if(legW){const y=Math.max(top,cy-legH/2);legend(legendMode==='center'?(W-legW)/2:W-PAD-legW,y);H=Math.max(H,y+legH+PAD);}
  } else {
    check(Array.isArray(s.x)&&s.x.length>=2,'Line graphs require at least two x labels.');
    const n=s.x.length;
    for(const v of series){check(Array.isArray(v.values)&&v.values.length===n&&v.values.every(a=>a===null||finite(a))&&v.values.some(finite),'Line values must match x; null means a gap.');if(v.labels!==undefined)check(Array.isArray(v.labels)&&v.labels.length===n&&v.labels.every(a=>typeof a==='string'),'Value labels must be strings matching x.');}
    check(s.dataFidelity!=='relative','Line helper requires explicit numeric data.');
    const [lo,hi]=domain(series.flatMap(v=>v.values)),ts=ticks(lo,hi);
    const xs=s.xValues??s.x.map((_,i)=>i);check(xs.length===n&&xs.every(finite)&&xs.every((v,i)=>i===0||v>xs[i-1]),'xValues must be increasing.');
    const yTitle=s.yTitle?normalized(s.yTitle).split(' ').map(w=>[...w].join('\n')).join('\n\n'):'';
    const labelMode=s.labelMode??(legendMode==='none'?'end':'legend');
    check(['end','legend'].includes(labelMode),'Line labelMode: end | legend');
    check(labelMode!=='legend'||legW>0,'labelMode legend requires a legend.');
    const rightW=Math.max(legW,labelMode==='end'?Math.max(...series.map(v=>measure(v.label)))+GAP:0,s.xTitle?measure(s.xTitle)+mm(4):0);
    const x0=PAD+(yTitle?F+mm(2):0)+Math.max(F,...ts.map(v=>measure(v)))+mm(2);
    const x1=W-PAD-rightW-(rightW?GAP:0)-mm(2),top=PAD+LH*1.7,ph=Math.max(mm(plotMm),yTitle?box(yTitle,0,0).h:0),bottom=top+ph;
    check(x1-x0>mm(30),'Insufficient line plot width; wrap end labels or move the legend.');
    const xp=v=>x0+mm(4)+(v-xs[0])/(xs.at(-1)-xs[0])*(x1-x0-mm(8)),yp=v=>bottom-(v-lo)/(hi-lo)*ph;
    const axis=s.xAxis??'zero';check(['zero','bottom'].includes(axis),'xAxis: zero | bottom');check(axis!=='zero'||(lo<=0&&hi>=0),'Zero axis must lie inside the domain.');
    const base=axis==='zero'?yp(0):bottom;
    const xLabelsAt=s.xLabelsAt??'axis';check(['axis','bottom'].includes(xLabelsAt),'xLabelsAt: axis | bottom');
    const xLabelH=Math.max(...s.x.map(v=>box(v,0,0).h));
    H=Math.max(bottom+PAD*2,(xLabelsAt==='axis'?base:bottom)+xLabelH+PAD*2,s.xTitle?base+LH*1.5+PAD:0);
    if(s.grid!==false) {
      for(const t of ts)if(yp(t)!==base)line(`grid-y-${t}`,x0,yp(t),xp(xs.at(-1)),yp(t),RULE,gridDash);
      xs.forEach((v,i)=>{const vals=series.map(a=>a.values[i]).filter(finite);if(vals.length)line(`grid-x-${i}`,xp(v),Math.min(base,...vals.map(yp)),xp(v),Math.max(base,...vals.map(yp)),RULE,gridDash);});
    }
    if(axis==='bottom'&&lo<0&&hi>0)line('zero-baseline',x0,yp(0),x1,yp(0),AX);
    line('y-axis',x0,top-mm(2),x0,bottom+mm(2),AX);line('x-axis',x0,base,x1+mm(2),base,AX);
    if(s.arrows!==false){arrow('x-arrow',x1+mm(2),base,0);arrow('y-arrow',x0,top-mm(2),-Math.PI/2);if(lo<0&&axis==='zero')arrow('y-negative-arrow',x0,bottom+mm(2),Math.PI/2);}
    ts.forEach(v=>text(`tick-${v}`,v,x0-mm(1.5),yp(v),'end'));
    if(yTitle)text('y-title',yTitle,PAD+F/2,(top+bottom)/2);
    if(s.unit)text('unit',s.unit,x0-mm(1.5),PAD+LH/2,'end');
    s.x.forEach((v,i)=>{line('x-tick',xp(xs[i]),base-mm(.7),xp(xs[i]),base+mm(.7));text(`x-label-${i}`,v,xp(xs[i]),(xLabelsAt==='axis'?base:bottom)+PAD+xLabelH/2);});
    if(s.xTitle)text('x-title',s.xTitle,x1+mm(3),base+LH,'start');
    // Draw every curve before markers so crossing lines cannot erase a marker.
    const segments=[];
    series.forEach((v,j)=>{
      for(let i=1;i<n;i++)if(v.values[i-1]!==null&&v.values[i]!==null){
        const a={x:xp(xs[i-1]),y:yp(v.values[i-1])},b={x:xp(xs[i]),y:yp(v.values[i])};
        segments.push([a,b]);line(`curve-${j}-${i}`,a.x,a.y,b.x,b.y,SW,curveDash(v));
      }
    });
    const points=[];
    series.forEach((v,j)=>v.values.forEach((value,i)=>{if(value!==null){const x=xp(xs[i]),y=yp(value);points.push({role:'point',series:j,index:i,value,x,y,marker:v.marker});}}));
    // Open squares first, then filled circles: preserve a shared coordinate exactly.
    [...points].sort((a,b)=>(a.marker==='open-square'?0:1)-(b.marker==='open-square'?0:1)).forEach(p=>marker(`point-${p.series}-${p.index}`,p.x,p.y,series[p.series]));
    geometry.push(...points);
    if(labelMode==='end')series.forEach((v,j)=>{
      const i=v.values.findLastIndex(finite),y=yp(v.values[i]),x=xp(xs[i])+GAP;
      text(`end-label-${j}`,v.label,x,y,'start');
    });
    if(s.valueLabels)for(const p of points) {
      const str=series[p.series].labels?.[p.index]??String(p.value),seriesId=String(series[p.series].id);
      const offset=s.labelOffsets?.[seriesId]?.[p.index]??s.labelOffsets?.[p.series]?.[p.index];
      check(finite(Number(String(str).replaceAll('−','-')))&&Math.abs(Number(String(str).replaceAll('−','-'))-p.value)<1e-10,'A value label does not match its numeric value.');
      let loc;
      for(const [dx,dy] of offset?[offset]:[[0,-LH],[0,LH],[0,-LH*1.7],[0,LH*1.7],[-LH,-LH],[LH,LH]]) {
        check(finite(dx)&&finite(dy),'labelOffsets are [dx,dy] in document px.');
        const b=box(str,p.x+dx,p.y+dy);
        if(b.x>=PAD&&b.x+b.w<W-PAD&&b.y>=PAD&&b.y+b.h<H-PAD&&!boxes.some(a=>overlap(a,b,1))&&!points.some(q=>overlap({x:q.x-3,y:q.y-3,w:6,h:6},b,1))&&!segments.some(([a,c])=>crosses(a,c,{x:b.x-1,y:b.y-1,w:b.w+2,h:b.h+2}))) {loc={x:p.x+dx,y:p.y+dy};break;}
      }
      check(loc,`Value label ${str} needs a different labelOffsets entry or more plot height.`);
      text(`value-${p.series}-${p.index}`,str,loc.x,loc.y);
    }
    if(legW)legend(W-PAD-legW,top+Math.max(0,(ph-legH)/2));
    H=Math.max(H,top+legH+PAD);
  }
  const collisions=[];
  for(let i=0;i<boxes.length;i++) {
    const b=boxes[i];check(b.x>=-.01&&b.y>=-.01&&b.x+b.w<=W+.01&&b.y+b.h<=H+.01,`Clipped text: ${b.name}. Wrap labels or revise panel layout; do not shrink 8pt.`);
    for(let j=0;j<i;j++)if(overlap(b,boxes[j],.2))collisions.push([boxes[j].name,b.name]);
  }
  check(!collisions.length,`Text collisions: ${JSON.stringify(collisions)}. Adjust layout/labelOffsets before delivery.`);
  const report={type:s.type,layout:s.layout??null,dataFidelity:s.dataFidelity,source:s.source??null,widthMm,heightMm:H*25.4/96,fontFace:font.postscriptName,fontPt:8,charSpacing:-60,strokePt,legend:legendMode,substitutions,vectorGlyphs,geometry,textBounds:boxes,resolvedSeries:series.map(({id,label,fill,pattern,line,marker})=>({id,label,fill,pattern,line,marker})),checks:{numericDomain:true,textInsidePage:true,textTextCollisions:0},requiresVisualReview:true};
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(widthMm)}mm" height="${fmt(H*25.4/96)}mm" viewBox="0 0 ${fmt(W)} ${fmt(H)}">\n<rect id="vgraph.background.1" data-name="graph-background" x="0" y="0" width="${fmt(W)}" height="${fmt(H)}" fill="#FFFFFF"/>\n${parts.join('\n')}\n</svg>\n`;
  return {svg,report};
}
