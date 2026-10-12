import {SKU,HOUSE_STYLES} from './catalog.js';
export const LANDS={beach:'Seashell Beach',forest:'Whispering Forest',sakura:'Cherry Blossom Forest'};
export const ROOMS={cabin:'Your cabin',shed:'Creator’s room'};
export const SPOTS=[[-2.4,-2.4],[0,-2.4],[2.4,-2.4],[-2.4,0],[2.4,0],[-2.4,2.2],[2.4,2.2]];
export function enterRoom(s,room){if(s.biome!=='ranch'||!Object.hasOwn(ROOMS,room)||(room==='cabin'&&!s.homeLevel))return false;s.room=room;s.x=480;s.y=370;s.yaw=0;s.pitch=-.08;return true;}
export function leaveRoom(s){s.room=null;s.x=480;s.y=548;s.yaw=0;s.pitch=-.14;}
export function setLand(s,land){if(s.biome!=='ranch'||!Object.hasOwn(LANDS,land))return false;s.ranchLand=land;return true;}
export function placeFurniture(s,id,room,spot,rotation=0){
 if(s.biome!=='ranch'||!s.owned.includes(id)||SKU[id]?.kind!=='furniture'||!['outside','cabin','shed'].includes(room)||(room==='cabin'&&!s.homeLevel))return false;
 if(room==='outside'){delete s.decor[id];return true;}
 if(!Number.isInteger(spot)||!SPOTS[spot]||!Number.isInteger(rotation)||rotation<0||rotation>3)return false;
 if(Object.entries(s.decor).some(([key,p])=>key!==id&&p.room===room&&p.spot===spot))return false;
 s.decor[id]={room,spot,rotation};return true;
}
export function restoreHousing(s,raw){
 s.houseStyle=Object.hasOwn(HOUSE_STYLES,raw.houseStyle)&&s.owned.includes(raw.houseStyle)?raw.houseStyle:null;if(s.houseStyle)s.homeLevel=Math.max(1,s.homeLevel);
 s.ranchLand=Object.hasOwn(LANDS,raw.ranchLand)?raw.ranchLand:'sakura';s.decor={};
 if(raw.decor&&typeof raw.decor==='object')for(const [id,p] of Object.entries(raw.decor))if(p&&s.owned.includes(id)&&SKU[id]?.kind==='furniture'&&Object.hasOwn(ROOMS,p.room)&&(p.room!=='cabin'||s.homeLevel)&&Number.isInteger(p.spot)&&SPOTS[p.spot]&&!Object.values(s.decor).some(v=>v.room===p.room&&v.spot===p.spot))s.decor[id]={room:p.room,spot:p.spot,rotation:Number.isInteger(p.rotation)&&p.rotation>=0&&p.rotation<4?p.rotation:0};
 s.room=s.biome==='ranch'&&Object.hasOwn(ROOMS,raw.room)&&(raw.room!=='cabin'||s.homeLevel)?raw.room:null;
 if(s.room&&(s.x<395||s.x>565||s.y<205||s.y>380)){s.x=480;s.y=370;}
}
