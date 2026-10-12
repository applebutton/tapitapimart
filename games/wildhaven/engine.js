export const SPECIES = [
  { name: 'Mossbun', biome: 'meadow', color: '#a4cf72', accent: '#55764a', shape: 'bunny', note: 'A little gardener with leaves for ears.' },
  { name: 'Sunpuff', biome: 'meadow', color: '#ffd779', accent: '#c78348', shape: 'round', note: 'Stores warm sunshine in its fluffy coat.' },
  { name: 'Glimmerfox', biome: 'grove', color: '#c9b6ff', accent: '#71578d', shape: 'fox', note: 'Leaves a trail of tiny violet stars.' },
  { name: 'Dewdrop', biome: 'grove', color: '#8bddd3', accent: '#438d92', shape: 'drop', note: 'Sings softly when the forest gets quiet.' },
  { name: 'Emberling', biome: 'ridge', color: '#ffab8c', accent: '#a75465', shape: 'fox', note: 'A pocket-sized spark with a gentle heart.' },
  { name: 'Moonmoth', biome: 'ridge', color: '#d9e4ff', accent: '#9297c4', shape: 'moth', note: 'Collects moonlight on its velvet wings.' },
];
export const BIOMES = {
  ranch: { name: 'Your ranch', subtitle: 'A soft place to land', ground: '#bed295', shade: '#a9c37f' },
  meadow: { name: 'Sunpetal Meadow', subtitle: 'Where every adventure begins', ground: '#b1cd8b', shade: '#96bb74' },
  grove: { name: 'Whispering Grove', subtitle: 'Follow the little lights', ground: '#89b7a0', shade: '#719e8b' },
  ridge: { name: 'Moonstone Ridge', subtitle: 'Something stirs in the starlight', ground: '#acb5cf', shade: '#919dbb' },
};
export const WIDTH = 960;
export const HEIGHT = 580;
export const LIMIT = 30;
export const MATERIALS = {
  berries: { name: 'Berries', color: '#df9caa', icon: '●', hint: 'Feed your friends. Vacuum pink berry bushes.' },
  wood: { name: 'Wood', color: '#c49d76', icon: '▰', hint: 'Build your home. Vacuum fallen branches.' },
  stone: { name: 'Moonstones', color: '#a7b8d2', icon: '◆', hint: 'Build your home. Vacuum shiny rock piles.' },
};
export const PENS = [
  { name: 'Clover pen', x: 75, y: 350, width: 250, height: 175, color: '#d5e6ab' },
  { name: 'Blossom pen', x: 355, y: 350, width: 250, height: 175, color: '#ead6cc' },
  { name: 'Moonbeam pen', x: 635, y: 350, width: 250, height: 175, color: '#d4dcef' },
];
export const HOME_STAGES = [
  { name: 'Cozy cabin', wood: 8, stone: 5, description: 'Turn your little tent into a real home.' },
  { name: 'Flower porch', wood: 12, stone: 8, description: 'Add a sunny porch and window flowers.' },
  { name: 'Dream cottage', wood: 18, stone: 12, description: 'Build a bigger roof, chimney, and starry garden.' },
];
export function creatureInfo(type) {
  if (Number.isInteger(type) && SPECIES[type]) return { ...SPECIES[type], giant: false, genes: [type] };
  if (typeof type !== 'string' || !/^giant-[0-5]-[0-5]$/.test(type)) return null;
  const [, a, b] = type.split('-').map((v, i) => i ? Number(v) : v);
  if (a > b) return null;
  const first = SPECIES[a], second = SPECIES[b];
  const starts = ['Moss', 'Sunny', 'Glimmer', 'Dew', 'Ember', 'Moon'];
  const ends = ['bun', 'puff', 'fox', 'drop', 'spark', 'moth'];
  return { ...first, name: `Giant ${starts[a]}${ends[b]}`, accent: second.color, giant: true, genes: [a, b], note: `A big, bouncy blend of ${first.name} and ${second.name}.` };
}
export function freshState(now = Date.now()) {
  return { version: 2, gems: 0, materials: { berries: 8, wood: 0, stone: 0 }, collection: [], homeLevel: 0, biome: 'meadow', x: 480, y: 400, health: 3, coat: '#dd846a', lastSaved: now, nextId: 1 };
}
const clamp = (v, min, max, fallback) => Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
export function loadState(raw, now = Date.now()) {
  try {
    const s = JSON.parse(raw);
    if (![1, 2].includes(s?.version) || !Array.isArray(s.collection)) return freshState(now);
    const state = freshState(now);
    state.gems = Math.floor(clamp(s.gems, 0, 1e9, 0));
    for (const key of Object.keys(MATERIALS)) state.materials[key] = Math.floor(clamp(s.version === 1 ? (key === 'berries' ? s.treats : 0) : s.materials?.[key], 0, LIMIT, key === 'berries' ? 8 : 0));
    state.homeLevel = s.version === 1 ? 1 : Math.floor(clamp(s.homeLevel, 0, HOME_STAGES.length, 0));
    const elapsed = clamp((now - s.lastSaved) / 60000, 0, 120, 0);
    const bagCounts = {};
    state.collection = s.collection.filter(c => c && creatureInfo(c.species)).map((c, i) => {
      let location = s.version === 1 ? i % PENS.length : c.location;
      if (location !== 'vacuum' && (!Number.isInteger(location) || !PENS[location])) location = 0;
      if (location === 'vacuum') {
        bagCounts[c.species] = (bagCounts[c.species] || 0) + 1;
        // Preserve creatures from malformed or old oversized saves by homing the extras.
        if (bagCounts[c.species] > LIMIT) location = i % PENS.length;
      }
      return { id: i + 1, species: c.species, location, happiness: Math.max(25, clamp(c.happiness, 25, 100, 60) - elapsed * .25), rewardAt: clamp(c.rewardAt, 0, now + 60000, 0) };
    });
    state.nextId = state.collection.length + 1;
    state.biome = Object.hasOwn(BIOMES, s.biome) ? s.biome : 'meadow';
    state.x = clamp(s.x, 35, WIDTH - 35, 480); state.y = clamp(s.y, 105, HEIGHT - 35, 400);
    state.coat = ['#dd846a', '#7a99cc', '#9b80ba', '#6e9f80'].includes(s.coat) ? s.coat : state.coat;
    return state;
  } catch { return freshState(now); }
}
export function countCarried(state, species) { return state.collection.filter(c => c.location === 'vacuum' && c.species === species).length; }
export function collectMaterial(state, type, amount = 3) {
  if (!Object.hasOwn(MATERIALS, type) || !Number.isInteger(amount) || amount < 1) return 0;
  const taken = Math.min(amount, LIMIT - state.materials[type]); state.materials[type] += taken; return taken;
}
export function catchCreature(state, species, now = Date.now()) {
  const info = creatureInfo(species);
  if (state.biome === 'ranch' || !info || info.biome !== state.biome || countCarried(state, species) >= LIMIT) return null;
  const c = { id: state.nextId++, species, location: 'vacuum', happiness: 60, rewardAt: now + 30000 };
  state.collection.push(c); state.gems += 3; return c;
}
export function releaseCreature(state, species, pen) {
  if (state.biome !== 'ranch' || !Number.isInteger(pen) || !PENS[pen]) return false;
  const c = state.collection.find(c => c.location === 'vacuum' && c.species === species);
  if (!c) return false;
  c.location = pen; return true;
}
export function vacuumResident(state, id) {
  const c = state.collection.find(c => c.id === id);
  if (state.biome !== 'ranch' || !c || c.location === 'vacuum' || countCarried(state, c.species) >= LIMIT) return false;
  c.location = 'vacuum'; return true;
}
export function combineCreatures(state, first, second, now = Date.now()) {
  if (state.biome !== 'ranch' || !Number.isInteger(first) || !Number.isInteger(second) || !SPECIES[first] || !SPECIES[second]) return null;
  const a = state.collection.find(c => c.location === 'vacuum' && c.species === first);
  const b = state.collection.find(c => c.location === 'vacuum' && c.species === second && c.id !== a?.id);
  const type = `giant-${Math.min(first, second)}-${Math.max(first, second)}`;
  if (!a || !b || countCarried(state, type) >= LIMIT) return null;
  const giant = { id: state.nextId++, species: type, location: 'vacuum', happiness: Math.round((a.happiness + b.happiness) / 2), rewardAt: now + 30000 };
  state.collection = state.collection.filter(c => c.id !== a.id && c.id !== b.id);
  state.collection.push(giant); return giant;
}
export function buildHome(state) {
  const stage = HOME_STAGES[state.homeLevel];
  if (state.biome !== 'ranch' || !stage || state.materials.wood < stage.wood || state.materials.stone < stage.stone) return false;
  state.materials.wood -= stage.wood; state.materials.stone -= stage.stone; state.homeLevel++; return true;
}
export function careFor(state, id, action, now = Date.now()) {
  if (state.biome !== 'ranch') return { ok: false, message: 'Visit your ranch to care for your friends.' };
  const c = state.collection.find(c => c.id === id && c.location !== 'vacuum');
  if (!c) return { ok: false, message: 'Put this friend into a pen first.' };
  const name = creatureInfo(c.species).name;
  if (action === 'feed') {
    if (!state.materials.berries) return { ok: false, message: 'Vacuum pink berry bushes for more food.' };
    if (c.happiness >= 100) return { ok: false, message: 'Already perfectly happy. Save that berry for later!' };
    state.materials.berries--; c.happiness = Math.min(100, c.happiness + 25);
    return { ok: true, message: `${name} loved that berry!` };
  }
  if (action === 'pet') { c.happiness = Math.min(100, c.happiness + 10); return { ok: true, message: `${name} snuggles closer. +10 happiness` }; }
  if (action === 'reward') {
    if (c.happiness < 75) return { ok: false, message: 'Give some care first. Gifts need 75 happiness.' };
    if (now < c.rewardAt) return { ok: false, message: 'A little gift is growing. Check back soon.' };
    state.gems += 8; c.happiness = Math.max(25, c.happiness - 5); c.rewardAt = now + 60000;
    return { ok: true, message: 'A gift from your friend: +8 stardust!' };
  }
  return { ok: false, message: 'Choose feed, pet, or collect gift.' };
}
export function tradeTreats(state) {
  if (state.gems < 5 || state.materials.berries > LIMIT - 5) return false;
  state.gems -= 5; state.materials.berries += 5; return true;
}
export function travel(state, biome) {
  if (!Object.hasOwn(BIOMES, biome)) return;
  state.biome = biome; state.x = 480; state.y = biome === 'ranch' ? 548 : 440;
  if (biome === 'ranch') state.health = 3;
}
export function takeHit(state) {
  if (state.biome === 'ranch') return false;
  state.health--;
  if (state.health <= 0) { travel(state, 'ranch'); return true; }
  return false;
}
export function penBounds(pen, giant = false) {
  const p = PENS[pen], margin = giant ? 58 : 35;
  return { minX: p.x + margin, maxX: p.x + p.width - margin, minY: p.y + (giant ? 88 : 54), maxY: p.y + p.height - margin };
}
// Wander, sniff, and change direction rather than looping along a fixed orbit.
export function wander(actor, dt, bounds, random = Math.random) {
  actor.rest = Math.max(0, (actor.rest || 0) - dt);
  if (!actor.goal || Math.hypot(actor.goal.x - actor.x, actor.goal.y - actor.y) < 3) {
    actor.goal = { x: bounds.minX + random() * (bounds.maxX - bounds.minX), y: bounds.minY + random() * (bounds.maxY - bounds.minY) };
    actor.rest = .5 + random() * 2;
  }
  if (!actor.rest) {
    const dx = actor.goal.x - actor.x, dy = actor.goal.y - actor.y, d = Math.hypot(dx, dy);
    if (d > 0) { const step = Math.min(d, (actor.speed || 22) * dt); actor.x += dx / d * step; actor.y += dy / d * step; actor.facing = dx >= 0 ? 1 : -1; }
  }
  actor.x = Math.max(bounds.minX, Math.min(bounds.maxX, actor.x)); actor.y = Math.max(bounds.minY, Math.min(bounds.maxY, actor.y));
}
