import {LANDS,ROOMS,SPOTS,enterRoom,leaveRoom,setLand,placeFurniture} from './housing.js';
import { World3D, shopPicture as housePicture } from './world3d.js';
import { AvatarPreview, shopPicture as illustratedPicture, drawFriend } from './world2d.js';
const shopPicture=(item,state)=>item.kind==='house'?housePicture(item,state):illustratedPicture(item,state);
import { SHOP, AVATAR_OPTIONS, SKU, HOUSE_STYLES } from './catalog.js';
import { SPECIES, BIOMES, WIDTH, HEIGHT, LIMIT, MATERIALS, PENS, HOME_STAGES, creatureInfo, countCarried, collectMaterial, releaseCreature, vacuumResident, combineCreatures, buildHome, penBounds, wander, freshState, loadState, catchCreature, careFor, tradeTreats, travel, takeHit, setAvatar, avatarAllowed, purchase, vacuumRange, vacuumDelay } from './engine.js';

const SAVE_KEY = 'tapitapimart-wildhaven-v1';
let state;
try { state = loadState(localStorage.getItem(SAVE_KEY)); } catch { state = freshState(); }
const canvas = document.querySelector('#world');
let world, preview;
try { world = new World3D(canvas); if(world.blocked(state.x,state.y,state)){if(state.room){state.x=480;state.y=370;}else if(state.biome==='ranch')leaveRoom(state);} } catch(error) {
  document.querySelector('#graphics-error').hidden=false;
  document.querySelector('#graphics-error').textContent='This illustrated 3D world needs WebGL 2. Please open it in a browser with graphics acceleration.';
  console.error('Wildhaven canvas could not start',error);
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
  $('#save-status').textContent = saveOkay ? 'Saved on this device · v12' : 'Saving unavailable · keep this tab open';
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
  if(state.room)return null;
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
function drawCreature(context,species,x,y,size=1){context.clearRect(0,0,context.canvas.width,context.canvas.height);drawFriend(context,species,x,y+20,size*67);}
function modalOpen(){return Boolean(document.querySelector('dialog[open]'));}
function openShed(){
  if(paused||modalOpen()||state.biome!=='ranch')return;
  keys.clear();lookPointer=null;enterRoom(state,'shed');renderUI();renderShop();$('#shop-message').textContent='Welcome! Use the tabs to find something lovely.';$('#shed-dialog').showModal();save();
}
function renderShop(){
  $('#shop-gems').textContent=state.gems;
  document.querySelectorAll('[data-shop-category]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.shopCategory===shopCategory));
  const chosen=SHOP.filter(item=>shopCategory==='All'||item.category===shopCategory);
  for(const card of $('#shop-items').children)card.hidden=!chosen.some(item=>item.id===card.dataset.sku);
  for(const item of chosen){let card=$(`[data-sku="${item.id}"]`);
    if(!card){card=document.createElement('article');card.className='shop-card';card.dataset.sku=item.id;card.innerHTML=`<div class="shop-art" style="--item-color:${item.color}"><img alt="${item.name} preview" loading="lazy"></div><h3>${item.name}</h3><p>${item.description}</p><button data-buy="${item.id}"></button>`;try{card.querySelector('img').src=shopPicture(item,state);}catch{card.querySelector('img').alt=`${item.name} preview unavailable`;}card.querySelector('button').addEventListener('click',()=>{const result=purchase(state,item.id);announce(result.message);if(result.ok){renderUI();save();}else renderShop();$('#shop-message').textContent=result.message;});const view=document.createElement('button');view.dataset.viewPurchase=item.id;view.textContent='See at ranch';view.addEventListener('click',()=>{showPurchase(item.id);});card.append(view);$('#shop-items').append(card);}
    const owned=state.owned.includes(item.id),button=card.querySelector('button');card.querySelector('[data-view-purchase]').hidden=!owned||!['furniture','theme','house'].includes(item.kind);
    const equipped=(item.kind==='avatar'&&state.avatar[item.slot]===item.value)||(item.kind==='theme'&&state.ranchTheme===item.value)||(item.kind==='house'&&state.houseStyle===item.value)||(item.kind==='tool'&&state.toolStyle===item.value)||(item.kind==='pet'&&state.pet===item.value)||(['upgrade','furniture'].includes(item.kind)&&owned);
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
  if(!preview){try{preview=new AvatarPreview($('#avatar-preview'));}catch(error){$('#avatar-message').textContent='Your choices are saved. The illustrated preview is unavailable.';}}
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
  $('#home-name').textContent=HOUSE_STYLES[state.houseStyle]?.name||levelNames[state.homeLevel];
  const stage=HOME_STAGES[state.homeLevel];
  $('#build-description').textContent=stage ? stage.description : 'A lovely place to come home to. Keep exploring and filling your pens!';
  $('#build-cost').textContent=stage ? `${state.materials.wood} / ${stage.wood} wood + ${state.materials.stone} / ${stage.stone} moonstones` : 'Your house is built. Go inside to decorate your rooms.';
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
  $('#place').textContent = state.room?ROOMS[state.room]:state.biome==='ranch'?LANDS[state.ranchLand]:BIOMES[state.biome].name; $('#subtitle').textContent = state.room?'Walk around and make yourself at home':BIOMES[state.biome].subtitle;
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
  $('#enter-cabin').disabled=state.biome!=='ranch'||!state.homeLevel;$('#enter-studio').disabled=state.biome!=='ranch';$('#decorate').disabled=state.biome!=='ranch';$('#exit-room').hidden=!state.room;$('#ranch-land').value=state.ranchLand;$('#ranch-land').disabled=state.biome!=='ranch';$('#home-help').textContent=state.biome!=='ranch'?'Come home to change your land or decorate.':!state.homeLevel?'Build a cabin below or buy a complete home in the Houses shop tab. The Creator’s room is open now.':'Your rooms, decorations, and chosen land are saved automatically.';
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
    const dx=state.room?strafe:-Math.sin(state.yaw)*forward+Math.cos(state.yaw)*strafe,dy=state.room?-forward:-Math.cos(state.yaw)*forward-Math.sin(state.yaw)*strafe;
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
    $('#world-hint').textContent=close&&close.distance<vacuumRange(state)?`✧ Vacuum ${targetName(close)}`:state.room?'Inside · decorate or go outside':state.biome==='ranch'?'Your ranch · drag to look · arrows to walk':'Drag to look · arrows to walk · vacuum nearby friends';
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
  if(!state.room&&event.key.toLowerCase()==='q'){state.yaw+=.15;return;}if(!state.room&&event.key.toLowerCase()==='r'){state.yaw-=.15;return;}
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
  if(!state.room){state.yaw-=(event.clientX-lookPointer.x)*.0045;state.pitch=Math.max(-.7,Math.min(.5,state.pitch-(event.clientY-lookPointer.y)*.003));}lookPointer.x=event.clientX;lookPointer.y=event.clientY;
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
function visitRoom(room){if(enterRoom(state,room)){keys.clear();target=null;renderUI();save();announce(`Welcome to ${ROOMS[room]}. Choose Decorate to arrange your furniture.`);canvas.scrollIntoView({block:'center'});}}
function showPurchase(id){
 const item=SKU[id];if($('#shed-dialog').open)$('#shed-dialog').close();if($('#decor-dialog').open)$('#decor-dialog').close();
 const placement=state.decor[id];if(placement){visitRoom(placement.room);state.x=480+SPOTS[placement.spot][0]/.04;state.y=Math.min(378,290+(SPOTS[placement.spot][1]+1.7)/.04);state.pitch=-.18;save();}else{leaveRoom(state);if(item.kind==='furniture'){state.x=250;state.y=350;}else{state.x=450;state.y=330;}state.yaw=0;state.pitch=-.10;renderUI();save();canvas.scrollIntoView({block:'center'});announce(item.kind==='theme'?`${item.name} is applied to your home and ranch. Themes decorate your home; build the cabin below when you are ready.`:item.kind==='house'?`${item.name} is your active home. Choose Enter cabin to decorate inside.`:`${item.name} is on your patio beside the house.`);}
}
function renderDecor(){
 const container=$('#decor-items');container.replaceChildren();const owned=SHOP.filter(i=>i.kind==='furniture'&&state.owned.includes(i.id));
 if(!owned.length){container.textContent='Your decoration collection is empty. Visit the Creator’s Shed to pick furniture.';return;}
 for(const item of owned){const card=document.createElement('article');card.className='decor-card';card.innerHTML=`<img alt="${item.name}"><div><h3>${item.name}</h3><label>Where <select data-room><option value="outside">Outdoor patio</option><option value="cabin">Cabin</option><option value="shed">Creator’s room</option></select></label><label>Spot <select data-spot>${['Back left','Back middle','Back right','Left wall','Right wall','Front left','Front right'].map((n,i)=>`<option value="${i}">${n}</option>`).join('')}</select></label><label>Turn <select data-turn><option value="0">Forward</option><option value="1">Right</option><option value="2">Back</option><option value="3">Left</option></select></label><button data-place>Place here</button><button data-find>Find item</button></div>`;
 try{card.querySelector('img').src=shopPicture(item,state);}catch{}const p=state.decor[item.id];card.querySelector('[data-room]').value=p?.room||'outside';card.querySelector('[data-room] option[value="cabin"]').disabled=!state.homeLevel;card.querySelector('[data-spot]').value=p?.spot||0;card.querySelector('[data-turn]').value=p?.rotation||0;
 card.querySelector('[data-place]').addEventListener('click',()=>{const room=card.querySelector('[data-room]').value,ok=placeFurniture(state,item.id,room,Number(card.querySelector('[data-spot]').value),Number(card.querySelector('[data-turn]').value));$('#decor-message').textContent=ok?`${item.name} placed. Use Find item to see it.`:'That spot is already used. Choose another spot.';if(ok){save();renderUI();}});card.querySelector('[data-find]').addEventListener('click',()=>showPurchase(item.id));container.append(card);}
}
$('#enter-cabin').addEventListener('click',()=>visitRoom('cabin'));$('#enter-studio').addEventListener('click',()=>visitRoom('shed'));$('#exit-room').addEventListener('click',()=>{leaveRoom(state);renderUI();save();});
$('#ranch-land').addEventListener('change',e=>{if(setLand(state,e.target.value)){renderUI();save();announce(`Your ranch is now in ${LANDS[state.ranchLand]}. Your home, furniture, and creatures came with you.`);}});
$('#decorate').addEventListener('click',()=>{keys.clear();renderDecor();$('#decor-message').textContent='';$('#decor-dialog').showModal();});
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

window.addEventListener('wildhaven-art-ready',()=>{collectionSignature='';renderUI();for(const card of $('#shop-items').children){const item=SKU[card.dataset.sku];if(item)card.querySelector('img').src=shopPicture(item,state);}});
