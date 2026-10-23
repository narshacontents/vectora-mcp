// Review only the explicitly supported native display-text paths. Never rewrite input.
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const supportedKinds = new Set(['text', 'composition', 'table', 'graph', 'dialogue', 'schematic']);
const coordinateSchematicLayouts = new Set(['sequential', 'shared', 'crossing', 'shared-results', 'relations']);
const flowRowLayoutKeys = new Set(['version', 'xPolicy', 'horizontalGapMm', 'verticalGapMm', 'rows']);
const markerChars = new Set(['○', '△', '□', '☆']);
const binaryOperatorChars = new Set(['×', '+', '=', '−', '-']);
// Allow Hangul continuations after the fixed noun set while excluding Latin, numeric, and identifier continuations.
const limitedLatinCategoryLabel = /(?<![\p{L}\p{N}_$])([A-Z](?:~[A-Z])?)([\t \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]*)(지역|펀드|주식)(?![\p{Script=Latin}\p{N}_$])/gu;

function isSupportedFlowRowLayoutV2(spec) {
  const config = spec.rowLayout;
  if (spec.layout !== 'relations' || !isRecord(config) || config.version !== 2 || config.xPolicy !== 'preserve' ||
      Object.keys(config).some(key => !flowRowLayoutKeys.has(key)) ||
      !Number.isFinite(config.horizontalGapMm) || config.horizontalGapMm <= 0 ||
      !Number.isFinite(config.verticalGapMm) || config.verticalGapMm <= 0 ||
      !Array.isArray(config.rows) || !config.rows.length || config.rows.length > 100 ||
      spec.sequentialOptions !== undefined || spec.gapMm !== undefined ||
      (spec.edges !== undefined && (!Array.isArray(spec.edges) || spec.edges.length > 300))) return false;

  const nodeIds = new Set();
  if (!Array.isArray(spec.nodes) || !spec.nodes.length || spec.nodes.length > 100 || spec.nodes.some(node => {
    if (!isRecord(node) || typeof node.id !== 'string' || !node.id || nodeIds.has(node.id) || typeof node.text !== 'string' ||
        ![undefined, 'rect', 'diamond', 'document'].includes(node.shape) ||
        ['yMm', 'level', 'lane', 'side', 'affiliation'].some(key => node[key] !== undefined)) return true;
    nodeIds.add(node.id);
    return false;
  })) return false;

  const rowIds = new Set(), membership = new Set();
  for (const row of config.rows) {
    if (!isRecord(row) || typeof row.id !== 'string' || !row.id || rowIds.has(row.id) ||
        Object.keys(row).some(key => !['id', 'nodeIds'].includes(key)) ||
        !Array.isArray(row.nodeIds) || !row.nodeIds.length) return false;
    rowIds.add(row.id);
    for (const id of row.nodeIds) {
      if (typeof id !== 'string' || !nodeIds.has(id) || membership.has(id)) return false;
      membership.add(id);
    }
  }
  return membership.size === nodeIds.size;
}

function overlaps(ranges, start, end) {
  return ranges.some(([from, to]) => start < to && end > from);
}

function addRange(ranges, start, end) {
  if (end > start) ranges.push([start, end]);
}

function codeRanges(text, value) {
  const ranges = [];
  if (isRecord(value) && (
    value.code === true || value.isCode === true || value.type === 'code' ||
    value.kind === 'code' || value.format === 'code'
  )) addRange(ranges, 0, text.length);

  // URL tokens and explicitly marked Markdown code are not prose spacing evidence.
  const urls = /(?:\b[A-Za-z][A-Za-z0-9+.-]*:\/\/|\b(?:www\.|mailto:|tel:|data:)|\/\/)[^\s<>"']+/giu;
  for (const match of text.matchAll(urls)) addRange(ranges, match.index, match.index + match[0].length);

  const fences = /```[\s\S]*?(?:```|$)/g;
  for (const match of text.matchAll(fences)) addRange(ranges, match.index, match.index + match[0].length);

  // Inline backtick runs are explicit code spans when a matching delimiter is present.
  for (let i = 0; i < text.length;) {
    if (text[i] !== '`') { i++; continue; }
    let runEnd = i + 1;
    while (text[runEnd] === '`') runEnd++;
    const marker = text.slice(i, runEnd);
    let search = runEnd;
    let close = -1;
    while (search < text.length) {
      const candidate = text.indexOf('`', search);
      if (candidate < 0) break;
      let candidateEnd = candidate + 1;
      while (text[candidateEnd] === '`') candidateEnd++;
      if (candidateEnd - candidate === marker.length && !text.slice(Math.max(0, candidate - 1), candidate).endsWith('\\')) {
        close = candidateEnd;
        break;
      }
      search = candidateEnd;
    }
    if (close >= 0) {
      addRange(ranges, i, close);
      i = close;
    } else i = runEnd;
  }

  return ranges;
}

function excerpt(text, offset) {
  const start = Math.max(0, offset - 24);
  const end = Math.min(text.length, offset + 36);
  return text.slice(start, end);
}

function isHorizontalSpace(character) {
  return character !== undefined && /[\t \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/u.test(character);
}

function isHangulAt(text, offset) {
  if (offset >= text.length) return false;
  const point = String.fromCodePoint(text.codePointAt(offset));
  return /\p{Script=Hangul}/u.test(point);
}

function previousCodePoint(text, offset) {
  let start = offset - 1;
  const last = text.charCodeAt(start);
  if (last >= 0xDC00 && last <= 0xDFFF && start > 0) start--;
  return {start, char: text.slice(start, offset)};
}

function nextCodePoint(text, offset) {
  const point = text.codePointAt(offset);
  if (point === undefined) return null;
  const end = offset + (point > 0xFFFF ? 2 : 1);
  return {end, char: text.slice(offset, end)};
}

function isWordCodePoint(character) {
  return character !== undefined && /^[\p{L}\p{N}\p{M}_$]$/u.test(character);
}

function isLikelyMathLine(text) {
  const expression = text.trim();
  if (!expression || /\p{Script=Hangul}/u.test(expression)) return false;
  const operands = expression.match(/[\p{L}\p{N}_]+/gu) ?? [];
  const isMathToken = token => /^\p{N}+$/u.test(token) || /^\p{L}$/u.test(token) ||
    /^\p{N}+\p{L}$/u.test(token) || /^\p{L}\p{N}+$/u.test(token) || /^(?:sin|cos|tan|log|ln|sqrt)$/iu.test(token);
  if (operands.length < 2 || !operands.every(isMathToken)) return false;
  const hasOperator = Array.from(expression).some(character => '=+×*/%°‰−<>-^√≤≥≠'.includes(character));
  if (!hasOperator && !operands.some(token => /^(?:sin|cos|tan|log|ln|sqrt)$/iu.test(token))) return false;
  return Array.from(expression).every(character =>
    isWordCodePoint(character) || isHorizontalSpace(character) || '()[]{}.,+-−=×*/%°‰^√∠≤≥≠'.includes(character)
  );
}

function operandBefore(text, offset) {
  let end = offset;
  while (end > 0 && isHorizontalSpace(text[end - 1])) end--;
  if (!end) return null;

  const last = previousCodePoint(text, end);
  if (isWordCodePoint(last.char)) {
    let start = last.start;
    while (start > 0) {
      const previous = previousCodePoint(text, start);
      if (!isWordCodePoint(previous.char)) break;
      start = previous.start;
    }
    return {start, end, text: text.slice(start, end)};
  }
  if (')]}%°‰'.includes(last.char)) return {start: last.start, end, text: last.char};
  return null;
}

function operandAfter(text, offset) {
  let start = offset;
  while (isHorizontalSpace(text[start])) start++;
  if (start >= text.length) return null;

  let operandStart = start;
  let first = nextCodePoint(text, start);
  if (['+', '-', '−'].includes(first.char)) {
    operandStart = first.end;
    while (isHorizontalSpace(text[operandStart])) operandStart++;
    first = nextCodePoint(text, operandStart);
    if (!first) return null;
  }

  if (isWordCodePoint(first.char)) {
    let end = first.end;
    while (end < text.length) {
      const next = nextCodePoint(text, end);
      if (!isWordCodePoint(next.char)) break;
      end = next.end;
    }
    return {start, end, text: text.slice(start, end), baseText: text.slice(operandStart, end)};
  }
  if ('([{'.includes(first.char)) {
    return {start, end: first.end, text: text.slice(start, first.end), baseText: first.char};
  }
  return null;
}

function clauseBounds(text, offset) {
  const separators = /[,;\n]/g;
  let start = 0;
  let end = text.length;
  for (const match of text.matchAll(separators)) {
    if (match.index < offset) start = match.index + match[0].length;
    else { end = match.index; break; }
  }
  return [start, end];
}

function isCompoundOperator(text, offset, operator) {
  const before = text[offset - 1];
  const after = text[offset + 1];
  if (operator === '=' && /[=<>!+−×*/-]/u.test(before ?? '')) return true;
  if (operator === '=' && /[=>]/u.test(after ?? '')) return true;
  if (operator === '+' && /[+=]/u.test(before ?? '')) return true;
  if (operator === '+' && /[+=]/u.test(after ?? '')) return true;
  if (operator === '×' && /[×*=]/u.test(before ?? '')) return true;
  if (operator === '×' && /[×*=]/u.test(after ?? '')) return true;
  if (operator === '-' && /[-<>+=]/u.test(before ?? '')) return true;
  if (operator === '-' && /[-=>+]/u.test(after ?? '')) return true;
  if (operator === '−' && /[=+×*/]/u.test(before ?? '')) return true;
  if (operator === '−' && /[=+×*/]/u.test(after ?? '')) return true;
  return false;
}

function isNumericToken(token) {
  return /^\p{N}+(?:[.,]\p{N}+)*$/u.test(token);
}

function isSingleLatinVariable(token) {
  return /^[A-Za-z]$/u.test(token);
}

function isClearBinaryOperator(text, offset, operator, left, right) {
  if (operator !== '-' && operator !== '−') return true;

  const rightText = right.baseText ?? right.text;
  const leftNumber = isNumericToken(left.text);
  const rightNumber = isNumericToken(rightText);
  const leftVariable = isSingleLatinVariable(left.text);
  const rightVariable = isSingleLatinVariable(rightText);
  const clearlyMathematicalOperands = (leftNumber && rightNumber) ||
    (leftVariable && (rightVariable || rightNumber)) || (leftNumber && rightVariable);
  if (operator === '−') return clearlyMathematicalOperands;

  const beforeGap = text.slice(left.end, offset);
  const afterGap = text.slice(offset + 1, right.start);
  // A hyphen-minus needs visible separation to distinguish subtraction from identifiers and ranges.
  if (!beforeGap || !afterGap) return false;
  if (leftNumber && rightNumber) {
    const [start, end] = clauseBounds(text, offset);
    return /=/.test(text.slice(start, end));
  }
  if (/\p{N}/u.test(left.text) && /\p{L}/u.test(left.text)) return false;
  if (/\p{N}/u.test(rightText) && /\p{L}/u.test(rightText)) return false;
  return (leftVariable && (rightVariable || rightNumber)) || (leftNumber && rightVariable);
}

export function inspectDisplayText(spec, rootPath = 'spec') {
  const inspectedPaths = [];
  const inspectedSet = new Set();
  const skippedPaths = [];
  const warnings = [];
  const warningBySource = new Map();
  const active = new WeakSet();

  function addInspected(path) {
    if (!inspectedSet.has(path)) {
      inspectedSet.add(path);
      inspectedPaths.push(path);
    }
  }

  function addWarning(warning, ownerPath, sourceText) {
    // Duplicate text/richText aliases in one visible object share one review item.
    const key = [ownerPath, warning.ruleId, warning.offset, warning.missing.join(','), sourceText].join('\0');
    const prior = warningBySource.get(key);
    if (prior) {
      if (prior.path !== warning.path && !prior.alsoPaths.includes(warning.path)) prior.alsoPaths.push(warning.path);
      return;
    }
    const entry = {...warning, alsoPaths: []};
    warningBySource.set(key, entry);
    warnings.push(entry);
  }

  function reviewCircleListMarkers(text, path, ownerPath, ignored) {
    for (let paragraphStart = 0; paragraphStart <= text.length;) {
      const newline = text.indexOf('\n', paragraphStart);
      const rawEnd = newline < 0 ? text.length : newline;
      const lineEnd = rawEnd > paragraphStart && text[rawEnd - 1] === '\r' ? rawEnd - 1 : rawEnd;
      let markerStart = paragraphStart;
      while (markerStart < lineEnd && isHorizontalSpace(text[markerStart])) markerStart++;

      if (text[markerStart] === '○') {
        let contentStart = markerStart + 1;
        if (isHorizontalSpace(text[contentStart])) {
          while (contentStart < lineEnd && isHorizontalSpace(text[contentStart])) contentStart++;
          const content = text.slice(contentStart, lineEnd);
          const hasText = /[\p{L}\p{N}]/u.test(content);
          const startsWithAnotherMarker = markerChars.has(content[0]) || content[0] === '￮';
          if (hasText && !startsWithAnotherMarker && !isLikelyMathLine(content) &&
              !overlaps(ignored, markerStart, lineEnd)) {
            addWarning({
              ruleId: 'circle-list-marker-review',
              path,
              offset: markerStart,
              excerpt: excerpt(text, markerStart),
              missing: ['small-empty-circle-U+FFEE-if-list-marker'],
              message: '문단 첫머리의 ○가 목록 표식인지 제작자가 확인하세요.',
              action: 'creator-review',
            }, ownerPath, text);
          }
        }
      }

      if (newline < 0) break;
      paragraphStart = newline + 1;
    }
  }

  function scanString(text, path, ownerPath, value) {
    addInspected(path);
    if (!text) return;
    const ignored = codeRanges(text, value);

    // Deliberately limited to explicit label/type examples; this is not a Korean noun guesser.
    for (const match of text.matchAll(limitedLatinCategoryLabel)) {
      const [whole, label, separator] = match;
      const offset = match.index + label.length;
      if (separator === '\u2002' || overlaps(ignored, match.index, match.index + whole.length)) continue;
      addWarning({
        ruleId: 'limited-latin-region-fund-stock-label-half-space',
        path,
        offset,
        excerpt: excerpt(text, offset),
        missing: ['between-label-and-kind-U+2002'],
        message: '지역·펀드·주식의 제한된 알파벳 이름표 조합에서 U+2002 반칸을 제작자가 확인하세요.',
        action: 'creator-review',
      }, ownerPath, text);
    }

    for (let i = 0; i < text.length; i++) {
      if (text[i] !== ':' || overlaps(ignored, i, i + 1)) continue;
      const missing = [];
      if (text[i - 1] !== '\u2002') missing.push('before-U+2002');
      if (text[i + 1] !== ' ') missing.push('after-U+0020');
      if (!missing.length) continue;
      addWarning({
        ruleId: 'display-colon-spacing',
        path,
        offset: i,
        excerpt: excerpt(text, i),
        missing,
        message: '표시용 콜론 주변 간격을 제작자가 확인하세요.',
        action: 'creator-review',
      }, ownerPath, text);
    }

    for (let i = 0; i < text.length; i++) {
      const operator = text[i];
      if (!binaryOperatorChars.has(operator) || overlaps(ignored, i, i + 1) || isCompoundOperator(text, i, operator)) continue;
      const left = operandBefore(text, i);
      const right = operandAfter(text, i + 1);
      if (!left || !right || overlaps(ignored, left.start, left.end) || overlaps(ignored, right.start, right.end)) continue;
      if (!isClearBinaryOperator(text, i, operator, left, right)) continue;

      const missing = [];
      if (text.slice(left.end, i) !== '\u2002') missing.push('before-one-U+2002');
      if (text.slice(i + 1, right.start) !== '\u2002') missing.push('after-one-U+2002');
      if (!missing.length) continue;
      addWarning({
        ruleId: 'display-binary-operator-spacing',
        path,
        offset: i,
        excerpt: excerpt(text, i),
        missing,
        message: '명확한 이항 연산자 양쪽의 U+2002 한 칸을 제작자가 확인하세요.',
        action: 'creator-review',
      }, ownerPath, text);
    }

    reviewCircleListMarkers(text, path, ownerPath, ignored);

    for (let i = 0; i < text.length; i++) {
      if (!markerChars.has(text[i])) continue;
      const start = i;
      const internalGaps = [];
      let cursor = i;
      let markerCount = 0;

      while (cursor < text.length) {
        if (markerChars.has(text[cursor])) {
          markerCount++;
          cursor++;
          continue;
        }
        if (isHorizontalSpace(text[cursor])) {
          const gapStart = cursor;
          let afterGap = cursor;
          while (isHorizontalSpace(text[afterGap])) afterGap++;
          if (markerChars.has(text[afterGap])) {
            internalGaps.push(gapStart);
            cursor = afterGap;
            continue;
          }
          cursor = gapStart;
        }
        break;
      }

      const groupEnd = cursor;
      let boundaryEnd = cursor;
      while (isHorizontalSpace(text[boundaryEnd])) boundaryEnd++;
      const hasHangulLabel = isHangulAt(text, boundaryEnd);
      if (markerCount > 0 && hasHangulLabel) {
        const missing = [];
        if (internalGaps.length) missing.push('contiguous-symbol-group');
        const separator = text.slice(groupEnd, boundaryEnd);
        if (separator !== '\u2002') missing.push('between-symbol-group-and-Hangul-U+2002');
        if (missing.length && !overlaps(ignored, start, boundaryEnd + 1)) {
          const offset = internalGaps[0] ?? groupEnd;
          addWarning({
            ruleId: 'symbol-label-half-space',
            path,
            offset,
            excerpt: excerpt(text, offset),
            missing,
            message: '기호 묶음은 붙이고, 한글 설명 앞의 U+2002를 제작자가 확인하세요.',
            action: 'creator-review',
          }, ownerPath, text);
        }
      }
      if (cursor > i) i = cursor - 1;
    }
  }

  function inspectValue(value, path, ownerPath = path) {
    if (typeof value === 'string') {
      scanString(value, path, ownerPath, value);
    } else if (isRecord(value) && typeof value.text === 'string') {
      scanString(value.text, `${path}.text`, ownerPath, value);
    }
  }

  function inspectTextBlock(block, path, depth) {
    if (!isRecord(block)) return;
    if (block.type === 'text') {
      inspectValue(block.text, `${path}.text`, path);
    } else if (block.type === 'graph') {
      if (isRecord(block.graph)) visit(block.graph, `${path}.graph`, depth + 1);
      else skippedPaths.push({path: `${path}.graph`, kind: 'graph', reason: 'missing-native-spec'});
    } else if (block.type === 'component' && block.spec !== undefined) {
      visit(block.spec, `${path}.spec`, depth + 1);
    }
  }

  function inspectFormulaPart(part, path) {
    if (!isRecord(part)) return;
    inspectValue(part.text, `${path}.text`, path);
    if (isRecord(part.richText) && typeof part.richText.text === 'string') {
      inspectValue(part.richText.text, `${path}.richText.text`, path);
    }
  }

  function inspectSchematicFormula(spec, path) {
    if (!isRecord(spec.formula) || !Array.isArray(spec.formula.items)) return;
    spec.formula.items.forEach((item, index) => {
      const itemPath = `${path}.formula.items[${index}]`;
      if (item?.kind === 'text') inspectFormulaPart(item, itemPath);
      else if (item?.kind === 'fraction') {
        inspectFormulaPart(item.numerator, `${itemPath}.numerator`);
        inspectFormulaPart(item.denominator, `${itemPath}.denominator`);
      }
    });
  }

  function inspectSchematic(spec, path) {
    if (spec.layout === 'formula') {
      inspectSchematicFormula(spec, path);
      return;
    }

    const layout = spec.layout ?? 'sequential';
    if (!coordinateSchematicLayouts.has(layout)) {
      skippedPaths.push({path, kind: 'schematic', reason: 'unsupported-schematic-layout'});
      return;
    }

    const rowLayout = spec.rowLayout !== undefined;
    if (rowLayout && (layout !== 'relations' || !isRecord(spec.rowLayout))) {
      skippedPaths.push({path, kind: 'schematic', reason: 'unsupported-schematic-row-layout'});
      return;
    }
    const flowRowLayoutV2 = rowLayout && isSupportedFlowRowLayoutV2(spec);

    if (Array.isArray(spec.nodes)) spec.nodes.forEach((node, index) => {
      if (!isRecord(node)) return;
      const nodePath = `${path}.nodes[${index}]`;
      // buildSchematic passes node.text last; richText is formatting and cannot
      // replace the rendered literal. Row layouts use node.text directly too.
      if (typeof node.text === 'string') inspectValue(node.text, `${nodePath}.text`, nodePath);
      if (!rowLayout && typeof node.affiliation === 'string' && node.affiliation.trim()) {
        inspectValue(node.affiliation, `${nodePath}.affiliation`, nodePath);
      }
    });

    if (rowLayout) {
      skippedPaths.push({path: `${path}.rowLayout`, kind: 'schematic', reason: 'mode-specific-display-fields-out-of-scope'});
      if (!flowRowLayoutV2) return;
    }

    if (Array.isArray(spec.edges)) spec.edges.forEach((edge, index) => {
      if (!isRecord(edge) || typeof edge.label !== 'string' || !edge.label.trim()) return;
      const edgePath = `${path}.edges[${index}]`;
      inspectValue(edge.label, `${edgePath}.label`, edgePath);
    });
  }

  function inspectStringArray(values, path) {
    if (Array.isArray(values)) values.forEach((value, index) => inspectValue(value, `${path}[${index}]`));
  }

  function inspectLabelItems(values, path) {
    if (Array.isArray(values)) values.forEach((value, index) => {
      if (isRecord(value)) inspectValue(value.label, `${path}[${index}].label`);
    });
  }

  function inspectGraph(graph, path) {
    // Keep this list aligned with the native display fields in electron/graph-discovery.cjs.
    const graphTypes = new Set(['bar', 'line', 'points', 'pie', 'surface']);
    if (!graphTypes.has(graph.type)) {
      skippedPaths.push({path, kind: 'graph', reason: 'unsupported-graph-type'});
      return;
    }

    addInspected(path);
    const options = isRecord(graph.chartOptions) ? graph.chartOptions : {};
    const type = graph.type;
    const hasAxes = type !== 'pie';
    const legendVisible = graph.legend !== 'none';
    const semanticLabels = options.semanticLabels === 'end' || options.semanticLabels === 'legend';
    const seriesLabelsVisible = graph.layout === 'mirror' || legendVisible || semanticLabels || options.lineEndLabels === true ||
      options.categoryLegend === true || graph.mosaic?.cellLabelMode === 'series-name';
    const categoryLabelsVisible = options.showCategoryLabels !== false;

    if (type === 'surface') {
      inspectValue(graph.title, `${path}.title`);
      inspectValue(graph.xTitle, `${path}.xTitle`);
      inspectValue(graph.yTitle, `${path}.yTitle`);
      inspectValue(graph.zTitle, `${path}.zTitle`);
      return;
    }

    inspectValue(options.title, `${path}.chartOptions.title`);
    inspectValue(options.note, `${path}.chartOptions.note`);

    if (hasAxes) {
      if (options.showXAxis !== false) {
        inspectValue(graph.xTitle, `${path}.xTitle`);
        inspectValue(graph.xUnit, `${path}.xUnit`);
      }
      if (options.showYAxis !== false) {
        inspectValue(graph.yTitle, `${path}.yTitle`);
        inspectValue(graph.unit, `${path}.unit`);
        inspectValue(graph.yUnit, `${path}.yUnit`);
      }
    }

    const hasSecondaryAxis = options.secondaryDomain !== undefined ||
      (Array.isArray(graph.series) && graph.series.some(series => isRecord(series) && series.axis === 'secondary'));
    if (hasSecondaryAxis) inspectValue(options.secondaryTitle, `${path}.chartOptions.secondaryTitle`);

    const hasSizeLegend = Array.isArray(options.sizeLegend) && options.sizeLegend.length > 0;
    const legendTitleVisible = legendVisible || options.categoryLegend === true || options.semanticLabels === 'legend';
    if (legendTitleVisible) inspectValue(options.legendTitle, `${path}.chartOptions.legendTitle`);
    if (hasSizeLegend) inspectValue(options.sizeLegendTitle, `${path}.chartOptions.sizeLegendTitle`);
    if (hasSizeLegend) inspectLabelItems(options.sizeLegend, `${path}.chartOptions.sizeLegend`);

    const categoryStyle = graph.chartStyle;
    const categoriesAreDisplayLabels = (type === 'bar' || type === 'line') && categoryStyle !== 'mosaic';
    const hasRadarLabelOverride = categoryStyle === 'radar' && Array.isArray(options.radarAxisLabels);
    if (categoriesAreDisplayLabels && categoryLabelsVisible && !hasRadarLabelOverride) {
      inspectStringArray(graph.categories, `${path}.categories`);
      if (type === 'line' && categoryStyle === undefined) inspectStringArray(graph.x, `${path}.x`);
    }
    if (categoryStyle === 'radar' && categoryLabelsVisible) {
      inspectStringArray(options.radarAxisLabels, `${path}.chartOptions.radarAxisLabels`);
    }

    inspectLabelItems(options.annotations, `${path}.chartOptions.annotations`);
    inspectLabelItems(options.horizontalReferences, `${path}.chartOptions.horizontalReferences`);
    if (categoryLabelsVisible) inspectLabelItems(options.categoryGroups, `${path}.chartOptions.categoryGroups`);

    if (Array.isArray(graph.panels) && (type === 'pie' || graph.layout === 'mirror' || graph.layout === 'panels')) {
      inspectLabelItems(graph.panels, `${path}.panels`);
    }
    if (categoryStyle === 'mosaic' && isRecord(graph.mosaic)) {
      inspectLabelItems(graph.mosaic.columns, `${path}.mosaic.columns`);
    }

    if (Array.isArray(graph.series)) graph.series.forEach((series, index) => {
      if (!isRecord(series)) return;
      const seriesPath = `${path}.series[${index}]`;
      if (seriesLabelsVisible) inspectValue(series.label, `${seriesPath}.label`);
      if (graph.layout !== 'mirror' && graph.valueLabels !== false) inspectStringArray(series.labels, `${seriesPath}.labels`);
      if (Array.isArray(series.points)) series.points.forEach((point, pointIndex) => {
        if (isRecord(point)) inspectValue(point.label, `${seriesPath}.points[${pointIndex}].label`);
      });
    });
  }

  function visit(current, path, depth = 0) {
    if (!isRecord(current) || typeof current.kind !== 'string') return;
    if (!supportedKinds.has(current.kind)) {
      skippedPaths.push({path, kind: current.kind});
      return;
    }
    if (depth > 32 || active.has(current)) {
      skippedPaths.push({path, kind: current.kind, reason: 'cycle-or-depth-limit'});
      return;
    }
    active.add(current);

    if (current.kind === 'graph') {
      inspectGraph(current, path);
    } else if (current.kind === 'text') {
      for (const key of ['title', 'body']) inspectValue(current[key], `${path}.${key}`);
      for (const key of ['masthead', 'date']) inspectValue(current.background?.[key], `${path}.background.${key}`);
      if (Array.isArray(current.blocks)) current.blocks.forEach((block, index) => inspectTextBlock(block, `${path}.blocks[${index}]`, depth));
    } else if (current.kind === 'composition') {
      if (Array.isArray(current.children)) current.children.forEach((child, index) => {
        if (!isRecord(child)) return;
        const childPath = `${path}.children[${index}]`;
        inspectValue(child.text, `${childPath}.text`, childPath);
        inspectValue(child.richText, `${childPath}.richText`, childPath);
        if (child.spec !== undefined) visit(child.spec, `${childPath}.spec`, depth + 1);
      });
    } else if (current.kind === 'table') {
      if (Array.isArray(current.cells)) current.cells.forEach((cell, index) => {
        if (!isRecord(cell)) return;
        const cellPath = `${path}.cells[${index}]`;
        inspectValue(cell.text, `${cellPath}.text`, cellPath);
        inspectValue(cell.richText, `${cellPath}.richText`, cellPath);
        if (cell.content !== undefined) visit(cell.content, `${cellPath}.content`, depth + 1);
      });
    } else if (current.kind === 'dialogue') {
      if (Array.isArray(current.speakers)) current.speakers.forEach((speaker, index) => {
        if (!isRecord(speaker)) return;
        const speakerPath = `${path}.speakers[${index}]`;
        inspectValue(speaker.label, `${speakerPath}.label`);
        inspectValue(speaker.labelRichText, `${speakerPath}.labelRichText`);
      });
      if (Array.isArray(current.turns)) current.turns.forEach((turn, index) => {
        if (!isRecord(turn)) return;
        const turnPath = `${path}.turns[${index}]`;
        inspectValue(turn.text, `${turnPath}.text`);
        inspectValue(turn.richText, `${turnPath}.richText`);
      });
      inspectValue(current.screenText, `${path}.screenText`);
      inspectValue(current.screenRichText, `${path}.screenRichText`);
      if (current.screenGraph !== undefined) visit(current.screenGraph, `${path}.screenGraph`, depth + 1);
      if (current.screenComponent !== undefined) visit(current.screenComponent, `${path}.screenComponent`, depth + 1);
    } else if (current.kind === 'schematic') {
      inspectSchematic(current, path);
    }

    active.delete(current);
  }

  visit(spec, rootPath);
  for (const warning of warnings) if (!warning.alsoPaths.length) delete warning.alsoPaths;
  return {
    blocking: false,
    autoFixApplied: false,
    warnings,
    scope: {
      inspectedPaths,
      skippedPaths,
      offsetUnit: 'zero-based UTF-16 code units',
      boundary: 'Only inspectedPaths were checked for spacing; this is not native-spec validation and does not establish that uninspected fields are valid. Native graph specs are limited to schema-defined visible display text: surface and chart titles, axis titles and units, visible category and series labels, and supported panel, point, legend, annotation, reference, and group labels. Native coordinate schematic specs are limited to nodes[i].text (the rendered literal; richText supplies formatting and node.text takes precedence), node affiliations and edge labels in coordinate layouts without rowLayout, and edge labels when layout is relations with a supported rowLayout.version 2 configuration. Row-layout node affiliations, rowLayout title/caption, and other mode-specific display fields were not inspected. Native schematic formula specs remain limited to formula item text and fraction numerator/denominator text, including their richText.text aliases. Timeline, periods, Venn, and other mode-specific schematic display fields are skipped. IDs, metadata, raw source/provenance, numeric data, arbitrary fields, hidden labels, and unsupported native kinds or nested paths were not inspected. Recognized URL tokens and explicitly marked code spans were excluded from spacing checks.',
    },
  };
}
