import {BIOMES,PENS,creatureInfo} from './engine.js';
import {SPOTS} from './housing.js';
const ink='#241c2d';
function load(name){const img=new Image();img.onload=()=>window.dispatchEvent(new Event('wildhaven-art-ready'));img.src=new URL(name,import.meta.url).href;return img;}
const environment=load('./anime-environment.png');
const hero=load('./anime-avatar.png'),creatures=load('./anime-creatures.png'),sky=load('./anime-sky.png');
function ready(img){return img.complete&&img.naturalWidth>0;}
function shape(c,fill,draw,width=2.3){c.beginPath();draw();c.fillStyle=fill;c.fill();c.strokeStyle=ink;c.lineWidth=width;c.lineJoin='round';c.stroke();}
function oval(c,x,y,rx,ry,fill,line=true){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(line){c.strokeStyle=ink;c.lineWidth=2;c.stroke();}}
function rect(c,x,y,w,h,fill,r=5){shape(c,fill,()=>c.roundRect(x,y,w,h,r));}
function line(c,points,color=ink,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function text(c,str,x,y,size=14){c.font=`bold ${size}px "Trebuchet MS", sans-serif`;c.textAlign='center';c.fillStyle=ink;c.fillText(str,x,y);}
function bow(c,x,y,s=10){shape(c,'#ef9fc3',()=>{c.moveTo(x,y);c.lineTo(x-s,y-s*.6);c.quadraticCurveTo(x-s*1.3,y+s,x,y);c.lineTo(x+s,y-s*.6);c.quadraticCurveTo(x+s*1.3,y+s,x,y);});oval(c,x,y,3,3,'#ffdaea');}
export function drawFriend(c,type,x,y,size=62){
 const info=creatureInfo(type);if(!info)return;
 if(ready(creatures)){const index=typeof type==='number'?type:Number(String(type).split('-')[1]),cw=creatures.naturalWidth/3,ch=creatures.naturalHeight/2;const w=size*(info.giant?1.55:1);c.drawImage(creatures,index%3*cw,Math.floor(index/3)*ch,cw,ch,x-w/2,y-w,w,w);if(info.giant){bow(c,x,y-w*.15,w*.13);}return;}
 oval(c,x,y-size*.4,size*.4,size*.4,info.color);oval(c,x-8,y-size*.45,3,5,ink);oval(c,x+8,y-size*.45,3,5,ink);
}
const tintedAvatars=new Map();
function portraitSprite(state){
 const a=state.avatar,key=a.skin+a.hairColor;if(tintedAvatars.has(key))return tintedAvatars.get(key);
 const canvas=document.createElement('canvas');canvas.width=hero.naturalWidth;canvas.height=hero.naturalHeight;const q=canvas.getContext('2d');q.drawImage(hero,0,0);const pixels=q.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
 const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),skin=rgb(a.skin),hair=rgb(a.hairColor);
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(data[i+3]<100)continue;const u=x/canvas.width,v=y/canvas.height,r=data[i],g=data[i+1],b=data[i+2];
  const skinArea=(u>.38&&u<.65&&v>.09&&v<.20)||(u>.26&&u<.37&&v>.43&&v<.51)||(u>.86&&u<.98&&v>.4&&v<.49);
  if(skinArea&&r>g+5&&g>b+5&&r>130){const light=Math.min(1.12,(r+g+b)/(255+229+211));for(let k=0;k<3;k++)data[i+k]=Math.min(255,skin[k]*light);}
  else if(a.hairColor!=='#efa0bd'&&v>.045&&v<.39&&r>g*1.12&&b>g&&r>125){const light=(r+g+b)/600;for(let k=0;k<3;k++)data[i+k]=Math.min(255,hair[k]*light);}
 }
 q.putImageData(pixels,0,0);tintedAvatars.set(key,canvas);return canvas;
}
function customAvatar(c,state,x,y,height){
 const a=state.avatar,hair=a.hairColor,skin=a.skin,cloth=a.outfit==='cloud-dress'?'#c4def1':a.outfit==='star-hoodie'?'#edb8d4':a.outfit==='sugarcloud-dress'?'#ccb7e8':state.coat;
 c.save();c.translate(x,y);c.scale(height/210,height/210);
 const long=['sugarcloud-waves','ponytail'].includes(a.hair);
 shape(c,hair,()=>{c.moveTo(-24,-188);c.bezierCurveTo(-50,-160,-32,long?-75:-126,-27,long?-64:-122);c.lineTo(31,long?-64:-122);c.bezierCurveTo(38,-145,44,-194,0,-197);c.closePath();});
 for(const side of [-1,1]){rect(c,side*12-5,-65,10,56,'#fff4f8');rect(c,side*12-9,-12,18,12,'#eab2cf');}
 shape(c,cloth,()=>{c.moveTo(-19,-127);c.lineTo(19,-127);c.lineTo(17,-101);c.lineTo(32,-62);c.quadraticCurveTo(0,-53,-32,-62);c.lineTo(-17,-101);c.closePath();});
 if(['hoodie','star-hoodie','overalls'].includes(a.outfit)){rect(c,-23,-104,46,34,cloth);for(const side of [-1,1])rect(c,side*12-7,-68,14,37,cloth);}
 for(const side of [-1,1]){shape(c,cloth,()=>{c.moveTo(side*18,-124);c.lineTo(side*27,-119);c.lineTo(side*36,-85);c.lineTo(side*26,-82);c.closePath();});oval(c,side*31,-78,5,8,skin);}
 if(a.outfit==='overalls'){rect(c,-13,-124,26,35,'#f1dcc7');for(const side of [-1,1])line(c,[[side*10,-127],[side*10,-141]],'#f1dcc7',5);}
 else if(a.outfit==='star-hoodie')text(c,'★',0,-104,19);
 else{for(let i=0;i<9;i++)oval(c,-28+i*7,-62,4,3,'#fff5fc');bow(c,0,-124,9);}
 rect(c,-5,-140,10,16,skin,2);
 shape(c,skin,()=>{c.moveTo(-27,-173);c.bezierCurveTo(-28,-148,-16,-135,0,-132);c.bezierCurveTo(18,-136,30,-151,28,-174);c.bezierCurveTo(19,-191,-15,-193,-27,-173);});
 for(const side of [-1,1]){oval(c,side*11,-157,7,10,'#fffaff');oval(c,side*11,-156,5,8,'#965780');oval(c,side*11,-157,2.5,5,ink);oval(c,side*11-2,-161,2,3,'white',false);line(c,[[side*4,-164],[side*11,-167],[side*19,-163]],ink,2.5);oval(c,side*20,-145,4,2,'#efacba',false);}
 line(c,[[-3,-140],[0,-139],[4,-141]],'#aa6c80',1);
 shape(c,hair,()=>{c.moveTo(-29,-172);c.bezierCurveTo(-34,-198,24,-206,29,-175);c.lineTo(22,-160);c.lineTo(14,-179);c.lineTo(10,-163);c.lineTo(2,-181);c.lineTo(-6,-163);c.lineTo(-14,-180);c.lineTo(-21,-161);c.closePath();});
 if(a.hair==='space-buns')for(const side of [-1,1])oval(c,side*29,-186,12,12,hair);
 if(a.hair==='curls')for(let i=0;i<7;i++)oval(c,Math.sin(i)*29,-162+Math.cos(i)*20,7,9,hair);
 if(a.accessory==='bunny-beret'){oval(c,0,-190,31,11,'#fff6fc');for(const side of [-1,1]){oval(c,side*35,-174,7,21,'#fff5fc');oval(c,side*35,-174,3,15,'#f1b6d3',false);bow(c,side*20,-194,6);}}
 if(a.accessory==='round-glasses')for(const side of [-1,1]){c.beginPath();c.arc(side*11,-157,10,0,Math.PI*2);c.strokeStyle=ink;c.lineWidth=1.5;c.stroke();}
 if(a.accessory==='star-clip')text(c,'★',24,-177,13);
 c.restore();
}
function drawAvatar(c,state,x,y,height=116){
 if(!ready(hero)){text(c,'Loading your anime avatar…',x,y,12);return;}
 if(state.avatar.outfit!=='sugarcloud-dress'||state.avatar.hair!=='sugarcloud-waves'||!['bunny-beret','round-glasses'].includes(state.avatar.accessory)){customAvatar(c,state,x,y,height);return;}
 const width=height*hero.naturalWidth/hero.naturalHeight;
 c.drawImage(portraitSprite(state),x-width/2,y-height,width,height);
 // Additional purchased accessories remain visible with the illustrated outfit.
 if(state.avatar.accessory==='round-glasses'){const yy=y-height*.815;for(const side of [-1,1]){c.beginPath();c.ellipse(x+side*height*.043,yy,height*.033,height*.026,0,0,Math.PI*2);c.strokeStyle='#554363';c.lineWidth=1.5;c.stroke();}}
}
function flower(c,x,y,color='#f4b7d7'){line(c,[[x,y],[x,y+12]],'#739177',1.5);for(let k=0;k<5;k++)oval(c,x+Math.cos(k*1.257)*4,y+Math.sin(k*1.257)*4,3,3,color,false);oval(c,x,y,2,2,'#edc77d',false);}
function scenerySprite(c,index,x,y,width){const cells=[[0,0,512,512],[512,0,512,512],[1024,0,512,512],[0,512,512,512],[530,562,545,456],[1090,562,446,456]],r=cells[index],height=width*r[3]/r[2];c.drawImage(environment,...r,x-width/2,y-height,width,height);}
function tree(c,x,y,type='sakura',size=1){if(ready(environment)){scenerySprite(c,type==='forest'?3:2,x,y,140*size);return;}c.save();c.translate(x,y);c.scale(size,size);shape(c,'#c89bb0',()=>{c.moveTo(-7,0);c.lineTo(-5,-57);c.lineTo(5,-57);c.lineTo(8,0);});line(c,[[0,-28],[-20,-55]]);line(c,[[1,-37],[24,-65]]);const color=type==='forest'?'#a9d5b1':'#efb5d3';shape(c,color,()=>{c.moveTo(-40,-42);c.bezierCurveTo(-65,-58,-47,-82,-27,-78);c.bezierCurveTo(-30,-103,8,-109,18,-86);c.bezierCurveTo(51,-97,67,-63,42,-52);c.bezierCurveTo(39,-31,-10,-31,-40,-42);});for(let i=0;i<7;i++)flower(c,Math.sin(i*2.3)*32,-58+Math.cos(i)*16,type==='forest'?'#d8ebbd':'#ffe7f0');c.restore();}
function cottage(c,x,y,theme,shed=false,level=1){if(ready(environment)&&(level||shed)){c.save();if(!shed&&theme==='modern')c.filter='hue-rotate(80deg) saturate(.6)';else if(!shed&&theme!=='cute')c.filter='saturate(.65)';scenerySprite(c,shed?1:0,x,y+10,shed?160:180);c.restore();text(c,shed?'Creator’s Shed':'Your cabin',x,y+28,12);return;}c.save();c.translate(x,y);const pink=theme==='cute',modern=theme==='modern';if(!level&&!shed){shape(c,pink?'#f3bbd7':'#dfc3dd',()=>{c.moveTo(-67,10);c.lineTo(0,-90);c.lineTo(67,10);c.closePath();});shape(c,'#93789d',()=>{c.moveTo(-24,10);c.lineTo(0,-46);c.lineTo(24,10);c.closePath();});if(pink)bow(c,0,-60,14);text(c,'Your campsite',0,31,12);c.restore();return;}
 const w=shed?130:166;rect(c,-w/2,-75,w,95,pink?'#ffe0ed':shed?'#dceadd':'#fff0dc');shape(c,modern?'#b8d7d1':pink?'#edaaca':'#c8b3e6',()=>{c.moveTo(-w/2-12,-72);c.lineTo(0,-128);c.lineTo(w/2+12,-72);c.closePath();});for(let i=0;i<4;i++)line(c,[[-w/2+10+i*14,-78-i*8],[w/2-10-i*14,-78-i*8]],'#92708c',1);rect(c,-16,-35,32,55,'#bca5d6',12);oval(c,9,-4,2,2,'#ffe9bb');for(const side of [-1,1]){const xx=side*w*.3;rect(c,xx-15,-52,30,28,'#bee4f0');line(c,[[xx,-51],[xx,-25]]);line(c,[[xx-14,-38],[xx+14,-38]]);rect(c,xx-20,-18,40,9,'#dda5c1');for(let j=0;j<3;j++)flower(c,xx-12+j*12,-23);}
 bow(c,0,-74,13);text(c,shed?'Creator’s Shed':'Your cabin',0,41,12);c.restore();}
export function drawFurniture(c,id,x,y,scale=1,rotation=0){if(ready(environment)&&['sofa','table'].includes(id)){c.save();c.translate(x,y);c.rotate(rotation*Math.PI/2);scenerySprite(c,id==='sofa'?4:5,0,27*scale,95*scale);c.restore();return;}c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(rotation*Math.PI/2);if(id==='sofa'){rect(c,-36,-25,72,29,'#d5b5df',9);rect(c,-36,-7,72,25,'#edc7df',8);rect(c,-40,-14,12,37,'#d6add0');rect(c,28,-14,12,37,'#d6add0');for(const xx of [-15,15])rect(c,xx-10,-16,20,16,'#fff1e1',6);line(c,[[-30,24],[-30,29]]);line(c,[[30,24],[30,29]]);}else if(id==='table'){line(c,[[-22,0],[-24,26]]);line(c,[[22,0],[24,26]]);oval(c,0,-1,36,18,'#f2d9bf');}else if(id==='chair'){rect(c,-17,-30,34,35,'#bbe0cf',12);oval(c,0,9,24,12,'#d1edda');for(const xx of [-16,16])line(c,[[xx,15],[xx,34]]);}else if(id==='planter'){shape(c,'#f1c9c4',()=>{c.moveTo(-15,-6);c.lineTo(-10,24);c.lineTo(10,24);c.lineTo(15,-6);c.closePath();});for(let i=0;i<5;i++)oval(c,Math.sin(i)*10,-15-Math.cos(i)*10,7,17,'#b4d6a5');oval(c,-5,7,2,3,ink);oval(c,5,7,2,3,ink);}else{line(c,[[0,29],[0,-34]],ink,3);oval(c,0,-32,14,19,'#fff0b8');line(c,[[-11,-39],[11,-39]]);bow(c,0,-12,6);}c.restore();}
function worldGround(c,state){
 const beach=state.biome==='ranch'&&state.ranchLand==='beach',forest=state.biome==='grove'||state.biome==='ranch'&&state.ranchLand==='forest';
 c.fillStyle=beach?'#f5e4c3':state.biome==='ridge'?'#e1d6ee':'#d6ebd1';c.fillRect(0,0,960,580);
 if(ready(sky))c.drawImage(sky,0,0,sky.naturalWidth,sky.naturalHeight*.83,0,0,960,150);
 shape(c,beach?'#f5e4c3':forest?'#c1ddb8':'#d6ebd1',()=>{c.moveTo(0,145);c.quadraticCurveTo(220,100,480,147);c.quadraticCurveTo(710,120,960,155);c.lineTo(960,580);c.lineTo(0,580);c.closePath();},1.5);
 if(beach){shape(c,'#a4deeb',()=>{c.moveTo(815,140);c.quadraticCurveTo(770,300,830,580);c.lineTo(960,580);c.lineTo(960,140);c.closePath();});for(let i=0;i<9;i++)line(c,[[850+i%2*15,175+i*43],[890+i%2*15,178+i*43],[925,173+i*43]],'#fff4f4',2);}
 shape(c,'#f2e2d8',()=>{c.moveTo(457,135);c.lineTo(510,135);c.bezierCurveTo(575,320,390,360,535,580);c.lineTo(439,580);c.bezierCurveTo(355,330,524,290,457,135);c.closePath();},1);
 for(let i=0;i<80;i++){const x=35+i*71%885,y=165+i*47%390;if(Math.abs(x-480)>75&&(!beach||x<795))flower(c,x,y,i%3?'#f2afce':'#fff1d9');}
 for(let i=0;i<10;i++){const x=40+i*97;if(beach&&x>780)continue;tree(c,x,175+i%3*13,forest?'forest':'sakura',.75);}
}
function room(c,state){c.fillStyle='#f5e6ee';c.fillRect(0,0,960,580);rect(c,60,55,840,465,'#eedbcf',12);rect(c,60,55,840,125,'#efcfdf',12);for(let i=0;i<11;i++)line(c,[[61,190+i*30],[899,190+i*30]],'#d6b8b5',1);for(const x of [245,715]){rect(c,x-70,77,140,76,'#b9dfe9');line(c,[[x,78],[x,151]]);line(c,[[x-69,113],[x+69,113]]);for(const side of [-1,1])rect(c,x+side*75-10,70,20,100,'#ceb7e4');}oval(c,480,340,155,80,'#f2c2dd');text(c,state.room==='cabin'?'Your cozy cabin':'Creator’s room',480,105,23);rect(c,440,498,80,27,'#c6acd8');text(c,'Outside ↓',480,517,12);}
const roomPoint=(x,y)=>({x:100+(x-395)/170*760,y:180+(y-205)/175*315});
export class World2D {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');if(!this.c)throw Error('Canvas unavailable');canvas.width=960;canvas.height=580;this.pulse=0;}
 blocked(x,y,state){if(state.room){if(x<395||x>565||y<205||y>380)return true;return Object.values(state.decor||{}).some(p=>p.room===state.room&&Math.hypot((x-480)*.04-SPOTS[p.spot][0],(y-290)*.04-SPOTS[p.spot][1])<.55);}return state.biome==='ranch'&&((x>373&&x<527&&y>155&&y<235)||(x>634&&x<736&&y>165&&y<245));}
 aim(state,items){let best=null;for(const item of items){const d=Math.hypot(item.object.x-state.x,item.object.y-state.y);if(!best||d<best.distance)best={...item,distance:d};}return best;}
 animateVacuum(){this.pulse=.5;}
 render(state,wild,residents,nodes,wisps,clock,dt,beam,moving){
 const c=this.c;c.clearRect(0,0,960,580);const indoors=!!state.room;
 if(indoors)room(c,state);else worldGround(c,state);
 const objects=[];
 if(!indoors&&state.biome==='ranch'){
  cottage(c,450,220,state.ranchTheme,false,state.homeLevel);cottage(c,685,230,state.ranchTheme,true);
  for(const p of PENS){rect(c,p.x,p.y,p.width,p.height,p.color,10);for(let x=p.x+6;x<p.x+p.width;x+=20){line(c,[[x,p.y-8],[x,p.y+10]],'#90718a',3);line(c,[[x,p.y+p.height-8],[x,p.y+p.height+10]],'#90718a',3);}text(c,p.name,p.x+p.width/2,p.y-16,12);}
  state.owned.filter(id=>['sofa','chair','table','planter','lanterns'].includes(id)&&!state.decor[id]).forEach((id,i)=>objects.push({y:270+Math.floor(i/3)*55,draw:()=>drawFurniture(c,id,190+i%3*63,270+Math.floor(i/3)*55,.65)}));
 }
 if(indoors){for(const [id,p] of Object.entries(state.decor)){if(p.room!==state.room)continue;const pt=roomPoint(480+SPOTS[p.spot][0]/.04,290+SPOTS[p.spot][1]/.04);objects.push({y:pt.y,draw:()=>drawFurniture(c,id,pt.x,pt.y,1.35,p.rotation)});}}
 else {
  const friends=state.biome==='ranch'?[...residents.values()]:wild.filter(o=>o.wait<=clock);
  for(const o of friends)objects.push({y:o.y,draw:()=>drawFriend(c,o.species,o.x,o.y+Math.sin(clock*3+o.seed)*2,68)});
  if(state.biome!=='ranch')for(const n of nodes.filter(o=>o.ready<=clock))objects.push({y:n.y,draw:()=>{if(n.type==='wood'){for(let i=0;i<3;i++){rect(c,n.x-17+i*5,n.y-12-i*6,33,10,'#c9a18c');oval(c,n.x+16+i*5,n.y-7-i*6,4,5,'#f0cf9b');}}else if(n.type==='berries'){for(let i=0;i<5;i++)oval(c,n.x+Math.sin(i)*15,n.y-12+Math.cos(i)*9,10,9,'#b5d29c');for(let i=0;i<4;i++)oval(c,n.x+Math.sin(i*2)*12,n.y-10+Math.cos(i*2)*7,4,4,'#eb99b7');}else for(let i=0;i<3;i++)shape(c,n.type==='metal'?'#b4dbe4':'#d2bee9',()=>{const x=n.x+(i-1)*12,y=n.y-i%2*8;c.moveTo(x-8,y);c.lineTo(x-9,y-15);c.lineTo(x,y-26);c.lineTo(x+9,y-15);c.lineTo(x+8,y);c.closePath();});}});
  for(const w of wisps)objects.push({y:w.y,draw:()=>{oval(c,w.x,w.y-12,15,19,'#cdb6e6');oval(c,w.x-5,w.y-14,2,3,ink);oval(c,w.x+5,w.y-14,2,3,ink);}});
 }
 const player=indoors?roomPoint(state.x,state.y):{x:state.x,y:state.y};objects.push({y:player.y,draw:()=>{oval(c,player.x,player.y,22,6,'#7c648329',false);drawAvatar(c,state,player.x,player.y+(moving?Math.sin(clock*9)*2:0),indoors?150:145);}});
 if(state.pet&&!indoors)objects.push({y:player.y+12,draw:()=>drawFriend(c,state.pet==='cloud-cat'?2:4,player.x+40,player.y+12,43)});
 objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 if(beam&&clock-beam.started<beam.duration&&!indoors){c.save();c.setLineDash([5,7]);line(c,[[beam.x,beam.y-20],[player.x+18,player.y-45]],'#9c5daa',4);c.restore();}
 c.strokeStyle=ink;c.lineWidth=3;c.strokeRect(1.5,1.5,957,577);
 }
}
export class AvatarPreview {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');canvas.width=280;canvas.height=300;}
 render(state){this.c.clearRect(0,0,280,300);drawAvatar(this.c,state,140,294,290);}
}
const photoCache=new Map();
export function shopPicture(item,state){
 const key=item.id+JSON.stringify(state.avatar)+(ready(hero)?'h':'')+(ready(creatures)?'c':'')+(ready(environment)?'e':'');if(photoCache.has(key))return photoCache.get(key);
 const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const c=canvas.getContext('2d');c.fillStyle=item.color;c.fillRect(0,0,320,240);
 if(item.kind==='furniture')drawFurniture(c,item.id,160,130,2);
 else if(item.kind==='avatar'){const copy=structuredClone(state);copy.avatar[item.slot]=item.value;drawAvatar(c,copy,160,235,230);}
 else if(item.kind==='pet')drawFriend(c,item.value==='cloud-cat'?2:4,160,205,180);
 else if(item.kind==='theme'){cottage(c,160,155,item.value,false,1);}
 else if(item.kind==='tool'||item.kind==='upgrade'){rect(c,115,85,94,66,item.value==='starlight'?'#c7b2e6':'#b7e1d8',22);rect(c,80,105,47,22,'#e5c6df',7);oval(c,80,116,9,17,'#9878b2');bow(c,159,77,25);rect(c,160,139,20,37,'#e9bbd5');oval(c,180,112,14,16,'#fbeaf8');}
 else if(item.material==='wood'){for(let i=0;i<3;i++){rect(c,90+i*10,100-i*18,130,23,'#c5a18b');oval(c,220+i*10,111-i*18,9,12,'#f0d3a5');}}
 else if(item.material==='berries'){for(let i=0;i<5;i++)oval(c,160+Math.sin(i)*40,130+Math.cos(i)*25,23,23,'#eca9c5');}
 else if(item.material==='starfood'){for(let i=0;i<3;i++)shape(c,'#f9dc9d',()=>{for(let k=0;k<10;k++){const angle=k*Math.PI/5-Math.PI/2,r=k%2?14:30,x=100+i*60+Math.cos(angle)*r,y=125+Math.sin(angle)*r;k?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();});}
 else for(let i=0;i<3;i++)shape(c,item.color,()=>{const x=110+i*50;c.moveTo(x-19,170);c.lineTo(x-24,110);c.lineTo(x,66);c.lineTo(x+24,110);c.lineTo(x+19,170);c.closePath();});
 const url=canvas.toDataURL();photoCache.set(key,url);return url;
}

// Shared illustrated artwork for the 3D scene and wardrobe.
export function avatarCanvas(state){const canvas=document.createElement('canvas');canvas.width=320;canvas.height=480;drawAvatar(canvas.getContext('2d'),state,160,478,476);return canvas;}
