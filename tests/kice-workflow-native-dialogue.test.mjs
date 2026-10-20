import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareRules, readIndex } from '../skills/create-kice-illustration/scripts/prepare_rules.mjs';
import { prepareTask } from '../skills/create-kice-illustration/scripts/prepare_task.mjs';

const index = readIndex();

test('native dialogue execution rules follow selected speaker layouts and screen variants', () => {
  const vertical = prepareRules({ subtype: 'ITA-4_DialogueV', people: true });
  assert.ok(vertical.modules.includes('dialogue-native'));
  assert.ok(vertical.sources.includes(index.modules['dialogue-native']));
  assert.ok(!vertical.modules.includes('presentation-screen-native'));
  assert.doesNotMatch(vertical.content, /speech-above-board|boardWidthMm/);

  const horizontal = prepareRules({ subtype: 'ITA-3_DialogueH' });
  assert.ok(horizontal.modules.includes('dialogue-native'));
  assert.ok(horizontal.sources.includes(index.modules['dialogue-native']));
  assert.ok(!horizontal.modules.includes('presentation-screen-native'));
  assert.doesNotMatch(horizontal.content, /speech-above-board|boardWidthMm/);

  const defaultVertical = prepareTask({ units: [{ recipe: 'vertical-dialogue' }] }).resolved[0];
  assert.ok(defaultVertical.modules.includes('dialogue-native'));
  const messenger = prepareTask({ units: [{ recipe: 'messenger' }] }).resolved[0];
  assert.ok(messenger.modules.includes('vertical-messenger'));
  assert.ok(!messenger.modules.includes('dialogue-native'));

  for (const subtype of ['ITA-5_SoloBoard', 'ITB-2_SoloImageBoard']) {
    const screen = prepareRules({ subtype, variant: 'screen' });
    for (const module of ['dialogue-native', 'presentation-screen-native']) {
      assert.ok(screen.modules.includes(module), `${subtype}:${module}`);
      assert.ok(screen.sources.includes(index.modules[module]), `${subtype}:${module}:source`);
    }
  }

  const board = prepareRules({ subtype: 'ITA-5_SoloBoard', variant: 'board' });
  assert.ok(board.modules.includes('dialogue-native'));
  assert.ok(!board.modules.includes('presentation-screen-native'));

  for (const recipe of ['webpage', 'newspaper']) {
    const ordinary = prepareTask({ units: [{ recipe, ...(recipe === 'webpage' ? { contains: ['people'] } : {}) }] }).resolved[0];
    assert.ok(!ordinary.modules.includes('dialogue-native'), recipe);
    assert.ok(!ordinary.modules.includes('presentation-screen-native'), recipe);
  }
});
