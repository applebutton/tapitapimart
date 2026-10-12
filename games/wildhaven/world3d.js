import * as THREE from '../../vendor/three/three.module.js';
import { BIOMES, PENS, creatureInfo } from './engine.js';
const SCALE=.04;
const wx=x=>(x-480)*SCALE, wz=y=>(y-290)*SCALE;
const geo=new Map(), mats=new Map(), labels=new Map();
const shadowMaterial=new THREE.MeshBasicMaterial({color:'#566656',transparent:true,opacity:.12,depthWrite:false});
function material(color, glow=false){const key=color+glow;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.85,metalness:.02,...(glow?{emissive:color,emissiveIntensity:.5}:{})}));return mats.get(key);}
function geometry(key,create){if(!geo.has(key))geo.set(key,create());return geo.get(key);}
function ball(parent,x,y,z,sx,sy,sz,color){const m=new THREE.Mesh(geometry('sphere',()=>new THREE.SphereGeometry(1,20,14)),material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,color,round=.07){
 const key=`box:${w}:${h}:${d}:${round}`;
 const g=geometry(key,()=>{
  const r=Math.min(round,w/4,h/4,d/4),s=new THREE.Shape(),a=-w/2+r,b=-h/2+r,W=w-2*r,H=h-2*r;
  s.moveTo(a+r,b);s.lineTo(a+W-r,b);s.quadraticCurveTo(a+W,b,a+W,b+r);s.lineTo(a+W,b+H-r);s.quadraticCurveTo(a+W,b+H,a+W-r,b+H);s.lineTo(a+r,b+H);s.quadraticCurveTo(a,b+H,a,b+H-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
  const g=new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r,bevelThickness:r,curveSegments:6});g.translate(0,0,-(d-2*r)/2);return g;
 });const m=new THREE.Mesh(g,material(color));m.position.set(x,y,z);parent.add(m);return m;
}
function cylinder(parent,x,y,z,top,bottom,height,color){const key=`cyl:${top}:${bottom}:${height}`;const m=new THREE.Mesh(geometry(key,()=>new THREE.CylinderGeometry(top,bottom,height,16)),material(color));m.position.set(x,y,z);parent.add(m);return m;}
function torus(parent,x,y,z,r,tube,color){const m=new THREE.Mesh(geometry(`ring:${r}:${tube}`,()=>new THREE.TorusGeometry(r,tube,8,24)),material(color));m.position.set(x,y,z);parent.add(m);return m;}
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
export function creatureMesh(type){
 const s=creatureInfo(type),g=new THREE.Group();
 // Original round, shy little characters: soft balls, tiny faces, little feet.
 ball(g,0,.49,0,.49,.48,.43,s.color);ball(g,0,.35,.33,.30,.23,.13,s.giant?s.accent:'#fff1d9');
 ball(g,-.20,.085,.10,.14,.075,.15,s.color);ball(g,.20,.085,.10,.14,.075,.15,s.color);
 ball(g,-.43,.4,.035,.085,.12,.09,s.color);ball(g,.43,.4,.035,.085,.12,.09,s.color);
 face(g);
 if(s.shape==='bunny'){ball(g,-.19,.94,0,.12,.20,.11,s.color);ball(g,.19,.94,0,.12,.20,.11,s.color);}
 if(s.shape==='fox'){ball(g,-.28,.87,0,.15,.15,.14,s.color);ball(g,.28,.87,0,.15,.15,.14,s.color);ball(g,0,.30,-.43,.19,.16,.20,s.accent);}
 if(s.shape==='moth'){ball(g,-.45,.55,-.05,.19,.25,.08,'#ecddf3');ball(g,.45,.55,-.05,.19,.25,.08,'#ecddf3');}
 if(s.shape==='drop')ball(g,.04,.93,0,.10,.13,.10,'#c2efe4');
 if(s.shape==='round'){ball(g,-.08,.94,0,.11,.08,.1,'#ffeac0');ball(g,.08,.94,0,.11,.08,.1,'#ffeac0');}
 if(s.giant){g.scale.setScalar(1.75);ball(g,0,.94,.25,.09,.09,.045,'#fff1b0');}
 return anime(g);
}
export function avatarMesh(state){
 const g=new THREE.Group(),a=state.avatar,hair=a.hairColor,skin=a.skin;
 const outfit=a.outfit==='sugarcloud-dress'?'#cbb8ee':a.outfit==='cloud-dress'?'#bdd7ef':a.outfit==='star-hoodie'?'#dca9c7':state.coat;
 ball(g,-.17,.19,0,.12,.20,.12,'#b29b8b');ball(g,.17,.19,0,.12,.20,.12,'#b29b8b');
 ball(g,-.17,.06,.10,.15,.075,.20,'#fff1d9');ball(g,.17,.06,.10,.15,.075,.20,'#fff1d9');
 ball(g,0,.63,0,.31,.42,.24,outfit);
 if(a.outfit==='cloud-dress')cylinder(g,0,.4,0,.23,.42,.4,outfit);
 if(a.outfit==='overalls'){box(g,0,.66,.245,.34,.40,.065,'#ecd3aa');ball(g,-.1,.82,.29,.025,.025,.015,'#b79b75');ball(g,.1,.82,.29,.025,.025,.015,'#b79b75');}
 if(a.outfit==='star-hoodie'){ball(g,0,.74,.255,.10,.10,.025,'#f9e3a2');}
 ball(g,-.36,.65,0,.10,.28,.11,outfit);ball(g,.36,.65,0,.10,.28,.11,outfit);
 ball(g,-.38,.40,.01,.085,.10,.085,skin);ball(g,.38,.40,.01,.085,.10,.085,skin);
 ball(g,0,1.28,-.04,.38,.40,.32,hair);ball(g,0,1.20,.09,.31,.31,.28,skin);
 ball(g,-.17,1.45,.20,.17,.14,.17,hair);ball(g,.12,1.48,.16,.21,.14,.18,hair);
 if(a.hair==='bob'){ball(g,-.30,1.16,0,.12,.29,.22,hair);ball(g,.30,1.16,0,.12,.29,.22,hair);}
 if(a.hair==='curls')for(let i=0;i<9;i++){const t=i/9*Math.PI*2;ball(g,Math.cos(t)*.31,1.30+Math.sin(t)*.26,-.02,.15,.15,.15,hair);}
 if(a.hair==='ponytail'){ball(g,0,1.40,-.39,.20,.20,.22,hair);ball(g,0,1.08,-.40,.15,.28,.17,hair);}
 if(a.hair==='space-buns'){ball(g,-.33,1.58,-.04,.20,.20,.19,hair);ball(g,.33,1.58,-.04,.20,.20,.19,hair);}
 animeEye(g,-.105,1.23,.346,.051);animeEye(g,.105,1.23,.346,.051);
 ball(g,-.19,1.16,.31,.05,.022,.013,'#db9f96');ball(g,.19,1.16,.31,.05,.022,.013,'#db9f96');ball(g,0,1.13,.359,.028,.014,.01,'#a77870');
 if(a.hair==='sugarcloud-waves'){
  for(const side of [-1,1]){ball(g,side*.32,.97,-.1,.16,.48,.20,hair);ball(g,side*.40,.70,-.08,.16,.23,.18,hair);bow(g,side*.31,1.1,.13,.085);}
  for(let i=0;i<5;i++)ball(g,(i-2)*.09,1.43-Math.abs(i-2)*.018,.27,.08,.15,.095,hair);
 }
 if(a.outfit==='sugarcloud-dress'){
  ball(g,-.17,.21,.03,.105,.17,.12,'#fff4fa');ball(g,.17,.21,.03,.105,.17,.12,'#fff4fa');
  for(const side of [-1,1]){ball(g,side*.17,.065,.12,.155,.09,.21,'#efa8c4');bow(g,side*.17,.15,.21,.055);ball(g,side*.37,.64,.015,.14,.24,.14,'#f2b5d0');torus(g,side*.38,.44,.06,.09,.025,'#fff5fa');}
  for(let j=0;j<3;j++){const radius=.34+j*.055,y=.52-j*.09;cylinder(g,0,y,0,radius-.055,radius,.15,j===1?'#efb0d0':'#cbb8ee');for(let i=0;i<16;i++){const t=i/16*Math.PI*2;ball(g,Math.sin(t)*radius,y-.07,Math.cos(t)*radius,.055,.037,.055,'#fff4fa');}}
  bow(g,0,.88,.25,.115);bow(g,-.22,.49,.30,.08);bow(g,.22,.49,.30,.08);
  const strap=box(g,.06,.73,.265,.035,.46,.025,'#efadd0');strap.rotation.z=-.6;
  ball(g,.25,.54,.31,.12,.12,.055,'#f0a5c8');bow(g,.25,.56,.37,.055);
  ball(g,.34,.38,.33,.066,.057,.04,'#fff1e4');ball(g,.32,.43,.33,.022,.03,.025,'#fff1e4');ball(g,.37,.43,.33,.022,.03,.025,'#fff1e4');animeEye(g,.32,.385,.369,.009);animeEye(g,.36,.385,.369,.009);
 }
 if(a.accessory==='bunny-beret'){
  ball(g,0,1.61,-.025,.41,.17,.34,'#fff4fa');
  for(let i=0;i<14;i++){const t=i/14*Math.PI*2;ball(g,Math.sin(t)*.35,1.57,Math.cos(t)*.27,.08,.055,.065,'#fff9fd');}
  for(const side of [-1,1]){const ear=ball(g,side*.43,1.39,0,.13,.29,.11,'#fff4fa');ear.rotation.z=side*.35;const inner=ball(g,side*.44,1.38,.09,.065,.19,.025,'#f3b5d0');inner.rotation.z=side*.35;bow(g,side*.29,1.65,.23,.09);}
 }
 if(a.accessory==='star-clip'){ball(g,.28,1.45,.26,.065,.065,.025,'#ffe290');torus(g,.28,1.45,.29,.067,.012,'#fff0be');}
 if(a.accessory==='round-glasses'){torus(g,-.11,1.23,.38,.082,.012,'#77657f');torus(g,.11,1.23,.38,.082,.012,'#77657f');box(g,0,1.23,.382,.07,.016,.016,'#77657f',.004);}
 return anime(g);
}
function petMesh(type){const g=new THREE.Group(),col=type==='cloud-cat'?'#f6eadb':'#e6bf91';ball(g,0,.32,0,.34,.32,.31,col);ball(g,0,.2,.23,.21,.16,.08,'#fff7e7');ball(g,-.2,.60,0,.11,.13,.09,col);ball(g,.2,.60,0,.11,.13,.09,col);animeEye(g,-.09,.36,.29,.035);animeEye(g,.09,.36,.29,.035);ball(g,-.18,.30,.26,.04,.02,.015,'#e9a6bb');ball(g,.18,.30,.26,.04,.02,.015,'#e9a6bb');ball(g,0,.29,.32,.025,.02,.012,'#b78b86');ball(g,0,.28,-.32,.12,.15,.16,col);return anime(g);}
function vacuumMesh(style,skin,longReach,clothes){
 const g=new THREE.Group(),body=style==='petal'?'#eab5ce':style==='starlight'?'#b7a7dc':'#acd9d2',trim=style==='starlight'?'#e5cd8e':'#f4e5cf';
 ball(g,.04,-.16,.09,.11,.12,.19,skin);box(g,.04,-.23,.28,.2,.2,.30,clothes,.07);box(g,0,0,0,.38,.36,.66,body,.1);box(g,0,.035,.07,.26,.25,.35,'#d4efe8',.06);
 torus(g,0,0,-.31,.18,.035,trim);const nozzle=cylinder(g,0,0,longReach?-.59:-.48,.20,.14,longReach?.56:.34,body);nozzle.rotation.x=Math.PI/2;
 torus(g,0,0,longReach?-.87:-.65,.215,.035,trim);const end=cylinder(g,0,0,longReach?-.88:-.66,.18,.18,.025,'#668d93');end.rotation.x=Math.PI/2;
 ball(g,.08,.22,.02,.065,.065,.065,'#fff0a8');box(g,0,-.28,.12,.14,.32,.14,body,.045);g.rotation.set(-.04,-.12,-.1);return g;
}
export class World3D {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#dcecf0');this.scene.fog=new THREE.Fog('#dcecf0',22,56);
  this.camera=new THREE.PerspectiveCamera(65,1,.04,100);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  this.scene.add(new THREE.HemisphereLight('#fff7ed','#9ab28d',2.1));const sun=new THREE.DirectionalLight('#fff5de',2.5);sun.position.set(-8,16,9);this.scene.add(sun);
  this.scenery=new THREE.Group();this.scene.add(this.scenery);this.dynamic=new THREE.Group();this.scene.add(this.dynamic);this.actors=new Map();this.resources=new Map();this.lastScene='';this.lastTool='';this.pet=null;this.petId=null;
  this.vacuum=new THREE.Group();this.camera.add(this.vacuum);this.vacuum.position.set(.36,-.34,-.65);this.vacuum.scale.setScalar(.6);
  this.suction=new THREE.Group();this.scene.add(this.suction);this.suctionDots=Array.from({length:14},()=>ball(this.suction,0,0,0,.055,.055,.055,'#fff0ff'));
  this.pulse=0;this.resize();new ResizeObserver(()=>this.resize()).observe(canvas);
 }
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 cameraState(state,time=0,moving=false){this.camera.position.set(wx(state.x),1.55+(moving?Math.sin(time*9)*.012:0),wz(state.y));this.camera.rotation.set(state.pitch||0,state.yaw||0,0,'YXZ');this.camera.updateMatrixWorld();}
 terrain(state){
  const signature=JSON.stringify([state.biome,state.homeLevel,state.ranchTheme,state.owned.filter(id=>['lanterns','sofa','table','chair','planter'].includes(id))]);if(signature===this.lastScene)return;this.lastScene=signature;this.scenery.clear();
  const g=this.scenery,b=BIOMES[state.biome];this.scene.background.set(state.biome==='ridge'?'#e2e0f0':'#dcecf0');this.scene.fog.color.copy(this.scene.background);
  box(g,0,-.14,0,65,.25,65,b.ground,.03);
  const path=state.biome==='ridge'?'#dad4e0':'#ece0bd';box(g,0,.015,2.5,2.6,.04,25,path,.02);
  for(let i=0;i<32;i++){
   const a=i/32*Math.PI*2,x=Math.cos(a)*21,z=Math.sin(a)*17;
   cylinder(g,x,1,z,.14,.22,2,'#b49c79');ball(g,x,2.9,z,1.5,1.6,1.4,state.biome==='ridge'?'#b0b5d1':i%2?'#9cbd83':'#83a976');blob(g,x,z,1.4);
  }
  for(let i=0;i<14;i++){const a=i*2.4;ball(g,Math.cos(a)*29,1,Math.sin(a)*25,7,3.5,5,state.biome==='ridge'?'#bdc4db':'#b8ceac');}
  // Rounded flowers, pebbles, and distant cloud puffs bring depth without image downloads.
  for(let i=0;i<48;i++){const x=((i*37)%310-155)/10,z=((i*53)%195-100)/10;if(Math.abs(x)<1.6)continue;ball(g,x,.09,z,.09,.09,.09,i%3?'#fff0bc':'#edc0d3');}
  for(let i=0;i<8;i++){const x=(i-4)*6,z=-23+(i%3)*9;ball(g,x,9+i%2,z,2,.55,.8,'#fff9f0');ball(g,x+.8,9.2+i%2,z,.9,.6,.8,'#fff9f0');}
  if(state.biome==='ranch')this.ranch(state);
  else {ball(g,wx(820),.025,wz(160),3,.035,1.8,'#99c7cc');for(let i=0;i<7;i++)ball(g,wx(720+i*26),.08,wz(130+i%2*40),.3,.15,.25,'#b9c5b2');}
 }
 ranch(state){
  const g=this.scenery,modern=state.ranchTheme==='modern',cute=state.ranchTheme==='cute',trim=cute?'#d2b4df':modern?'#c4d9d5':'#f0dec2',roof=cute?'#e4b9d2':modern?'#b0c9c7':'#c999a0';
  const house=new THREE.Group();house.position.set(wx(450),0,wz(205));g.add(house);
  if(state.homeLevel===0){const tent=new THREE.Mesh(geometry('tent',()=>new THREE.ConeGeometry(2.5,2.8,4)),material('#ddbdcf'));tent.position.y=1.4;tent.rotation.y=Math.PI/4;house.add(tent);box(house,0,.65,1.45,1.0,1.3,.08,'#8e7a91',.1);sign(house,'YOUR LITTLE HOME',0,3.2,0,3);}
  else {
   box(house,0,1.4,0,5.8,2.8,3.5,modern?'#efede6':'#f0dbb2',.13);
   if(modern)box(house,0,2.93,0,6.2,.35,3.9,roof,.15);
   else {const r=new THREE.Mesh(geometry('roof',()=>new THREE.ConeGeometry(4.2,1.6,4)),material(roof));r.position.y=3.5;r.rotation.y=Math.PI/4;r.scale.z=.73;house.add(r);}
   box(house,0,.85,1.81,.94,1.7,.14,trim,.15);ball(house,.3,.85,1.91,.045,.045,.045,'#b78d5f');
   for(const x of [-1.85,1.85]){box(house,x,1.55,1.81,1.04,1.05,.16,'#c4e1df',.10);box(house,x,1.55,1.92,.045,1,.04,'#fff1d2',.008);}
   if(state.homeLevel>=2){box(house,0,.12,2.4,6.5,.22,1.5,'#dbc2a7',.1);for(const x of [-1.85,1.85]){box(house,x,.96,1.94,1.2,.22,.30,roof,.08);for(let i=0;i<4;i++)ball(house,x-.4+i*.27,1.13,1.97,.13,.13,.12,i%2?'#ecdce7':'#f5dfa5');}}
   if(state.homeLevel>=3){box(house,1.8,3.8,-.5,.5,1.3,.5,'#dcc9bc',.08);ball(house,1.8,4.65,-.5,.22,.15,.19,'#f6f2ea');}
   sign(house,'HOME SWEET HOME',0,4.7,0,3);
  }
  const shed=new THREE.Group();shed.position.set(wx(685),0,wz(210));g.add(shed);box(shed,0,1.15,0,3.65,2.3,3,'#c5d9d0',.15);box(shed,0,2.5,0,4.05,.45,3.35,'#d4b9db',.16);box(shed,-.62,.78,1.55,.85,1.56,.13,'#f0dbc0',.12);box(shed,.75,1.22,1.55,1.2,.85,.10,'#a0c8cb',.10);box(shed,.75,.70,1.77,1.5,.16,.6,'#e8d0bc',.05);sign(shed,"CREATOR'S SHED",0,3.15,.5,3.8);ball(shed,1.25,2.97,0,.2,.2,.16,'#fff0b9');
  box(g,wx(685),.01,wz(284),4,.025,2.6,'#e9dccb',.02);
  for(const p of PENS){const x=wx(p.x),z=wz(p.y),w=p.width*SCALE,d=p.height*SCALE;box(g,x+w/2,.008,z+d/2,w,.02,d,p.color,.02);
   for(let k=0;k<=10;k++){const px=x+k*w/10;for(const pz of [z,z+d])cylinder(g,px,.45,pz,.055,.06,.9,trim);}
   for(let k=0;k<=7;k++){const pz=z+k*d/7;for(const px of [x,x+w])cylinder(g,px,.45,pz,.055,.06,.9,trim);}
   for(const pz of [z,z+d])for(const h of [.27,.65])box(g,x+w/2,h,pz,w,.075,.085,trim,.03);
   for(const px of [x,x+w])for(const h of [.27,.65])box(g,px,h,z+d/2,.085,.075,d,trim,.03);
   sign(g,p.name,x+w/2,1.25,z,2.4);
  }
  const patioX=wx(250),patioZ=wz(240);if(state.owned.some(id=>['sofa','table','chair'].includes(id)))box(g,patioX,.06,patioZ,5,.12,3.5,'#e8d8cc',.08);
  if(state.owned.includes('sofa')){box(g,patioX,.45,patioZ-.6,2.5,.65,1.0,'#d7bdd6',.18);box(g,patioX,.9,patioZ-1.0,2.5,.8,.32,'#e2c8dc',.14);for(const x of [-1.12,1.12])box(g,patioX+x,.77,patioZ-.6,.3,.6,1,'#d5b7cd',.12);}
  if(state.owned.includes('table')){cylinder(g,patioX+.15,.67,patioZ+.75,.65,.65,.14,'#eee0cb');cylinder(g,patioX+.15,.35,patioZ+.75,.13,.21,.65,'#c7aa8f');}
  if(state.owned.includes('chair')){ball(g,patioX+1.7,.52,patioZ+.6,.47,.20,.43,'#aed0c3');ball(g,patioX+1.7,.9,patioZ+.31,.45,.48,.16,'#bedbcd');cylinder(g,patioX+1.7,.22,patioZ+.6,.09,.17,.4,'#b59c82');}
  if(state.owned.includes('planter')){cylinder(g,wx(535),.35,wz(280),.4,.3,.65,'#e4c69e');ball(g,wx(535),.96,wz(280),.55,.48,.48,'#aacb8c');}
  if(state.owned.includes('lanterns'))for(const [x,z] of [[wx(590),wz(278)],[wx(360),wz(280)],[wx(720),wz(275)]]){cylinder(g,x,.85,z,.04,.065,1.7,'#bca687');ball(g,x,1.8,z,.23,.3,.23,'#ffe7ac').material=material('#ffe7ac',true);}
 }
 blocked(x,y,state){if(state.biome!=='ranch')return false;return (x>373&&x<527&&y>155&&y<256)||(x>634&&x<736&&y>165&&y<255);}
 candidates(state,wild,residents,nodes,clock){return state.biome==='ranch'?[...residents.values()].map(o=>({type:'resident',object:o})):[...wild.filter(c=>c.wait<=clock).map(o=>({type:'creature',object:o})),...nodes.filter(n=>n.ready<=clock).map(o=>({type:'material',object:o}))];}
 aim(state,items){
  this.cameraState(state);let best=null,bestScore=Infinity;
  for(const item of items){const o=item.object,info=creatureInfo(o.species),v=new THREE.Vector3(wx(o.x),info?.giant?.9:.45,wz(o.y));const distance=Math.hypot(o.x-state.x,o.y-state.y);v.project(this.camera);
   if(v.z>1||v.z<0||Math.abs(v.x)>.34||Math.abs(v.y)>.45)continue;
   const score=Math.hypot(v.x,v.y)*180+distance*.1;if(score<bestScore){best={...item,distance};bestScore=score;}
  }return best;
 }
 animateVacuum(){this.pulse=.55;}
 render(state,wild,residents,nodes,wisps,clock,dt,beam,moving){
  this.terrain(state);this.cameraState(state,clock,moving&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ts=JSON.stringify([state.toolStyle,state.avatar.skin,state.owned.includes('long-reach'),state.avatar.outfit,state.coat]);if(ts!==this.lastTool){this.lastTool=ts;this.vacuum.clear();this.vacuum.add(vacuumMesh(state.toolStyle,state.avatar.skin,state.owned.includes('long-reach'),state.avatar.outfit==='sugarcloud-dress'?'#f2b5d0':state.avatar.outfit==='cloud-dress'?'#bdd7ef':state.avatar.outfit==='star-hoodie'?'#dca9c7':state.coat));}
  this.pulse=Math.max(0,this.pulse-dt);this.vacuum.rotation.z=this.pulse?Math.sin(clock*40)*.03:0;this.vacuum.position.z=-.65+(this.pulse?Math.sin(this.pulse*8)*.04:0);
  const creatures=state.biome==='ranch'?[...residents.values()]:wild.filter(c=>c.wait<=clock),active=new Set();
  for(const [i,c] of creatures.entries()){const key=state.biome==='ranch'?`r${c.id}`:`w${wild.indexOf(c)}`,sig=String(c.species);active.add(key);let entry=this.actors.get(key);
   if(!entry||entry.species!==sig){if(entry)this.dynamic.remove(entry.group);const group=creatureMesh(c.species),shadow=blob(group,0,0,.48);entry={group,species:sig};this.actors.set(key,entry);this.dynamic.add(group);}
   entry.group.position.set(wx(c.x),c.rest>0?0:Math.abs(Math.sin(clock*4+c.seed))*.035,wz(c.y));const desired=c.goal?Math.atan2(c.goal.x-c.x,c.goal.y-c.y):0;
   entry.group.rotation.y+=Math.atan2(Math.sin(desired-entry.group.rotation.y),Math.cos(desired-entry.group.rotation.y))*Math.min(1,dt*2);
  }
  for(const [key,entry] of this.actors)if(!active.has(key)){this.dynamic.remove(entry.group);this.actors.delete(key);}
  const resourceActive=new Set();
  if(state.biome!=='ranch')for(const [i,n] of nodes.entries()){
   const key=`node${i}`;resourceActive.add(key);let entry=this.resources.get(key);
   if(!entry||entry.type!==n.type){if(entry)this.dynamic.remove(entry.group);const g=new THREE.Group();
    if(n.type==='berries'){ball(g,0,.36,0,.55,.4,.47,'#87ae82');for(let k=0;k<6;k++)ball(g,Math.cos(k)*.4,.4+Math.sin(k*2)*.18,Math.sin(k)*.35,.09,.09,.09,'#e9acbd');}
    if(n.type==='wood'){for(let k=0;k<3;k++){const log=cylinder(g,(k-1)*.19,.15+k*.05,0,.12,.12,.85,'#bd9875');log.rotation.z=Math.PI/2+(k-1)*.22;}}
    if(n.type==='stone'||n.type==='metal'){for(let k=0;k<3;k++)ball(g,(k-1)*.23,.15+k%2*.13,0,.24,.21+k%2*.1,.23,n.type==='metal'?'#a5bbc2':'#becae2');}
    entry={group:g,type:n.type};this.resources.set(key,entry);this.dynamic.add(g);
   }
   entry.group.visible=n.ready<=clock;entry.group.position.set(wx(n.x),0,wz(n.y));
  }
  for(const [key,entry] of this.resources)if(!resourceActive.has(key)){this.dynamic.remove(entry.group);this.resources.delete(key);}
  if(!this.wispGroup){this.wispGroup=new THREE.Group();this.scene.add(this.wispGroup);this.wispMeshes=[];}
  while(this.wispMeshes.length<wisps.length){const g=new THREE.Group();ball(g,0,.6,0,.27,.31,.26,'#b9a9d8');ball(g,-.09,.65,.245,.025,.035,.016,'#6d6081');ball(g,.09,.65,.245,.025,.035,.016,'#6d6081');this.wispMeshes.push(g);this.wispGroup.add(g);}
  this.wispMeshes.forEach((g,i)=>{g.visible=Boolean(wisps[i]);if(g.visible)g.position.set(wx(wisps[i].x),Math.sin(clock*2+i)*.1,wz(wisps[i].y));});
  if(state.pet!==this.petId){if(this.pet)this.scene.remove(this.pet);this.petId=state.pet;this.pet=state.pet?petMesh(state.pet):null;if(this.pet){this.pet.position.set(wx(state.x)+1,0,wz(state.y)+1);this.scene.add(this.pet);}}
  if(this.pet){const px=wx(state.x)+Math.cos(state.yaw)*.95-Math.sin(state.yaw)*1.8,pz=wz(state.y)-Math.sin(state.yaw)*.95-Math.cos(state.yaw)*1.8;this.pet.position.x+=(px-this.pet.position.x)*Math.min(1,dt*3);this.pet.position.z+=(pz-this.pet.position.z)*Math.min(1,dt*3);this.pet.position.y=Math.abs(Math.sin(clock*4))*.045;this.pet.rotation.y=Math.atan2(wx(state.x)-this.pet.position.x,wz(state.y)-this.pet.position.z);}
  this.suction.visible=Boolean(beam&&clock-beam.started<beam.duration);if(this.suction.visible){const t=(clock-beam.started)/beam.duration;this.suctionDots.forEach((m,i)=>{const p=(t+i/14)%1;m.position.set(wx(beam.x)+(this.camera.position.x-wx(beam.x))*p+Math.sin(i*3+p*15)*.15,.45+(1.22-.45)*p,wz(beam.y)+(this.camera.position.z-wz(beam.y))*p);});}
  this.scenery.traverse(o=>{if(o.isSprite&&o.userData.labelWidth){const distance=o.getWorldPosition(new THREE.Vector3()).distanceTo(this.camera.position),w=Math.min(o.userData.labelWidth,distance*.35);o.scale.set(w,w/5.12,1);}});
  this.renderer.render(this.scene,this.camera);
 }
}
export class AvatarPreview {
 constructor(canvas){this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(280,260,false);this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,280/260,.1,20);this.camera.position.set(0,1.1,3.6);this.camera.lookAt(0,.9,0);this.scene.add(new THREE.HemisphereLight('#fffaf4','#bea7b5',2.8));const light=new THREE.DirectionalLight('#fff8e5',2);light.position.set(-3,5,4);this.scene.add(light);this.signature='';}
 render(state,time){const sig=JSON.stringify([state.avatar,state.coat]);if(sig!==this.signature){this.signature=sig;if(this.model)this.scene.remove(this.model);this.model=avatarMesh(state);this.scene.add(this.model);}this.model.rotation.y=Math.sin(time*.4)*.3;this.renderer.render(this.scene,this.camera);}
}
