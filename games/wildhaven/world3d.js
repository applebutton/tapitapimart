import * as THREE from '../../vendor/three/three.module.js';
import { BIOMES, PENS, creatureInfo } from './engine.js';
const SCALE=.04;
const wx=x=>(x-480)*SCALE, wz=y=>(y-290)*SCALE;
const geo=new Map(), mats=new Map(), labels=new Map();
const shadowMaterial=new THREE.MeshBasicMaterial({color:'#566656',transparent:true,opacity:.12,depthWrite:false});
function material(color, glow=false){const key=color+glow;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.85,metalness:.02,...(glow?{emissive:color,emissiveIntensity:.5}:{})}));return mats.get(key);}
function geometry(key,create){if(!geo.has(key))geo.set(key,create());return geo.get(key);}
function ball(parent,x,y,z,sx,sy,sz,color){const m=new THREE.Mesh(geometry(Math.max(sx,sy,sz)<.18?'detail-sphere':'sphere',()=>new THREE.SphereGeometry(1,Math.max(sx,sy,sz)<.18?10:20,Math.max(sx,sy,sz)<.18?7:14)),material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
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
 if(s.shape==='bunny'){for(const side of [-1,1]){const leaf=ball(g,side*.1,1.15,0,.065,.17,.025,'#8db991');leaf.rotation.z=side*.5;}ribbon(g,0,.26,.45,.09);}
 if(s.shape==='round'){for(let i=0;i<8;i++){const t=i/8*Math.PI*2;const petal=ball(g,Math.cos(t)*.22,.88+Math.sin(t)*.16,-.04,.10,.17,.035,'#ffe3a1');petal.rotation.z=-t;}ball(g,0,.93,.02,.11,.10,.025,'#fff0c4');}
 if(s.shape==='fox'){for(const side of [-1,1])ball(g,side*.28,.90,.105,.07,.09,.025,'#ffe9f3');ribbon(g,.29,.70,.27,.09);}
 if(s.shape==='moth'){for(const side of [-1,1]){ball(g,side*.50,.61,-.015,.21,.27,.035,'#d4b8e9');ball(g,side*.50,.61,.02,.13,.17,.015,'#f9e9f7');strand(g,[[side*.12,.86,0],[side*.17,1.05,0],[side*.24,1.08,0]],.012,'#b99bc9');ball(g,side*.24,1.08,0,.038,.038,.038,'#ffe4a2');}}
 if(s.shape==='drop'){torus(g,0,.94,0,.13,.015,'#ddfaff').rotation.x=Math.PI/2;ball(g,-.26,.65,.33,.045,.065,.016,'#f4ffff');}
 if(s.giant){g.scale.setScalar(1.75);ball(g,0,.94,.25,.09,.09,.045,'#fff1b0');}
 return anime(g);
}
function strand(g,points,radius,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const key='strand:'+JSON.stringify(points)+radius;const m=new THREE.Mesh(geometry(key,()=>new THREE.TubeGeometry(curve,14,radius,7,false)),material(color));g.add(m);return m;}
function ribbon(g,x,y,z,size,color='#ee9bbb'){
 for(const side of [-1,1]){const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(side*size,-size*.5,side*size,-size*.15);shape.lineTo(side*size,size*.6);shape.quadraticCurveTo(side*size*.5,size*.55,0,0);const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),material(color));m.material.side=THREE.DoubleSide;m.position.set(x,y,z);g.add(m);}
 ball(g,x,y,z,.025,.03,.025,'#ffd6e4');for(const side of [-1,1]){const tail=box(g,x+side*size*.22,y-size*.65,z,.035,size,.012,color,.005);tail.rotation.z=side*.25;}
}
export function avatarMesh(state){
 const g=new THREE.Group(),a=state.avatar,skin=a.skin,hair=a.hairColor,sugar=a.outfit==='sugarcloud-dress',dress=sugar||a.outfit==='cloud-dress',cloth=sugar?'#c9b5ec':a.outfit==='cloud-dress'?'#bcd9f2':state.coat;
 // A human anime silhouette: shaped face, long articulated limbs, fitted bodice and flared skirt.
 for(const side of [-1,1]){
  cylinder(g,side*.115,.38,0,.065,.048,.65,dress?'#fff3f8':cloth);ball(g,side*.115,.055,.06,.09,.065,.15,sugar?'#eaa3c2':'#897c9d');
  if(sugar)ribbon(g,side*.115,.11,.18,.046);
  const arm=ball(g,side*.26,1.02,0,.075,.22,.085,sugar?'#efb5cf':cloth);arm.rotation.z=side*.14;
  cylinder(g,side*.29,.80,.015,.045,.035,.22,sugar?'#fff0f7':skin);ball(g,side*.29,.67,.025,.047,.068,.045,skin);
 }
 cylinder(g,0,1.0,0,.17,.135,.37,cloth);ball(g,0,1.15,0,.19,.11,.105,cloth);cylinder(g,0,1.27,0,.048,.06,.14,skin);
 if(dress){for(let tier=0;tier<3;tier++){const y=.86-tier*.115,r=.21+tier*.045;cylinder(g,0,y,0,r-.04,r,.16,tier===1&&sugar?'#efbad3':cloth);for(let n=0;n<28;n++){const t=n/28*Math.PI*2;ball(g,Math.sin(t)*r,y-.079,Math.cos(t)*r,.026,.018,.026,'#fff6fc');}}}
 else {for(const side of [-1,1])box(g,side*.09,.74,0,.15,.22,.17,cloth);}
 if(sugar){ribbon(g,0,1.17,.12,.095);for(const x of [-.17,.17])ribbon(g,x,.77,.21,.065);const strap=box(g,.065,.98,.115,.025,.40,.015,'#ed96bb');strap.rotation.z=-.5;ball(g,.21,.79,.17,.077,.075,.025,'#f1adc9');ribbon(g,.21,.81,.2,.048);ball(g,.28,.68,.16,.043,.037,.023,'#fff2e1');animeEye(g,.265,.685,.187,.007);animeEye(g,.293,.685,.187,.007);}
 // Tapered jaw and a less spherical face, with large outlined eyes and tiny nose.
 const faceProfile=[[0,1.29],[.07,1.32],[.145,1.39],[.19,1.51],[.18,1.64],[.13,1.71],[0,1.74]].map(([x,y])=>new THREE.Vector2(x,y));
 const head=new THREE.Mesh(geometry('anime-head',()=>new THREE.LatheGeometry(faceProfile,40)),material(skin));head.scale.z=.83;g.add(head);
 ball(g,0,1.56,-.075,.20,.21,.15,hair);
 animeEye(g,-.078,1.50,.142,.045);animeEye(g,.078,1.50,.142,.045);
 for(const side of [-1,1]){strand(g,[[side*.036,1.543,.156],[side*.076,1.558,.158],[side*.119,1.542,.144]],.008,'#62384f');ball(g,side*.125,1.425,.117,.032,.012,.005,'#ecacba');}
 ball(g,0,1.435,.162,.013,.018,.013,skin);strand(g,[[-.019,1.382,.126],[0,1.379,.137],[.019,1.382,.126]],.0035,'#9b6575');
 const long=a.hair==='sugarcloud-waves'||a.hair==='ponytail';
 for(let n=0;n<9;n++){const x=(n-4)*.041;strand(g,[[x*.65,1.72,.03],[x,1.68,.13],[x*1.07,1.57+Math.abs(n-4)*.006,.15]],.032,hair);}
 for(const side of [-1,1]){for(let n=0;n<4;n++){const x=side*(.165+n*.025);strand(g,[[side*.15,1.66,-.04],[x,1.42,-.015],[x+side*.025,long?1.13:1.28,.0],[x+side*.05,long?.94:1.25,-.015]],.028,hair);}if(long)ribbon(g,side*.20,1.35,.06,.06);}
 if(a.hair==='space-buns')for(const side of [-1,1])ball(g,side*.20,1.70,-.03,.09,.09,.085,hair);
 if(a.hair==='curls')for(let n=0;n<10;n++)ball(g,Math.sin(n)*.19,1.48+Math.cos(n)*.13,-.08,.07,.075,.07,hair);
 if(a.accessory==='bunny-beret'){ball(g,0,1.75,-.02,.24,.09,.20,'#fff5fb');for(const side of [-1,1]){const ear=ball(g,side*.255,1.56,0,.064,.20,.053,'#fff5fb');ear.rotation.z=side*.32;const inside=ball(g,side*.26,1.55,.045,.033,.14,.012,'#efb2cd');inside.rotation.z=side*.32;ribbon(g,side*.17,1.79,.12,.06);}}
 if(a.accessory==='round-glasses'){for(const side of [-1,1])torus(g,side*.078,1.50,.17,.056,.006,'#89739c');}
 if(a.accessory==='star-clip')ribbon(g,.15,1.65,.12,.055,'#f2d888');
 return anime(g);
}
function petMesh(type){const g=new THREE.Group(),col=type==='cloud-cat'?'#f6eadb':'#e6bf91';ball(g,0,.32,0,.34,.32,.31,col);ball(g,0,.2,.23,.21,.16,.08,'#fff7e7');ball(g,-.2,.60,0,.11,.13,.09,col);ball(g,.2,.60,0,.11,.13,.09,col);animeEye(g,-.09,.36,.29,.035);animeEye(g,.09,.36,.29,.035);ball(g,-.18,.30,.26,.04,.02,.015,'#e9a6bb');ball(g,.18,.30,.26,.04,.02,.015,'#e9a6bb');ball(g,0,.29,.32,.025,.02,.012,'#b78b86');ball(g,0,.28,-.32,.12,.15,.16,col);return anime(g);}
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
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(14,14);const m=new THREE.MeshStandardMaterial({map:texture,roughness:1});groundMaterials.set(ridge,m);return m;
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
export class World3D {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#dcecf0');this.scene.fog=new THREE.Fog('#efe0ee',24,85);
  const skyTexture=new THREE.TextureLoader().load(new URL('./anime-sky.png',import.meta.url).href);skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.offset.y=-.2;
  this.sky=new THREE.Mesh(new THREE.SphereGeometry(75,48,24),new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,fog:false,toneMapped:false}));this.scene.add(this.sky);
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
  const signature=JSON.stringify([state.biome,state.homeLevel,state.ranchTheme,state.owned.filter(id=>['lanterns','sofa','table','chair','planter'].includes(id))]);if(signature===this.lastScene)return;this.lastScene=signature;this.scenery.traverse(o=>{if(o.isInstancedMesh)o.dispose();});this.scenery.clear();
  const g=this.scenery,b=BIOMES[state.biome];this.scene.background.set(state.biome==='ridge'?'#e2e0f0':'#dcecf0');this.scene.fog.color.copy(this.scene.background);
  const ground=box(g,0,-.14,0,65,.25,65,state.biome==='ridge'?'#dbd0e9':'#c6dfce',.03);ground.material=paintedGround(state.biome==='ridge');
  const path=state.biome==='ridge'?'#e5dced':'#eedcdf';box(g,0,.015,2.5,2.6,.04,25,path,.02);
  for(let i=0;i<22;i++){const a=i/22*Math.PI*2;tree(g,Math.cos(a)*19,Math.sin(a)*15,i,state.biome==='ridge');}
  for(let i=0;i<90;i++){const x=((i*71)%340-170)/10,z=((i*43)%240-120)/10;if(Math.abs(x)<1.8)continue;flower(g,x,.13+i%3*.045,z,['#f3b6d5','#fff1dc','#cfbaed'][i%3],.09);}
  // Closer flower beds and a winding ribbon of individual stepping stones.
  for(let i=0;i<22;i++){const z=i*.85-9;const x=Math.sin(i*.4)*.45;const stone=cylinder(g,x,.04,z,.48,.5,.055,'#f6e5e8');stone.scale.z=.70;}
  if(state.biome==='ranch')this.ranch(state);
  else {ball(g,wx(820),.025,wz(160),3,.035,1.8,'#99c7cc');for(let i=0;i<7;i++)ball(g,wx(720+i*26),.08,wz(130+i%2*40),.3,.15,.25,'#b9c5b2');}
  batchScenery(g);
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
  // Storybook architectural details: scalloped awnings, shutters, lattice and flower boxes.
  for(const [building,width,depth] of [[house,5.8,1.82],[shed,3.65,1.56]]){
   if(building===house&&state.homeLevel===0)continue;
   for(let k=0;k<9;k++){const x=(k-4)*width/9;const awning=box(building,x,2.16,depth+.26,width/9+.02,.07,.7,k%2?'#fff3f7':'#e5b5d0',.015);awning.rotation.x=.16;ball(building,x,2.05,depth+.60,width/18,.09,.025,k%2?'#fff3f7':'#e5b5d0');}
   for(const side of [-1,1]){const x=side*(building===house?1.85:1.15);for(const dx of [-.64,.64]){box(building,x+dx,1.52,depth+.08,.22,.95,.055,'#d0b8e4',.025);for(let j=0;j<5;j++)box(building,x+dx,1.17+j*.15,depth+.12,.19,.022,.025,'#fff1fa',.003);}box(building,x,.94,depth+.17,1.1,.18,.32,'#e3bacf',.02);for(let k=0;k<5;k++)flower(building,x-.4+k*.2,1.1,depth+.20,k%2?'#fff1de':'#e5a3c9',.10);}
   ribbon(building,0,2.45,depth+.1,.26);
  }
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
  this.terrain(state);this.sky.position.set(wx(state.x),0,wz(state.y));this.cameraState(state,clock,moving&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
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
    if(n.type==='stone'||n.type==='metal'){for(let k=0;k<4;k++){const crystal=new THREE.Mesh(geometry('crystal',()=>new THREE.OctahedronGeometry(.23)),material(n.type==='metal'?'#a9d7d8':'#c5b6ed'));crystal.position.set((k-1.5)*.16,.23+k%2*.15,0);crystal.scale.y=1.8;g.add(crystal);}}
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
