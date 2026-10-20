/** Browser-safe calculation for editable text-illustration backgrounds. */
export const variants = ['newspaper-wave', 'newspaper-band', 'scroll', 'browser', 'noticeboard'];
const px = mm => mm * 96 / 25.4;
const round = value => Math.round(value * 1e6) / 1e6;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

export function buildTextFrame(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('A JSON object is required.');
  const allowed = new Set(['variant','widthMm','contentHeightMm','paddingMm','titleHeightMm','headerHeightMm','columns','cardTitleHeightMm','footerHeightMm','portraitMm','asideWidthMm','asideHeightMm']);
  for (const key of Object.keys(spec)) if (!allowed.has(key)) throw new Error(`Unknown option: ${key}`);
  if (!variants.includes(spec.variant)) throw new Error(`variant must be one of ${variants.join(', ')}`);
  const number = (key, fallback, min, max) => {
    const value = spec[key] ?? fallback;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`Invalid ${key}: expected ${min}..${max}`);
    return value;
  };
  const widthMm = number('widthMm',108,30,108), bodyMm = number('contentHeightMm',undefined,1,1000);
  const pad = px(number('paddingMm',3,1,15)), W = px(widthMm), B = px(bodyMm);
  const titleH = px(number('titleHeightMm',0,0,100));
  const variant = spec.variant, parts = [], slots = [], reserved = [], idCounts = new Map();
  const stroke = '#000000', sw = 96 / 72 * .3, gap = px(2);
  let H = 0;
  const attrs = values => Object.entries(values).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}="${escape(typeof v === 'number' ? round(v) : v)}"`).join(' ');
  const add = (tag,values) => {
    const name=String(values.name??values['data-name']??tag),count=(idCounts.get(name)??0)+1;idCounts.set(name,count);
    const id=`vframe.${encodeURIComponent(name)}.${count}`;
    parts.push(`<${tag} ${attrs({id,...values})}/>`);
  };
  const rect = (name,x,y,w,h,fill='#FFFFFF',line=stroke,extra={}) => add('rect',{'data-name':name,x,y,width:w,height:h,fill,stroke:line,'stroke-width':sw,...extra});
  const line = (name,x1,y1,x2,y2,color=stroke,width=sw) => add('line',{'data-name':name,x1,y1,x2,y2,stroke:color,'stroke-width':width});
  const curve = (name,d,fill='none',color=stroke) => add('path',{'data-name':name,d,fill,stroke:color,'stroke-width':sw,'stroke-linejoin':'round'});
  const ellipse = (name,cx,cy,rx,ry,fill='#FFFFFF',color=stroke) => add('ellipse',{'data-name':name,cx,cy,rx,ry,fill,stroke:color,'stroke-width':sw});
  const box = (name,role,x,y,w,h,white=true) => {
    if (w <= 0 || h <= 0) throw new Error(`${name}: no usable space; increase width or reduce margins/reservations.`);
    const textAlign = name==='date'||role==='author' ? 'right' : role==='title'||name==='masthead' ? 'center' : 'left';
    const value = {name,role,x:round(x),y:round(y),width:round(w),height:round(h),whiteBackground:white,...(role==='illustration'?{}:{textAlign,verticalAlign:role==='content'?'top':'middle'})};
    (role==='illustration' ? reserved : slots).push(value);
    return value;
  };
  const cross = (name,x,y,r) => {line(name,x-r,y-r,x+r,y+r);line(name,x-r,y+r,x+r,y-r);};
  const content = (x,y,w,h,name='body') => box(name,'content',x,y,w,h);

  if (variant.startsWith('newspaper-')) {
    const header = px(number('headerHeightMm',9,6,60));
    const top = header + pad;
    const bodyY = top + (titleH ? titleH + gap : 0);
    const waveH = variant==='newspaper-wave' ? px(2) : 0;
    H = bodyY+B+pad+waveH+px(.7);
    if (variant==='newspaper-wave') {
      const base=H-waveH-px(.7), left=px(.5), right=W-px(.5), step=(right-left)/5;
      let edge=`M ${left} ${base}`;
      for(let i=0;i<5;i++) {
        const x=left+i*step;
        edge+=` C ${x+step*.2} ${base}, ${x+step*.3} ${base+waveH}, ${x+step*.5} ${base+waveH}`;
        edge+=` C ${x+step*.7} ${base+waveH}, ${x+step*.8} ${base}, ${x+step} ${base}`;
      }
      const d=`${edge} L ${right} ${px(.5)} H ${left} Z`;
      parts.push(`<g id="vframe.paper-edge-shadow.1" data-name="paper-edge-shadow" transform="translate(0 ${px(.4)})">`);
      curve('shadow',d,'#B8B8B8','none');parts.push('</g>');
      curve('paper',d,'#FFFFFF');
      line('masthead-rule',px(1.2),header,W-px(1.2),header);
    } else {
      rect('paper',px(.5),px(.5),W-px(1),H-px(1));
      rect('masthead-band',pad,px(2),W-2*pad,header-px(2.8),'#CCCCCC','none');
      line('masthead-rule-top',pad,px(1.5),W-pad,px(1.5));
      line('masthead-rule-bottom',pad,header-px(.3),W-pad,header-px(.3));
    }
    box('masthead','chrome',W*.32,px(2),W*.33,header-px(3),variant==='newspaper-wave');
    box('date','chrome',W*.68,px(2),W*.28-pad,header-px(3),variant==='newspaper-wave');
    if(titleH)box('headline','title',pad,top,W-2*pad,titleH);
    content(pad,bodyY,W-2*pad,B);
  } else if (variant==='scroll') {
    const roll=px(4), inset=px(3.5), bodyY=roll+pad;
    H=bodyY+B+pad+roll;
    rect('scroll-paper',inset,roll*.5,W-2*inset,H-roll);
    parts.push('<defs><linearGradient id="roller-shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5B5B5"/><stop offset="0.45" stop-color="#FAFAFA"/><stop offset="1" stop-color="#999999"/></linearGradient></defs>');
    for(const [name,y] of [['upper',px(.5)],['lower',H-roll-px(.5)]]){
      rect(`${name}-shaft`,px(.5),y+roll*.3,W-px(1),roll*.4,'#DDDDDD',stroke,{rx:px(.5)});
      rect(`${name}-roller`,px(2.5),y,W-px(5),roll,'url(#roller-shade)',stroke,{rx:px(.7)});
      ellipse(`${name}-endcap`,W-px(2.5),y+roll*.5,px(.55),roll*.5,'#BBBBBB');
      rect(`${name}-right-shaft`,W-px(2.7),y+roll*.3,px(2.2),roll*.4,'#DDDDDD',stroke,{rx:px(.3)});
    }
    content(inset+pad,bodyY,W-2*(inset+pad),B);
  } else if (variant==='browser') {
    const header=px(number('headerHeightMm',12,10,60)), row=header/2, rail=px(2.7);
    const bodyY=header+pad, innerW=W-2*pad-rail;
    H=bodyY+B+pad;
    rect('browser-window',px(.5),px(.5),W-px(1),H-px(1));
    rect('tab-strip',px(.5),px(.5),W-px(1),row,'#B6B6B6');
    rect('active-tab',px(.5),px(.5),W*.29,row,'#EEEEEE');
    box('tab-title','chrome',px(2),px(1),W*.24,row-px(1.5),false);
    cross('tab-close',W*.27,row*.5,px(.55));
    line('new-tab-h',W*.31,row*.5,W*.33,row*.5);
    line('new-tab-v',W*.32,row*.5-px(.7),W*.32,row*.5+px(.7));
    line('minimize',W-px(13),row*.6,W-px(11),row*.6);
    rect('maximize',W-px(8.7),row*.5-px(.6),px(1.2),px(1.2),'none');
    cross('window-close',W-px(3),row*.5,px(.6));
    rect('toolbar',px(.5),row,W-px(1),row,'#E5E5E5');
    const cy=row*1.5, unit=W/108;
    for(const [x,dir] of [[4,-1],[10,1]]){
      line('navigation-shaft',(x-1)*unit,cy,(x+1)*unit,cy,'#666666');
      curve('navigation-arrow',`M ${(x-dir)*unit} ${cy-unit} L ${(x+dir)*unit} ${cy} L ${(x-dir)*unit} ${cy+unit}`,'none','#666666');
    }
    curve('refresh',`M ${17*unit} ${cy-unit} A ${1.2*unit} ${1.2*unit} 0 1 0 ${17.5*unit} ${cy+unit} M ${17*unit} ${cy-unit} l 0 ${unit} l ${unit} ${-unit}`,'none','#666666');
    curve('home',`M ${21*unit} ${cy} l ${unit} ${-unit} l ${unit} ${unit} v ${unit} h ${-2*unit} Z`,'none','#666666');
    rect('address-field',W*.29,row+px(1),W*.40,row-px(2),'#FFFFFF','none');
    rect('lock-body',W*.267,cy,px(1.3),px(1.1),'none','#666666');
    curve('lock-loop',`M ${W*.267} ${cy} v ${-unit*.6} a ${unit*.65} ${unit*.65} 0 0 1 ${unit*1.3} 0 v ${unit*.6}`,'none','#666666');
    for(let i=0;i<3;i++)line('menu-line',W*.82,cy-unit+i*unit,W*.842,cy-unit+i*unit,'#666666');
    for(let i=0;i<3;i++)ellipse('menu-dot',W*.94+i*unit*1.2,cy,unit*.15,unit*.15,'#666666','none');
    rect('scrollbar-rail',W-rail-px(.5),header,rail,H-header-px(.5),'#E8E8E8','none');
    rect('scrollbar-thumb',W-rail,header+px(2),rail-px(1),Math.min(px(10),B/3),'#CCCCCC',stroke,{rx:px(.4)});
    for(const [y,sign] of [[header+px(.8),-1],[H-px(.8),1]])curve('scrollbar-arrow',`M ${W-rail} ${y-sign*px(.35)} L ${W-px(.9)} ${y-sign*px(.35)} L ${W-rail*.5-px(.25)} ${y+sign*px(.35)} Z`,'#777777','none');
    const asideW=px(number('asideWidthMm',0,0,widthMm*.5));
    if(asideW){
      const asideH=px(number('asideHeightMm',Math.min(bodyMm,20),1,bodyMm));
      const textW=innerW-asideW-gap;
      content(pad,bodyY,textW,asideH,'body-upper');
      box('side-illustration','illustration',pad+textW+gap,bodyY,asideW,asideH);
      if(B>asideH+gap)content(pad,bodyY+asideH+gap,innerW,B-asideH-gap,'body-lower');
    }else content(pad,bodyY,innerW,B);
  } else {
    const columns=number('columns',3,1,8);
    if(!Number.isInteger(columns))throw new Error('columns must be an integer.');
    const header=px(number('headerHeightMm',8,5,60)), margin=px(4), cardGap=px(1.5), pins=px(3);
    const cardTitle=px(number('cardTitleHeightMm',0,0,60)), footer=px(number('footerHeightMm',0,0,60));
    const portrait=px(number('portraitMm',0,0,20));
    if(portrait>footer)throw new Error('portraitMm must fit within footerHeightMm.');
    const cardY=margin+header+gap, cardW=(W-2*margin-cardGap*(columns-1))/columns;
    const cardH=pins+pad+(cardTitle?cardTitle+gap:0)+B+(footer?gap+footer:0)+pad+px(1);
    H=cardY+cardH+margin;
    rect('board',px(.5),px(.5),W-px(1),H-px(1),'#DEDEDE');
    curve('bevel-top',`M ${px(.5)} ${px(.5)} H ${W-px(.5)} L ${W-px(2)} ${px(2)} H ${px(2)} Z`,'#BBBBBB');
    curve('bevel-left',`M ${px(.5)} ${px(.5)} L ${px(2)} ${px(2)} V ${H-px(2)} L ${px(.5)} ${H-px(.5)} Z`,'#808080');
    curve('bevel-right',`M ${W-px(.5)} ${px(.5)} V ${H-px(.5)} L ${W-px(2)} ${H-px(2)} V ${px(2)} Z`,'#777777');
    curve('bevel-bottom',`M ${px(.5)} ${H-px(.5)} L ${px(2)} ${H-px(2)} H ${W-px(2)} L ${W-px(.5)} ${H-px(.5)} Z`,'#AAAAAA');
    rect('board-title-paper',margin+px(4),margin,W-2*(margin+px(4)),header);
    for(const x of [margin+px(6),W-margin-px(6)]){
      line('title-pin-stem',x,margin+header*.4,x+px(.4),margin+header*.4+px(1));
      ellipse('title-pin-head',x,margin+header*.4,px(.8),px(.4));
    }
    box('board-title','title',margin+px(9),margin+px(1),W-2*(margin+px(9)),header-px(2));
    for(let i=0;i<columns;i++){
      const x=margin+i*(cardW+cardGap), y=cardY, end=y+cardH;
      const d=`M ${x} ${y} H ${x+cardW} V ${end-px(2)} Q ${x+cardW-px(.3)} ${end-px(.6)} ${x+cardW-px(.8)} ${end-px(.5)} Q ${x+cardW*.6} ${end+px(.2)} ${x} ${end} Z`;
      parts.push(`<g id="vframe.card-${i+1}-shadow.1" data-name="card-${i+1}-shadow" transform="translate(${px(.4)} ${px(.4)})">`);curve('paper-shadow',d,'#A8A8A8','none');parts.push('</g>');
      curve(`card-${i+1}`,d,'#FFFFFF');
      for(const cx of [x+px(1.8),x+cardW-px(1.8)])ellipse('card-pin',cx,y+px(1.8),px(.75),px(.75),'#888888');
      let bodyY=y+pins+pad;
      if(cardTitle){box(`card-${i+1}-title`,'title',x+pad,bodyY,cardW-2*pad,cardTitle);bodyY+=cardTitle+gap;}
      content(x+pad,bodyY,cardW-2*pad,B,`card-${i+1}-body`);
      if(footer){
        const fy=bodyY+B+gap, portraitGap=portrait?gap:0;
        box(`card-${i+1}-author`,'author',x+pad,fy,cardW-2*pad-portrait-portraitGap,footer);
        if(portrait)box(`card-${i+1}-portrait`,'illustration',x+cardW-pad-portrait,fy,portrait,portrait);
      }
    }
  }
  for(const b of [...slots,...reserved]){
    if(b.x<0||b.y<0||b.x+b.width>W+.001||b.y+b.height>H+.001)throw new Error(`Slot outside frame: ${b.name}`);
  }
  for(let i=0;i<slots.length;i++)for(const b of [...slots.slice(i+1),...reserved]){
    const a=slots[i];
    if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.001 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.001)throw new Error(`Overlapping slots: ${a.name}, ${b.name}`);
  }
  const layout={schema:'vectora.text-frame/v1',variant,widthMm,heightMm:round(H*25.4/96),widthPx:round(W),heightPx:round(H),slots,illustrationSlots:reserved,typography:{family:'UND v3.0',style:'Regular',fontPt:8,fontPx:8*96/72,charSpacing:-60},status:'frame-only; text, requested illustrations, and charts still need composition and verification'};
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${layout.heightMm}mm" viewBox="0 0 ${round(W)} ${round(H)}"><g id="vframe.root.1" data-name="text-illustration-frame">${parts.join('')}</g></svg>`;
  return {svg,layout};
}
