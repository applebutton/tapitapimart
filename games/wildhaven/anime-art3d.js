import * as THREE from '../../vendor/three/three.module.js';
import {avatarCanvas,aquaticCanvas} from './world2d.js';
const textures=new Map();
function texture(file,index=null){const key=file+index;if(textures.has(key))return textures.get(key);const t=new THREE.TextureLoader().load(new URL(file,import.meta.url).href);t.colorSpace=THREE.SRGBColorSpace;if(index!==null){t.repeat.set(1/3,1/2);t.offset.set(index%3/3,(1-Math.floor(index/3))/2);}textures.set(key,t);return t;}
function card(map,width,height){const s=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,alphaTest:.12,depthWrite:true,toneMapped:false}));s.center.set(.5,0);s.scale.set(width,height,1);return s;}
export function animeCreature(type){const giant=typeof type==='string',index=giant?Number(type.split('-')[1]):type;if(index>=6){const key='aquatic-'+index;let map=textures.get(key);if(!map){map=new THREE.CanvasTexture(document.createElement('canvas'));map.colorSpace=THREE.SRGBColorSpace;textures.set(key,map);const update=()=>{const c=aquaticCanvas(index-6);if(c){map.image=c;map.needsUpdate=true;window.removeEventListener('wildhaven-art-ready',update);}};window.addEventListener('wildhaven-art-ready',update);update();}return card(map,giant?2.1:1.35,giant?2.1:1.35);}return card(texture('./anime-creatures.png',index),giant?1.9:1.1,giant?1.9:1.1);}
export function animeTree(x,z,forest=false){const s=card(texture('./anime-environment.png',forest?3:2),4.5,4.5);s.position.set(x,0,z);return s;}
export function animeAvatar(state){const map=new THREE.CanvasTexture(avatarCanvas(state));map.colorSpace=THREE.SRGBColorSpace;const s=card(map,1.35,2.55);s.userData.ownTexture=true;return s;}
export function disposeAvatar(s){if(!s)return;s.material.map.dispose();s.material.dispose();s.removeFromParent();}
