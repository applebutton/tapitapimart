import { World3D, AvatarPreview } from './world3d.js';
import { SHOP, AVATAR_OPTIONS, SKU } from './catalog.js';
import { SPECIES, BIOMES, WIDTH, HEIGHT, LIMIT, MATERIALS, PENS, HOME_STAGES, creatureInfo, countCarried, collectMaterial, releaseCreature, vacuumResident, combineCreatures, buildHome, penBounds, wander, freshState, loadState, catchCreature, careFor, tradeTreats, travel, takeHit, setAvatar, avatarAllowed, purchase, vacuumRange, vacuumDelay } from './engine.js';

const SAVE_KEY = 'tapitapimart-wildhaven-v1';
let state;
try { state = loadState(localStorage.getItem(SAVE_KEY)); } catch { state = freshState(); }
const canvas = document.querySelector('#world');
let world, preview;
try { world = new World3D(canvas); } catch(error) {
  document.querySelector('#graphics-error').hidden=false;
  document.querySelector('#graphics-error').textContent='This 3D world needs WebGL 2. Please open it in a browser with graphics acceleration enabled.';
  console.error('Wildhaven graphics could not start',error);
}
const $ = selector => document.querySelector(selector);
let wild = [], wisps = [], berries = [], target = null, keys = new Set();
let lastTime = 0, clock = 0, invincibleUntil = 0, catchReady = 0, collectionSignature = '', paused = false;
let saveOkay = true, selectedPen = 0, beam = null, shopCategory = 'All', lookPointer = null;
const residents = new Map();
const particles = [];
function save() {
  state.lastSaved = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saveOkay = true; }
  catch { saveOkay = false; }
  $('#save-status').textContent = saveOkay ? 'Saved on this device · v7' : 'Saving unavailable · keep this tab open';
}
function announce(message) { $('#message').textContent = message; if($('#inventory').open)$('#inventory-message').textContent=message;if($('#shed-dialog').open)$('#shop-message').textContent=message;if($('#avatar-dialog').open)$('#avatar-message').textContent=message; }
function scatter(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 85, vy: -25 - Math.random() * 80, life: 1, color });
}
function populate() {
  const species = SPECIES.flatMap((s, i) => s.biome === state.biome ? [i] : []);
  wild = state.biome === 'ranch' ? [] : Array.from({ length: 5 }, (_, i) => ({ species: species[i % 2], x: [480, 640, 240, 770, 350][i], y: [330, 240, 245, 415, 480][i], seed: i * 2.1, wait: 0 }));
  const n = state.biome === 'ranch' ? 0 : state.biome === 'ridge' ? 4 : state.biome === 'grove' ? 3 : 2;
  wisps = Array.from({ length: n }, (_, i) => ({ x: 210 + i * 210, y: 160 + i * 75, baseX: 210 + i * 210, baseY: 180 + i * 75, seed: i * 2.4 }));
  if(state.biome==='ridge')wild.push({species:'giant-4-5',x:700,y:460,seed:12,wait:0,speed:14});
  berries = [{ type:'berries',x: 170, y: 420, ready: 0 }, { type:'berries',x: 790, y: 290, ready: 0 },{type:'wood',x:540,y:320,ready:0},{type:'wood',x:250,y:480,ready:0},{type:'stone',x:615,y:405,ready:0},{type:'stone',x:320,y:220,ready:0},{type:'metal',x:700,y:350,ready:0}];
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
  return world?.aim(state,items) ?? null;
}
function targetName(close) {return close.type==='material'?MATERIALS[close.object.type].name:creatureInfo(close.object.species).name;}
function interact() {
  if (paused || modalOpen() || clock < catchReady) return;
  const close = nearest();
  if (!close || close.distance > vacuumRange(state)) { announce(state.biome==='ranch'?'Walk closer to vacuum a penned friend, or open Inventory to put friends into pens.':'A little closer! Walk near a friend, a berry bush, branches, or shiny rocks.'); return; }
  catchReady = clock + vacuumDelay(state);
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
function drawCreature(context, species, x, y, size = 1) {
  const s=creatureInfo(species);context.save();context.translate(x,y);context.scale(size,size);
  const gradient=context.createRadialGradient(-9,-16,3,0,-5,27);gradient.addColorStop(0,'#fff9eb');gradient.addColorStop(.35,s.color);gradient.addColorStop(1,s.color);
  ellipse(context,0,13,23,6,'#5e78631b');ellipse(context,0,-8,25,24,gradient);ellipse(context,0,0,14,10,s.giant?s.accent:'#fff3de');
  if(s.shape==='bunny'){ellipse(context,-10,-30,6,9,s.color);ellipse(context,10,-30,6,9,s.color);}
  if(s.shape==='fox'){ellipse(context,-17,-26,7,7,s.color);ellipse(context,17,-26,7,7,s.color);}
  ellipse(context,-8,13,7,4,s.color);ellipse(context,8,13,7,4,s.color);ellipse(context,-7,-11,2,2.8,'#57443f');ellipse(context,7,-11,2,2.8,'#57443f');ellipse(context,-14,-5,4,2,'#e9aeb4');ellipse(context,14,-5,4,2,'#e9aeb4');ellipse(context,0,-4,2,1,'#a87e77');
  if(s.giant){ellipse(context,0,-26,4,4,'#fff1b0');}context.restore();
}
function modalOpen(){return Boolean(document.querySelector('dialog[open]'));}
function openShed(){
  if(paused||modalOpen()||state.biome!=='ranch')return;
  keys.clear();lookPointer=null;state.x=685;state.y=295;state.yaw=0;state.pitch=-.03;renderShop();$('#shop-message').textContent='Welcome! Use the tabs to find something lovely.';$('#shed-dialog').showModal();save();
}
function renderShop(){
  $('#shop-gems').textContent=state.gems;
  document.querySelectorAll('[data-shop-category]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.shopCategory===shopCategory));
  const chosen=SHOP.filter(item=>shopCategory==='All'||item.category===shopCategory);
  for(const card of $('#shop-items').children)card.hidden=!chosen.some(item=>item.id===card.dataset.sku);
  for(const item of chosen){let card=$(`[data-sku="${item.id}"]`);
    if(!card){card=document.createElement('article');card.className='shop-card';card.dataset.sku=item.id;card.innerHTML=`<div class="shop-art" style="--item-color:${item.color}"><span aria-hidden="true">${item.icon}</span></div><h3>${item.name}</h3><p>${item.description}</p><button data-buy="${item.id}"></button>`;card.querySelector('button').addEventListener('click',()=>{const result=purchase(state,item.id);announce(result.message);if(result.ok){renderUI();save();}else renderShop();});$('#shop-items').append(card);}
    const owned=state.owned.includes(item.id),button=card.querySelector('button');
    const equipped=(item.kind==='avatar'&&state.avatar[item.slot]===item.value)||(item.kind==='theme'&&state.ranchTheme===item.value)||(item.kind==='tool'&&state.toolStyle===item.value)||(item.kind==='pet'&&state.pet===item.value)||(['upgrade','furniture'].includes(item.kind)&&owned);
    const full=item.kind==='supply'&&state.materials[item.material]+item.amount>LIMIT;
    button.textContent=owned?(equipped?'Owned · in use':'Use this'):full?'Inventory full':`Buy · ${item.price} ✧`;
    button.disabled=equipped||full||(!owned&&state.gems<item.price);
  }
}
const pretty=value=>value.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
function renderAvatar(){
  for(const key of ['hair','outfit','accessory']){
    const select=$(`#avatar-${key}`);
    if(!select.options.length)for(const value of AVATAR_OPTIONS[key]){const o=document.createElement('option');o.value=value;select.append(o);}
    for(const option of select.options){const allowed=avatarAllowed(state,key,option.value);option.disabled=!allowed;option.textContent=`${pretty(option.value)}${allowed?'':' · in the Shed'}`;}
    select.value=state.avatar[key];
  }
  document.querySelectorAll('[data-avatar-skin]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.avatarSkin===state.avatar.skin));
  document.querySelectorAll('[data-avatar-hair-color]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.avatarHairColor===state.avatar.hairColor));
  document.querySelectorAll('[data-coat]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.coat===state.coat));
}
function openAvatar(){
  if(paused||modalOpen())return;keys.clear();lookPointer=null;renderAvatar();$('#avatar-dialog').showModal();
  if(!preview){try{preview=new AvatarPreview($('#avatar-preview'));}catch(error){$('#avatar-message').textContent='Your choices are saved. The 3D preview needs graphics acceleration.';}}
  preview?.render(state,clock);
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
  world?.animateVacuum();
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
  if(paused || modalOpen())return;
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
  updateWorkshop();if($('#inventory').open)renderInventory();if($('#shed-dialog').open)renderShop();if($('#avatar-dialog').open)renderAvatar();
  $('#open-shed').disabled=state.biome!=='ranch';
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
      card.innerHTML = `<canvas class="portrait" width="96" height="96" aria-hidden="true"></canvas><h3>${s.name}</h3><p class="species-note">${s.note}</p><div class="happiness"><span>Happiness</span><b></b></div><div class="meter"><span></span></div><div class="care-actions"><button data-care="feed">Feed · 1 berry</button><button data-care="pet">Pet ♡</button><button data-care="treat">Star cookie ★</button><button data-care="reward">Gift ✧</button><button class="vacuum-out" data-vacuum-id="${c.id}">Vacuum back into bag</button></div><p class="gift-note"></p>`;
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
    card.querySelector('[data-care="treat"]').disabled = !atHome || !state.materials.starfood || c.happiness >= 100;
    card.querySelector('[data-care="pet"]').disabled = !atHome || c.happiness >= 100;
    card.querySelector('[data-care="reward"]').disabled = !atHome || c.happiness < 75 || c.rewardAt > Date.now();
    card.querySelector('.vacuum-out').disabled=!atHome||countCarried(state,c.species)>=LIMIT;
    card.querySelector('.gift-note').textContent = c.happiness < 75 ? 'A little care brings happiness to 75 for gifts.' : c.rewardAt > Date.now() ? 'Growing a gift… ready within a minute.' : 'A gift is ready! +8 stardust';
  }
}
function ellipse(c, x, y, rx, ry, color) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
function polygon(c, points, color) { c.fillStyle = color; c.beginPath(); points.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.fill(); }
function tick(time){
  const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;
  if(!document.hidden&&!paused&&!modalOpen()){
    clock+=dt;
    const forward=(keys.has('up')?1:0)-(keys.has('down')?1:0),strafe=(keys.has('right')?1:0)-(keys.has('left')?1:0);
    const dx=-Math.sin(state.yaw)*forward+Math.cos(state.yaw)*strafe,dy=-Math.cos(state.yaw)*forward-Math.sin(state.yaw)*strafe;
    if(dx||dy){const d=Math.hypot(dx,dy),nx=Math.max(35,Math.min(WIDTH-35,state.x+dx/d*95*dt)),ny=Math.max(110,Math.min(HEIGHT-30,state.y+dy/d*95*dt));
      if(!world?.blocked(nx,state.y,state))state.x=nx;if(!world?.blocked(state.x,ny,state))state.y=ny;
    }
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
    $('#world-hint').textContent=close&&close.distance<vacuumRange(state)?`✧ Vacuum ${targetName(close)}`:state.biome==='ranch'?'Swipe to look · visit the Creator’s Shed':'Swipe to look · arrows to walk';
    $('#reticle').classList.toggle('ready',Boolean(close&&close.distance<vacuumRange(state)));
    $('#interact').firstChild.textContent='✧ Vacuum ';

  }
  if(!document.hidden)world?.render(state,wild,residents,berries,wisps,clock,dt,beam,keys.size>0);
  if($('#avatar-dialog').open)preview?.render(state,clock);
  requestAnimationFrame(tick);
}
const directions={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
window.addEventListener('keydown',event=>{
  if(modalOpen()||paused||event.target.closest('input, select, summary, a'))return;
  if(event.key.toLowerCase()==='i'){event.preventDefault();openInventory();return;}
  if(event.key==='q'||event.key==='Q'){state.yaw+=.15;return;}
  if(event.key==='r'||event.key==='R'){state.yaw-=.15;return;}
  if(event.key==='PageUp'){event.preventDefault();state.pitch=Math.min(.8,state.pitch+.1);return;}
  if(event.key==='PageDown'){event.preventDefault();state.pitch=Math.max(-1.05,state.pitch-.1);return;}
  if(directions[event.key]){event.preventDefault();keys.add(directions[event.key]);target=null;}
  if((event.code==='Space'&&!event.target.closest('button'))||event.key.toLowerCase()==='e'){event.preventDefault();if(!event.repeat)interact();}
});
window.addEventListener('keyup',e=>{if(directions[e.key])keys.delete(directions[e.key]);});
window.addEventListener('blur',()=>{keys.clear();target=null;save();});
document.addEventListener('visibilitychange',()=>{keys.clear();target=null;if(document.hidden)save();});
window.addEventListener('pagehide',save);
canvas.addEventListener('pointerdown',event=>{
  if(paused||modalOpen())return;event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);lookPointer={id:event.pointerId,x:event.clientX,y:event.clientY};
});
canvas.addEventListener('pointermove',event=>{
  if(!lookPointer||event.pointerId!==lookPointer.id)return;
  state.yaw-=(event.clientX-lookPointer.x)*.0045;state.pitch=Math.max(-1.05,Math.min(.8,state.pitch-(event.clientY-lookPointer.y)*.0045));lookPointer.x=event.clientX;lookPointer.y=event.clientY;
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{lookPointer=null;});
document.querySelectorAll('[data-dir]').forEach(button=>{
  button.addEventListener('pointerdown',e=>{if(paused||modalOpen())return;e.preventDefault();button.setPointerCapture(e.pointerId);target=null;keys.add(button.dataset.dir);});
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
for(const category of ['All',...new Set(SHOP.map(item=>item.category))]){
  const button=document.createElement('button');button.dataset.shopCategory=category;button.textContent=category;button.addEventListener('click',()=>{shopCategory=category;renderShop();});$('#shop-tabs').append(button);
}
for(const [key,container,attr] of [['skin','#skin-options','avatarSkin'],['hairColor','#hair-color-options','avatarHairColor']]){
  AVATAR_OPTIONS[key].forEach((value,i)=>{const b=document.createElement('button');b.dataset[attr]=value;b.style.setProperty('--swatch',value);b.setAttribute('aria-label',`${key==='skin'?'Skin tone':'Hair color'} ${i+1}`);b.addEventListener('click',()=>{setAvatar(state,key,value);renderAvatar();save();});$(container).append(b);});
}
for(const key of ['hair','outfit','accessory'])$(`#avatar-${key}`).addEventListener('change',e=>{setAvatar(state,key,e.target.value);renderAvatar();save();});
$('#open-shed').addEventListener('click',openShed);$('#open-avatar').addEventListener('click',openAvatar);
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(`#${b.dataset.close}`).close()));
for(const selector of ['#shed-dialog','#avatar-dialog'])$(selector).addEventListener('close',()=>{keys.clear();canvas.focus({preventScroll:true});});
populate();renderUI();save();requestAnimationFrame(tick);
setInterval(()=>{if(!document.hidden)renderUI();},1000);setInterval(save,5000);
if('serviceWorker' in navigator){
  const controlled=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled)$('#update').hidden=false;});
  $('#update').addEventListener('click',()=>location.reload());
  navigator.serviceWorker.register('../../sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
}
