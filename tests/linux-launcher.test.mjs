import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {createMcpConfig, PLUGIN_ROOT} from '../scripts/build-packages.mjs';
import {createLaunchSpec} from '../scripts/claude/claude-mcp-launcher.mjs';

async function fixture(t){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'vectora-linux-launch-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const bin=path.join(root,'bin');await fs.mkdir(bin);
  await fs.writeFile(path.join(bin,'uname'),'#!/bin/sh\nprintf Linux');await fs.chmod(path.join(bin,'uname'),0o755);
  const home=path.join(root,'home 한글 & space');await fs.mkdir(home);
  const env={...process.env,HOME:home,XDG_CONFIG_HOME:path.join(home,'custom config'),VECTORA_APP_PATH:'',PATH:`${bin}:${process.env.PATH}`,ELECTRON_RUN_AS_NODE:'1'};
  const stub=async relative=>{
    const file=path.join(home,relative);await fs.mkdir(path.dirname(file),{recursive:true});
    await fs.writeFile(file,'#!/bin/sh\nprintf "arg:%s node:%s" "$1" "${ELECTRON_RUN_AS_NODE:-unset}"\nprintf diagnostic >&2\nexit 7\n');
    await fs.chmod(file,0o755);return file;
  };
  const run=()=>{
    const config=createMcpConfig('linux').mcpServers.vectora;
    return spawnSync(config.command,config.args,{env,encoding:'utf8',timeout:5000});
  };
  return {home,env,stub,run};
}

test('Linux explicit Unicode AppImage path preserves stdio, exit status and removes Electron Node mode',async t=>{
  const f=await fixture(t);f.env.VECTORA_APP_PATH=await f.stub("custom/Vectora 한글 ' & $().AppImage");
  const result=f.run();assert.equal(result.status,7,result.stderr);assert.equal(result.stdout,'arg:--mcp-stdio node:unset');assert.equal(result.stderr,'diagnostic');
});

test('Linux discovers ~/Applications, ~/.local/bin and persisted XDG paths',async t=>{
  for(const relative of ['Applications/Vectora-2.2.2-linux-x64.AppImage','.local/bin/Vectora.AppImage','custom/Vectora.AppImage']){
    const f=await fixture(t);const app=await f.stub(relative);
    if(relative.startsWith('custom/')){
      await fs.mkdir(path.join(f.env.XDG_CONFIG_HOME,'Vectora'),{recursive:true});
      await fs.writeFile(path.join(f.env.XDG_CONFIG_HOME,'Vectora/mcp-app-path'),app+'\n');
    }
    const result=f.run();assert.equal(result.status,7,result.stderr);assert.equal(result.stdout,'arg:--mcp-stdio node:unset');
  }
});

test('Linux invalid override and missing execute permission fail closed without stdout or fallback',async t=>{
  const f=await fixture(t);await f.stub('Applications/Vectora.AppImage');
  f.env.VECTORA_APP_PATH=path.join(f.home,'missing');
  let result=f.run();assert.equal(result.status,69);assert.equal(result.stdout,'');assert.match(result.stderr,/VECTORA_APP_PATH/);
  f.env.VECTORA_APP_PATH=await f.stub('custom/Vectora.AppImage');await fs.chmod(f.env.VECTORA_APP_PATH,0o644);
  result=f.run();assert.equal(result.status,69);assert.equal(result.stdout,'');
});

test('Claude and Gemini share a shell-free Linux launch specification; packaged Unix launcher stays canonical',async()=>{
  assert.deepEqual(createLaunchSpec('linux','/tmp/extension 한글'),{command:'/bin/sh',args:['/tmp/extension 한글/scripts/start-mcp.sh']});
  const canonical=await fs.readFile(path.join(PLUGIN_ROOT,'scripts/start-mcp.sh'));
  for(const plugin of ['vectora','vectora-macos'])assert((await fs.readFile(path.join(PLUGIN_ROOT,'plugins',plugin,'scripts/start-mcp.sh'))).equals(canonical));
  const packaged=JSON.parse(await fs.readFile(path.join(PLUGIN_ROOT,'plugins/vectora-macos/.mcp.json')));
  assert.deepEqual(packaged,createMcpConfig('linux'));
});
