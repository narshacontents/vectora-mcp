// Shared recognizers for the visible-text subset of native schematic contracts.
// These guards select supported paths; they do not validate native specs.
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const timelineKeys = new Set(['version', 'spacing', 'events', 'appearance', 'showTimes', 'startExtensionMm', 'endExtensionMm', 'intervals']);
const timelineEventKeys = new Set(['id', 'time', 'label', 'timeLabel']);
const timelineIntervalKeys = new Set(['id', 'from', 'to', 'label']);
const periodsKeys = new Set(['version', 'spacing', 'boundaries', 'rows', 'strokePt', 'guideStrokePt']);
const periodBoundaryKeys = new Set(['id', 'time', 'labelAfter']);
const periodRowKeys = new Set(['id', 'label', 'intervals']);
const periodIntervalKeys = new Set(['id', 'from', 'to', 'label']);
const stableSchematicId = value => typeof value === 'string' && /^[A-Za-z0-9._:-]{1,100}$/.test(value);
const literalText = (value, max = 2000) => typeof value === 'string' && !!value.trim() && value.length <= max;

export function isSupportedTimelineV1(spec) {
  const timeline = spec.timeline;
  if (!isRecord(timeline) || timeline.version !== 1 || !['sequence', 'proportional'].includes(timeline.spacing) ||
      timeline.appearance !== undefined && !['pin', 'band'].includes(timeline.appearance) ||
      Object.keys(timeline).some(key => !timelineKeys.has(key)) ||
      timeline.showTimes !== undefined && typeof timeline.showTimes !== 'boolean' ||
      !Array.isArray(timeline.events) || timeline.events.length < (timeline.appearance === 'band' ? 2 : 1) || timeline.events.length > 32 ||
      ['nodes', 'edges', 'rowLayout', 'sequentialOptions', 'venn', 'sets', 'regions', 'gapMm'].some(key => spec[key] !== undefined)) return false;

  const width = spec.widthMm ?? 108;
  if (typeof width !== 'number' || !Number.isFinite(width) || width < 30 || width > 108) return false;
  const band = timeline.appearance === 'band';
  if (!band && ['showTimes', 'startExtensionMm', 'endExtensionMm', 'intervals'].some(key => timeline[key] !== undefined)) return false;
  for (const key of ['startExtensionMm', 'endExtensionMm']) {
    if (timeline[key] !== undefined && (typeof timeline[key] !== 'number' || !Number.isFinite(timeline[key]) || timeline[key] < .5 || timeline[key] > 20)) return false;
  }

  const ids = new Set();
  for (const [index, event] of timeline.events.entries()) {
    if (!isRecord(event) || Object.keys(event).some(key => !timelineEventKeys.has(key)) ||
        !stableSchematicId(event.id) || ids.has(event.id) || !literalText(event.label) ||
        !(band && event.time === undefined || typeof event.time === 'number' && Number.isFinite(event.time) || literalText(event.time, 200)) ||
        event.timeLabel !== undefined && !literalText(event.timeLabel, 200)) return false;
    ids.add(event.id);
    if (timeline.spacing === 'proportional' &&
        (typeof event.time !== 'number' || index > 0 && event.time <= timeline.events[index - 1].time)) return false;
  }
  if (timeline.spacing === 'proportional' && timeline.events.length > 1 &&
      !Number.isFinite(timeline.events.at(-1).time - timeline.events[0].time)) return false;

  if (timeline.intervals !== undefined) {
    if (!band || !Array.isArray(timeline.intervals) || timeline.intervals.length > timeline.events.length - 1) return false;
    const intervalIds = new Set(), starts = new Set();
    for (const interval of timeline.intervals) {
      if (!isRecord(interval) || Object.keys(interval).some(key => !timelineIntervalKeys.has(key)) ||
          !stableSchematicId(interval.id) || intervalIds.has(interval.id) || !literalText(interval.label)) return false;
      const index = timeline.events.findIndex(event => event.id === interval.from);
      if (typeof interval.from !== 'string' || typeof interval.to !== 'string' || index < 0 ||
          timeline.events[index + 1]?.id !== interval.to || starts.has(interval.from)) return false;
      intervalIds.add(interval.id);
      starts.add(interval.from);
    }
  }
  return true;
}

export function isSupportedPeriodsV1(spec) {
  const periods = spec.periods;
  if (!isRecord(periods) || periods.version !== 1 || !['sequence', 'proportional'].includes(periods.spacing) ||
      Object.keys(periods).some(key => !periodsKeys.has(key)) ||
      ['timeline', 'nodes', 'edges', 'rowLayout', 'sequentialOptions', 'venn', 'sets', 'regions', 'gapMm'].some(key => spec[key] !== undefined) ||
      !Array.isArray(periods.boundaries) || periods.boundaries.length < 2 || periods.boundaries.length > 33 ||
      !Array.isArray(periods.rows) || periods.rows.length < 1 || periods.rows.length > 16) return false;

  const width = spec.widthMm ?? 108;
  if (typeof width !== 'number' || !Number.isFinite(width) || width < 30 || width > 108) return false;
  for (const key of ['strokePt', 'guideStrokePt']) {
    if (periods[key] !== undefined && (typeof periods[key] !== 'number' || !Number.isFinite(periods[key]) || periods[key] <= 0 || periods[key] > 20)) return false;
  }

  const boundaryIds = new Set();
  for (const [index, boundary] of periods.boundaries.entries()) {
    if (!isRecord(boundary) || Object.keys(boundary).some(key => !periodBoundaryKeys.has(key)) ||
        !stableSchematicId(boundary.id) || boundaryIds.has(boundary.id) ||
        !(typeof boundary.time === 'number' && Number.isFinite(boundary.time) || literalText(boundary.time, 200)) ||
        boundary.labelAfter !== undefined && (!literalText(boundary.labelAfter, 200) || index === periods.boundaries.length - 1) ||
        periods.spacing === 'proportional' && (typeof boundary.time !== 'number' || index > 0 && boundary.time <= periods.boundaries[index - 1].time)) return false;
    boundaryIds.add(boundary.id);
  }
  if (periods.spacing === 'proportional' &&
      !Number.isFinite(periods.boundaries.at(-1).time - periods.boundaries[0].time)) return false;

  const rowIds = new Set();
  let intervalCount = 0;
  for (const row of periods.rows) {
    if (!isRecord(row) || Object.keys(row).some(key => !periodRowKeys.has(key)) ||
        !stableSchematicId(row.id) || rowIds.has(row.id) || !literalText(row.label) ||
        !Array.isArray(row.intervals) || row.intervals.length < 1 || row.intervals.length > 64) return false;
    rowIds.add(row.id);
    const intervalIds = new Set();
    const occupied = [];
    for (const interval of row.intervals) {
      if (!isRecord(interval) || Object.keys(interval).some(key => !periodIntervalKeys.has(key)) ||
          !stableSchematicId(interval.id) || intervalIds.has(interval.id) || !literalText(interval.label)) return false;
      const from = periods.boundaries.findIndex(boundary => boundary.id === interval.from);
      const to = periods.boundaries.findIndex(boundary => boundary.id === interval.to);
      if (from < 0 || to <= from || occupied.some(([start, end]) => from < end && to > start)) return false;
      intervalIds.add(interval.id);
      occupied.push([from, to]);
      intervalCount++;
    }
  }
  return intervalCount <= 256;
}
