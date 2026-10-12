import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, loadState, catchCreature, careFor, travel, tradeTreats, takeHit } from '../games/wildhaven/engine.js';

test('catching, ranch care and timed gifts form a repeatable reward loop', () => {
  const s = freshState(1000);
  const c = catchCreature(s, 0, 1000);
  assert.equal(s.collection.length, 1); assert.equal(s.gems, 3);
  assert.equal(careFor(s, c.id, 'feed', 2000).ok, false);
  travel(s, 'ranch');
  assert.equal(careFor(s, c.id, 'feed', 2000).ok, true);
  assert.equal(c.happiness, 85); assert.equal(s.treats, 7);
  assert.equal(careFor(s, c.id, 'reward', 2000).ok, false);
  assert.equal(careFor(s, c.id, 'reward', 31000).ok, true);
  assert.equal(s.gems, 11);
  assert.equal(careFor(s, c.id, 'reward', 31001).ok, false);
  assert.equal(careFor(s, c.id, 'reward', 91000).ok, true);
  assert.equal(tradeTreats(s), true); assert.equal(s.treats, 12);
});

test('three hits respawn safely without losing any companions or rewards', () => {
  const s = freshState(); catchCreature(s, 0); const collection = structuredClone(s.collection);
  assert.equal(takeHit(s), false); assert.equal(s.health, 2);
  assert.equal(takeHit(s), false); assert.equal(s.health, 1);
  assert.equal(takeHit(s), true); assert.equal(s.biome, 'ranch'); assert.equal(s.health, 3);
  assert.deepEqual(s.collection, collection); assert.equal(s.gems, 3);
  assert.equal(takeHit(s), false); assert.equal(s.health, 3);
  travel(s, 'grove'); assert.ok(catchCreature(s, 2));
});

test('save restoration bounds happiness and preserves collections and rewards', () => {
  const s = freshState(1000); catchCreature(s, 0, 1000); s.gems = 120; s.coat = '#7a99cc';
  const restored = loadState(JSON.stringify(s), 1000 + 86400000);
  assert.equal(restored.collection.length, 1); assert.equal(restored.gems, 120);
  assert.equal(restored.collection[0].happiness, 30); assert.equal(restored.coat, '#7a99cc');
  assert.equal(loadState('bad data').collection.length, 0);
  assert.equal(loadState(JSON.stringify({version:1, collection:[], biome:'toString'})).biome, 'meadow');
});

test('free petting means empty supplies never block ranch progress', () => {
  const s = freshState(); const c = catchCreature(s, 0, 0); travel(s, 'ranch'); s.treats = 0; s.gems = 0;
  assert.equal(careFor(s, c.id, 'feed').ok, false); assert.equal(tradeTreats(s), false);
  for (let i = 0; i < 4; i++) assert.equal(careFor(s, c.id, 'pet').ok, true);
  assert.equal(c.happiness, 100); assert.equal(careFor(s, c.id, 'reward', 100000).ok, true);
  assert.equal(tradeTreats(s), true); assert.equal(s.treats, 5);
  assert.equal(catchCreature(s, 0), null);
});
