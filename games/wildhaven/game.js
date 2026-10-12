import { SPECIES, BIOMES, WIDTH, HEIGHT, LIMIT, MATERIALS, PENS, HOME_STAGES, creatureInfo, countCarried, collectMaterial, releaseCreature, vacuumResident, combineCreatures, buildHome, penBounds, wander, freshState, loadState, catchCreature, careFor, tradeTreats, travel, takeHit } from './engine.js';

const SAVE_KEY = 'tapitapimart-wildhaven-v1';
let state;
try { state = loadState(localStorage.getItem(SAVE_KEY)); } catch { state = freshState(); }
const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const $ = selector => document.querySelector(selector);
let wild = [], wisps = [], berries = [], target = null, keys = new Set(), cameraX = 0;
let lastTime = 0, clock = 0, invincibleUntil = 0, catchReady = 0, collectionSignature = '', paused = false;
let saveOkay = true, selectedPen = 0, beam = null;
const residents = new Map();
const particles = [];
function save() {
  state.lastSaved = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saveOkay = true; }
  catch { saveOkay = false; }
  $('#save-status').textContent = saveOkay ? 'Saved on this device · v5' : 'Saving unavailable · keep this tab open';
}
function announce(message) { $('#message').textContent = message; if($('#inventory').open)$('#inventory-message').textContent=message; }
function scatter(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 85, vy: -25 - Math.random() * 80, life: 1, color });
}
function populate() {
  const species = SPECIES.flatMap((s, i) => s.biome === state.biome ? [i] : []);
  wild = state.biome === 'ranch' ? [] : Array.from({ length: 5 }, (_, i) => ({ species: species[i % 2], x: [420, 640, 240, 770, 350][i], y: [330, 240, 245, 415, 480][i], seed: i * 2.1, wait: 0 }));
  const n = state.biome === 'ranch' ? 0 : state.biome === 'ridge' ? 4 : state.biome === 'grove' ? 3 : 2;
  wisps = Array.from({ length: n }, (_, i) => ({ x: 210 + i * 210, y: 160 + i * 75, baseX: 210 + i * 210, baseY: 180 + i * 75, seed: i * 2.4 }));
  if(state.biome==='ridge')wild.push({species:'giant-4-5',x:700,y:460,seed:12,wait:0,speed:14});
  berries = [{ type:'berries',x: 170, y: 420, ready: 0 }, { type:'berries',x: 790, y: 290, ready: 0 },{type:'wood',x:540,y:320,ready:0},{type:'wood',x:250,y:480,ready:0},{type:'stone',x:615,y:405,ready:0},{type:'stone',x:320,y:220,ready:0}];
  syncResidents();
  target = null; keys.clear();
}
function go(biome) {
  if (paused) return;
  travel(state, biome); populate(); invincibleUntil = clock + 2;
  announce(biome === 'ranch' ? 'Home sweet home! Open Inventory to put friends into pens. Build your home and mix a giant below.' : `Welcome to ${BIOMES[biome].name}. Follow your curiosity.`);
  renderUI(); save();
}
function nearest() {
  const items = state.biome==='ranch'?[...residents.values()].map(c=>({type:'resident',object:c})):[...wild.filter(c => c.wait <= clock).map(c => ({ type: 'creature', object: c })), ...berries.filter(b => b.ready <= clock).map(b => ({ type: 'material', object: b }))];
  return items.map(item => ({ ...item, distance: Math.hypot(item.object.x - state.x, item.object.y - state.y) })).sort((a, b) => a.distance - b.distance)[0];
}
function targetName(close) {return close.type==='material'?MATERIALS[close.object.type].name:creatureInfo(close.object.species).name;}
function interact() {
  if (paused || $('#inventory').open || clock < catchReady) return;
  const close = nearest();
  if (!close || close.distance > 110) { announce(state.biome==='ranch'?'Walk closer to vacuum a penned friend, or open Inventory to put friends into pens.':'A little closer! Walk near a friend, a berry bush, branches, or shiny rocks.'); return; }
  catchReady = clock + .6;
  if (close.type === 'creature') {
    const creature = catchCreature(state, close.object.species);
    if(!creature){announce(`Vacuum full for ${targetName(close)}: 30 / 30. Put some in a pen to make room.`);return;}
    close.object.wait = clock + 12;vacuumEffect(close.object);
    announce(`Whoosh! ${creatureInfo(creature.species).name} is in your vacuum. +3 stardust! Take it to a ranch pen.`);
  } else if(close.type==='resident') {
    if(!vacuumResident(state,close.object.id)){announce(`Your vacuum holds 30 ${targetName(close)} already. Put one in a pen first.`);return;}
    vacuumEffect(close.object);announce(`Whoosh! ${targetName(close)} is back in your vacuum. Your other friends stay in their pens.`);
  } else {
    const taken=collectMaterial(state,close.object.type,3);
    if(!taken){announce(`${targetName(close)} are full: 30 / 30. Use some at your ranch to make room.`);return;}
    close.object.ready=clock+18;vacuumEffect(close.object);
    announce(`Whoosh! +${taken} ${targetName(close).toLowerCase()}. ${state.materials[close.object.type]} / 30 in your vacuum.`);
  }
  renderUI(); save();
}
function drawCreature(context, species, x, y, size = 1, t = 0) {
  const s = creatureInfo(species); context.save(); context.translate(x, y); const scale=size*(s.giant?1.65:1); context.scale(scale, scale);
  ellipse(context, 0, 13, 20, 7, '#45604525');
  const bob = Math.sin(t * 2) * 2; context.translate(0, bob);
  if (s.shape === 'moth') {
    ellipse(context, -17, -8, 16, 23, s.color); ellipse(context, 17, -8, 16, 23, s.color);
    ellipse(context, -20, -10, 6, 11, '#fff4bd'); ellipse(context, 20, -10, 6, 11, '#fff4bd');
  }
  if (s.shape === 'bunny') { ellipse(context, -9, -28, 6, 17, s.color); ellipse(context, 9, -30, 6, 18, s.color); ellipse(context, -9, -31, 2, 8, '#f6edd0'); }
  if (s.shape === 'fox') {
    polygon(context, [[-18,-9],[-19,-34],[-2,-19]], s.color); polygon(context, [[18,-9],[19,-34],[2,-19]], s.color);
    ellipse(context, 20, 4, 13, 8, s.accent);
  }
  if (s.shape === 'drop') polygon(context, [[-15,-9],[0,-35],[15,-9]], s.color);
  if (s.shape === 'round') for (let i = 0; i < 8; i++) ellipse(context, Math.cos(i * .785) * 16, Math.sin(i * .785) * 16 - 4, 9, 9, s.color);
  ellipse(context, 0, -5, s.shape === 'moth' ? 10 : 21, 20, s.color);
  ellipse(context, 0, 3, 12, 10, s.giant?s.accent:'#fff9e389');
  if(s.giant){ellipse(context,-14,-13,4,5,s.accent);ellipse(context,13,4,4,4,s.accent);polygon(context,[[-5,-28],[0,-36],[5,-28],[0,-20]],'#fff5c4');}
  ellipse(context, -7, -7, 2.2, 3, '#354d49'); ellipse(context, 7, -7, 2.2, 3, '#354d49');
  ellipse(context, -12, -1, 3, 1.7, '#d9877b80'); ellipse(context, 12, -1, 3, 1.7, '#d9877b80');
  context.strokeStyle = s.accent; context.lineWidth = 1.5; context.beginPath(); context.arc(0, -1, 3, .2, Math.PI - .2); context.stroke();
  context.restore();
}
function syncResidents() {
  const inPens = state.collection.filter(c => c.location !== 'vacuum');
  const ids = new Set(inPens.map(c => c.id));
  for (const id of residents.keys()) if (!ids.has(id)) residents.delete(id);
  for (const c of inPens) {
    const old = residents.get(c.id);
    if (old && old.pen === c.location) continue;
    const info = creatureInfo(c.species), b = penBounds(c.location, info.giant);
    residents.set(c.id, { id: c.id, species: c.species, pen: c.location, x: b.minX + Math.random() * (b.maxX-b.minX), y: b.minY + Math.random() * (b.maxY-b.minY), seed: c.id, speed: info.giant ? 14 : 23 });
  }
}
function vacuumEffect(object) {
  beam = { x: object.x, y: object.y, species: object.species, started: clock, duration: .55 };
  for (let i=0;i<14;i++) particles.push({ x: object.x+(Math.random()-.5)*20, y: object.y+(Math.random()-.5)*20, vx: (state.x-object.x)*1.8, vy: (state.y-object.y-20)*1.8, life: .55, color: '#fdf2ff' });
}
function updateWorkshop() {
  const levelNames=['Your little campsite','Your cozy cabin','Your flower porch','Your dream cottage'];
  $('#home-name').textContent=levelNames[state.homeLevel];
  const stage=HOME_STAGES[state.homeLevel];
  $('#build-description').textContent=stage ? stage.description : 'A lovely place to come home to. Keep exploring and filling your pens!';
  $('#build-cost').textContent=stage ? `${state.materials.wood} / ${stage.wood} wood + ${state.materials.stone} / ${stage.stone} moonstones` : 'Your home is all decorated. Your adventure keeps going.';
  $('#build-home').textContent=stage ? `Build ${stage.name.toLowerCase()}` : 'Home sweet home';
  $('#build-home').disabled=!stage || state.biome!=='ranch' || state.materials.wood<stage.wood || state.materials.stone<stage.stone;
  for(const select of [$('#mix-first'),$('#mix-second')]) for(const option of select.options) option.textContent=`${SPECIES[Number(option.value)].name} (${countCarried(state,Number(option.value))} in bag)`;
  const a=Number($('#mix-first').value), b=Number($('#mix-second').value), type=`giant-${Math.min(a,b)}-${Math.max(a,b)}`;
  const available=countCarried(state,a)>=(a===b?2:1) && countCarried(state,b)>0;
  $('#mix-preview').textContent=`Makes 1 ${creatureInfo(type).name}. Uses 2 friends from your vacuum.`;
  $('#combine').disabled=state.biome!=='ranch'||!available||countCarried(state,type)>=LIMIT;
}
function renderInventory() {
  for(const [key, material] of Object.entries(MATERIALS)) {
    let slot=$(`#material-${key}`);
    if(!slot){slot=document.createElement('article');slot.id=`material-${key}`;slot.className='material-slot';slot.innerHTML=`<span class="material-icon" style="color:${material.color}">${material.icon}</span><strong>${material.name}</strong><span class="slot-count"></span><small>${material.hint}</small>`;$('#material-slots').append(slot);}
    slot.querySelector('.slot-count').textContent=`${state.materials[key]} / ${LIMIT}`;
    slot.querySelector('.slot-count').classList.toggle('full',state.materials[key]===LIMIT);
  }
  const types=[...SPECIES.keys(),...new Set(state.collection.filter(c=>creatureInfo(c.species).giant).map(c=>c.species))];
  for(const type of types){
    const info=creatureInfo(type), count=countCarried(state,type);
    let slot=$(`#slot-${type}`);
    if(!slot){slot=document.createElement('article');slot.id=`slot-${type}`;slot.className='creature-slot';slot.innerHTML=`<canvas width="96" height="96" aria-hidden="true"></canvas><h4>${info.name}</h4><span class="slot-count"></span><button data-release="${type}">Put into pen</button>`;
      slot.querySelector('button').addEventListener('click',()=>{
        const pen=Number($('#release-pen').value);
        if(releaseCreature(state,type,pen)){
          selectedPen=pen;syncResidents();scatter(state.x,state.y-20,info.color,25);
          announce(`${info.name} is in ${PENS[pen].name}! It stays inside until you vacuum it out.`);
          renderUI();save();
        }
      });
      $('#creature-slots').append(slot);drawCreature(slot.querySelector('canvas').getContext('2d'),type,48,66,info.giant?.95:1.2);
    }
    slot.classList.toggle('empty-slot',!count);
    slot.querySelector('.slot-count').textContent=`${count} / ${LIMIT}`;
    slot.querySelector('button').disabled=!count||state.biome!=='ranch';
  }
  $('#inventory-note').textContent=state.biome==='ranch'?`Choose a pen and put your friends inside. Pens keep them safely at home.`:'Your friends travel in your vacuum. Visit the ranch to put them into a pen.';
}
function openInventory() {
  if(paused || $('#inventory').open)return;
  keys.clear();target=null;renderInventory();$('#inventory-message').textContent='';$('#release-pen').value=String(selectedPen);$('#inventory').showModal();
}
function renderUI() {
  syncResidents();
  $('#gems').textContent = state.gems; $('#treats').textContent = state.materials.berries;
  $('#bag-total').textContent=state.collection.filter(c=>c.location==='vacuum').length;
  $('#health').textContent = '♥ '.repeat(state.health) + '♡ '.repeat(3 - state.health);
  $('#health').setAttribute('aria-label', `${state.health} of 3 hearts`);
  $('#place').textContent = BIOMES[state.biome].name; $('#subtitle').textContent = BIOMES[state.biome].subtitle;
  const inPens=state.collection.filter(c=>c.location!=='vacuum');
  $('#collection-count').textContent = inPens.length;
  $('#ranch-count').textContent = `${inPens.length} in pens · ${state.collection.length-inPens.length} in vacuum`;
  $('#care-note').textContent = state.biome === 'ranch' ? 'Friends stay in their pens. Open Inventory to add one, or vacuum a friend back into your bag.' : 'Your penned friends stay home while you explore. Visit the ranch to care for them.';
  $('#buy-treats').disabled = state.gems < 5 || state.materials.berries>25;
  document.querySelectorAll('[data-biome]').forEach(b => { b.classList.toggle('active', b.dataset.biome === state.biome); b.setAttribute('aria-pressed', b.dataset.biome === state.biome); });
  document.querySelectorAll('[data-coat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.coat === state.coat));
  document.querySelectorAll('[data-pen]').forEach(b=>{const pen=Number(b.dataset.pen);b.setAttribute('aria-pressed',pen===selectedPen);b.querySelector('span').textContent=`${state.collection.filter(c=>c.location===pen).length} friends`;});
  updateWorkshop();if($('#inventory').open)renderInventory();
  const visible=state.collection.filter(c=>c.location===selectedPen);
  const signature = JSON.stringify([state.biome, state.materials.berries,selectedPen, state.collection.map(c => [c.id,c.location,Math.round(c.happiness), c.rewardAt <= Date.now()])]);
  if (signature === collectionSignature) return;
  collectionSignature = signature;
  const container = $('#collection');
  for(const card of container.querySelectorAll('[data-creature]'))if(!visible.some(c=>c.id===Number(card.dataset.creature)))card.remove();
  if (!visible.length) { container.innerHTML = '<div class="empty">A little home waiting for a friend.<br>At the ranch, open <b>Inventory</b> and choose <b>Put into pen</b>.</div>'; return; }
  for (const c of visible) {
    let card = container.querySelector(`[data-creature="${c.id}"]`);
    const s = creatureInfo(c.species);
    if (!card) {
      container.querySelector('.empty')?.remove();
      card = document.createElement('article'); card.className = 'creature-card'; card.dataset.creature = c.id;
      card.innerHTML = `<canvas class="portrait" width="96" height="96" aria-hidden="true"></canvas><h3>${s.name}</h3><p class="species-note">${s.note}</p><div class="happiness"><span>Happiness</span><b></b></div><div class="meter"><span></span></div><div class="care-actions"><button data-care="feed">Feed · 1 berry</button><button data-care="pet">Pet ♡</button><button data-care="reward">Gift ✧</button><button class="vacuum-out" data-vacuum-id="${c.id}">Vacuum back into bag</button></div><p class="gift-note"></p>`;
      card.querySelectorAll('[data-care]').forEach(button => button.addEventListener('click', () => {
        const result = careFor(state, c.id, button.dataset.care); announce(result.message); renderUI(); save();
        if (result.ok) scatter(state.x, state.y - 20, '#fff2b0');
      }));
      card.querySelector('.vacuum-out').addEventListener('click',()=>{
        const actor=residents.get(c.id);
        if(vacuumResident(state,c.id)) {if(actor)vacuumEffect(actor);announce(`${s.name} is safely in your vacuum. Put it in any pen when you are ready.`);renderUI();save();$('#open-inventory').focus({preventScroll:true});}
        else announce(`Your vacuum already holds 30 ${s.name}. Put one into a pen first.`);
      });
      container.append(card);drawCreature(card.querySelector('canvas').getContext('2d'),c.species,48,66,s.giant?.95:1.2);
    }
    card.querySelector('.happiness b').textContent = `${Math.round(c.happiness)} / 100`;
    card.querySelector('.meter span').style.width = `${c.happiness}%`;
    const atHome = state.biome === 'ranch';
    card.querySelector('[data-care="feed"]').disabled = !atHome || !state.materials.berries || c.happiness >= 100;
    card.querySelector('[data-care="pet"]').disabled = !atHome || c.happiness >= 100;
    card.querySelector('[data-care="reward"]').disabled = !atHome || c.happiness < 75 || c.rewardAt > Date.now();
    card.querySelector('.vacuum-out').disabled=!atHome||countCarried(state,c.species)>=LIMIT;
    card.querySelector('.gift-note').textContent = c.happiness < 75 ? 'A little care brings happiness to 75 for gifts.' : c.rewardAt > Date.now() ? 'Growing a gift… ready within a minute.' : 'A gift is ready! +8 stardust';
  }
}
function ellipse(c, x, y, rx, ry, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function polygon(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill(); }
function line(points, color, width) { ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke(); }
function tree(x, y, size, shade = false) {
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  ellipse(ctx, 5, 13, 33, 11, '#34583b19');
  line([[0,0],[0,-50]],'#8f8460',10);
  const color = state.biome === 'ridge' ? (shade ? '#7d91aa' : '#849ead') : state.biome === 'grove' ? (shade ? '#4f8878' : '#659783') : (shade ? '#729952' : '#8cad67');
  ellipse(ctx,-13,-50,26,29,color);ellipse(ctx,16,-52,27,31,color);ellipse(ctx,0,-76,27,29,color);
  ellipse(ctx,-8,-84,15,12,'#ffffff0c');ctx.restore();
}
function label(text,x,y) { ctx.font='11px Arial'; const w=ctx.measureText(text).width+18; ctx.fillStyle='#fffdefe8';ctx.beginPath();ctx.roundRect(x-w/2,y-13,w,22,11);ctx.fill();ctx.fillStyle='#637351';ctx.textAlign='center';ctx.fillText(text,x,y+2); }
function drawWorld() {
  const viewWidth = matchMedia('(max-width:760px)').matches ? 640 : WIDTH;
  if(canvas.width !== viewWidth) canvas.width=viewWidth;
  cameraX=Math.max(0,Math.min(WIDTH-viewWidth,state.x-viewWidth/2));
  ctx.clearRect(0,0,canvas.width,HEIGHT);ctx.save();ctx.translate(-cameraX,0);
  ctx.fillStyle=BIOMES[state.biome].ground;ctx.fillRect(0,0,WIDTH,HEIGHT);
  for(let i=0;i<80;i++){
    const x=(i*137.7)%WIDTH,y=90+(i*79.1)%480;
    ellipse(ctx,x,y,18+(i%4)*10,8,BIOMES[state.biome].shade+'50');
    line([[x-3,y],[x-5,y-5]],'#688b523a',1.5);line([[x+2,y],[x+4,y-4]],'#688b523a',1.5);
  }
  // A winding path makes each area feel like part of the same little world.
  ctx.strokeStyle=state.biome==='ridge'?'#d4d2cd':'#e3d5a7';ctx.lineWidth=64;ctx.beginPath();ctx.moveTo(480,630);ctx.bezierCurveTo(480,400,300,320,440,100);ctx.stroke();
  ctx.strokeStyle='#f8ecc72e';ctx.lineWidth=42;ctx.stroke();
  for(let i=0;i<19;i++)tree(i*57-18,90+Math.sin(i*2)*20,.8+(i%3)*.14,i%2);
  if(state.biome==='ranch'){
    // Your starter tent grows into a handmade home as you gather materials.
    if(state.homeLevel===0){
      ellipse(ctx,460,280,100,20,'#56764a20');
      polygon(ctx,[[352,285],[450,147],[557,285]],'#d3a7ad');polygon(ctx,[[450,147],[478,285],[557,285]],'#bd899c');
      polygon(ctx,[[396,285],[450,195],[480,285]],'#745f70');line([[450,145],[450,130]],'#af9272',4);
      polygon(ctx,[[450,130],[481,141],[450,150]],'#f9df9e');
      label('YOUR LITTLE CAMPSITE',450,305);
    }else{
      ctx.fillStyle='#e4cfa1';ctx.fillRect(350,160,210,130);
      if(state.homeLevel===3){ctx.fillStyle='#c9b5aa';ctx.fillRect(506,111,28,56);ellipse(ctx,522,95,13,9,'#fff9ed70');ellipse(ctx,535,76,17,11,'#fff9ed40');}
      polygon(ctx,[[325,171],[451,80],[584,171]],state.homeLevel===3?'#8c9bb3':'#b18486');polygon(ctx,[[339,171],[451,94],[567,171]],state.homeLevel===3?'#a5b6cc':'#cd9d9d');
      ctx.fillStyle='#8e7562';ctx.fillRect(434,218,43,72);ctx.fillStyle='#fff0b8';ctx.fillRect(379,197,30,30);ctx.fillRect(503,197,30,30);
      line([[394,197],[394,227]],'#baa47b',3);line([[379,212],[409,212]],'#baa47b',3);line([[518,197],[518,227]],'#baa47b',3);
      ellipse(ctx,467,255,2,2,'#ebd3a0');
      if(state.homeLevel>=2){
        ctx.fillStyle='#d7bb9a';ctx.fillRect(330,285,250,20);line([[335,264],[335,292]],'#f5e4c7',5);line([[575,264],[575,292]],'#f5e4c7',5);
        for(const x of [391,518]){ctx.fillStyle='#b28f76';ctx.fillRect(x-20,228,42,12);for(let i=0;i<5;i++){ellipse(ctx,x-15+i*8,226,5,7,'#88a871');ellipse(ctx,x-15+i*8,218,4,4,i%2?'#efd3e1':'#f6ddb0');}}
      }
      label(state.homeLevel===3?'YOUR DREAM COTTAGE':'HOME, SWEET WILDHAVEN',450,305);
    }
    for(const [i,pen] of PENS.entries()){
      ctx.fillStyle=pen.color+'80';ctx.beginPath();ctx.roundRect(pen.x,pen.y,pen.width,pen.height,12);ctx.fill();
      // Fully enclosed fences: there is no open gate for a creature to wander through.
      line([[pen.x,pen.y+15],[pen.x+pen.width,pen.y+15],[pen.x+pen.width,pen.y+pen.height],[pen.x,pen.y+pen.height],[pen.x,pen.y+15]],'#f7edcf',5);
      for(let x=pen.x;x<=pen.x+pen.width;x+=25){line([[x,pen.y-5],[x,pen.y+27]],'#ffefd5',5);}
      for(let y=pen.y+25;y<=pen.y+pen.height;y+=30){line([[pen.x,y-10],[pen.x,y+12]],'#ffefd5',5);line([[pen.x+pen.width,y-10],[pen.x+pen.width,y+12]],'#ffefd5',5);}
      label(`${pen.name} · ${state.collection.filter(c=>c.location===i).length}`,pen.x+pen.width/2,pen.y-22);
    }

  }else{
    // A small pool and stones stay decorative, keeping movement friendly.
    ellipse(ctx,810,140,101,42,'#88b9a8');ellipse(ctx,810,135,89,31,'#9dcabc');
    line([[777,129],[805,129]],'#c4e2c9',2);line([[828,140],[852,140]],'#c4e2c9',2);
    for(let i=0;i<8;i++){const x=70+(i*233)%840,y=170+(i*73)%350;ellipse(ctx,x,y,13,8,state.biome==='ridge'?'#c9cde0':'#aeb997');ellipse(ctx,x-3,y-3,7,3,'#f0efdc44');}
  }
  for(let i=0;i<60;i++){
    const x=(i*177+60)%930+15,y=140+(i*117)%420;
    const col=state.biome==='ridge'?'#efe6ff':i%3?'#f9edb5':'#f2b7a5';
    ellipse(ctx,x,y,2.5,2.5,col);if(i%3===0){ellipse(ctx,x+4,y-3,2,2,col);ellipse(ctx,x+6,y+1,2,2,col);}
  }
  tree(65,260,1.2);tree(913,365,1.25);tree(35,535,1);tree(898,550,1.1);
  if(state.biome!=='ranch') for(const node of berries){
    const {x,y}=node;const ready=node.ready<=clock;
    ellipse(ctx,x,y+8,25,8,'#47614220');
    if(node.type==='berries'){
      ellipse(ctx,x,y-2,24,19,'#719363');ellipse(ctx,x-13,y-9,13,13,'#85a46f');
      if(ready)for(let i=0;i<6;i++)ellipse(ctx,x-14+(i%3)*12,y-12+Math.floor(i/3)*13,4,4,'#edaab9');
    }else if(node.type==='wood'){
      ellipse(ctx,x,y+4,22,9,'#bca07d');
      if(ready){line([[x-18,y-6],[x+20,y-14]],'#b7926d',10);line([[x-15,y-15],[x+12,y+2]],'#caa17b',9);ellipse(ctx,x-16,y-15,4,4,'#e6c6a0');ellipse(ctx,x+20,y-14,4,5,'#f1d7b2');}
    }else{
      ellipse(ctx,x,y+3,22,10,'#9eacc2');
      if(ready){polygon(ctx,[[x-18,y],[x-17,y-20],[x-9,y-28],[x-1,y-15],[x-1,y+3]],'#cdd9ec');polygon(ctx,[[x,y+5],[x+3,y-26],[x+13,y-37],[x+21,y-23],[x+19,y]],'#b4c9e6');line([[x+13,y-33],[x+12,y-12]],'#f1f4ff',2);}
    }
    if(ready)ellipse(ctx,x+23,y-27,2,2,'#fff9cd');
  }
  const close=nearest();
  if(close && close.distance<110){ctx.strokeStyle='#fff9c4';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(close.object.x,close.object.y+10,36,20,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);label(targetName(close),close.object.x,close.object.y-(creatureInfo(close.object.species)?.giant?85:54));}
  const companions=state.biome==='ranch'?[...residents.values()]:wild.filter(c=>c.wait<=clock);
  const actors=companions.map(c=>({y:c.y,draw:()=>{
    drawCreature(ctx,c.species,c.x,c.y,1,clock+c.seed);
    if(c.rest>1.5){ctx.font='12px Arial';ctx.textAlign='center';ctx.fillStyle='#ffffffaa';ctx.fillText('♪',c.x+23,c.y-(creatureInfo(c.species).giant?80:48));}
  }}));
  actors.push({y:state.y,draw:drawAvatar});
  for(const w of wisps) actors.push({y:w.y,draw:()=>{
    ellipse(ctx,w.x,w.y+10,17,5,'#68517926');ellipse(ctx,w.x,w.y-3,27,27,'#ba9cdb20');ellipse(ctx,w.x,w.y-3,16,17,'#b4a0d5');
    polygon(ctx,[[w.x-12,w.y+8],[w.x-7,w.y+20],[w.x,w.y+11],[w.x+8,w.y+17],[w.x+14,w.y+7]],'#b4a0d5');
    ellipse(ctx,w.x-5,w.y-5,2,3,'#635777');ellipse(ctx,w.x+5,w.y-5,2,3,'#635777');
  }});
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
  if(state.biome==='ranch')for(const pen of PENS){line([[pen.x,pen.y+pen.height-6],[pen.x+pen.width,pen.y+pen.height-6]],'#f5e6c7',5);for(let x=pen.x;x<=pen.x+pen.width;x+=25)line([[x,pen.y+pen.height-19],[x,pen.y+pen.height+5]],'#fff0d9',5);}
  if(beam){
    const progress=(clock-beam.started)/beam.duration;
    if(progress>=1)beam=null;
    else{ctx.save();ctx.globalAlpha=1-progress;polygon(ctx,[[state.x+25,state.y-16],[beam.x-25,beam.y-24],[beam.x+25,beam.y+15]],'#eee4ff60');line([[state.x+25,state.y-16],[beam.x,beam.y]],'#f5eaff',3);if(beam.species!==undefined)drawCreature(ctx,beam.species,beam.x+(state.x-beam.x)*progress,beam.y+(state.y-20-beam.y)*progress,1-progress,clock);ctx.restore();}
  }
  if(target){ctx.strokeStyle='#fefce4a0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(target.x,target.y,9,5,0,0,Math.PI*2);ctx.stroke();}
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ellipse(ctx,p.x,p.y,3,3,p.color);}ctx.globalAlpha=1;
  // Drifting motes add life without external images or downloads.
  for(let i=0;i<12;i++){const x=(i*89+clock*8)%WIDTH,y=140+(i*97)%380+Math.sin(clock+i)*9;ellipse(ctx,x,y,1.5,1.5,'#fffbe780');}
  ctx.restore();
}
function drawAvatar(){
  const x=state.x,y=state.y;
  if(clock<invincibleUntil && Math.floor(clock*10)%2===0)return;
  ellipse(ctx,x,y+12,18,7,'#3c544435');
  const walking=target||keys.size;const step=walking?Math.sin(clock*12)*3:0;
  line([[x-6,y+2],[x-7,y+14+step]],'#695847',6);line([[x+6,y+2],[x+7,y+14-step]],'#695847',6);
  ctx.fillStyle=state.coat;ctx.beginPath();ctx.roundRect(x-13,y-24,26,30,8);ctx.fill();
  ellipse(ctx,x-14,y-9,4,8,'#e0bb93');ellipse(ctx,x+14,y-9,4,8,'#e0bb93');
  ellipse(ctx,x,y-32,12,13,'#e6c29a');ellipse(ctx,x-4,y-32,1.5,2,'#475548');ellipse(ctx,x+4,y-32,1.5,2,'#475548');
  ellipse(ctx,x,y-44,20,6,'#d7bd83');ellipse(ctx,x,y-48,13,9,'#e8d09b');line([[x-11,y-44],[x+11,y-44]],'#aa9470',3);
  // A glassy backpack, flexible hose and a big friendly magic-vacuum nozzle.
  ctx.fillStyle='#95c9be';ctx.beginPath();ctx.roundRect(x-11,y-22,21,23,6);ctx.fill();
  ellipse(ctx,x,y-11,6,8,'#d6efe6');ellipse(ctx,x-2,y-15,2,3,'#fbfff9');
  line([[x+7,y-9],[x+17,y-4],[x+21,y-18]],'#657f83',5);
  line([[x+17,y-18],[x+32,y-18]],'#b1ced0',9);polygon(ctx,[[x+30,y-23],[x+40,y-29],[x+40,y-8],[x+30,y-13]],'#c6aed6');
  line([[x+40,y-28],[x+40,y-9]],'#efe3fa',4);
}
function tick(time){
  const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;
  if(!document.hidden&&!paused&&!$('#inventory').open){
    clock+=dt;
    let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);
    if(target&&!dx&&!dy){dx=target.x-state.x;dy=target.y-state.y;if(Math.hypot(dx,dy)<5){target=null;dx=dy=0;}}
    if(dx||dy){const d=Math.hypot(dx,dy);state.x=Math.max(35,Math.min(WIDTH-35,state.x+dx/d*155*dt));state.y=Math.max(110,Math.min(HEIGHT-30,state.y+dy/d*155*dt));}
    for(const c of wild){if(c.wait>clock)continue;wander(c,dt,{minX:80,maxX:880,minY:150,maxY:515});}
    for(const c of residents.values())wander(c,dt,penBounds(c.pen,creatureInfo(c.species).giant));
    for(const w of wisps){w.x=w.baseX+Math.sin(clock*.7+w.seed)*100;w.y=w.baseY+Math.cos(clock*.6+w.seed)*55;
      if(clock>=invincibleUntil&&Math.hypot(w.x-state.x,w.y-state.y)<30){
        invincibleUntil=clock+2;scatter(state.x,state.y,'#dbbfea');
        const respawned=takeHit(state);
        if(respawned){paused=true;populate();$('#respawn').hidden=false;$('#continue').focus();announce('You respawned at home. Everything you collected is safe.');}
        else announce('A wisp gave you a bump! Keep wandering, or rest at the ranch to restore your hearts.');
        renderUI();save();break;
      }
    }
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=85*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
    for(const c of state.collection.filter(c=>c.location!=='vacuum'))c.happiness=Math.max(25,c.happiness-dt/240);
    const close=nearest();
    $('#world-hint').textContent=close&&close.distance<110?`✧ Vacuum ${targetName(close)}`:state.biome==='ranch'?'Your pens keep every friend safely inside':'Tap to walk · Space / E to vacuum';
    $('#interact').firstChild.textContent='✧ Vacuum ';

  }
  drawWorld();requestAnimationFrame(tick);
}
const directions={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
window.addEventListener('keydown',event=>{
  if($('#inventory').open||paused||event.target.closest('input, select, summary, a'))return;
  if(event.key.toLowerCase()==='i'){event.preventDefault();openInventory();return;}
  if(directions[event.key]){event.preventDefault();keys.add(directions[event.key]);target=null;}
  if((event.code==='Space'&&!event.target.closest('button'))||event.key.toLowerCase()==='e'){event.preventDefault();if(!event.repeat)interact();}
});
window.addEventListener('keyup',e=>{if(directions[e.key])keys.delete(directions[e.key]);});
window.addEventListener('blur',()=>{keys.clear();target=null;save();});
document.addEventListener('visibilitychange',()=>{keys.clear();target=null;if(document.hidden)save();});
window.addEventListener('pagehide',save);
canvas.addEventListener('pointerdown',event=>{
  if(paused)return;event.preventDefault();canvas.focus();const rect=canvas.getBoundingClientRect();target={x:Math.max(35,Math.min(WIDTH-35,(event.clientX-rect.left)*canvas.width/rect.width+cameraX)),y:Math.max(110,Math.min(HEIGHT-30,(event.clientY-rect.top)*HEIGHT/rect.height))};
});
document.querySelectorAll('[data-dir]').forEach(button=>{
  button.addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();button.setPointerCapture(e.pointerId);target=null;keys.add(button.dataset.dir);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>keys.delete(button.dataset.dir));
});
$('#interact').addEventListener('click',interact);$('#home').addEventListener('click',()=>go('ranch'));
document.querySelectorAll('[data-biome]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.biome)));
document.querySelectorAll('[data-coat]').forEach(b=>b.addEventListener('click',()=>{state.coat=b.dataset.coat;renderUI();save();}));
$('#buy-treats').addEventListener('click',()=>{if(tradeTreats(state)){announce('Traded 5 stardust for 5 berries.');renderUI();save();}});
$('#continue').addEventListener('click',()=>{paused=false;$('#respawn').hidden=true;canvas.focus();});
$('#respawn').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();$('#continue').focus();}});
for(const [i,pen] of PENS.entries()){
  const button=document.createElement('button');button.dataset.pen=i;button.innerHTML=`${pen.name}<span>0 friends</span>`;button.addEventListener('click',()=>{selectedPen=i;renderUI();});$('#pen-tabs').append(button);
}
for(const selector of ['#mix-first','#mix-second'])SPECIES.forEach((s,i)=>{const option=document.createElement('option');option.value=i;option.textContent=s.name;$(selector).append(option);});
$('#mix-second').value='1';
$('#mix-first').addEventListener('change',updateWorkshop);$('#mix-second').addEventListener('change',updateWorkshop);
$('#open-inventory').addEventListener('click',openInventory);$('#close-inventory').addEventListener('click',()=>$('#inventory').close());
$('#inventory').addEventListener('close',()=>{keys.clear();canvas.focus({preventScroll:true});});
$('#build-home').addEventListener('click',()=>{if(buildHome(state)){scatter(450,210,'#fff1b3',40);announce(`Your ${HOME_STAGES[state.homeLevel-1].name.toLowerCase()} is built! A little more home, a little more magic.`);renderUI();save();}});
$('#combine').addEventListener('click',()=>{
  const giant=combineCreatures(state,Number($('#mix-first').value),Number($('#mix-second').value));
  if(giant){announce(`Meet ${creatureInfo(giant.species).name}! Two friends became one giant. Find it in Inventory and put it into a pen.`);scatter(state.x,state.y-40,'#e7c5ff',40);renderUI();save();openInventory();$('#inventory-message').textContent=`A new ${creatureInfo(giant.species).name}! Choose a pen to meet your big friend.`;}
});
populate();renderUI();save();requestAnimationFrame(tick);
setInterval(()=>{if(!document.hidden)renderUI();},1000);setInterval(save,5000);
if('serviceWorker' in navigator){
  const controlled=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled)$('#update').hidden=false;});
  $('#update').addEventListener('click',()=>location.reload());
  navigator.serviceWorker.register('../../sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
}
