import { SPECIES, BIOMES, WIDTH, HEIGHT, freshState, loadState, catchCreature, careFor, tradeTreats, travel, takeHit } from './engine.js';

const SAVE_KEY = 'tapitapimart-wildhaven-v1';
let state;
try { state = loadState(localStorage.getItem(SAVE_KEY)); } catch { state = freshState(); }
const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const $ = selector => document.querySelector(selector);
let wild = [], wisps = [], berries = [], target = null, keys = new Set(), cameraX = 0;
let lastTime = 0, clock = 0, invincibleUntil = 0, catchReady = 0, collectionSignature = '', paused = false;
let saveOkay = true;
const particles = [];
function save() {
  state.lastSaved = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); saveOkay = true; }
  catch { saveOkay = false; }
  $('#save-status').textContent = saveOkay ? 'Saved on this device · v4' : 'Saving unavailable · keep this tab open';
}
function announce(message) { $('#message').textContent = message; }
function scatter(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 85, vy: -25 - Math.random() * 80, life: 1, color });
}
function populate() {
  const species = SPECIES.flatMap((s, i) => s.biome === state.biome ? [i] : []);
  wild = state.biome === 'ranch' ? [] : Array.from({ length: 5 }, (_, i) => ({ species: species[i % 2], x: [420, 640, 240, 770, 350][i], y: [330, 240, 245, 415, 480][i], seed: i * 2.1, wait: 0 }));
  const n = state.biome === 'ranch' ? 0 : state.biome === 'ridge' ? 4 : state.biome === 'grove' ? 3 : 2;
  wisps = Array.from({ length: n }, (_, i) => ({ x: 210 + i * 210, y: 160 + i * 75, baseX: 210 + i * 210, baseY: 180 + i * 75, seed: i * 2.4 }));
  berries = [{ x: 170, y: 420, ready: 0 }, { x: 790, y: 290, ready: 0 }];
  target = null; keys.clear();
}
function go(biome) {
  if (paused) return;
  travel(state, biome); populate(); invincibleUntil = clock + 2;
  announce(biome === 'ranch' ? 'Home sweet home. Feed and pet your companions below, and collect their gifts.' : `Welcome to ${BIOMES[biome].name}. Follow your curiosity.`);
  renderUI(); save();
}
function nearest() {
  const items = [...wild.filter(c => c.wait <= clock).map(c => ({ type: 'creature', object: c })), ...berries.filter(b => b.ready <= clock && state.biome !== 'ranch').map(b => ({ type: 'berry', object: b }))];
  return items.map(item => ({ ...item, distance: Math.hypot(item.object.x - state.x, item.object.y - state.y) })).sort((a, b) => a.distance - b.distance)[0];
}
function interact() {
  if (paused || clock < catchReady) return;
  if (state.biome === 'ranch') { $('#collection').scrollIntoView({ behavior: 'smooth', block: 'center' }); announce('Your friends are waiting below. Petting is always free!'); return; }
  const close = nearest();
  if (!close || close.distance > 90) { announce('A little closer! Walk into the glowing circle around a creature or berry bush.'); return; }
  catchReady = clock + .6;
  if (close.type === 'creature') {
    const creature = catchCreature(state, close.object.species);
    close.object.wait = clock + 12;
    scatter(close.object.x, close.object.y, '#fff6b4', 24);
    announce(`${SPECIES[creature.species].name} joined your ranch! +3 stardust. Visit home to say hello.`);
  } else {
    state.treats += 3; close.object.ready = clock + 18;
    scatter(close.object.x, close.object.y, '#e6959c');
    announce('A handful of sweet berries. +3 treats for your companions!');
  }
  renderUI(); save();
}
function drawCreature(context, species, x, y, size = 1, t = 0) {
  const s = SPECIES[species]; context.save(); context.translate(x, y); context.scale(size, size);
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
  ellipse(context, 0, 3, 12, 10, '#fff9e389');
  ellipse(context, -7, -7, 2.2, 3, '#354d49'); ellipse(context, 7, -7, 2.2, 3, '#354d49');
  ellipse(context, -12, -1, 3, 1.7, '#d9877b80'); ellipse(context, 12, -1, 3, 1.7, '#d9877b80');
  context.strokeStyle = s.accent; context.lineWidth = 1.5; context.beginPath(); context.arc(0, -1, 3, .2, Math.PI - .2); context.stroke();
  context.restore();
}
function renderUI() {
  $('#gems').textContent = state.gems; $('#treats').textContent = state.treats;
  $('#health').textContent = '♥ '.repeat(state.health) + '♡ '.repeat(3 - state.health);
  $('#health').setAttribute('aria-label', `${state.health} of 3 hearts`);
  $('#place').textContent = BIOMES[state.biome].name; $('#subtitle').textContent = BIOMES[state.biome].subtitle;
  $('#collection-count').textContent = state.collection.length;
  $('#ranch-count').textContent = state.collection.length ? `${state.collection.length} little ${state.collection.length === 1 ? 'friend' : 'friends'} waiting` : 'A home for new friends';
  $('#care-note').textContent = state.biome === 'ranch' ? 'Petting is free. Happy companions make gifts every minute. No need to rush.' : 'Return to your ranch to feed, pet, and collect gifts.';
  $('#buy-treats').disabled = state.gems < 5;
  document.querySelectorAll('[data-biome]').forEach(b => { b.classList.toggle('active', b.dataset.biome === state.biome); b.setAttribute('aria-pressed', b.dataset.biome === state.biome); });
  document.querySelectorAll('[data-coat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.coat === state.coat));
  const signature = JSON.stringify([state.biome, state.treats, state.collection.map(c => [c.id, Math.round(c.happiness), c.rewardAt <= Date.now()])]);
  if (signature === collectionSignature) return;
  collectionSignature = signature;
  const container = $('#collection');
  if (!state.collection.length) { container.innerHTML = '<div class="empty">Your ranch has room for a little magic.<br>Befriend a creature in the wild to bring your first companion home.</div>'; return; }
  // Keep cards and focused controls stable while happiness and gift readiness change.
  for (const c of state.collection) {
    let card = container.querySelector(`[data-creature="${c.id}"]`);
    const s = SPECIES[c.species];
    if (!card) {
      container.querySelector('.empty')?.remove();
      card = document.createElement('article'); card.className = 'creature-card'; card.dataset.creature = c.id;
      card.innerHTML = `<canvas class="portrait" width="96" height="96" aria-hidden="true"></canvas><h3>${s.name}</h3><p class="species-note">${s.note}</p><div class="happiness"><span>Happiness</span><b></b></div><div class="meter"><span></span></div><div class="care-actions"><button data-care="feed">Feed · 1 treat</button><button data-care="pet">Pet ♡</button><button data-care="reward">Gift ✧</button></div><p class="gift-note"></p>`;
      card.querySelectorAll('[data-care]').forEach(button => button.addEventListener('click', () => {
        const result = careFor(state, c.id, button.dataset.care); announce(result.message); renderUI(); save();
        if (result.ok) scatter(state.x, state.y - 20, '#fff2b0');
      }));
      container.append(card);
      drawCreature(card.querySelector('canvas').getContext('2d'), c.species, 48, 60, 1.4);
    }
    card.querySelector('.happiness b').textContent = `${Math.round(c.happiness)} / 100`;
    card.querySelector('.meter span').style.width = `${c.happiness}%`;
    const atHome = state.biome === 'ranch';
    card.querySelector('[data-care="feed"]').disabled = !atHome || !state.treats || c.happiness >= 100;
    card.querySelector('[data-care="pet"]').disabled = !atHome || c.happiness >= 100;
    card.querySelector('[data-care="reward"]').disabled = !atHome || c.happiness < 75 || c.rewardAt > Date.now();
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
    // Cottage, little garden and a generous companion paddock.
    ctx.fillStyle='#d5b987';ctx.fillRect(350,160,210,130);
    polygon(ctx,[[325,171],[451,80],[584,171]],'#9f735e');polygon(ctx,[[339,171],[451,94],[567,171]],'#b1856a');
    ctx.fillStyle='#795b48';ctx.fillRect(434,218,43,72);ctx.fillStyle='#ead29d';ctx.fillRect(379,197,30,30);ctx.fillRect(503,197,30,30);
    line([[394,197],[394,227]],'#ad9871',3);line([[379,212],[409,212]],'#ad9871',3);
    ellipse(ctx,467,255,2,2,'#ebd3a0');
    label('HOME, SWEET WILDHAVEN',450,317);
    for(let x=110;x<860;x+=38){ if(x>395&&x<550)continue;line([[x,337],[x,372]],'#f0e5c5',7); }
    line([[110,347],[382,347]],'#e7d9af',6);line([[565,347],[870,347]],'#e7d9af',6);
    for(let i=0;i<6;i++){ellipse(ctx,140+i*25,280,9,7,'#819b58');ellipse(ctx,140+i*25,275,4,4,'#e7b775');}
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
  if(state.biome!=='ranch') for(const berry of berries){
    ellipse(ctx,berry.x,berry.y+8,25,8,'#47614220');ellipse(ctx,berry.x,berry.y-2,24,19,'#719363');ellipse(ctx,berry.x-13,berry.y-9,13,13,'#85a46f');
    if(berry.ready<=clock)for(let i=0;i<6;i++)ellipse(ctx,berry.x-14+(i%3)*12,berry.y-12+Math.floor(i/3)*13,4,4,'#e2a1a0');
  }
  const close=nearest();
  if(close && close.distance<90){ctx.strokeStyle='#fff9c4';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.ellipse(close.object.x,close.object.y+10,36,20,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);label(close.type==='creature'?SPECIES[close.object.species].name:'Berry treats',close.object.x,close.object.y-54);}
  const companions=state.biome==='ranch'?state.collection.slice(-24).map((c,i)=>({species:c.species,x:170+(i%8)*86+Math.sin(clock*.5+i)*15,y:390+Math.floor(i/8)*54+Math.cos(clock*.4+i)*10,seed:i})):wild.filter(c=>c.wait<=clock);
  const actors=companions.map(c=>({y:c.y,draw:()=>drawCreature(ctx,c.species,c.x,c.y,1,clock+c.seed)}));
  actors.push({y:state.y,draw:drawAvatar});
  for(const w of wisps) actors.push({y:w.y,draw:()=>{
    ellipse(ctx,w.x,w.y+10,17,5,'#68517926');ellipse(ctx,w.x,w.y-3,27,27,'#ba9cdb20');ellipse(ctx,w.x,w.y-3,16,17,'#b4a0d5');
    polygon(ctx,[[w.x-12,w.y+8],[w.x-7,w.y+20],[w.x,w.y+11],[w.x+8,w.y+17],[w.x+14,w.y+7]],'#b4a0d5');
    ellipse(ctx,w.x-5,w.y-5,2,3,'#635777');ellipse(ctx,w.x+5,w.y-5,2,3,'#635777');
  }});
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw());
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
  ctx.fillStyle='#cfbd8b';ctx.beginPath();ctx.roundRect(x-9,y-19,18,15,4);ctx.fill();line([[x-6,y-14],[x+6,y-14]],'#b09b71',2);
}
function tick(time){
  const dt=Math.min((time-lastTime)/1000||0,.05);lastTime=time;
  if(!document.hidden&&!paused){
    clock+=dt;
    let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);
    if(target&&!dx&&!dy){dx=target.x-state.x;dy=target.y-state.y;if(Math.hypot(dx,dy)<5){target=null;dx=dy=0;}}
    if(dx||dy){const d=Math.hypot(dx,dy);state.x=Math.max(35,Math.min(WIDTH-35,state.x+dx/d*155*dt));state.y=Math.max(110,Math.min(HEIGHT-30,state.y+dy/d*155*dt));}
    for(const c of wild){if(c.wait>clock)continue;c.x=Math.max(80,Math.min(880,c.x+Math.sin(clock*.5+c.seed)*dt*8));c.y=Math.max(140,Math.min(525,c.y+Math.cos(clock*.6+c.seed)*dt*6));}
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
    for(const c of state.collection)c.happiness=Math.max(25,c.happiness-dt/240);
    const close=nearest();
    $('#world-hint').textContent=state.biome==='ranch'?'Home is where your little friends are':close&&close.distance<90?(close.type==='creature'?`✧ Befriend ${SPECIES[close.object.species].name}`:'◉ Gather berry treats'):'Tap to walk · avoid the purple wisps';
    $('#interact').firstChild.textContent=state.biome==='ranch'?'♡ Care for friends ':close&&close.distance<90?(close.type==='creature'?'✧ Catch creature ':'◉ Gather berries '):'✧ Catch / gather ';
  }
  drawWorld();requestAnimationFrame(tick);
}
const directions={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};
window.addEventListener('keydown',event=>{
  if(event.target.closest('input, select, summary, a'))return;
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
$('#buy-treats').addEventListener('click',()=>{if(tradeTreats(state)){announce('Traded 5 stardust for 5 berry treats.');renderUI();save();}});
$('#continue').addEventListener('click',()=>{paused=false;$('#respawn').hidden=true;canvas.focus();});
$('#respawn').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();$('#continue').focus();}});
populate();renderUI();save();requestAnimationFrame(tick);
setInterval(()=>{if(!document.hidden)renderUI();},1000);setInterval(save,5000);
if('serviceWorker' in navigator){
  const controlled=Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(controlled)$('#update').hidden=false;});
  $('#update').addEventListener('click',()=>location.reload());
  navigator.serviceWorker.register('../../sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
}
