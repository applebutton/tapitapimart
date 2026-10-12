import {waterAt,waterArea,isSwimOutfit,LAKES,RANCH_POOL} from './water.js';
import {HOUSE_STYLES, OUTFIT_COLORS,FENCE_STYLES,POOL_STYLES} from './catalog.js';
import {animeCreature,animeTree,animeAvatar} from './anime-art3d.js';
import {SPOTS} from './housing.js';
import * as THREE from '../../vendor/three/three.module.js';
import { BIOMES, PENS, creatureInfo } from './engine.js';
const SCALE=.04;
const wx=x=>(x-480)*SCALE, wz=y=>(y-290)*SCALE;
const geo=new Map(), mats=new Map(), labels=new Map();
const shadowMaterial=new THREE.MeshBasicMaterial({color:'#566656',transparent:true,opacity:.12,depthWrite:false});
function material(color, glow=false){const key=color+glow;if(!mats.has(key))mats.set(key,new THREE.MeshToonMaterial({color,gradientMap:toonRamp,...(glow?{emissive:color,emissiveIntensity:.5}:{})}));return mats.get(key);}
function geometry(key,create){if(!geo.has(key))geo.set(key,create());return geo.get(key);}
function ball(parent,x,y,z,sx,sy,sz,color){const m=new THREE.Mesh(geometry(Math.max(sx,sy,sz)<.18?'detail-sphere':'sphere',()=>new THREE.SphereGeometry(1,24,16)),material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,color,round=.07){
 const key=`box:${w}:${h}:${d}:${round}`;
 const g=geometry(key,()=>{
  const r=Math.min(round,w/4,h/4,d/4),s=new THREE.Shape(),a=-w/2+r,b=-h/2+r,W=w-2*r,H=h-2*r;
  s.moveTo(a+r,b);s.lineTo(a+W-r,b);s.quadraticCurveTo(a+W,b,a+W,b+r);s.lineTo(a+W,b+H-r);s.quadraticCurveTo(a+W,b+H,a+W-r,b+H);s.lineTo(a+r,b+H);s.quadraticCurveTo(a,b+H,a,b+H-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:6});g.translate(0,0,-(d-2*r)/2);return g;
 });const m=new THREE.Mesh(g,material(color));m.position.set(x,y,z);parent.add(m);return m;
}
function cylinder(parent,x,y,z,top,bottom,height,color){const key=`cyl:${top}:${bottom}:${height}`;const m=new THREE.Mesh(geometry(key,()=>new THREE.CylinderGeometry(top,bottom,height,24)),material(color));m.position.set(x,y,z);parent.add(m);return m;}
function torus(parent,x,y,z,r,tube,color){const m=new THREE.Mesh(geometry(`ring:${r}:${tube}`,()=>new THREE.TorusGeometry(r,tube,12,32)),material(color));m.position.set(x,y,z);parent.add(m);return m;}
function blob(parent,x,z,r=.5){const m=new THREE.Mesh(geometry('shadow',()=>new THREE.CircleGeometry(1,24)),shadowMaterial);m.rotation.x=-Math.PI/2;m.scale.set(r,r*.75,1);m.position.set(x,.012,z);parent.add(m);return m;}
function sign(parent,text,x,y,z,width=3){
 if(!labels.has(text)){const c=document.createElement('canvas');c.width=512;c.height=100;const q=c.getContext('2d');q.fillStyle='#fffaf0';q.beginPath();q.roundRect(4,4,504,92,30);q.fill();q.fillStyle='#526658';q.font='bold 28px Arial';q.textAlign='center';q.textBaseline='middle';q.fillText(text,256,50,470);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;labels.set(text,new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true,toneMapped:false}));}
 const sprite=new THREE.Sprite(labels.get(text));sprite.position.set(x,y,z);sprite.scale.set(width,width/5.12,1);sprite.userData.labelWidth=width;parent.add(sprite);return sprite;
}
// A shared three-band ramp keeps every character softly cel shaded.
const toonRamp=new THREE.DataTexture(new Uint8Array([110,190,255]),3,1,THREE.RedFormat);
toonRamp.needsUpdate=true;toonRamp.minFilter=THREE.NearestFilter;toonRamp.magFilter=THREE.NearestFilter;
const toonMaterials=new Map();
function anime(group){group.traverse(o=>{if(!o.isMesh||!o.material.color||o.material===shadowMaterial)return;const key=o.material.color.getHex();if(!toonMaterials.has(key))toonMaterials.set(key,new THREE.MeshToonMaterial({color:key,gradientMap:toonRamp}));o.material=toonMaterials.get(key);});return group;}
function bow(g,x,y,z,size=.1){ball(g,x-size*.65,y,z,size*.7,size*.48,size*.28,'#ec91b5');ball(g,x+size*.65,y,z,size*.7,size*.48,size*.28,'#ec91b5');ball(g,x,y,z+.015,size*.28,size*.3,size*.3,'#ffd4e5');}
function animeEye(g,x,y,z,size){ball(g,x,y,z,size,size*1.3,size*.35,'#57354f');ball(g,x,y-.008,z+size*.28,size*.65,size*.87,size*.16,'#b56391');ball(g,x-size*.25,y+size*.45,z+size*.43,size*.32,size*.38,size*.12,'#fffaff');ball(g,x+size*.3,y-size*.4,z+size*.43,size*.15,size*.18,size*.1,'#fffaff');}
function face(g,scale=1){
 animeEye(g,-.14,.52,.44,.052);animeEye(g,.14,.52,.44,.052);
 ball(g,-.26,.44,.40,.066,.027,.018,'#edb8b7');ball(g,.26,.44,.40,.066,.027,.018,'#edb8b7');
 ball(g,0,.44,.464,.035,.02,.013,'#92766d');
}
export function creatureMesh(type){const g=new THREE.Group();g.add(animeCreature(type));return g;}
function strand(g,points,radius,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const key='strand:'+JSON.stringify(points)+radius;const m=new THREE.Mesh(geometry(key,()=>new THREE.TubeGeometry(curve,14,radius,7,false)),material(color));g.add(m);return m;}
function ribbon(g,x,y,z,size,color='#ee9bbb'){
 for(const side of [-1,1]){const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(side*size,-size*.5,side*size,-size*.15);shape.lineTo(side*size,size*.6);shape.quadraticCurveTo(side*size*.5,size*.55,0,0);const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));m.material.side=THREE.DoubleSide;m.position.set(x,y,z);g.add(m);}
 ball(g,x,y,z,.025,.03,.025,'#ffd6e4');for(const side of [-1,1]){const tail=box(g,x+side*size*.22,y-size*.65,z,.035,size,.012,color,.005);tail.rotation.z=side*.25;}
}
export function avatarMesh(state){return animeAvatar(state);}
function petMesh(type){const g=new THREE.Group();const art=animeCreature(type==='cloud-cat'?2:4);art.scale.multiplyScalar(.65);g.add(art);return g;}
function vacuumMesh(style,skin,longReach,clothes){
 const g=new THREE.Group(),body=style==='petal'?'#eab5ce':style==='starlight'?'#b7a7dc':'#acd9d2',trim=style==='starlight'?'#e5cd8e':'#f4e5cf';
 ball(g,.04,-.16,.09,.11,.12,.19,skin);box(g,.04,-.23,.28,.2,.2,.30,clothes,.07);box(g,0,0,0,.38,.36,.66,body,.1);box(g,0,.035,.07,.26,.25,.35,'#d4efe8',.06);
 torus(g,0,0,-.31,.18,.035,trim);const nozzle=cylinder(g,0,0,longReach?-.59:-.48,.20,.14,longReach?.56:.34,body);nozzle.rotation.x=Math.PI/2;
 torus(g,0,0,longReach?-.87:-.65,.215,.035,trim);const end=cylinder(g,0,0,longReach?-.88:-.66,.18,.18,.025,'#668d93');end.rotation.x=Math.PI/2;
 ribbon(g,0,.19,.1,.16);torus(g,0,.06,.25,.10,.015,'#efbfdc');for(let i=0;i<5;i++)ball(g,.23,.03-i*.05,.12,.022,.022,.022,'#fff0de');ball(g,.23,-.23,.12,.055,.045,.04,'#f4d2e4');ball(g,.08,.22,.02,.065,.065,.065,'#fff0a8');box(g,0,-.28,.12,.14,.32,.14,body,.045);g.rotation.set(-.04,-.12,-.1);return g;
}
const groundMaterials=new Map();
function paintedGround(ridge){
 if(groundMaterials.has(ridge))return groundMaterials.get(ridge);
 const c=document.createElement('canvas');c.width=c.height=512;const q=c.getContext('2d');q.fillStyle=ridge?'#d7cce8':'#b9d8ba';q.fillRect(0,0,512,512);
 for(let i=0;i<700;i++){const x=(i*73.13)%512,y=(i*117.31)%512;q.strokeStyle=ridge?'#a89bb827':'#719b7a30';q.lineWidth=1.2;q.beginPath();q.moveTo(x-3,y);q.quadraticCurveTo(x-1,y-5,x-4,y-7);q.moveTo(x,y);q.quadraticCurveTo(x,y-4,x+3,y-6);q.stroke();if(i%9===0){q.fillStyle='#fff2dc88';q.beginPath();q.ellipse(x+5,y+3,1.5,2,0,0,Math.PI*2);q.fill();}}
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(14,14);texture.anisotropy=8;const m=new THREE.MeshToonMaterial({map:texture,gradientMap:toonRamp});groundMaterials.set(ridge,m);return m;
}
function batchScenery(group){
 group.updateMatrixWorld(true);const buckets=new Map(),remove=[];
 group.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);remove.push(o);});
 for(const meshes of buckets.values()){const inst=new THREE.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);meshes.forEach((m,i)=>inst.setMatrixAt(i,m.matrixWorld));inst.instanceMatrix.needsUpdate=true;group.add(inst);}
 remove.forEach(m=>m.removeFromParent());
}
function flower(g,x,y,z,color,size=.10){cylinder(g,x,y/2,z,.009,.013,y,'#8cbaa4');for(let k=0;k<5;k++){const t=k*Math.PI*2/5;ball(g,x+Math.cos(t)*size*.65,y,z+Math.sin(t)*size*.65,size*.55,.025,size*.45,color);}ball(g,x,y+.018,z,.026,.022,.026,'#f6d785');}
function tree(g,x,z,index,ridge=false){
 strand(g,[[x,0,z],[x+.12,1.4,z],[x-.08,2.7,z]],.105,'#b993a4');
 for(let k=0;k<4;k++){const angle=k*2.2+index;const bx=x+Math.cos(angle)*.6,bz=z+Math.sin(angle)*.6;strand(g,[[x,1.6,z],[bx,2.35,bz]],.045,'#b993a4');for(let j=0;j<4;j++){ball(g,bx+Math.sin(j*2.4)*.45,2.6+j%2*.3,bz+Math.cos(j*2.4)*.45,.65,.38,.55,ridge?'#c1b4e6':index%3?'#f4b7d4':'#add8bf');for(let petal=0;petal<3;petal++)ball(g,bx+Math.sin(j*2.4+petal)*.6,2.8+j%2*.3,bz+Math.cos(j*2.4+petal)*.6,.16,.06,.13,index%3?'#ffe0ed':'#d9efcf');}}
}
function charm(g,x,y,z,type,size=.16){
 const part=new THREE.Group();part.position.set(x,y,z);part.scale.setScalar(size);g.add(part);
 if(type==='bunny'){ball(part,0,0,0,.75,.65,.3,'#fff0f7');for(const side of [-1,1]){ball(part,side*.35,.77,0,.22,.6,.2,'#fff0f7');ball(part,side*.35,.8,.17,.1,.4,.04,'#f4b2d2');ball(part,side*.23,.07,.29,.06,.09,.04,'#906587');}ribbon(part,0,-.55,.22,.42);}
 else if(type==='star'){const m=new THREE.Mesh(geometry('soft-star',()=>{const s=new THREE.Shape();for(let k=0;k<10;k++){const t=k*Math.PI/5+Math.PI/2,r=k%2?.44:1;k?s.lineTo(Math.cos(t)*r,Math.sin(t)*r):s.moveTo(Math.cos(t)*r,Math.sin(t)*r);}s.closePath();return new THREE.ExtrudeGeometry(s,{depth:.16,bevelEnabled:true,bevelThickness:.09,bevelSize:.06,bevelSegments:3});}),material('#ffdfa1'));part.add(m);}
 else {for(let i=0;i<5;i++){const petal=ball(part,(i-2)*.24,.1,0,.25,.8-Math.abs(i-2)*.14,.2,i%2?'#ffe8ef':'#e8c2e8');petal.rotation.z=-(i-2)*.2;}ball(part,0,-.4,.2,.25,.25,.2,'#fff6dd');}
 return part;
}
export function fenceMesh(style,width=3){
 const spec=FENCE_STYLES[style],g=new THREE.Group();if(!spec)return g;const n=Math.max(2,Math.round(width/1.25));
 for(let i=0;i<=n;i++){const x=-width/2+i*width/n;cylinder(g,x,.55,0,.065,.075,1.1,spec.color);ball(g,x,1.13,0,.12,.12,.12,spec.accent);}
 for(const y of [.3,.72])box(g,0,y,0,width,.09,.12,spec.color);
 for(let i=0;i<n;i++){const x=-width/2+(i+.5)*width/n;strand(g,[[x-width/n/2,1.08,0],[x,.94,0],[x+width/n/2,1.08,0]],.012,spec.accent);const light=ball(g,x,1,0,.055,.07,.055,'#fff2b5');light.material=material('#fff2b5',true);charm(g,x,.66,.11,spec.charm,.16);if(i%2===0)ribbon(g,x,.36,.10,.14);}
 return g;
}
export function poolMesh(style){
 const spec=POOL_STYLES[style],g=new THREE.Group();if(!spec)return g;
 const rim=torus(g,0,.16,0,2.64,.17,spec.color);rim.rotation.x=-Math.PI/2;rim.scale.y=.5;
 ball(g,0,.085,0,2.55,.055,1.25,spec.water);
 for(let i=0;i<16;i++){const t=i/16*Math.PI*2,x=Math.cos(t)*2.64,z=Math.sin(t)*1.32;const pearl=ball(g,x,.32,z,.065,.075,.065,spec.accent);pearl.material=material(spec.accent,true);}
 for(const side of [-1,1]){charm(g,side*2,.48,-.93,spec.charm,.23);ribbon(g,side*2,.21,1.02,.19);}
 for(const r of [.55,1.25]){const ripple=torus(g,0,.148,0,r,.014,'#e9fffb');ripple.rotation.x=-Math.PI/2;ripple.scale.y=.5;}
 if(spec.charm==='star'){for(const x of [-.65,.65])charm(g,x,.25,-1.32,'star',.2);}
 if(spec.charm==='shell'){const fountain=ball(g,0,.48,-1.38,.45,.43,.25,'#f3d7e6');charm(g,0,.78,-1.38,'shell',.36);ball(g,0,.29,-1.08,.035,.28,.035,'#c8f7f4');}
 return g;
}
function lakeMesh(lake){const g=new THREE.Group();ball(g,0,.06,0,lake.rx*.04,.045,lake.ry*.04,lake.color);for(let i=0;i<18;i++){const t=i/18*Math.PI*2;ball(g,Math.cos(t)*(lake.rx*.04+.12),.10,Math.sin(t)*(lake.ry*.04+.12),.24,.16,.19,i%3?'#d2d5d2':'#f3cfdf');}for(let i=0;i<5;i++){const pad=cylinder(g,-2+i*.8,.12,-.75,.3,.3,.035,'#a5d3b6');flower(g,-2+i*.8,.2,-.75,'#efbfd8',.14);}return g;}
function reefScenery(g){
 box(g,0,-.15,0,65,.25,65,'#c6dfce');
 for(let i=0;i<65;i++){const x=((i*71)%340-170)/10,z=((i*43)%240-120)/10;if(Math.abs(x)<1.5)continue;
  if(i%3===0){for(let k=0;k<3;k++){const leaf=ball(g,x+(k-1)*.19,.65+k%2*.35,z,.13,.75+k%2*.3,.055,i%2?'#7abfad':'#a1cfba');leaf.rotation.z=(k-1)*.25;}}
  else if(i%3===1){for(let k=0;k<4;k++)ball(g,x+Math.sin(k)*.25,.2+k%2*.28,z+Math.cos(k)*.15,.14,.30,.12,i%2?'#eebbd8':'#bbbbe8');}
  else {ball(g,x,.12,z,.43,.19,.32,'#e4d9d9');charm(g,x,.38,z,'shell',.19);}
 }
 for(const side of [-1,1]){ball(g,side*3,1.4,-5,.6,1.5,.7,'#b4d9d5');for(let i=0;i<5;i++)ball(g,side*3+i*side*.15,2.7+i*.03,-5,.5,.3,.6,'#c2e6d9');}
 for(let i=0;i<32;i++){const m=ball(g,Math.sin(i*4.3)*15,.6+i%7*.42,Math.cos(i*2.4)*11,.05+i%3*.025,.06+i%3*.025,.05,'#d5fffc');m.material=material('#c1fff2',true);}
 sign(g,'CORAL DREAM LAGOON',0,3.1,-6,5);
}

export function furnitureMesh(id){const g=new THREE.Group();
 if(id==='sofa'){box(g,0,.4,0,1.7,.5,.7,'#d7b6d6',.15);box(g,0,.8,-.3,1.7,.7,.2,'#efcbe1',.1);for(const x of [-.78,.78])box(g,x,.6,0,.2,.5,.7,'#d8aed0',.09);for(const x of [-.38,.38])ball(g,x,.62,-.12,.26,.22,.09,'#fff0e7');}
 if(id==='table'){cylinder(g,0,.65,0,.6,.6,.12,'#f2ddc3');cylinder(g,0,.32,0,.09,.17,.6,'#bb92a3');}
 if(id==='chair'){ball(g,0,.45,0,.4,.13,.38,'#b7dacf');ball(g,0,.78,-.25,.39,.4,.1,'#cbeade');for(const x of [-.22,.22])for(const z of [-.18,.18])cylinder(g,x,.2,z,.035,.045,.4,'#c1a795');}
 if(id==='planter'){cylinder(g,0,.22,0,.27,.2,.42,'#ecc6ba');for(let i=0;i<5;i++)ball(g,Math.sin(i)*.18,.55+i%2*.12,Math.cos(i)*.18,.15,.23,.08,'#a5c6a4');animeEye(g,-.07,.25,.24,.024);animeEye(g,.07,.25,.24,.024);}
 if(id==='lanterns'){cylinder(g,0,.65,0,.025,.05,1.3,'#b58ba9');ball(g,0,1.38,0,.18,.24,.18,'#ffe9ac');torus(g,0,1.57,0,.08,.015,'#ddbad7');}
 if(id==='sofa'){for(const x of [-.38,.38])ribbon(g,x,.65,.001,.095);for(const x of [-.66,.66])for(const z of [-.24,.24])ball(g,x,.10,z,.08,.12,.08,'#b58ba8');}
 if(id==='table'){cylinder(g,0,.735,0,.30,.30,.025,'#fff1fa');ball(g,0,.84,0,.15,.12,.13,'#e8b6d5');torus(g,.17,.85,0,.07,.02,'#e8b6d5');ball(g,0,.97,0,.04,.025,.04,'#fff0b5');for(const x of [-.31,.31])cylinder(g,x,.79,.1,.065,.045,.12,'#c4dce8');}
 if(id==='chair')ribbon(g,0,.94,-.13,.13);
 if(id==='lanterns')ribbon(g,0,1.1,.08,.12);
 return g;
}
export function houseMesh(style='sakura-cottage',level=1){
 const spec=HOUSE_STYLES[style]||HOUSE_STYLES['sakura-cottage'],g=new THREE.Group(),raised=spec.shape==='beach'?.35:0;
 box(g,0,1.35+raised,0,5.8,2.7,3.5,spec.wall,.08);
 if(spec.shape==='modern'){box(g,0,2.82+raised,0,6.3,.22,3.95,spec.roof,.05);box(g,-1.9,3.2,-.5,1.3,.55,1.7,spec.trim,.05);}
 else {const roofShape=new THREE.Shape();roofShape.moveTo(-3.25,2.7+raised);roofShape.lineTo(0,4.25+raised);roofShape.lineTo(3.25,2.7+raised);roofShape.closePath();const roof=new THREE.Mesh(geometry(`home-roof:${style}`,()=>new THREE.ExtrudeGeometry(roofShape,{depth:4,bevelEnabled:false})),material(spec.roof));roof.position.z=-2;g.add(roof);for(let i=0;i<5;i++)box(g,0,2.76+i*.28+raised,.04,6.35-i*1.2,.018,4.02,spec.trim,.004);}
 box(g,0,.87+raised,1.80,1.02,1.75,.10,spec.trim,.1);ball(g,.3,.88+raised,1.88,.045,.045,.04,'#f9df97');
 for(const side of [-1,1]){const x=side*1.8;box(g,x,1.5+raised,1.80,spec.shape==='modern'?1.45:1.1,1.12,.08,'#bde4ed',.03);box(g,x,1.5+raised,1.87,.035,1.14,.025,'#fff6ee',.003);box(g,x,1.5+raised,1.87,1.12,.035,.025,'#fff6ee',.003);box(g,x,.88+raised,1.9,1.35,.2,.35,spec.trim,.03);for(let k=0;k<5;k++)ball(g,x-.5+k*.25,1.03+raised,1.96,.10,.09,.08,k%2?'#f7bddb':'#fff0ba');}
 box(g,0,.09,2.08,6.1,.18,1.05,spec.trim,.02);
 if(spec.shape==='beach'){for(const x of [-2.6,2.6])cylinder(g,x,1.45,2.35,.07,.07,2.5,'#fff6ed');box(g,0,2.73,2.2,6.1,.14,1.2,spec.roof,.02);for(let i=0;i<3;i++)box(g,0,.05+i*.09,2.9-i*.2,1.6,.1,.35,'#fff0dc',.02);}
 if(spec.shape==='woodland'){for(let i=0;i<8;i++){box(g,0,.25+i*.30,-1.78,5.75,.025,.035,spec.trim,.003);for(const x of [-2.92,2.92])box(g,x,.25+i*.30,0,.035,.025,3.5,spec.trim,.003);}box(g,1.9,3.8,-.65,.55,1.6,.55,'#c0a8b1',.02);}
 if(spec.shape==='gable'){for(let i=0;i<9;i++){box(g,(i-4)*.57,2.18,2,.59,.08,.60,i%2?'#fff2f8':spec.trim,.02);ball(g,(i-4)*.57,2.08,2.30,.29,.10,.025,i%2?'#fff2f8':spec.trim);}ribbon(g,0,2.5,1.88,.30);}
 if(level>=2)for(const x of [-2.7,2.7]){cylinder(g,x,.55,2.4,.05,.05,.95,spec.trim);box(g,x,.7,2.2,.05,.06,.6,spec.trim);}
 if(level>=3){for(const x of [-2.8,2.8]){cylinder(g,x,.3,2.9,.24,.20,.55,spec.trim);ball(g,x,.78,2.9,.32,.3,.28,'#b2d3ac');}}

 return g;
}
let photoRenderer;const photos=new Map();
export function shopPicture(item,state){
 const key=item.id+JSON.stringify(state.avatar);if(photos.has(key))return photos.get(key);
 if(!photoRenderer){photoRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});photoRenderer.setSize(320,240);photoRenderer.setPixelRatio(2);}
 const scene=new THREE.Scene();scene.background=new THREE.Color(item.color);scene.add(new THREE.HemisphereLight('#fff7fc','#b4aacb',1.3));const light=new THREE.DirectionalLight('#fff7ed',1.6);light.position.set(-3,6,5);scene.add(light);let model;
 if(item.kind==='house')model=houseMesh(item.value);
 else if(item.kind==='pool')model=poolMesh(item.value);
 else if(item.kind==='fence')model=fenceMesh(item.value);
 else if(item.kind==='furniture')model=furnitureMesh(item.id);
 else if(item.kind==='avatar'){const copy=structuredClone(state);copy.avatar[item.slot]=item.value;model=avatarMesh(copy);}
 else if(item.kind==='pet')model=petMesh(item.value);
 else if(item.kind==='tool'||item.kind==='upgrade')model=vacuumMesh(item.value||state.toolStyle,state.avatar.skin,item.id==='long-reach','#edbad4');
 else {model=new THREE.Group();if(item.kind==='theme'){box(model,0,.6,0,1.5,1.2,1.1,'#fff0dc');box(model,0,1.28,0,1.8,.2,1.4,item.value==='cute'?'#e8acd1':'#a8cfc9');box(model,0,.4,.58,.35,.8,.04,'#c4b5df');for(const x of [-.48,.48])box(model,x,.8,.58,.3,.3,.04,'#b5ddea');}else if(item.material==='wood'){for(let i=0;i<3;i++){const log=cylinder(model,(i-1)*.22,.25,0,.1,.1,.8,'#c19c80');log.rotation.z=Math.PI/2;}}else if(item.material==='stone'||item.material==='metal'){for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),material(item.color));m.position.set((i-1)*.28,.25,0);m.scale.y=1.6;model.add(m);}}else for(let i=0;i<5;i++)ball(model,Math.sin(i)*.25,.3+i%2*.17,Math.cos(i)*.2,.14,.14,.14,item.material==='berries'?'#e99ebb':'#ffe2a4');}
 scene.add(model);const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),camera=new THREE.PerspectiveCamera(35,4/3,.01,30);const distance=Math.max(size.x,size.y,size.z,.7)*(item.kind==='pool'?1.05:item.kind==='fence'?1.35:2.3);camera.position.set(center.x+distance*.30,center.y+distance*(item.kind==='pool'?.95:.22),center.z+distance);camera.lookAt(center);photoRenderer.render(scene,camera);const url=photoRenderer.domElement.toDataURL('image/png');photos.set(key,url);return url;
}
export class World3D {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.NoToneMapping;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#dcecf0');this.scene.fog=new THREE.Fog('#efe0ee',65,95);
  const skyTexture=new THREE.TextureLoader().load(new URL('./anime-sky.png',import.meta.url).href);skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.offset.y=-.2;this.landSkyTexture=skyTexture;this.reefSkyTexture=new THREE.TextureLoader().load(new URL('./anime-reef-sky.png',import.meta.url).href);this.reefSkyTexture.colorSpace=THREE.SRGBColorSpace;this.reefSkyTexture.offset.y=-.12;
  this.sky=new THREE.Mesh(new THREE.SphereGeometry(75,48,24),new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,fog:false,toneMapped:false}));this.scene.add(this.sky);
  this.camera=new THREE.PerspectiveCamera(65,1,.04,100);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  this.scene.add(new THREE.HemisphereLight('#fff7ed','#bca6cd',1.25));const sun=new THREE.DirectionalLight('#fff5ed',1.65);sun.position.set(-8,16,9);this.scene.add(sun);
  this.scenery=new THREE.Group();this.scene.add(this.scenery);this.dynamic=new THREE.Group();this.scene.add(this.dynamic);this.actors=new Map();this.resources=new Map();this.lastScene='';this.lastTool='';this.pet=null;this.petId=null;
  this.vacuum=new THREE.Group();this.camera.add(this.vacuum);this.vacuum.position.set(.32,-.23,-.7);this.vacuum.scale.setScalar(.46);
  this.suction=new THREE.Group();this.scene.add(this.suction);this.suctionDots=Array.from({length:14},()=>ball(this.suction,0,0,0,.055,.055,.055,'#fff0ff'));
  this.artVersion=0;this.player=null;this.avatarSignature='';window.addEventListener('wildhaven-art-ready',()=>this.artVersion++);this.pulse=0;this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);
 }
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 cameraState(state,time=0,moving=false){
  // Eye level remains attached to the explorer, indoors and outdoors.
  const wet=waterAt(state),bob=wet&&moving?Math.sin(time*2)*.025:0;this.camera.position.set(wx(state.x),state.biome==='reef'?3.5-state.swimDepth+bob:wet?.65+bob:1.65,wz(state.y));
  this.camera.rotation.set(state.pitch||0,state.yaw||0,0,'YXZ');
  this.camera.updateMatrixWorld();
 }

 terrain(state){
  const signature=JSON.stringify([state.biome,state.homeLevel,state.houseStyle,state.ranchTheme,state.ranchLand,state.room,state.decor,state.poolStyle,state.fenceStyle,state.owned.filter(id=>['lanterns','sofa','table','chair','planter'].includes(id))]);if(signature===this.lastScene)return;this.lastScene=signature;this.scenery.traverse(o=>{if(o.isInstancedMesh)o.dispose();});this.scenery.clear();
  const g=this.scenery,b=BIOMES[state.biome];
  if(state.biome==='reef'){this.sky.visible=true;this.sky.material.map=this.reefSkyTexture;this.scene.background.set('#83c8d3');this.scene.fog.color.set('#83c8d3');this.scene.fog.near=12;this.scene.fog.far=45;reefScenery(g);batchScenery(g);return;}this.sky.material.map=this.landSkyTexture;this.scene.fog.near=65;this.scene.fog.far=95;
  if(state.room){this.sky.visible=false;this.interior(state);batchScenery(g);return;}this.sky.visible=true;this.scene.background.set(state.biome==='ridge'?'#e2e0f0':'#dcecf0');this.scene.fog.color.copy(this.scene.background);
  const ground=box(g,0,-.14,0,65,.25,65,state.biome==='ridge'?'#dbd0e9':'#c6dfce',.03);ground.material=paintedGround(state.biome==='ridge');if(state.biome==='ranch'&&state.ranchLand==='beach')ground.material=material('#f5dfbd');
  const path=state.biome==='ridge'?'#e5dced':'#eedcdf';box(g,0,.015,2.5,2.6,.04,25,path,.02);
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2;if(!(state.biome==='ranch'&&state.ranchLand==='beach'&&Math.cos(a)>.2))g.add(animeTree(Math.cos(a)*19,Math.sin(a)*15,state.biome==='grove'||state.biome==='ranch'&&state.ranchLand==='forest'));}
  for(let i=0;i<90;i++){const x=((i*71)%340-170)/10,z=((i*43)%240-120)/10;if(Math.abs(x)<1.8)continue;flower(g,x,.13+i%3*.045,z,['#f3b6d5','#fff1dc','#cfbaed'][i%3],.09);}
  // Closer flower beds and a winding ribbon of individual stepping stones.
  for(let i=0;i<22;i++){const z=i*.85-9;const x=Math.sin(i*.4)*.45;const stone=cylinder(g,x,.04,z,.48,.5,.055,'#f6e5e8');stone.scale.z=.70;}
  if(state.biome==='ranch'&&state.ranchLand==='beach'){box(g,24,-.02,0,18,.08,64,'#89d4df');for(let k=0;k<6;k++)box(g,16+k*.36,.035,0,.1,.025,58,k%2?'#d7f7ee':'#b6e8e8');for(let i=0;i<18;i++)ball(g,13+Math.sin(i)*1.8,.06,(i-9)*2,.14,.05,.11,i%2?'#fff2e2':'#efc0d5');}
  if(state.biome==='ranch')this.ranch(state);
  else if(LAKES[state.biome]){const lake=LAKES[state.biome],m=lakeMesh(lake);m.position.set(wx(lake.x),0,wz(lake.y));g.add(m);sign(g,lake.name,wx(lake.x),1.8,wz(lake.y),3);}
  batchScenery(g);
 }
 ranch(state){
  const g=this.scenery,modern=state.ranchTheme==='modern',cute=state.ranchTheme==='cute',trim=cute?'#d2b4df':modern?'#c4d9d5':'#f0dec2',roof=cute?'#e4b9d2':modern?'#b0c9c7':'#c999a0';
  const house=new THREE.Group();house.position.set(wx(450),0,wz(205));g.add(house);
  if(state.homeLevel===0){const tent=new THREE.Mesh(geometry('tent',()=>new THREE.ConeGeometry(2.5,2.8,4)),material(roof));tent.position.y=1.4;tent.rotation.y=Math.PI/4;house.add(tent);box(house,0,.65,1.45,1.0,1.3,.08,'#8e7a91',.1);if(cute)ribbon(house,0,1.85,1.25,.28);sign(house,'YOUR LITTLE HOME',0,3.2,0,3);}
  else {house.add(houseMesh(state.houseStyle||(state.ranchTheme==='modern'?'modern-home':state.ranchTheme==='cute'?'sakura-cottage':'forest-cabin'),state.homeLevel));sign(house,HOUSE_STYLES[state.houseStyle]?.name||'HOME SWEET HOME',0,4.9,0,3.6);}
  const shed=new THREE.Group();shed.position.set(wx(685),0,wz(210));g.add(shed);box(shed,0,1.15,0,3.65,2.3,3,'#c5d9d0',.15);box(shed,0,2.5,0,4.05,.45,3.35,'#d4b9db',.16);box(shed,-.62,.78,1.55,.85,1.56,.13,'#f0dbc0',.12);box(shed,.75,1.22,1.55,1.2,.85,.10,'#a0c8cb',.10);box(shed,.75,.70,1.77,1.5,.16,.6,'#e8d0bc',.05);sign(shed,"CREATOR'S SHED",0,3.15,.5,3.8);ball(shed,1.25,2.97,0,.2,.2,.16,'#fff0b9');
  // Storybook architectural details: scalloped awnings, shutters, lattice and flower boxes.
  for(const [building,width,depth] of [[shed,3.65,1.56]]){
   if(building===house&&state.homeLevel===0)continue;
   for(let k=0;k<9;k++){const x=(k-4)*width/9;const awning=box(building,x,2.16,depth+.26,width/9+.02,.07,.7,k%2?'#fff3f7':'#e5b5d0',.015);awning.rotation.x=.16;ball(building,x,2.05,depth+.60,width/18,.09,.025,k%2?'#fff3f7':'#e5b5d0');}
   for(const side of [-1,1]){const x=side*(building===house?1.85:1.15);for(const dx of [-.64,.64]){box(building,x+dx,1.52,depth+.08,.22,.95,.055,'#d0b8e4',.025);for(let j=0;j<5;j++)box(building,x+dx,1.17+j*.15,depth+.12,.19,.022,.025,'#fff1fa',.003);}box(building,x,.94,depth+.17,1.1,.18,.32,'#e3bacf',.02);for(let k=0;k<5;k++)flower(building,x-.4+k*.2,1.1,depth+.20,k%2?'#fff1de':'#e5a3c9',.10);}
   ribbon(building,0,2.45,depth+.1,.26);
  }
  box(g,wx(685),.01,wz(284),4,.025,2.6,'#e9dccb',.02);
  for(const p of PENS){const x=wx(p.x),z=wz(p.y),w=p.width*SCALE,d=p.height*SCALE;box(g,x+w/2,.008,z+d/2,w,.02,d,p.color,.02);
   if(state.fenceStyle){for(const pz of [z,z+d]){const f=fenceMesh(state.fenceStyle,w);f.position.set(x+w/2,0,pz);g.add(f);}for(const px of [x,x+w]){const f=fenceMesh(state.fenceStyle,d);f.rotation.y=Math.PI/2;f.position.set(px,0,z+d/2);g.add(f);}}else{
   for(let k=0;k<=10;k++){const px=x+k*w/10;for(const pz of [z,z+d])cylinder(g,px,.45,pz,.055,.06,.9,trim);}
   for(let k=0;k<=7;k++){const pz=z+k*d/7;for(const px of [x,x+w])cylinder(g,px,.45,pz,.055,.06,.9,trim);}
   for(const pz of [z,z+d])for(const h of [.27,.65])box(g,x+w/2,h,pz,w,.075,.085,trim,.03);
   for(const px of [x,x+w])for(const h of [.27,.65])box(g,px,h,z+d/2,.085,.075,d,trim,.03);
   }
   sign(g,p.name,x+w/2,1.45,z,2.4);
  }
  if(state.poolStyle){const pool=poolMesh(state.poolStyle);pool.position.set(wx(RANCH_POOL.x),0,wz(RANCH_POOL.y));g.add(pool);sign(g,POOL_STYLES[state.poolStyle].name,wx(RANCH_POOL.x),1.5,wz(RANCH_POOL.y)-1.8,3);}
  const patioX=wx(250),patioZ=wz(240);const outside=state.owned.filter(id=>['sofa','table','chair','planter','lanterns'].includes(id)&&!state.decor?.[id]);
  if(outside.length)box(g,patioX,.03,patioZ,6,.06,5,'#eddde7');
  outside.forEach((id,i)=>{const furniture=furnitureMesh(id);furniture.position.set(patioX+(i%3-1)*1.9,0,patioZ+Math.floor(i/3)*1.8);g.add(furniture);});

 }
 interior(state){
  const g=this.scenery,shed=state.room==='shed',palette=HOUSE_STYLES[state.houseStyle]||HOUSE_STYLES['sakura-cottage'];box(g,0,-.09,0,8,.18,8,'#e8cfbf');
  for(let i=0;i<16;i++)box(g,(i-7.5)*.5,.01,0,.017,.015,8,'#d3b6ab');
  box(g,0,1.65,-4,8,3.3,.16,shed?'#e1d4ed':palette.wall);for(const x of [-4,4])box(g,x,1.65,0,.16,3.3,8,'#f6e8ef');
  box(g,0,3.35,0,8,.12,8,'#fff1fa');box(g,0,1.65,4,8,3.3,.16,palette.wall);box(g,0,1.05,3.89,1.35,2.1,.06,palette.trim);ball(g,.43,1.05,3.82,.05,.05,.04,'#ffe1a5');box(g,0,.015,3.6,1.3,.035,.55,palette.trim);sign(g,'EXIT TO RANCH',0,.35,3.85,1.6);
  for(const x of [-2.4,2.4]){box(g,x,1.9,-3.88,1.7,1.5,.06,'#a9d8ea');box(g,x,1.9,-3.81,.05,1.5,.04,'#fff7ea');box(g,x,1.9,-3.81,1.7,.05,.04,'#fff7ea');for(const side of [-1,1])box(g,x+side*.88,1.9,-3.75,.24,1.75,.08,'#d4b8e5');}
  cylinder(g,0,.055,0,1.7,1.7,.035,shed?'#d4bee8':'#f0bed7');
  if(shed){box(g,0,.52,-3.3,1.8,1,.6,'#cdb5db');sign(g,'CREATOR’S ROOM',0,2.9,-3.7,2.7);}
  else sign(g,'HOME SWEET HOME',0,2.9,-3.7,2.8);
  for(const [id,p] of Object.entries(state.decor||{})){if(p.room!==state.room)continue;const m=furnitureMesh(id);m.position.set(SPOTS[p.spot][0],0,SPOTS[p.spot][1]);m.rotation.y=p.rotation*Math.PI/2;g.add(m);}
 }
 blocked(x,y,state){if(waterAt(state,x,y)&&!isSwimOutfit(state.avatar.outfit))return true;if(state.room){if(x<395||x>565||y<205||y>380)return true;return Object.values(state.decor||{}).some(p=>p.room===state.room&&Math.hypot(wx(x)-SPOTS[p.spot][0],wz(y)-SPOTS[p.spot][1])<.7);}if(state.biome!=='ranch')return false;return (x>373&&x<527&&y>155&&y<256)||(x>634&&x<736&&y>165&&y<255);}
 candidates(state,wild,residents,nodes,clock){return state.biome==='ranch'?[...residents.values()].map(o=>({type:'resident',object:o})):[...wild.filter(c=>c.wait<=clock).map(o=>({type:'creature',object:o})),...nodes.filter(n=>n.ready<=clock).map(o=>({type:'material',object:o}))];}
 aim(state,items){let best=null;for(const item of items){const distance=Math.hypot(item.object.x-state.x,item.object.y-state.y);if(!best||distance<best.distance)best={...item,distance};}return best;}
 animateVacuum(){this.pulse=.55;}
 render(state,wild,residents,nodes,wisps,clock,dt,beam,moving){
  this.terrain(state);this.sky.position.set(wx(state.x),0,wz(state.y));this.cameraState(state,clock,moving&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ts=JSON.stringify([state.toolStyle,state.avatar.skin,state.owned.includes('long-reach'),state.avatar.outfit,state.coat]);if(ts!==this.lastTool){this.lastTool=ts;this.vacuum.clear();this.vacuum.add(vacuumMesh(state.toolStyle,state.avatar.skin,state.owned.includes('long-reach'),OUTFIT_COLORS[state.avatar.outfit]||state.coat));}
  this.pulse=Math.max(0,this.pulse-dt);this.vacuum.rotation.z=this.pulse?Math.sin(clock*40)*.03:0;this.vacuum.position.z=-.7+(this.pulse?Math.sin(this.pulse*8)*.04:0);
  const creatures=state.room?[]:state.biome==='ranch'?[...residents.values()]:wild.filter(c=>c.wait<=clock),active=new Set();
  for(const [i,c] of creatures.entries()){const key=state.biome==='ranch'?`r${c.id}`:`w${wild.indexOf(c)}`,sig=String(c.species);active.add(key);let entry=this.actors.get(key);
   if(!entry||entry.species!==sig){if(entry)this.dynamic.remove(entry.group);const group=creatureMesh(c.species),shadow=blob(group,0,0,.48);entry={group,species:sig};this.actors.set(key,entry);this.dynamic.add(group);}
   entry.group.position.set(wx(c.x),state.biome==='reef'?.6+Math.sin(clock*1.5+c.seed)*.22:c.rest>0?0:Math.abs(Math.sin(clock*4+c.seed))*.035,wz(c.y));const desired=c.goal?Math.atan2(c.goal.x-c.x,c.goal.y-c.y):0;
   entry.group.rotation.y+=Math.atan2(Math.sin(desired-entry.group.rotation.y),Math.cos(desired-entry.group.rotation.y))*Math.min(1,dt*2);
  }
  for(const [key,entry] of this.actors)if(!active.has(key)){this.dynamic.remove(entry.group);this.actors.delete(key);}
  const resourceActive=new Set();
  if(state.biome!=='ranch')for(const [i,n] of nodes.entries()){
   const key=`node${i}`;resourceActive.add(key);let entry=this.resources.get(key);
   if(!entry||entry.type!==n.type){if(entry)this.dynamic.remove(entry.group);const g=new THREE.Group();
    if(n.type==='berries'){ball(g,0,.36,0,.55,.4,.47,'#87ae82');for(let k=0;k<6;k++)ball(g,Math.cos(k)*.4,.4+Math.sin(k*2)*.18,Math.sin(k)*.35,.09,.09,.09,'#e9acbd');}
    if(n.type==='wood'){for(let k=0;k<3;k++){const log=cylinder(g,(k-1)*.19,.15+k*.05,0,.12,.12,.85,'#bd9875');log.rotation.z=Math.PI/2+(k-1)*.22;}}
    if(n.type==='stone'||n.type==='metal'){for(let k=0;k<4;k++){const crystal=new THREE.Mesh(geometry('crystal',()=>new THREE.IcosahedronGeometry(.23,1)),material(n.type==='metal'?'#a9d7d8':'#c5b6ed'));crystal.position.set((k-1.5)*.16,.23+k%2*.15,0);crystal.scale.y=1.8;g.add(crystal);}}
    entry={group:g,type:n.type};this.resources.set(key,entry);this.dynamic.add(g);
   }
   entry.group.visible=n.ready<=clock;entry.group.position.set(wx(n.x),0,wz(n.y));
  }
  for(const [key,entry] of this.resources)if(!resourceActive.has(key)){this.dynamic.remove(entry.group);this.resources.delete(key);}
  if(!this.wispGroup){this.wispGroup=new THREE.Group();this.scene.add(this.wispGroup);this.wispMeshes=[];}
  while(this.wispMeshes.length<wisps.length){const g=new THREE.Group();ball(g,0,.6,0,.27,.31,.26,'#b9a9d8');ball(g,-.09,.65,.245,.025,.035,.016,'#6d6081');ball(g,.09,.65,.245,.025,.035,.016,'#6d6081');this.wispMeshes.push(g);this.wispGroup.add(g);}
  this.wispMeshes.forEach((g,i)=>{g.visible=Boolean(wisps[i]);if(g.visible)g.position.set(wx(wisps[i].x),Math.sin(clock*2+i)*.1,wz(wisps[i].y));});
  if(state.pet!==this.petId){if(this.pet)this.scene.remove(this.pet);this.petId=state.pet;this.pet=state.pet?petMesh(state.pet):null;if(this.pet){this.pet.position.set(wx(state.x)+1,0,wz(state.y)+1);this.scene.add(this.pet);}}
  if(this.pet)this.pet.visible=!state.room;
  if(this.pet){const px=wx(state.x)+Math.cos(state.yaw)*.95-Math.sin(state.yaw)*1.8,pz=wz(state.y)-Math.sin(state.yaw)*.95-Math.cos(state.yaw)*1.8;this.pet.position.x+=(px-this.pet.position.x)*Math.min(1,dt*3);this.pet.position.z+=(pz-this.pet.position.z)*Math.min(1,dt*3);this.pet.position.y=Math.abs(Math.sin(clock*4))*.045;this.pet.rotation.y=Math.atan2(wx(state.x)-this.pet.position.x,wz(state.y)-this.pet.position.z);}
  this.suction.visible=Boolean(beam&&clock-beam.started<beam.duration);if(this.suction.visible){const t=(clock-beam.started)/beam.duration;this.suctionDots.forEach((m,i)=>{const p=(t+i/14)%1;m.position.set(wx(beam.x)+(this.camera.position.x-wx(beam.x))*p+Math.sin(i*3+p*15)*.15,.45+(1.22-.45)*p,wz(beam.y)+(this.camera.position.z-wz(beam.y))*p);});}
  this.scenery.traverse(o=>{if(o.isSprite&&o.userData.labelWidth){const distance=o.getWorldPosition(new THREE.Vector3()).distanceTo(this.camera.position),w=Math.min(o.userData.labelWidth,distance*.35);o.scale.set(w,w/5.12,1);}});
  this.vacuum.visible=true;
  this.renderer.render(this.scene,this.camera);
 }
}
export class AvatarPreview {
 constructor(canvas){this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2.5));this.renderer.setSize(280,260,false);this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,280/260,.1,20);this.camera.position.set(0,1.1,3.6);this.camera.lookAt(0,.9,0);this.scene.add(new THREE.HemisphereLight('#fffaf4','#bea7b5',2.8));const light=new THREE.DirectionalLight('#fff8e5',2);light.position.set(-3,5,4);this.scene.add(light);this.signature='';}
 render(state,time){const sig=JSON.stringify([state.avatar,state.coat]);if(sig!==this.signature){this.signature=sig;if(this.model)this.scene.remove(this.model);this.model=avatarMesh(state);this.scene.add(this.model);}this.model.rotation.y=Math.sin(time*.4)*.3;this.renderer.render(this.scene,this.camera);}
}
