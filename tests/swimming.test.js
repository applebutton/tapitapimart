import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,travel,purchase,setAvatar,catchCreature,countCarried,combineCreatures,creatureInfo,releaseCreature,vacuumResident} from '../games/wildhaven/engine.js';
import {LAKES,waterAt,startSwimming,leaveWater,canDive,surface,changeDepth} from '../games/wildhaven/water.js';
import {FENCE_STYLES,POOL_STYLES} from '../games/wildhaven/catalog.js';
test('all lakes support swimwear, swimming boundaries, diving and returning to the same lake',()=>{
 for(const biome of Object.keys(LAKES)){const s=freshState();travel(s,biome);assert.equal(waterAt(s),null);assert.equal(canDive(s),false);assert(startSwimming(s));assert.equal(s.avatar.outfit,'petal-swimsuit');assert.equal(waterAt(s).kind,'lake');assert(canDive(s));assert.equal(setAvatar(s,'outfit','hoodie'),false);travel(s,'reef');assert.equal(s.biome,'reef');assert(changeDepth(s,100));assert.equal(s.swimDepth,2.8);assert(changeDepth(s,-100));assert.equal(s.swimDepth,.5);assert(surface(s));assert.equal(s.biome,biome);assert.equal(waterAt(s).kind,'lake');assert(leaveWater(s));assert.equal(waterAt(s),null);assert(setAvatar(s,'outfit','hoodie'));}
});
test('three pool styles appear immediately, switch free, and only permit swimming after purchase',()=>{
 const s=freshState();travel(s,'ranch');assert.equal(startSwimming(s),false);s.gems=200;
 for(const id of Object.keys(POOL_STYLES)){assert(purchase(s,id).ok);assert.equal(s.poolStyle,id);assert(startSwimming(s));assert.equal(waterAt(s).kind,'pool');assert.equal(canDive(s),false);assert(leaveWater(s));}
 const money=s.gems;assert(purchase(s,'blossom-pool').ok);assert.equal(s.gems,money);assert.equal(s.poolStyle,'blossom-pool');assert.equal(s.owned.filter(id=>Object.hasOwn(POOL_STYLES,id)).length,3);
});
test('fence and pool selections preserve progress and reject unaffordable or unowned styles',()=>{
 const s=freshState();travel(s,'ranch');const before=structuredClone(s);assert.equal(purchase(s,'bunny-fence').ok,false);assert.deepEqual(s,before);s.gems=200;
 for(const id of Object.keys(FENCE_STYLES))assert(purchase(s,id).ok);purchase(s,'shell-pool');s.room='shed';s.decor={};const saved=loadState(JSON.stringify(s));assert.equal(saved.fenceStyle,'shell-fence');assert.equal(saved.poolStyle,'shell-pool');assert.deepEqual(saved.owned,s.owned);const invalid=loadState(JSON.stringify({...s,fenceStyle:'__proto__',poolStyle:'moon-pool'}));assert.equal(invalid.fenceStyle,null);assert.equal(invalid.poolStyle,null);
});
test('all aquatic creatures obey catch limits, combine into valid giants, and survive save and pen transfers',()=>{
 const s=freshState();assert.equal(catchCreature(s,6),null);travel(s,'reef');
 for(const type of [6,7,8]){for(let i=0;i<30;i++)assert(catchCreature(s,type));assert.equal(catchCreature(s,type),null);assert.equal(countCarried(s,type),30);}
 travel(s,'ranch');const giant=combineCreatures(s,6,8);assert(giant);assert.equal(creatureInfo(giant.species).name,'Giant Pearljelly');assert(releaseCreature(s,giant.species,1));assert(releaseCreature(s,7,0));const saved=loadState(JSON.stringify(s));assert.equal(saved.collection.length,89);assert(saved.collection.some(c=>c.species==='giant-6-8'&&c.location===1));const resident=saved.collection.find(c=>c.species===7&&c.location===0);assert(vacuumResident(saved,resident.id));
 for(let a=0;a<9;a++)for(let b=a;b<9;b++)assert(creatureInfo(`giant-${a}-${b}`));assert.equal(creatureInfo('giant-8-6'),null);
});
test('underwater saves restore safe depth, swimwear and return location without losing collections',()=>{
 const s=freshState();travel(s,'reef');catchCreature(s,8);const saved=loadState(JSON.stringify({...s,avatar:{...s.avatar,outfit:'hoodie'},swimDepth:999,surfaceReturn:'__proto__'}));assert.equal(saved.biome,'reef');assert.equal(saved.avatar.outfit,'petal-swimsuit');assert.equal(saved.swimDepth,2.8);assert.equal(saved.surfaceReturn,'meadow');assert.equal(saved.collection[0].species,8);
 const old=loadState(JSON.stringify({...freshState(),poolStyle:undefined,fenceStyle:undefined}));assert.equal(old.poolStyle,null);assert.equal(old.fenceStyle,null);assert.equal(old.avatar.outfit,'sugarcloud-dress');
});
