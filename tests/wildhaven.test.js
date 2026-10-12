import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, loadState, catchCreature, careFor, travel, tradeTreats, takeHit, LIMIT, PENS, HOME_STAGES, countCarried, collectMaterial, releaseCreature, vacuumResident, combineCreatures, buildHome, creatureInfo, penBounds, wander } from '../games/wildhaven/engine.js';

test('vacuum has separate 30-item limits and never deletes a rejected catch', () => {
  const s=freshState();
  for(let i=0;i<LIMIT;i++)assert.ok(catchCreature(s,0));
  assert.equal(catchCreature(s,0),null);assert.equal(countCarried(s,0),30);
  assert.ok(catchCreature(s,1));assert.equal(countCarried(s,1),1);
  assert.equal(collectMaterial(s,'wood',29),29);assert.equal(collectMaterial(s,'wood',3),1);assert.equal(collectMaterial(s,'wood'),0);
  assert.equal(collectMaterial(s,'stone',3),3);assert.equal(s.materials.wood,30);
  assert.equal(collectMaterial(s,'__proto__'),0);
});

test('creatures stay in chosen pens and vacuuming respects bag limits', () => {
  const s=freshState();const c=catchCreature(s,0);
  assert.equal(c.location,'vacuum');assert.equal(releaseCreature(s,0,1),false);
  travel(s,'ranch');assert.equal(releaseCreature(s,0,1),true);assert.equal(c.location,1);
  travel(s,'grove');travel(s,'ranch');assert.equal(c.location,1);
  assert.equal(vacuumResident(s,c.id),true);assert.equal(c.location,'vacuum');
  assert.equal(releaseCreature(s,0,2),true);travel(s,'meadow');for(let i=0;i<30;i++)catchCreature(s,0);
  travel(s,'ranch');assert.equal(vacuumResident(s,c.id),false);assert.equal(c.location,2);
  assert.equal(releaseCreature(s,0,0),true);assert.equal(vacuumResident(s,c.id),true);
});

test('giants of any size can be vacuumed, placed in pens, and vacuumed out', () => {
  const s=freshState();travel(s,'ridge');const c=catchCreature(s,'giant-4-5');assert.ok(c);
  assert.equal(creatureInfo(c.species).giant,true);travel(s,'ranch');assert.equal(releaseCreature(s,c.species,0),true);
  assert.equal(vacuumResident(s,c.id),true);assert.equal(countCarried(s,'giant-4-5'),1);
});

test('combining two carried creatures produces one new giant without duplicating them', () => {
  const s=freshState();catchCreature(s,0);catchCreature(s,1);travel(s,'ranch');
  const giant=combineCreatures(s,1,0,1000);assert.equal(giant.species,'giant-0-1');assert.equal(giant.location,'vacuum');
  assert.equal(s.collection.length,1);assert.equal(countCarried(s,0),0);assert.equal(countCarried(s,1),0);
  assert.equal(combineCreatures(s,0,1),null);
  travel(s,'meadow');catchCreature(s,0);travel(s,'ranch');assert.equal(combineCreatures(s,0,0),null);
  travel(s,'meadow');catchCreature(s,0);travel(s,'ranch');assert.equal(combineCreatures(s,0,0).species,'giant-0-0');
});

test('a full giant slot blocks combining without consuming either input', () => {
  const s=freshState();travel(s,'ridge');for(let i=0;i<30;i++)catchCreature(s,'giant-4-5');
  catchCreature(s,4);catchCreature(s,5);travel(s,'ranch');const before=structuredClone(s);
  assert.equal(combineCreatures(s,4,5),null);assert.deepEqual(s,before);
});

test('home construction consumes the exact recipe and persists each stage', () => {
  const s=freshState();s.materials.wood=30;s.materials.stone=30;assert.equal(buildHome(s),false);travel(s,'ranch');
  for(const [i,stage] of HOME_STAGES.entries()){
    s.materials.wood=stage.wood;s.materials.stone=stage.stone;assert.equal(buildHome(s),true);
    assert.equal(s.homeLevel,i+1);assert.equal(s.materials.wood,0);assert.equal(s.materials.stone,0);
    assert.equal(loadState(JSON.stringify(s)).homeLevel,i+1);
  }
  assert.equal(buildHome(s),false);
});

test('insufficient building materials do not spend supplies or change the home', () => {
  const s=freshState();travel(s,'ranch');s.materials.wood=7;s.materials.stone=5;
  const before=structuredClone(s);assert.equal(buildHome(s),false);assert.deepEqual(s,before);
});

test('care and gifts require a pen, and berry trading cannot overflow capacity', () => {
  const s=freshState(1000);const c=catchCreature(s,0,1000);travel(s,'ranch');
  assert.equal(careFor(s,c.id,'feed',2000).ok,false);releaseCreature(s,0,0);
  assert.equal(careFor(s,c.id,'feed',2000).ok,true);assert.equal(c.happiness,85);assert.equal(s.materials.berries,7);
  assert.equal(careFor(s,c.id,'reward',2000).ok,false);assert.equal(careFor(s,c.id,'reward',31000).ok,true);assert.equal(s.gems,11);
  assert.equal(careFor(s,c.id,'reward',31001).ok,false);assert.equal(tradeTreats(s),true);assert.equal(s.materials.berries,12);
  s.materials.berries=28;const gems=s.gems;assert.equal(tradeTreats(s),false);assert.equal(s.gems,gems);
});

test('respawn preserves inventory, materials, pens, buildings and rewards', () => {
  const s=freshState();const c=catchCreature(s,0);travel(s,'ranch');releaseCreature(s,0,2);s.homeLevel=2;
  travel(s,'meadow');catchCreature(s,1);collectMaterial(s,'wood');const before=structuredClone(s);
  assert.equal(takeHit(s),false);assert.equal(takeHit(s),false);assert.equal(takeHit(s),true);
  assert.equal(s.biome,'ranch');assert.equal(s.health,3);assert.equal(c.location,2);
  for(const key of ['collection','materials','homeLevel','gems'])assert.deepEqual(s[key],before[key]);
});

test('old saves migrate every companion into pens and retain the existing home', () => {
  const old={version:1,gems:120,treats:8,collection:[{id:1,species:0,happiness:85,rewardAt:2000},{id:2,species:3,happiness:60,rewardAt:2000}],biome:'ranch',x:480,y:440,lastSaved:1000,coat:'#7a99cc'};
  const s=loadState(JSON.stringify(old),1000);assert.equal(s.version,2);assert.equal(s.collection.length,2);
  assert.deepEqual(s.collection.map(c=>c.location),[0,1]);assert.equal(s.materials.berries,8);assert.equal(s.homeLevel,1);assert.equal(s.gems,120);
  const again=loadState(JSON.stringify(s),1000);assert.deepEqual(again.collection,s.collection);assert.equal(again.coat,'#7a99cc');
  assert.equal(loadState('bad save').collection.length,0);
});

test('free petting means empty supplies never block progress', () => {
  const s=freshState();const c=catchCreature(s,0,0);travel(s,'ranch');releaseCreature(s,0,0);s.materials.berries=0;s.gems=0;
  assert.equal(careFor(s,c.id,'feed').ok,false);for(let i=0;i<4;i++)careFor(s,c.id,'pet');
  assert.equal(c.happiness,100);assert.equal(careFor(s,c.id,'reward',100000).ok,true);assert.equal(tradeTreats(s),true);
});

test('autonomous creatures, including giants, stay strictly inside every pen', () => {
  let randomSeed=1234;const random=()=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296;};
  for(let pen=0;pen<PENS.length;pen++)for(const giant of [false,true]){
    const b=penBounds(pen,giant);const actor={x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2};let moved=false;const start={...actor};
    for(let frame=0;frame<10000;frame++){
      wander(actor,1/60,b,random);assert.ok(actor.x>=b.minX&&actor.x<=b.maxX);assert.ok(actor.y>=b.minY&&actor.y<=b.maxY);
      if(Math.abs(actor.x-start.x)>10)moved=true;
    }
    assert.ok(moved);
  }
});
