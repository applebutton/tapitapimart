import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,travel,purchase,setAvatar,loadState,vacuumRange,vacuumDelay,catchCreature,releaseCreature,careFor} from '../games/wildhaven/engine.js';
import {SHOP,AVATAR_OPTIONS} from '../games/wildhaven/catalog.js';

test('shop rejects unaffordable, invalid and out-of-ranch purchases without mutation',()=>{
 const s=freshState();s.gems=100;const wild=structuredClone(s);assert.equal(purchase(s,'sofa').ok,false);assert.deepEqual(s,wild);
 travel(s,'ranch');s.gems=0;const poor=structuredClone(s);assert.equal(purchase(s,'cloud-cat').ok,false);assert.equal(purchase(s,'constructor').ok,false);assert.deepEqual(s,poor);
});
test('every catalog purchase grants the item and costs exactly its listed price',()=>{
 for(const item of SHOP){const s=freshState();travel(s,'ranch');s.gems=100;const result=purchase(s,item.id);assert.equal(result.ok,true,item.id);assert.equal(s.gems,100-item.price,item.id);
 if(item.kind==='supply')assert.equal(s.materials[item.material],(item.material==='berries'?8:0)+item.amount);
 else {assert.ok(s.owned.includes(item.id));const gems=s.gems;assert.equal(purchase(s,item.id).ok,true);assert.equal(s.gems,gems,'owned items are not charged again');}
 }
});
test('full supply slots reject purchases atomically at the 30 item limit',()=>{
 const s=freshState();travel(s,'ranch');s.gems=100;s.materials.metal=28;const before=structuredClone(s);assert.equal(purchase(s,'metal-pack').ok,false);assert.deepEqual(s,before);
 s.materials.metal=25;assert.equal(purchase(s,'metal-pack').ok,true);assert.equal(s.materials.metal,30);
});
test('skin tone and starter styles are free; bought outfits and hairstyles unlock and equip',()=>{
 const s=freshState();for(const color of AVATAR_OPTIONS.skin)assert.equal(setAvatar(s,'skin',color),true);
 assert.equal(setAvatar(s,'hair','curls'),true);assert.equal(setAvatar(s,'outfit','cloud-dress'),false);assert.equal(setAvatar(s,'hair','space-buns'),false);
 travel(s,'ranch');s.gems=100;purchase(s,'cloud-dress');purchase(s,'space-buns');purchase(s,'round-glasses');
 assert.equal(s.avatar.outfit,'cloud-dress');assert.equal(s.avatar.hair,'space-buns');assert.equal(s.avatar.accessory,'round-glasses');assert.equal(s.gems,68);
 assert.equal(setAvatar(s,'skin','invalid'),false);
});
test('pets, themes, supplies, furniture, tool styles and upgrades survive reload',()=>{
 const s=freshState();travel(s,'ranch');s.gems=500;
 for(const id of ['cloud-cat','modern-theme','sofa','metal-pack','cookie-pack','starlight-vac','long-reach','quick-vac'])purchase(s,id);
 const r=loadState(JSON.stringify(s));assert.equal(r.pet,'cloud-cat');assert.equal(r.ranchTheme,'modern');assert.ok(r.owned.includes('sofa'));assert.equal(r.materials.metal,5);assert.equal(r.materials.starfood,3);assert.equal(r.toolStyle,'starlight');assert.equal(vacuumRange(r),160);assert.equal(vacuumDelay(r),.3);assert.equal(r.gems,s.gems);
});
test('special creature food is consumed and increases happiness only in pens',()=>{
 const s=freshState();const c=catchCreature(s,0);travel(s,'ranch');s.gems=6;purchase(s,'cookie-pack');assert.equal(careFor(s,c.id,'treat').ok,false);assert.equal(s.materials.starfood,3);
 releaseCreature(s,0,0);assert.equal(careFor(s,c.id,'treat').ok,true);assert.equal(c.happiness,100);assert.equal(s.materials.starfood,2);assert.equal(careFor(s,c.id,'treat').ok,false);assert.equal(s.materials.starfood,2);
});
test('version 2 ranches migrate to 3D without changing creatures, materials or buildings',()=>{
 const s={version:2,gems:27,materials:{berries:9,wood:15,stone:22},collection:[{species:'giant-0-1',location:2,happiness:80,rewardAt:5000}],homeLevel:3,biome:'ranch',x:480,y:548,coat:'#9b80ba',lastSaved:1000};
 const r=loadState(JSON.stringify(s),1000);assert.equal(r.version,3);assert.equal(r.homeLevel,3);assert.equal(r.gems,27);assert.equal(r.collection[0].location,2);assert.equal(r.collection[0].species,'giant-0-1');assert.equal(r.materials.wood,15);assert.equal(r.materials.metal,0);assert.equal(r.coat,s.coat);assert.deepEqual(r.owned,[]);
});
