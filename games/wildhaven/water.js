import {SWIM_OUTFITS,POOL_STYLES,FENCE_STYLES} from './catalog.js';
export const LAKES={
 meadow:{name:'Petal Lake',x:775,y:220,rx:110,ry:70,color:'#8cdbdf'},
 grove:{name:'Firefly Lake',x:775,y:220,rx:110,ry:70,color:'#8ad9c9'},
 ridge:{name:'Moonmirror Lake',x:775,y:220,rx:110,ry:70,color:'#a4c7ed'},
};
export const RANCH_POOL={name:'Your ranch pool',x:140,y:290,rx:66,ry:33};
export const isSwimOutfit=outfit=>SWIM_OUTFITS.includes(outfit);
export function waterArea(s){if(s.room)return null;if(s.biome==='reef')return {kind:'reef',name:'Coral Dream Lagoon'};if(s.biome==='ranch')return Object.hasOwn(POOL_STYLES,s.poolStyle)?{...RANCH_POOL,kind:'pool'}:null;return Object.hasOwn(LAKES,s.biome)?{...LAKES[s.biome],kind:'lake'}:null;}
export function waterAt(s,x=s.x,y=s.y){const area=waterArea(s);return area&&(area.kind==='reef'||((x-area.x)/area.rx)**2+((y-area.y)/area.ry)**2<1)?area:null;}
export function startSwimming(s){
 const area=waterArea({...s,room:null});if(!area||area.kind==='reef')return false;
 s.room=null;if(!isSwimOutfit(s.avatar.outfit))s.avatar.outfit='petal-swimsuit';s.x=area.x;s.y=area.y;s.pitch=-.08;s.yaw=0;return true;
}
export function leaveWater(s){const area=waterAt(s);if(!area||area.kind==='reef')return false;s.x=area.x;s.y=area.y+area.ry+14;return true;}
export function canDive(s){return waterAt(s)?.kind==='lake'&&isSwimOutfit(s.avatar.outfit);}
export function surface(s){
 if(s.biome!=='reef')return false;const biome=Object.hasOwn(LAKES,s.surfaceReturn)?s.surfaceReturn:'meadow',lake=LAKES[biome];s.biome=biome;s.room=null;s.x=lake.x;s.y=lake.y;s.yaw=0;s.pitch=-.08;return true;
}
export function changeDepth(s,amount){if(s.biome!=='reef'||!Number.isFinite(amount))return false;s.swimDepth=Math.max(.5,Math.min(2.8,(s.swimDepth||1.5)+amount));return true;}
export function restoreWater(s,raw){
 for(const [key,styles] of [['poolStyle',POOL_STYLES],['fenceStyle',FENCE_STYLES]])s[key]=Object.hasOwn(styles,raw[key])&&s.owned.includes(raw[key])?raw[key]:null;
 s.surfaceReturn=Object.hasOwn(LAKES,raw.surfaceReturn)?raw.surfaceReturn:'meadow';s.swimDepth=Number.isFinite(raw.swimDepth)?Math.max(.5,Math.min(2.8,raw.swimDepth)):1.5;
 if(waterAt(s)&&!isSwimOutfit(s.avatar.outfit))s.avatar.outfit='petal-swimsuit';
}
