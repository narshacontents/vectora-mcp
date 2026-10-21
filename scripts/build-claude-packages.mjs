import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLUGIN_ROOT, PLUGIN_VERSION } from './build-packages.mjs';

export const CLAUDE_PLUGIN_VERSION = PLUGIN_VERSION;
const runtimeRoot = path.join(PLUGIN_ROOT, 'scripts', 'claude-runtime');

function replaceExactlyOnce(value, before, after, label) {
  const first = value.indexOf(before);
  if (first < 0 || value.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Expected one editable Claude-specific passage in ${label}.`);
  }
  return value.slice(0, first) + after + value.slice(first + before.length);
}

function updateFile(filePath, transform) {
  const before = readFileSync(filePath, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`Claude adaptation did not change ${path.relative(PLUGIN_ROOT, filePath)}.`);
  writeFileSync(filePath, after);
}

function copySkillSource(name, targetRoot) {
  const source = path.join(PLUGIN_ROOT, 'skills', name);
  const target = path.join(targetRoot, name);
  cpSync(source, target, {
    recursive: true,
    filter(sourcePath) {
      const relative = path.relative(source, sourcePath).split(path.sep).join('/');
      return relative !== 'agents/openai.yaml' && !relative.startsWith('agents/openai.yaml/')
        && !relative.split('/').includes('__pycache__') && !relative.endsWith('.pyc');
    },
  });
  return target;
}

function adaptUseVectora(skillRoot) {
  const skillPath = path.join(skillRoot, 'SKILL.md');
  updateFile(skillPath, (value) => {
    value = replaceExactlyOnce(
      value,
      'description: "Vectora MCP로 벡터 그림을 만들고 SVG·AI/PDF·이미지를 열어 편집·추적·저장한다. 도형·경로·문자·부분 서식·양끝 화살표·그룹·레이어·대지를 다루거나 기존 그림을 변환할 때 사용한다. Computer Use 없이 작동한다. 통합사회 평가원 스타일 요청에는 함께 제공된 create-kice-illustration 규칙도 적용한다. 통합과학 스킬은 본문이 비어 있는 준비 중 항목이다."',
      'description: "Claude의 Vectora MCP로 벡터 그림을 편집하고 저장한다. SVG·AI/PDF·이미지 가져오기, 문자·도형·그래프·레이어 편집과 통합사회 평가원 스타일 제작에 사용한다. 통합과학 스킬은 본문이 비어 있는 준비 중 항목이다."',
      'use-vectora/SKILL.md frontmatter',
    );
    const introStart = '# Vectora로 벡터 편집\n\n';
    const introEnd = '\n## 연결과 단위';
    const start = value.indexOf(introStart);
    const end = value.indexOf(introEnd, start);
    if (start < 0 || end < 0) throw new Error('Could not locate the Vectora skill introduction.');
    const intro = `${introStart}Claude에서 현재 세션에 노출된 MCP 도구 목록을 확인하고 Vectora 도구를 사용한다. Claude Code 플러그인에서는 도구 이름에 플러그인 접두사가 붙을 수 있으므로 실제 목록의 이름을 그대로 호출한다. 화면 클릭이나 앱에 스크립트를 주입해 대체하지 않는다. MCP는 설치된 Vectora 1.0.0+의 실제 편집 엔진을 별도 세션에서 실행한다. 일반 앱 창의 미저장 문서는 MCP에 자동 연결되지 않는다. 파일을 저장한 뒤 \`vectora_open_document\` 도구를 찾아 열고 작업한다.\n\nClaude Desktop 스킬의 코드 실행 첨부 경로는 별도 작업공간일 수 있으므로 로컬 Vectora 앱이나 글꼴 파일을 읽을 수 있다고 가정하지 않는다. 현재 도구 목록에서 \`vectora_fonts\`, 노출된 경우 \`vectora_check_font\`·\`vectora_measure_text\`, 그리고 실제 스키마에 맞는 \`vectora_apply\`·\`vectora_import_svg\`를 우선 사용한다. SVG 문자열이나 data URL은 가져오기 스키마가 허용하는 형식일 때 전달한다. 코드 실행 첨부 경로를 Vectora 저장 경로로 재사용하지 말고 사용자가 지정한 실제 로컬 경로를 쓴다. Claude Code 로컬 플러그인에서는 번들된 보조 스크립트를 사용할 수 있다.\n\n현재 세션에 Vectora MCP가 보이지 않으면 연결된 것으로 간주하지 않는다. Claude 웹 채팅/클라우드 세션에는 이 로컬 실행기가 연결되지 않으므로 최종 Vectora 저장·재열기를 주장하지 말고, 사용자가 로컬 MCP를 쓸 수 있는 Claude Desktop 또는 Claude Code에서 이어가도록 안내한다.${introEnd}`;
    value = value.slice(0, start) + intro + value.slice(end + introEnd.length);
    value = value.replaceAll('이 Mac의 절대 경로', '현재 컴퓨터의 절대 경로');
    value = value.replace('설치 방법은 플러그인 루트 `README.md`와 앱 프로젝트의 `docs/MCP_INSTALLATION.md`를 참고한다.', '설치 방법은 배포 패키지의 `CLAUDE_INSTALLATION.md`를 참고한다.');
    return replaceExactlyOnce(
      value,
      '- Windows에서 MCP 실행기는 Windows PowerShell 기본 `powershell.exe`와 설치된 `Vectora.exe`를 사용한다. Node.js/Python 런타임은 필요하지 않다. 앱 경로 우선순위는 `VECTORA_APP_PATH`, `%APPDATA%\\Vectora\\mcp-app-path`, `%LOCALAPPDATA%\\Programs\\Vectora\\Vectora.exe`, `%ProgramFiles%\\Vectora\\Vectora.exe`, `%ProgramFiles(x86)%\\Vectora\\Vectora.exe`다. 사용자 지정 경로는 `scripts/configure-app.ps1 -AppPath <Vectora.exe 절대 경로>`로 저장한다. macOS는 `scripts/configure-app.sh <Vectora.app 절대 경로>` 또는 Applications 기본 위치를 사용한다.',
      '- Claude Desktop Cowork 로컬 세션과 Claude Code의 Vectora MCP는 이 컴퓨터에 설치된 앱을 실행한다. 기본 설치 위치에서 앱을 찾지 못하면 플러그인 안의 `configure-app.sh` 또는 `configure-app.ps1`을 사용한다. 마켓플레이스에 플러그인을 추가해도 Claude 일반 웹 채팅에는 로컬 MCP 실행기가 연결되지 않는다.',
      'use-vectora local app setup guidance',
    );
  });

  const examplesPath = path.join(skillRoot, 'references', 'examples.md');
  updateFile(examplesPath, (value) => replaceExactlyOnce(
    value,
    '앱 안에서 경로를 자동 탐색하는 것은 Codex 플러그인의 Windows 실행기 기능이다. 다른 MCP 클라이언트는 앱 실행 파일을 직접 등록하고 `--mcp-stdio`를 인자로 전달해야 한다.',
    'Claude용 실행기는 Windows에서 PowerShell 경로를 안전하게 전달하고 Vectora.exe와 로컬 MCP 연결을 중계한다. 사용자는 실행 파일을 직접 MCP 설정에 넣지 않는다.',
    'use-vectora/references/examples.md',
  ));
}

function adaptCreateKice(skillRoot) {
  // Keep client availability boundaries discoverable at entry; production rules are selected per task.
  const skillPath = path.join(skillRoot, 'SKILL.md');
  updateFile(skillPath, (value) => replaceExactlyOnce(
    value,
    '<!-- VECTORA_CLIENT_BOUNDARY -->',
    `<!-- VECTORA_CLIENT_BOUNDARY -->

### Claude 로컬 실행 경계

Claude에서 현재 노출된 MCP 도구 목록으로 Vectora 연결·실제 도구 이름·입력 스키마를 확인한다. 플러그인 접두사가 붙을 수 있다. 로컬 MCP는 Claude Code와 Claude Desktop Cowork 로컬 세션에서 사용하며 일반 웹/클라우드에는 자동 연결되지 않는다. MCP가 없으면 비최종 설계안만 준비하고 로컬 편집·저장·재열기·내보내기를 완료했다고 주장하지 않는다.

Claude 코드 실행 첨부 경로는 로컬 앱·글꼴 경로와 별개일 수 있다. 실제 노출된 vectora_fonts 및 제공되는 vectora_check_font/vectora_measure_text를 사용하고, SVG 문자열/data URL은 가져오기 스키마가 허용할 때만 전달한다. 첨부 경로를 Vectora 저장 경로로 재사용하지 말고 사용자가 지정한 실제 로컬 경로를 사용한다. Claude Code 로컬 플러그인에서는 번들된 보조 스크립트를 사용할 수 있다.

이 패키지는 이미지 생성 모델을 포함하지 않는다. 먼저 현재 세션에 실제 연결된 외부 이미지 생성/편집 MCP 등의 도구를 확인한다. 있으면 이번 작업에 준비된 제작·인물 지침의 해당 화풍 계약·참조 검색·배경 조건을 해당 도구의 실제 스키마에 맞춰 전달한다. 생성 결과는 실제로 열어 대상·화풍·배경을 확인하고 Vectora가 접근 가능한 로컬 파일 또는 지원되는 data URL로 가져온다. 원격 URL이나 Claude 첨부 경로를 로컬 파일 경로로 간주하지 않는다.

생성 도구 부재의 재사용 검토·생성 프롬프트·비최종 조판·미완료 보고는 작업 지침의 「새 원화와 참조 검색」 규칙을 적용한다.`,
    'create-kice-illustration/SKILL.md client boundary',
  ));
}

function stageSkill(name, stagingRoot) {
  const skillRoot = copySkillSource(name, stagingRoot);
  if (name === 'use-vectora') adaptUseVectora(skillRoot);
  else if (name === 'create-kice-illustration') adaptCreateKice(skillRoot);
  else if (name !== 'create-kice-science-illustration') throw new Error(`Unexpected skill: ${name}`);
  for (const relative of listFiles(skillRoot).filter((file) => file.endsWith('.md'))) {
    const filePath = path.join(skillRoot, relative);
    const before = readFileSync(filePath, 'utf8');
    const after = before
      .replaceAll('node skills/create-kice-illustration/scripts/', 'node scripts/')
      .replaceAll('python3 skills/create-kice-illustration/scripts/', 'python3 scripts/');
    if (after !== before) writeFileSync(filePath, after);
  }
  return skillRoot;
}

function listFiles(directory, prefix = '') {
  const result = [];
  for (const name of readdirSync(directory).sort()) {
    const fullPath = path.join(directory, name);
    const relative = prefix ? `${prefix}/${name}` : name;
    if (statSync(fullPath).isDirectory()) result.push(...listFiles(fullPath, relative));
    else result.push(relative.split(path.sep).join('/'));
  }
  return result;
}

function addProductionSources(skillRoot) {
  const productionRoot = path.join(skillRoot, 'scripts', 'production');
  mkdirSync(productionRoot, { recursive: true });
  for (const filename of ['frames-core.mjs', 'graphs-core.mjs', 'graphs-points.mjs']) {
    cpSync(path.join(PLUGIN_ROOT, 'src', 'production', filename), path.join(productionRoot, filename));
  }
  const graphBuilder = path.join(skillRoot, 'scripts', 'build_graph.mjs');
  updateFile(graphBuilder, (value) => {
    value = replaceExactlyOnce(value, "'../../../src/production/graphs-core.mjs'", "'./production/graphs-core.mjs'", 'build_graph.mjs source import');
    const oldFontSearch = `export function findFont(explicit){
  if(explicit)return explicit;
  const dir=path.join(os.homedir(),'Library','Fonts');
  const file=fs.existsSync(dir)&&fs.readdirSync(dir).find(n=>/^UNDv31-Regular\\.ttf$/i.test(n));
  check(file,'Installed UNDv31-Regular.ttf not found in ~/Library/Fonts. Supply --font; no UND v3.0 fallback is used.');
  return path.join(dir,file);
}`;
    const newFontSearch = `export function findFont(explicit){
  if(explicit)return explicit;
  const directories=[
    path.join(os.homedir(),'Library','Fonts'),
    process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Microsoft','Windows','Fonts'),
    path.join(process.env.WINDIR||'C:\\\\Windows','Fonts'),
    path.join(os.homedir(),'AppData','Local','Microsoft','Windows','Fonts'),
    path.join(os.homedir(),'.local','share','fonts'),
    '/usr/local/share/fonts',
    '/usr/share/fonts',
  ].filter(Boolean);
  for(const dir of directories){
    const file=fs.existsSync(dir)&&fs.readdirSync(dir).find(n=>/^UNDv31-Regular\\.ttf$/i.test(n));
    if(file)return path.join(dir,file);
  }
  throw new Error('Installed UNDv31-Regular.ttf not found in ~/Library/Fonts, %LOCALAPPDATA%/Microsoft/Windows/Fonts, %WINDIR%/Fonts, or standard Linux font directories. Supply --font; no UND v3.0 fallback is used.');
}`;
    return replaceExactlyOnce(value, oldFontSearch, newFontSearch, 'build_graph.mjs font lookup');
  });
  const frameBuilder = path.join(skillRoot, 'scripts', 'build_text_frame.mjs');
  updateFile(frameBuilder, (value) => replaceExactlyOnce(
    value,
    "'../../../src/production/frames-core.mjs'",
    "'./production/frames-core.mjs'",
    'build_text_frame.mjs source import',
  ));
}

function ensurePortableVendor(temporaryRoot, kiceSkill) {
  const archivePath = path.join(runtimeRoot, 'runtime-vendor.zip');
  const metadataPath = path.join(runtimeRoot, 'runtime-vendor.json');
  if (!existsSync(archivePath) || !existsSync(metadataPath)) {
    throw new Error('Missing pinned Claude helper dependencies. Run node scripts/build-claude-runtime.mjs once to create the portable vendor archive.');
  }
  const bytes = readFileSync(archivePath);
  const expected = JSON.parse(readFileSync(metadataPath, 'utf8'));
  const actualHash = createHash('sha256').update(bytes).digest('hex');
  if (actualHash !== expected.sha256 || bytes.length !== expected.bytes) {
    throw new Error('Claude helper dependency archive does not match its checked-in hash manifest.');
  }
  const unpackedRoot = path.join(temporaryRoot, 'vendor-source');
  const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
  const pythonArgs = process.platform === 'win32' ? ['-3'] : [];
  const extractedFiles = Number(execFileSync(pythonCommand, [
    ...pythonArgs,
    path.join(runtimeRoot, 'extract-vendor.py'),
    archivePath,
    unpackedRoot,
  ], { encoding: 'utf8' }).trim());
  if (extractedFiles !== expected.files) throw new Error('Claude helper dependency archive file count does not match its manifest.');
  const nodeRoot = path.join(unpackedRoot, 'node_modules');
  const pythonRoot = path.join(unpackedRoot, 'python');
  if (!existsSync(path.join(nodeRoot, 'fontkit', 'package.json'))
    || !existsSync(path.join(nodeRoot, 'imagetracerjs', 'package.json'))
    || !existsSync(path.join(pythonRoot, 'fonttools-4.63.0.dist-info', 'WHEEL'))) {
    throw new Error('Claude helper dependency archive is missing a required runtime package.');
  }
  const wheelRecord = readFileSync(path.join(pythonRoot, 'fonttools-4.63.0.dist-info', 'WHEEL'), 'utf8');
  if (!/^Tag: py3-none-any$/m.test(wheelRecord)) throw new Error('Vendored fontTools must be platform-independent.');
  cpSync(nodeRoot, path.join(kiceSkill, 'node_modules'), { recursive: true });
  cpSync(pythonRoot, path.join(kiceSkill, 'vendor', 'python'), { recursive: true });
  return { files: extractedFiles, bytes: bytes.length, sha256: actualHash };
}

function adaptAuditHelper(skillRoot) {
  const auditPath = path.join(skillRoot, 'scripts', 'audit_svg.py');
  updateFile(auditPath, (value) => {
    value = replaceExactlyOnce(
      value,
      'from pathlib import Path\n',
      "from pathlib import Path\nsys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'vendor' / 'python'))\n",
      'audit_svg.py bundled Python dependency path',
    );
    value = replaceExactlyOnce(
      value,
      "import argparse\n",
      "import argparse\nimport os\n",
      'audit_svg.py portable font search import',
    );
    return replaceExactlyOnce(
      value,
      '    anchors = [Path.home() / "Library" / "Fonts"]\n',
      `    anchors = [\n        Path.home() / "Library" / "Fonts",\n        Path.home() / "AppData" / "Local" / "Microsoft" / "Windows" / "Fonts",\n        Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts",\n        Path("/usr/share/fonts"),\n        Path("/usr/local/share/fonts"),\n    ]\n`,
      'audit_svg.py cross-platform installed font lookup',
    );
  });
}

export function buildClaudePlugin(targetRoot) {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'vectora-claude-plugin-'));
  const temporarySkills = path.join(temporaryRoot, 'skills');
  const stagedRoot = path.join(temporaryRoot, 'plugin');
  try {
    const useSkill = stageSkill('use-vectora', temporarySkills);
    const kiceSkill = stageSkill('create-kice-illustration', temporarySkills);
    const scienceSkill = stageSkill('create-kice-science-illustration', temporarySkills);
    mkdirSync(stagedRoot, { recursive: true });
    mkdirSync(path.join(stagedRoot, 'skills'), { recursive: true });
    cpSync(useSkill, path.join(stagedRoot, 'skills', 'use-vectora'), { recursive: true });
    cpSync(kiceSkill, path.join(stagedRoot, 'skills', 'create-kice-illustration'), { recursive: true });
    cpSync(scienceSkill, path.join(stagedRoot, 'skills', 'create-kice-science-illustration'), { recursive: true });
    addProductionSources(path.join(stagedRoot, 'skills', 'create-kice-illustration'));

    const scriptsRoot = path.join(stagedRoot, 'scripts');
    mkdirSync(path.join(scriptsRoot, 'claude'), { recursive: true });
    for (const filename of ['configure-app.sh', 'configure-app.ps1', 'start-mcp.sh', 'start-mcp.ps1']) {
      cpSync(path.join(PLUGIN_ROOT, 'scripts', filename), path.join(scriptsRoot, filename));
    }
    cpSync(
      path.join(PLUGIN_ROOT, 'scripts', 'claude', 'claude-mcp-launcher.mjs'),
      path.join(scriptsRoot, 'claude', 'claude-mcp-launcher.mjs'),
    );
    cpSync(
      path.join(PLUGIN_ROOT, 'scripts', 'claude', 'trace_artwork.mjs'),
      path.join(stagedRoot, 'skills', 'create-kice-illustration', 'scripts', 'trace_artwork.mjs'),
    );
    adaptAuditHelper(path.join(stagedRoot, 'skills', 'create-kice-illustration'));
    const dependencyPayload = ensurePortableVendor(
      temporaryRoot,
      path.join(stagedRoot, 'skills', 'create-kice-illustration'),
    );

    mkdirSync(path.join(stagedRoot, '.claude-plugin'), { recursive: true });
    writeFileSync(path.join(stagedRoot, '.claude-plugin', 'plugin.json'), `${JSON.stringify({
      name: 'vectora',
      version: PLUGIN_VERSION,
      description: 'Vectora MCP and three illustration skills. App 2.0 integrates (가)–(하) into UND v3.1 Main/Batang and supports four text presets, percentage leading, and unified paragraph anchoring. Check the live schema before using new fields.',
      author: { name: 'Vectora' },
    }, null, 2)}\n`);
    writeFileSync(path.join(stagedRoot, '.mcp.json'), `${JSON.stringify({
      mcpServers: {
        vectora: {
          type: 'stdio',
          command: 'node',
          args: ['${CLAUDE_PLUGIN_ROOT}/scripts/claude/claude-mcp-launcher.mjs'],
        },
      },
    }, null, 2)}\n`);
    cpSync(path.join(PLUGIN_ROOT, 'CLAUDE_INSTALLATION.md'), path.join(stagedRoot, 'CLAUDE_INSTALLATION.md'));

    mkdirSync(path.dirname(targetRoot), { recursive: true });
    cpSync(stagedRoot, targetRoot, { recursive: true });
    return { version: PLUGIN_VERSION, dependencyPayload };
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}
