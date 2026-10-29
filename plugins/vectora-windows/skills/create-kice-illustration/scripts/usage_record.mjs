#!/usr/bin/env node
// Local immutable usage bundles. No network, credentials, upload or sync claims.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const LOGICAL_FOLDER='/A4. 통사실험실/[C] 개별 PJT/vectora (Js)/스킬 사용 기록';
const parts=LOGICAL_FOLDER.slice(1).split('/');
const SCHEMA='vectora.skill-usage/v1',MAX_FILE=256*1024*1024,MAX_RECORD=16*1024*1024;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hex=/^[0-9a-f]{64}$/;
const own=(o,k)=>Object.hasOwn(o,k);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=(code,message)=>{const e=new Error(message);e.code=code;throw e;};
const sha=b=>createHash('sha256').update(b).digest('hex');
const canonical=v=>Array.isArray(v)?v.map(canonical):object(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const encode=v=>Buffer.from(JSON.stringify(canonical(v),null,2)+'\n');
function fields(value,required,optional=[]){
 if(!object(value)||required.some(k=>!own(value,k))||Object.keys(value).some(k=>![...required,...optional].includes(k)))fail('INPUT_INVALID','Missing or unsupported fields; provide one request, not chat/configuration data.');
}
function text(value,max,label){if(typeof value!=='string'||!value.trim()||value.length>max)fail('INPUT_INVALID',`${label} must be a nonempty string of at most ${max} characters.`);}
function id(value){if(typeof value!=='string'||!uuid.test(value))fail('INPUT_INVALID','IDs must be canonical lowercase UUIDs.');}
function safePath(value){
 text(value,32000,'Path');
 if(value.includes('\0')||value.split(/[\\/]/).some(p=>p==='..'||p==='.')||/^\w+:\/\//.test(value))fail('PATH_UNSAFE','Path traversal, URLs and NUL are not accepted.');
 return path.resolve(value);
}
function absolute(value){const resolved=safePath(value);if(!path.isAbsolute(value))fail('PATH_UNSAFE','An absolute filesystem path is required.');return resolved;}
// Historical delivery references can belong to another OS. They are metadata,
// never reopened; current inputs still require a real path on the current OS.
function referencePath(value){
 text(value,32000,'Delivery reference');
 if(value.includes('\0')||value.split(/[\\/]/).some(p=>p==='..'||p==='.')||/^\w+:\/\//.test(value)||!path.posix.isAbsolute(value)&&!path.win32.isAbsolute(value))fail('PATH_UNSAFE','Historical delivery references must be absolute filesystem paths.');
}
// Reject symlinks/junctions in every existing component, including ancestors.
function noLinks(value){
 const p=safePath(value),parsed=path.parse(p);let current=parsed.root,stat=fs.lstatSync(current);
 for(const part of p.slice(parsed.root.length).split(path.sep).filter(Boolean)){
  if(!stat.isDirectory())fail('PATH_UNSAFE','A path ancestor is not a directory.');
  current=path.join(current,part);stat=fs.lstatSync(current);
  if(stat.isSymbolicLink())fail('PATH_UNSAFE','Symbolic links and junctions are not accepted.');
 }
 return stat;
}
function directory(p,writable=false){
 const stat=noLinks(p);if(!stat.isDirectory())fail('FOLDER_INVALID','Expected an existing directory.');
 fs.accessSync(p,fs.constants.R_OK|fs.constants.X_OK|(writable?fs.constants.W_OK:0));
 if(writable&&!(stat.mode&0o222))fail('FOLDER_NOT_WRITABLE','The existing directory is not writable.');
 return fs.realpathSync(p);
}
function exists(p){try{fs.lstatSync(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
function readFile(p,max=MAX_FILE){
 p=safePath(p);const before=noLinks(p);if(!before.isFile()||before.size<1||before.size>max)fail('FILE_INVALID','Expected a bounded nonempty regular file.');
 const fd=fs.openSync(p,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0));
 try{
  const first=fs.fstatSync(fd),bytes=fs.readFileSync(fd),after=fs.fstatSync(fd);
  if(first.dev!==before.dev||first.ino!==before.ino||after.size!==first.size||after.mtimeMs!==first.mtimeMs||bytes.length!==first.size)fail('FILE_CHANGED','Input changed during snapshot; retry after saving.');
  return {path:fs.realpathSync(p),bytes};
 }finally{fs.closeSync(fd);}
}
function json(bytes){try{return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));}catch{fail('JSON_INVALID','Invalid JSON container.');}}
function logicalFrom(base){
 let current=directory(base);
 for(const part of parts){
  const matches=fs.readdirSync(current).filter(name=>name.normalize('NFC')===part.normalize('NFC'));
  if(matches.length>1)fail('ROOT_AMBIGUOUS','Multiple NFC/NFD names match the logical folder.');
  if(!matches.length)return null;
  current=directory(path.join(current,matches[0]));
 }
 return current;
}
export function preflight({root,home=os.homedir(),localAppData=process.env.LOCALAPPDATA,platform=process.platform}={}){
 let selected;
 if(root!==undefined){
  const p=absolute(root),segments=p.split(path.sep).filter(Boolean);
  if(parts.some((part,i)=>segments[segments.length-parts.length+i]?.normalize('NFC')!==part.normalize('NFC')))fail('ROOT_SUFFIX','--root must be the existing full usage folder ending in the exact logical suffix.');
  selected=directory(p,true);
 }else{
  const candidates=[],infoFiles=platform==='win32'?(localAppData?[path.join(absolute(localAppData),'Dropbox','info.json')]:[]):[path.join(absolute(home),'.dropbox','info.json')];
  for(const file of infoFiles)if(exists(file)){
   const info=json(readFile(file,1024*1024).bytes);if(!object(info))fail('DISCOVERY_INVALID','Invalid Dropbox account metadata.');
   for(const row of Object.values(info))if(object(row)&&typeof row.path==='string')candidates.push(absolute(row.path));
  }
  if(platform!=='win32'){
   const cloud=path.join(absolute(home),'Library','CloudStorage');
   if(exists(cloud)){directory(cloud);for(const name of fs.readdirSync(cloud))if(name.startsWith('Dropbox'))candidates.push(path.join(cloud,name));}
  }
  const found=new Map();
  for(const candidate of new Set(candidates)){
   if(!exists(candidate))continue;
   const target=logicalFrom(candidate);if(target){const stat=fs.statSync(target);found.set(stat.ino?`${stat.dev}:${stat.ino}`:target,target);}
  }
  if(found.size!==1)fail(found.size?'ROOT_AMBIGUOUS':'ROOT_NOT_FOUND','Exactly one existing logical usage folder must be discoverable; no root is created.');
  selected=directory([...found.values()][0],true);
 }
 return {status:'ready',root:selected,logicalFolder:LOGICAL_FOLDER,remoteVerified:false};
}
function native(bytes){
 const d=json(bytes);
 if(!object(d)||d.format!=='vectora'||d.version!==1||typeof d.name!=='string'||!Array.isArray(d.artboards)||!d.artboards.length||d.artboards.length>200||!object(d.canvas)||!Array.isArray(d.canvas.objects))fail('NATIVE_INVALID','Expected a Vectora v1 JSON workspace container.');
 const ids=new Set();for(const b of d.artboards){
  if(!object(b)||typeof b.id!=='string'||!b.id||ids.has(b.id)||typeof b.name!=='string'||typeof b.background!=='string'||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<=0||b.height<=0||b.width>50000||b.height>50000)fail('NATIVE_INVALID','Invalid native artboard container.');ids.add(b.id);
 }
 if(!ids.has(d.activeArtboard)||d.canvas.objects.some(o=>!object(o)||typeof o.type!=='string'))fail('NATIVE_INVALID','Invalid active artboard or object container.');
}
function jpeg(bytes){
 if(bytes.length<4||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255||bytes.at(-2)!==255||bytes.at(-1)!==217)fail('JPEG_INVALID','JPEG SOI/EOI magic is required.');
 let offset=2,frame=false,scan=false;
 while(offset<bytes.length-2){
  if(bytes[offset++]!==255)fail('JPEG_INVALID','Invalid JPEG marker.');
  while(bytes[offset]===255)offset++;
  const marker=bytes[offset++];if(marker===217)break;
  if(marker===1||marker>=208&&marker<=215)continue;
  if(offset+2>bytes.length)fail('JPEG_INVALID','Truncated JPEG segment.');
  const length=bytes.readUInt16BE(offset);if(length<2||offset+length>bytes.length)fail('JPEG_INVALID','Truncated JPEG segment.');
  if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){
   if(length<8||!bytes.readUInt16BE(offset+3)||!bytes.readUInt16BE(offset+5))fail('JPEG_INVALID','Missing JPEG dimensions.');frame=true;
  }
  if(marker===218){scan=true;break;}offset+=length;
 }
 if(!frame||!scan)fail('JPEG_INVALID','JPEG frame and scan headers are required; pixels are not decoded.');
}
function prompt(value){fields(value,['verbatim','origin']);text(value.verbatim,65536,'Verbatim prompt');if(!['user','calling-agent'].includes(value.origin))fail('INPUT_INVALID','Prompt origin must be user or calling-agent.');}
function credentials(strings){
 if(strings.some(s=>/(?:\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}|\bBearer\s+[A-Za-z0-9._-]{16,}|\bAKIA[A-Z0-9]{16}\b|\bsl\.[A-Za-z0-9_-]{30,})/.test(s)))fail('CREDENTIALS_REJECTED','Do not include credentials in a usage request.');
}
function description(value){
 prompt(value.prompt);text(value.interpretedBrief,800,'Interpreted brief');
 if(!Array.isArray(value.assumptions)||value.assumptions.length>10||value.assumptions.some(s=>typeof s!=='string'||!s.trim()||s.length>300))fail('INPUT_INVALID','Use at most ten short assumptions.');
 for(const k of ['engine','skillVersion'])if(value[k]!==undefined)text(value[k],160,k);
 credentials([value.prompt.verbatim,value.interpretedBrief,...value.assumptions,...['engine','skillVersion'].filter(k=>value[k]!==undefined).map(k=>value[k])]);
}
const archivePath=r=>`archive/${r.illustrationId}/${r.requestId}`;
const names=id=>({vectora:`${id}.vectora`,jpeg:`${id}.jpeg`,record:`${id}.json`});
function seal(record){const body={...record};delete body.integrity;return {...body,integrity:{algorithm:'sha256',sha256:sha(encode(body))}};}
function output(value,fileName){
 fields(value,['fileName','bytes','sha256','deliveryPath']);
 if(value.fileName!==fileName||!Number.isSafeInteger(value.bytes)||value.bytes<1||!hex.test(value.sha256))fail('RECORD_INVALID','Invalid output reference.');referencePath(value.deliveryPath);
}
function recordShape(r){
 fields(r,['schema','requestId','illustrationId','revision','parentRequestId','requestedAt','action','prompt','interpretedBrief','assumptions','outputs','recordFile','previousRecord','storage','history','integrity'],['engine','skillVersion','importedBaseline']);
 if(r.schema!==SCHEMA)fail('RECORD_INVALID','Unsupported usage schema.');id(r.requestId);id(r.illustrationId);
 if(!Number.isSafeInteger(r.revision)||r.revision<1||!['create','modify'].includes(r.action)||typeof r.requestedAt!=='string'||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(r.requestedAt)||!Number.isFinite(Date.parse(r.requestedAt)))fail('RECORD_INVALID','Invalid revision, action or timestamp.');
 if(r.parentRequestId!==null)id(r.parentRequestId);description(r);
 const n=names(r.illustrationId);fields(r.outputs,['vectora','jpeg']);output(r.outputs.vectora,n.vectora);output(r.outputs.jpeg,n.jpeg);
 if(r.recordFile!==n.record)fail('RECORD_INVALID','Record filename does not match the illustration stem.');
 fields(r.storage,['mode','status','remoteFolder','archiveRelativePath','remoteVerified']);
 if(r.storage.remoteFolder!==LOGICAL_FOLDER||r.storage.archiveRelativePath!==archivePath(r)||r.storage.remoteVerified!==false||!(r.storage.mode==='synced-folder'&&['prepared','synced-folder-written'].includes(r.storage.status)||r.storage.mode==='remote'&&r.storage.status==='remote-prepared'))fail('RECORD_INVALID','Invalid storage contract; remote verification is not performed by this helper.');
 fields(r.integrity,['algorithm','sha256']);if(r.integrity.algorithm!=='sha256'||!hex.test(r.integrity.sha256)||seal(r).integrity.sha256!==r.integrity.sha256)fail('RECORD_TAMPERED','Usage record integrity mismatch.');
 if(r.previousRecord!==null){fields(r.previousRecord,['requestId','recordSha256']);id(r.previousRecord.requestId);if(!hex.test(r.previousRecord.recordSha256))fail('RECORD_INVALID','Invalid previous record reference.');}
 if(r.importedBaseline!==undefined){
  fields(r.importedBaseline,['kind','source','prompt']);const b=r.importedBaseline;
  if(b.kind!=='imported-baseline'||b.prompt!==null)fail('RECORD_INVALID','Imported baselines must not invent a previous prompt.');
  fields(b.source,['fileName','bytes','sha256','deliveryPath']);if(typeof b.source.fileName!=='string'||!Number.isSafeInteger(b.source.bytes)||b.source.bytes<1||!hex.test(b.source.sha256))fail('RECORD_INVALID','Invalid baseline source hash.');referencePath(b.source.deliveryPath);
 }
}
export function validateRecord(record){
 if(!object(record)||!Array.isArray(record.history)||record.history.length>1000)fail('RECORD_INVALID','A bounded cumulative history is required.');
 const snapshots=record.history,chain=[...snapshots,record],seen=new Set();
 chain.forEach((row,i)=>{
  if(!object(row)||i<snapshots.length&&own(row,'history'))fail('RECORD_INVALID','History entries must be nonrecursive prior record snapshots.');
  const restored=i===snapshots.length?row:{...row,history:snapshots.slice(0,i)};recordShape(restored);
  if(row.illustrationId!==record.illustrationId||row.revision!==i+1||seen.has(row.requestId))fail('HISTORY_INVALID','Illustration, revision or request identity mismatch.');seen.add(row.requestId);
  if(i===0){if(row.parentRequestId!==null||row.previousRecord!==null||row.action==='create'&&row.importedBaseline!==undefined||row.action==='modify'&&!row.importedBaseline)fail('HISTORY_INVALID','The first record must be create or an explicit imported baseline.');}
  else{const previous=chain[i-1];if(row.action!=='modify'||row.parentRequestId!==previous.requestId||row.previousRecord?.requestId!==previous.requestId||row.previousRecord?.recordSha256!==previous.integrity.sha256||row.importedBaseline!==undefined)fail('HISTORY_INVALID','Broken previous prompt/output history chain.');}
 });return record;
}
function fileReference(snapshot,fileName){return {fileName,bytes:snapshot.bytes.length,sha256:sha(snapshot.bytes),deliveryPath:snapshot.path};}
function getPrevious(file){if(!file)return undefined;return validateRecord(json(readFile(file,MAX_RECORD).bytes));}
function makeRecord(input,{previous,prepareRemote=false}={}){
 fields(input,['requestId','illustrationId','requestedAt','action','prompt','interpretedBrief','assumptions','outputs'],['revision','parentRequestId','engine','skillVersion','baseline']);
 id(input.requestId);id(input.illustrationId);description(input);fields(input.outputs,['vectora','jpeg']);
 for(const row of Object.values(input.outputs)){fields(row,['path']);absolute(row.path);}
 if(!['create','modify'].includes(input.action)||input.action==='create'&&(previous||input.baseline)||input.action==='modify'&&!previous&&!input.baseline||previous&&input.baseline)fail('LINEAGE_REQUIRED','Create has no previous source; modify requires --previous or an explicit baseline.path.');
 if(previous&&previous.illustrationId!==input.illustrationId)fail('HISTORY_INVALID','Previous record belongs to another illustration.');
 const revision=previous?previous.revision+1:1,parentRequestId=previous?.requestId??null;
 if(own(input,'revision')&&input.revision!==revision||own(input,'parentRequestId')&&input.parentRequestId!==parentRequestId)fail('HISTORY_INVALID','Supplied revision/parent does not match the explicit history.');
 const vectora=readFile(input.outputs.vectora.path),image=readFile(input.outputs.jpeg.path);native(vectora.bytes);jpeg(image.bytes);
 const n=names(input.illustrationId),history=previous?[...previous.history,(({history:_history,...rest})=>rest)(previous)]:[];
 const r={schema:SCHEMA,requestId:input.requestId,illustrationId:input.illustrationId,revision,parentRequestId,requestedAt:input.requestedAt,action:input.action,prompt:{...input.prompt},interpretedBrief:input.interpretedBrief,assumptions:[...input.assumptions],...Object.fromEntries(['engine','skillVersion'].filter(k=>input[k]!==undefined).map(k=>[k,input[k]])),outputs:{vectora:fileReference(vectora,n.vectora),jpeg:fileReference(image,n.jpeg)},recordFile:n.record,previousRecord:previous?{requestId:previous.requestId,recordSha256:previous.integrity.sha256}:null,storage:{mode:prepareRemote?'remote':'synced-folder',status:prepareRemote?'remote-prepared':'prepared',remoteFolder:LOGICAL_FOLDER,archiveRelativePath:archivePath(input),remoteVerified:false},history};
 if(input.baseline){fields(input.baseline,['path']);const source=readFile(absolute(input.baseline.path));native(source.bytes);r.importedBaseline={kind:'imported-baseline',source:fileReference(source,path.basename(source.path)),prompt:null};}
 const record=seal(r);validateRecord(record);
 return {record,buffers:new Map([[n.vectora,vectora.bytes],[n.jpeg,image.bytes],[n.record,encode(record)]])};
}
function readSet(dir,recordFile){
 directory(dir);const entries=fs.readdirSync(dir).sort();
 if(!recordFile){const records=entries.filter(f=>f.endsWith('.json'));if(records.length!==1)fail('BUNDLE_INVALID','Exactly one record JSON is required.');recordFile=records[0];}
 const record=validateRecord(json(readFile(path.join(dir,recordFile),MAX_RECORD).bytes)),n=names(record.illustrationId),expected=Object.values(n).sort();
 if(JSON.stringify(entries)!==JSON.stringify(expected))fail('BUNDLE_INVALID','A request directory must contain exactly the same-stem .vectora, .jpeg and .json files.');
 const buffers=new Map(expected.map(f=>[f,readFile(path.join(dir,f),f.endsWith('.json')?MAX_RECORD:MAX_FILE).bytes]));
 for(const kind of ['vectora','jpeg']){const reference=record.outputs[kind],bytes=buffers.get(reference.fileName);if(bytes.length!==reference.bytes||sha(bytes)!==reference.sha256)fail('OUTPUT_TAMPERED','Archived output hash mismatch.');}
 native(buffers.get(n.vectora));jpeg(buffers.get(n.jpeg));return {record,buffers};
}
export function inspectBundle(dir){const set=readSet(safePath(dir));return receipt(safePath(dir),set.record,set.buffers,false);}
function receipt(dir,record,buffers,reused){return {status:record.storage.status,reused,requestId:record.requestId,illustrationId:record.illustrationId,revision:record.revision,directory:dir,remoteFolder:LOGICAL_FOLDER,archiveRelativePath:archivePath(record),remoteVerified:false,files:[...buffers].map(([fileName,bytes])=>({fileName,bytes:bytes.length,sha256:sha(bytes)}))};}
function sameSet(dir,expected){
 const existing=readSet(dir);
 if(existing.buffers.size!==expected.buffers.size||[...expected.buffers].some(([f,b])=>!existing.buffers.has(f)||!b.equals(existing.buffers.get(f))))fail('REQUEST_CONFLICT','Existing request differs; no files were overwritten.');
}
function publish(destination,set){
 const parent=directory(path.dirname(destination),true),lock=path.join(parent,`.usage-${sha(Buffer.from(destination)).slice(0,24)}.lock`);let locked=false,stage;
 try{
  try{fs.mkdirSync(lock,{mode:0o700});locked=true;}catch(e){if(e.code==='EEXIST')fail('BUSY','Publication lock exists; inspect stale locks rather than deleting them automatically.');throw e;}
  directory(parent,true);
  if(exists(destination)){sameSet(destination,set);return receipt(destination,set.record,set.buffers,true);}
  stage=fs.mkdtempSync(path.join(parent,'.usage-staging-'));
  for(const [name,bytes] of set.buffers){const fd=fs.openSync(path.join(stage,name),'wx',0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  sameSet(stage,set);directory(parent,true);
  // Cooperating writers share this lock. Fail closed on any existing target,
  // including an empty/partial directory; never replace it with rename().
  if(exists(destination))fail('REQUEST_CONFLICT','Target appeared during staging; nothing was replaced.');
  fs.renameSync(stage,destination);stage=undefined;sameSet(destination,set);
  return receipt(destination,set.record,set.buffers,false);
 }finally{
  if(stage)fs.rmSync(stage,{recursive:true,force:true});
  if(locked)fs.rmdirSync(lock);
 }
}
export function prepareUsage(input,{out,previous,prepareRemote=false}={}){
 if(!out)fail('INPUT_INVALID','--out is required.');const destination=safePath(out);directory(path.dirname(destination),true);
 const set=makeRecord(input,{previous:getPrevious(previous),prepareRemote});return publish(destination,set);
}
function childDirectory(parent,name){
 directory(parent,true);const child=path.join(parent,name);
 try{fs.mkdirSync(child,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}
 return directory(child,true);
}
export function commitUsage(bundle,options={}){
 const set=readSet(safePath(bundle));
 if(set.record.storage.mode!=='synced-folder'||set.record.storage.status!=='prepared')fail('COMMIT_MODE','Commit requires a prepared local bundle. Remote preparation is uploaded/read back separately by the caller.');
 const {root}=preflight(options),archive=childDirectory(root,'archive'),illustration=childDirectory(archive,set.record.illustrationId);
 const record=seal({...set.record,storage:{...set.record.storage,status:'synced-folder-written'}});validateRecord(record);
 const buffers=new Map(set.buffers);buffers.set(record.recordFile,encode(record));
 return publish(path.join(illustration,record.requestId),{record,buffers});
}
export const HELP=`Usage (Node.js, no dependencies):
  usage_record.mjs preflight [--root FULL_EXISTING_USAGE_FOLDER]
  usage_record.mjs prepare --input REQUEST.json --out NEW_LOCAL_BUNDLE [--previous OLD_USAGE.json] [--prepare-remote]
  usage_record.mjs commit --bundle LOCAL_BUNDLE [--root FULL_EXISTING_USAGE_FOLDER]

Logical folder: ${LOGICAL_FOLDER}
--root is the full existing usage folder, not the Dropbox account root. Its NFC/NFD-normalized suffix must match exactly. preflight creates nothing.
prepare copies unchanged delivery files to exactly three UUID-stem files. --prepare-remote only prepares a local set with the fixed remoteFolder; the caller lists/uploads/reads back through connected Dropbox separately.
commit publishes archive/<illustrationId>/<requestId>/ atomically via staging. It reports synced-folder-written, never remote-verified. Same-request exact bytes are reused; different or partial contents reject. Stale locks require caller inspection.
The JSON records native/JPEG hashes, original local delivery paths and cumulative prior prompt/output snapshots. Its own semantic integrity digest excludes integrity; receipts provide raw bytes/SHA-256 for all three files. Minimal container/magic checks do not prove visual quality or native reopening.
Input (absolute local paths; one secret-free prompt, no full chat/configuration):
${JSON.stringify({requestId:'00000000-0000-4000-8000-000000000001',illustrationId:'00000000-0000-4000-8000-000000000002',requestedAt:'2026-10-30T00:00:00+09:00',action:'create',prompt:{verbatim:'원문 요청 그대로',origin:'user'},interpretedBrief:'간단한 제작 요약',assumptions:[],outputs:{vectora:{path:'/absolute/delivery/item.vectora'},jpeg:{path:'/absolute/delivery/item.jpeg'}}},null,2)}
For modify: use --previous, or baseline:{path:"/absolute/existing.vectora"} if no old record exists. A baseline is source-hashed with prompt:null; no prior prompt is invented. revision and parentRequestId may be supplied only if they match the computed chain.
`;
export function main(args){
 if(args.includes('--help')||!args.length){console.log(HELP);return;}
 const [command,...tail]=args,allowed=command==='preflight'?['--root']:command==='prepare'?['--input','--out','--previous','--prepare-remote']:command==='commit'?['--bundle','--root']:[];
 if(!allowed.length)fail('CLI_INVALID','Unknown command. Use --help.');const options={};
 for(let i=0;i<tail.length;i++){const key=tail[i];if(!allowed.includes(key)||own(options,key))fail('CLI_INVALID','Unknown or duplicate option.');if(key==='--prepare-remote'){options[key]=true;continue;}const value=tail[++i];if(!value||value.startsWith('--'))fail('CLI_INVALID','Missing option value.');options[key]=value;}
 let result;
 if(command==='preflight')result=preflight({root:options['--root']});
 if(command==='prepare'){if(!options['--input'])fail('CLI_INVALID','--input is required.');result=prepareUsage(json(readFile(options['--input'],MAX_RECORD).bytes),{out:options['--out'],previous:options['--previous'],prepareRemote:!!options['--prepare-remote']});}
 if(command==='commit'){if(!options['--bundle'])fail('CLI_INVALID','--bundle is required.');result=commitUsage(options['--bundle'],{root:options['--root']});}
 console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2));}catch(error){console.error(JSON.stringify({error:{code:error.code??'USAGE_RECORD_FAILED',message:error.message}}));process.exitCode=1;}
}
