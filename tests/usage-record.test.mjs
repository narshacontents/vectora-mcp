import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {LOGICAL_FOLDER,preflight,prepareUsage,commitUsage,inspectBundle,validateRecord} from '../skills/create-kice-illustration/scripts/usage_record.mjs';

// Every fixture, fake Dropbox root, source, bundle and archive lives below a
// realpath(os.tmpdir()) mkdtemp. No actual Dropbox metadata or folder is used.
const script=fileURLToPath(new URL('../skills/create-kice-illustration/scripts/usage_record.mjs',import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const jpeg=Buffer.from('ffd8ffc0000b080001000101011100ffda0008010100003f0000ffd9','hex');
function fixture(t){
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'vectora-usage-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const delivery=path.join(dir,'delivery');fs.mkdirSync(delivery);
 const native={format:'vectora',version:1,name:'synthetic',activeArtboard:'b',artboards:[{id:'b',name:'board',x:0,y:0,width:108,height:60,background:'#FFFFFF'}],canvas:{objects:[{type:'Rect',left:1,top:1,width:3,height:2}]}};
 const vectora=path.join(delivery,'original.vectora'),image=path.join(delivery,'original.jpeg');fs.writeFileSync(vectora,JSON.stringify(native));fs.writeFileSync(image,jpeg);
 const input={requestId:randomUUID(),illustrationId:randomUUID(),requestedAt:'2026-10-30T10:00:00+09:00',action:'create',prompt:{verbatim:'  사용자가 요청한 그림\n공백도 그대로. ',origin:'user'},interpretedBrief:'단일 그림 생성',assumptions:[],outputs:{vectora:{path:vectora},jpeg:{path:image}}};
 const sync=path.join(dir,'fake-Dropbox'),root=path.join(sync,...LOGICAL_FOLDER.slice(1).split('/'));fs.mkdirSync(root,{recursive:true});
 const out=path.join(dir,'bundle');
 const recordAt=folder=>path.join(folder,`${input.illustrationId}.json`);
 return {dir,delivery,vectora,image,input,native,sync,root,out,recordAt};
}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const mustFail=(fn,code)=>assert.throws(fn,e=>code instanceof RegExp?code.test(e.code??''):e.code===code);
function three(receipt){assert.equal(receipt.files.length,3);assert.deepEqual(new Set(receipt.files.map(f=>path.extname(f.fileName))),new Set(['.vectora','.jpeg','.json']));assert.equal(new Set(receipt.files.map(f=>path.parse(f.fileName).name)).size,1);assert.deepEqual(fs.readdirSync(receipt.directory).sort(),receipt.files.map(f=>f.fileName).sort());for(const f of receipt.files){const bytes=fs.readFileSync(path.join(receipt.directory,f.fileName));assert.equal(bytes.length,f.bytes);assert.equal(hash(bytes),f.sha256);}}

test('preflight does not create missing sync roots or logical folders and validates explicit suffix',t=>{
 const f=fixture(t),missing=path.join(f.dir,'missing');mustFail(()=>preflight({root:path.join(missing,...LOGICAL_FOLDER.slice(1).split('/'))}),'ENOENT');assert.equal(fs.existsSync(missing),false);
 mustFail(()=>preflight({root:f.sync}),'ROOT_SUFFIX');
 fs.rmSync(f.root,{recursive:true});mustFail(()=>preflight({home:f.dir,platform:'darwin'}),'ROOT_NOT_FOUND');assert.equal(fs.existsSync(f.root),false);
});
test('mac account metadata discovers NFD directories through NFC logical comparison without writes',t=>{
 const f=fixture(t);fs.rmSync(f.sync,{recursive:true});const root=path.join(f.sync,...LOGICAL_FOLDER.slice(1).split('/').map(s=>s.normalize('NFD')));fs.mkdirSync(root,{recursive:true});
 const info=path.join(f.dir,'.dropbox');fs.mkdirSync(info);fs.writeFileSync(path.join(info,'info.json'),JSON.stringify({personal:{path:f.sync}}));
 const before=fs.readdirSync(root);assert.equal(preflight({home:f.dir,platform:'darwin'}).root,fs.realpathSync(root));assert.equal(preflight({root}).root,fs.realpathSync(root));assert.deepEqual(fs.readdirSync(root),before);
});
test('CloudStorage Dropbox fallback and Windows LOCALAPPDATA metadata are supported in tmp fixtures',t=>{
 const f=fixture(t),cloud=path.join(f.dir,'Library','CloudStorage','Dropbox-personal');fs.mkdirSync(path.dirname(cloud),{recursive:true});fs.renameSync(f.sync,cloud);
 assert.equal(preflight({home:f.dir,platform:'darwin'}).root,fs.realpathSync(path.join(cloud,...LOGICAL_FOLDER.slice(1).split('/'))));
 const local=path.join(f.dir,'local','Dropbox');fs.mkdirSync(local,{recursive:true});fs.writeFileSync(path.join(local,'info.json'),JSON.stringify({business:{path:cloud}}));
 assert.equal(preflight({home:f.dir,platform:'win32',localAppData:path.dirname(local)}).status,'ready');
});
test('multiple matching account folders and nonwritable targets fail closed',t=>{
 const f=fixture(t),other=path.join(f.dir,'second'),second=path.join(other,...LOGICAL_FOLDER.slice(1).split('/'));fs.mkdirSync(second,{recursive:true});fs.mkdirSync(path.join(f.dir,'.dropbox'));
 fs.writeFileSync(path.join(f.dir,'.dropbox','info.json'),JSON.stringify({personal:{path:f.sync},business:{path:other}}));mustFail(()=>preflight({home:f.dir,platform:'darwin'}),'ROOT_AMBIGUOUS');
 fs.chmodSync(f.root,0o555);try{assert.throws(()=>preflight({root:f.root}));}finally{fs.chmodSync(f.root,0o755);}
});
test('root/source/archive symlinks and raw traversal are rejected',t=>{
 const f=fixture(t);mustFail(()=>preflight({root:path.join(f.root,'x')+'/../'}),'PATH_UNSAFE');
 const alias=path.join(f.dir,'alias');fs.symlinkSync(f.sync,alias,'dir');mustFail(()=>preflight({root:path.join(alias,...LOGICAL_FOLDER.slice(1).split('/'))}),'PATH_UNSAFE');
 const source=path.join(f.delivery,'link.vectora');fs.symlinkSync(f.vectora,source);const invalid=structuredClone(f.input);invalid.outputs.vectora.path=source;mustFail(()=>prepareUsage(invalid,{out:f.out}),'PATH_UNSAFE');
 prepareUsage(f.input,{out:f.out});fs.symlinkSync(f.delivery,path.join(f.root,'archive'),'dir');mustFail(()=>commitUsage(f.out,{root:f.root}),'PATH_UNSAFE');assert.equal(fs.readdirSync(f.delivery).length,3);
});
test('prepare and local commit publish exactly three copied same-stem files; original delivery is unchanged',t=>{
 const f=fixture(t),before=[fs.readFileSync(f.vectora),fs.readFileSync(f.image)],prepared=prepareUsage(f.input,{out:f.out});three(prepared);assert.equal(prepared.status,'prepared');assert.equal(fs.existsSync(path.join(f.root,'archive')),false);
 const committed=commitUsage(f.out,{root:f.root});three(committed);assert.equal(committed.status,'synced-folder-written');assert.equal(committed.remoteVerified,false);
 assert.equal(committed.directory,path.join(f.root,'archive',f.input.illustrationId,f.input.requestId));const record=read(f.recordAt(committed.directory));assert.equal(record.schema,'vectora.skill-usage/v1');assert.equal(record.prompt.verbatim,f.input.prompt.verbatim);assert.equal(record.outputs.vectora.deliveryPath,fs.realpathSync(f.vectora));
 assert.deepEqual(fs.readFileSync(f.vectora),before[0]);assert.deepEqual(fs.readFileSync(f.image),before[1]);assert.deepEqual(fs.readdirSync(f.delivery).sort(),['original.jpeg','original.vectora']);assert.equal(read(f.recordAt(f.out)).storage.status,'prepared');
});
test('same request is idempotent by all file hashes, with no rewriting or extra files',t=>{
 const f=fixture(t);const a=prepareUsage(f.input,{out:f.out});assert.equal(a.reused,false);assert.equal(prepareUsage(f.input,{out:f.out}).reused,true);
 const first=commitUsage(f.out,{root:f.root}),times=first.files.map(x=>fs.statSync(path.join(first.directory,x.fileName)).mtimeMs),again=commitUsage(f.out,{root:f.root});assert.equal(again.reused,true);assert.deepEqual(again.files,first.files);assert.deepEqual(again.files.map(x=>fs.statSync(path.join(again.directory,x.fileName)).mtimeMs),times);three(again);
});
test('same request with different data or metadata rejects without overwriting an existing archive',t=>{
 const f=fixture(t);prepareUsage(f.input,{out:f.out});const first=commitUsage(f.out,{root:f.root}),original=first.files.map(x=>fs.readFileSync(path.join(first.directory,x.fileName)));
 const changed=structuredClone(f.input);changed.prompt.verbatim+='수정';const second=path.join(f.dir,'other-bundle');prepareUsage(changed,{out:second});mustFail(()=>commitUsage(second,{root:f.root}),'REQUEST_CONFLICT');assert.deepEqual(first.files.map(x=>fs.readFileSync(path.join(first.directory,x.fileName))),original);
 const changedJpeg=Buffer.from(jpeg);changedJpeg[changedJpeg.length-3]=1;fs.writeFileSync(f.image,changedJpeg);mustFail(()=>prepareUsage(f.input,{out:f.out}),'REQUEST_CONFLICT');
});
test('partial staged write failure leaves no published request, staging or lock; retry succeeds',t=>{
 const f=fixture(t);prepareUsage(f.input,{out:f.out});const original=fs.openSync;
 const mock=t.mock.method(fs,'openSync',function(file,flags,...rest){if(flags==='wx'&&String(file).endsWith('.jpeg')){const e=new Error('injected copy failure');e.code='EIO';throw e;}return original.call(this,file,flags,...rest);});
 try{mustFail(()=>commitUsage(f.out,{root:f.root}),'EIO');}finally{mock.mock.restore();}
 const illustration=path.join(f.root,'archive',f.input.illustrationId);assert.deepEqual(fs.readdirSync(illustration),[]);three(commitUsage(f.out,{root:f.root}));
});
test('failed atomic rename leaves target absent and delivery originals unchanged',t=>{
 const f=fixture(t),original=fs.readFileSync(f.vectora);prepareUsage(f.input,{out:f.out});const mock=t.mock.method(fs,'renameSync',()=>{const e=new Error('injected rename failure');e.code='EIO';throw e;});
 try{mustFail(()=>commitUsage(f.out,{root:f.root}),'EIO');}finally{mock.mock.restore();}assert.deepEqual(fs.readFileSync(f.vectora),original);assert.deepEqual(fs.readdirSync(path.join(f.root,'archive',f.input.illustrationId)),[]);
});
test('prepared output/JSON tampering and existing partial or fourth-file directories reject',t=>{
 const f=fixture(t);prepareUsage(f.input,{out:f.out});const copied=path.join(f.out,`${f.input.illustrationId}.jpeg`);fs.appendFileSync(copied,'x');mustFail(()=>commitUsage(f.out,{root:f.root}),'OUTPUT_TAMPERED');assert.equal(fs.existsSync(path.join(f.root,'archive')),false);
 fs.rmSync(f.out,{recursive:true});prepareUsage(f.input,{out:f.out});const record=read(f.recordAt(f.out));record.prompt.verbatim='tamper';fs.writeFileSync(f.recordAt(f.out),JSON.stringify(record));mustFail(()=>commitUsage(f.out,{root:f.root}),'RECORD_TAMPERED');
 fs.rmSync(f.out,{recursive:true});prepareUsage(f.input,{out:f.out});fs.writeFileSync(path.join(f.out,'receipt.json'),'{}');mustFail(()=>commitUsage(f.out,{root:f.root}),'BUNDLE_INVALID');fs.unlinkSync(path.join(f.out,'receipt.json'));
 const destination=path.join(f.root,'archive',f.input.illustrationId,f.input.requestId);fs.mkdirSync(destination,{recursive:true});mustFail(()=>commitUsage(f.out,{root:f.root}),'BUNDLE_INVALID');assert.deepEqual(fs.readdirSync(destination),[]);
});
test('two revisions accumulate only related original prompts and output refs in one validated history chain',t=>{
 const f=fixture(t);prepareUsage(f.input,{out:f.out});const first=commitUsage(f.out,{root:f.root}),previous=f.recordAt(first.directory);
 const change=structuredClone(f.input);change.action='modify';change.requestId=randomUUID();change.requestedAt='2026-10-30T10:30:00+09:00';change.prompt={origin:'calling-agent',verbatim:'호출 에이전트의 수정 의뢰 원문'};change.revision=2;change.parentRequestId=f.input.requestId;
 const second=path.join(f.dir,'revision2');prepareUsage(change,{out:second,previous});const committed=commitUsage(second,{root:f.root});three(committed);const record=read(f.recordAt(committed.directory));validateRecord(record);
 assert.equal(record.revision,2);assert.equal(record.parentRequestId,f.input.requestId);assert.equal(record.history.length,1);assert.deepEqual(record.history[0].prompt,f.input.prompt);assert.deepEqual(record.history[0].outputs,read(previous).outputs);assert.equal(record.previousRecord.recordSha256,read(previous).integrity.sha256);assert.equal(fs.readdirSync(path.join(f.root,'archive',f.input.illustrationId)).length,2);
 const third={...change,requestId:randomUUID(),revision:3,parentRequestId:change.requestId};const thirdOut=path.join(f.dir,'revision3');prepareUsage(third,{out:thirdOut,previous:f.recordAt(committed.directory)});const r3=read(f.recordAt(thirdOut));assert.equal(r3.history.length,2);assert.equal(r3.history[1].prompt.verbatim,change.prompt.verbatim);validateRecord(r3);
});
test('previous record tampering, wrong illustration and fake revision are rejected',t=>{
 const f=fixture(t);prepareUsage(f.input,{out:f.out});const previous=f.recordAt(f.out),change={...structuredClone(f.input),requestId:randomUUID(),action:'modify'};
 const corrupted=read(previous);corrupted.outputs.jpeg.sha256='0'.repeat(64);const bad=path.join(f.dir,'bad.json');fs.writeFileSync(bad,JSON.stringify(corrupted));mustFail(()=>prepareUsage(change,{out:path.join(f.dir,'bad-out'),previous:bad}),'RECORD_TAMPERED');
 mustFail(()=>prepareUsage({...change,illustrationId:randomUUID()},{out:path.join(f.dir,'bad-out'),previous}),'HISTORY_INVALID');mustFail(()=>prepareUsage({...change,revision:7},{out:path.join(f.dir,'bad-out'),previous}),'HISTORY_INVALID');
});
test('history preserves foreign-OS local delivery paths without opening those old paths',t=>{
 const f=fixture(t);prepareUsage(f.input,{out:f.out});const foreign=read(f.recordAt(f.out));
 foreign.outputs.vectora.deliveryPath='C:\\Users\\author\\delivery\\old.vectora';foreign.outputs.jpeg.deliveryPath='C:\\Users\\author\\delivery\\old.jpeg';
 const canonical=v=>Array.isArray(v)?v.map(canonical):v!==null&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const {integrity:_integrity,...body}=foreign;foreign.integrity={algorithm:'sha256',sha256:hash(Buffer.from(JSON.stringify(canonical(body),null,2)+'\n'))};validateRecord(foreign);
 const previous=path.join(f.dir,'foreign-history.json');fs.writeFileSync(previous,JSON.stringify(foreign));
 const changed={...structuredClone(f.input),requestId:randomUUID(),action:'modify'},out=path.join(f.dir,'cross-os');prepareUsage(changed,{out,previous});
 const record=read(f.recordAt(out));validateRecord(record);assert.equal(record.history[0].outputs.vectora.deliveryPath,foreign.outputs.vectora.deliveryPath);assert.equal(record.revision,2);
});
test('modify without old request info requires imported baseline, hashes its source and invents no old prompt',t=>{
 const f=fixture(t),change={...structuredClone(f.input),action:'modify'};mustFail(()=>prepareUsage(change,{out:f.out}),'LINEAGE_REQUIRED');change.baseline={path:f.vectora};prepareUsage(change,{out:f.out});const record=read(f.recordAt(f.out));validateRecord(record);
 assert.equal(record.revision,1);assert.equal(record.parentRequestId,null);assert.deepEqual(record.history,[]);assert.equal(record.importedBaseline.kind,'imported-baseline');assert.equal(record.importedBaseline.prompt,null);assert.equal(record.importedBaseline.source.sha256,hash(fs.readFileSync(f.vectora)));
});
test('remote preparation is local only, fixes remoteFolder and cannot claim commit or remote verification',t=>{
 const f=fixture(t),receipt=prepareUsage(f.input,{out:f.out,prepareRemote:true});three(receipt);assert.equal(receipt.status,'remote-prepared');assert.equal(receipt.remoteVerified,false);const record=read(f.recordAt(f.out));assert.equal(record.storage.remoteFolder,LOGICAL_FOLDER);assert.equal(record.storage.mode,'remote');assert.equal(record.storage.remoteVerified,false);mustFail(()=>commitUsage(f.out,{root:f.root}),'COMMIT_MODE');assert.equal(fs.existsSync(path.join(f.root,'archive')),false);
});
test('invalid JPEG/native magic and workspace container fail before publication',t=>{
 const f=fixture(t);for(const bytes of [Buffer.from('not JPEG'),Buffer.from([255,216,255,217]),jpeg.subarray(0,-1)]){fs.writeFileSync(f.image,bytes);mustFail(()=>prepareUsage(f.input,{out:f.out}),'JPEG_INVALID');assert.equal(fs.existsSync(f.out),false);}
 fs.writeFileSync(f.image,jpeg);for(const native of [{}, {...f.native,version:2},{...f.native,activeArtboard:'missing'},{...f.native,artboards:[]}]){fs.writeFileSync(f.vectora,JSON.stringify(native));mustFail(()=>prepareUsage(f.input,{out:f.out}),'NATIVE_INVALID');}
});
test('unrelated chat/configuration fields and obvious credentials are not logged',t=>{
 const f=fixture(t);mustFail(()=>prepareUsage({...f.input,messages:[]},{out:f.out}),'INPUT_INVALID');const input=structuredClone(f.input);input.prompt.verbatim='Bearer '+ 'A'.repeat(32);mustFail(()=>prepareUsage(input,{out:f.out}),'CREDENTIALS_REJECTED');assert.equal(fs.existsSync(f.out),false);
});
test('CLI preflight/help and prepare-remote return machine JSON using only tmp inputs',t=>{
 const f=fixture(t),help=execFileSync(process.execPath,[script,'--help'],{encoding:'utf8'});assert.match(help,/--prepare-remote/);assert.match(help,/synced-folder-written/);
 const info=JSON.parse(execFileSync(process.execPath,[script,'preflight','--root',f.root],{encoding:'utf8'}));assert.equal(info.status,'ready');assert.equal(info.remoteVerified,false);
 const input=path.join(f.dir,'input.json');fs.writeFileSync(input,JSON.stringify(f.input));const receipt=JSON.parse(execFileSync(process.execPath,[script,'prepare','--input',input,'--out',f.out,'--prepare-remote'],{encoding:'utf8'}));three(receipt);assert.equal(receipt.status,'remote-prepared');
 const rejected=spawnSync(process.execPath,[script,'preflight','--root',f.sync],{encoding:'utf8'});assert.equal(rejected.status,1);assert.equal(JSON.parse(rejected.stderr).error.code,'ROOT_SUFFIX');assert.equal(inspectBundle(f.out).status,'remote-prepared');
});
