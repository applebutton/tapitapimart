import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,loadState,travel,purchase} from '../games/wildhaven/engine.js';
import {enterRoom,leaveRoom,placeFurniture,setLand,restoreHousing} from '../games/wildhaven/housing.js';
function ranch(){const s=freshState();travel(s,'ranch');s.gems=200;return s;}
test('rooms require a built cabin, can be left, and cannot leak into exploration',()=>{const s=ranch();assert.equal(enterRoom(s,'cabin'),false);assert(enterRoom(s,'shed'));leaveRoom(s);assert.equal(s.room,null);s.homeLevel=1;assert(enterRoom(s,'cabin'));travel(s,'grove');assert.equal(s.room,null);assert.equal(enterRoom(s,'shed'),false);});
test('decorating moves owned items, rejects occupied slots, and persists rotation and location',()=>{const s=ranch();s.homeLevel=1;purchase(s,'sofa');purchase(s,'chair');assert.equal(placeFurniture(s,'table','cabin',0),false);assert(placeFurniture(s,'sofa','cabin',0,1));assert.equal(placeFurniture(s,'chair','cabin',0),false);assert(placeFurniture(s,'chair','shed',0,3));assert.equal(placeFurniture(s,'sofa','shed',1,8),false);enterRoom(s,'cabin');const saved=loadState(JSON.stringify(s));assert.deepEqual(saved.decor,s.decor);assert.equal(saved.room,'cabin');assert(placeFurniture(saved,'sofa','outside',0));assert.equal(saved.decor.sofa,undefined);assert(saved.owned.includes('sofa'));});
test('moving land preserves purchases, pens, rooms and home',()=>{const s=ranch();s.homeLevel=2;purchase(s,'cute-theme');purchase(s,'table');placeFurniture(s,'table','shed',3);const before=structuredClone(s);for(const land of ['beach','forest','sakura']){assert(setLand(s,land));assert.equal(loadState(JSON.stringify(s)).ranchLand,land);}assert.equal(setLand(s,'unknown'),false);assert.equal(s.homeLevel,before.homeLevel);assert.deepEqual(s.decor,before.decor);assert.deepEqual(s.owned,before.owned);assert.equal(s.gems,before.gems);});
test('old and malformed saves keep owned purchases but reject invalid decoration placement',()=>{const s=ranch();purchase(s,'sofa');const raw={decor:{sofa:{room:'cabin',spot:99}},room:'cabin',ranchLand:'unknown'};restoreHousing(s,raw);assert.deepEqual(s.decor,{});assert.equal(s.room,null);assert.equal(s.ranchLand,'sakura');assert(s.owned.includes('sofa'));});

test('buying a house builds an enterable home immediately without consuming building materials',()=>{
 const s=ranch(),materials=structuredClone(s.materials);assert.equal(s.homeLevel,0);const before=s.gems;
 assert(purchase(s,'seaside-home').ok);assert.equal(s.houseStyle,'seaside-home');assert.equal(s.homeLevel,1);assert.equal(s.gems,before-45);assert.deepEqual(s.materials,materials);assert(enterRoom(s,'cabin'));
});
test('switching owned house styles is free and preserves upgrades and room furniture across reload',()=>{
 const s=ranch();s.homeLevel=3;purchase(s,'sakura-cottage');purchase(s,'sofa');placeFurniture(s,'sofa','cabin',3,2);purchase(s,'modern-home');const balance=s.gems;
 assert(purchase(s,'sakura-cottage').ok);assert.equal(s.gems,balance);assert.equal(s.homeLevel,3);const saved=loadState(JSON.stringify(s));assert.equal(saved.houseStyle,'sakura-cottage');assert.deepEqual(saved.decor,s.decor);assert.equal(saved.homeLevel,3);
});
test('unaffordable or unowned houses cannot become an active home',()=>{
 const s=ranch();s.gems=0;const before=structuredClone(s);assert.equal(purchase(s,'modern-home').ok,false);assert.deepEqual(s,before);s.houseStyle='modern-home';const loaded=loadState(JSON.stringify(s));assert.equal(loaded.houseStyle,null);assert.equal(loaded.homeLevel,0);assert.equal(enterRoom(loaded,'cabin'),false);
});
