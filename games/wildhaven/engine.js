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
export function freshState(now = Date.now()) {
  return { version: 1, gems: 0, treats: 8, collection: [], biome: 'meadow', x: 480, y: 400, health: 3, coat: '#dd846a', lastSaved: now, nextId: 1 };
}
export function loadState(raw, now = Date.now()) {
  try {
    const s = JSON.parse(raw);
    if (s.version !== 1 || !Array.isArray(s.collection)) return freshState(now);
    const state = freshState(now);
    const number = (v, min, max, fallback) => Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
    state.gems = Math.floor(number(s.gems, 0, 1e9, 0));
    state.treats = Math.floor(number(s.treats, 0, 1e6, 8));
    const elapsed = number((now - s.lastSaved) / 60000, 0, 120, 0);
    state.collection = s.collection.filter(c => Number.isInteger(c.species) && SPECIES[c.species]).map((c, i) => ({
      id: i + 1, species: c.species,
      happiness: number(c.happiness, 25, 100, 60) > 25 ? Math.max(25, number(c.happiness, 25, 100, 60) - elapsed * .25) : 25,
      rewardAt: number(c.rewardAt, 0, now + 60000, 0),
    }));
    state.nextId = state.collection.length + 1;
    state.biome = Object.hasOwn(BIOMES, s.biome) ? s.biome : 'meadow';
    state.x = number(s.x, 35, WIDTH - 35, 480);
    state.y = number(s.y, 105, HEIGHT - 35, 400);
    state.coat = ['#dd846a', '#7a99cc', '#9b80ba', '#6e9f80'].includes(s.coat) ? s.coat : state.coat;
    return state;
  } catch { return freshState(now); }
}
export function catchCreature(state, species, now = Date.now()) {
  if (state.biome === 'ranch' || !SPECIES[species] || SPECIES[species].biome !== state.biome) return null;
  const creature = { id: state.nextId++, species, happiness: 60, rewardAt: now + 30000 };
  state.collection.push(creature);
  state.gems += 3;
  return creature;
}
export function careFor(state, id, action, now = Date.now()) {
  if (state.biome !== 'ranch') return { ok: false, message: 'Visit your ranch to care for your companions.' };
  const creature = state.collection.find(c => c.id === id);
  if (!creature) return { ok: false, message: 'This companion is not at the ranch.' };
  if (action === 'feed') {
    if (!state.treats) return { ok: false, message: 'Gather berries in the wild, or trade 5 stardust for 5 treats.' };
    if (creature.happiness >= 100) return { ok: false, message: 'Already perfectly happy. Save that treat for later!' };
    state.treats--;
    creature.happiness = Math.min(100, creature.happiness + 25);
    return { ok: true, message: `${SPECIES[creature.species].name} loved that berry treat!` };
  }
  if (action === 'pet') {
    creature.happiness = Math.min(100, creature.happiness + 10);
    return { ok: true, message: `${SPECIES[creature.species].name} snuggles closer. +10 happiness` };
  }
  if (action === 'reward') {
    if (creature.happiness < 75) return { ok: false, message: 'Give some care first. Gifts need at least 75 happiness.' };
    if (now < creature.rewardAt) return { ok: false, message: 'A little gift is growing. Check back soon.' };
    state.gems += 8;
    creature.happiness = Math.max(25, creature.happiness - 5);
    creature.rewardAt = now + 60000;
    return { ok: true, message: 'A gift from your companion: +8 stardust!' };
  }
  return { ok: false, message: 'Choose feed, pet, or collect gift.' };
}
export function tradeTreats(state) {
  if (state.gems < 5) return false;
  state.gems -= 5; state.treats += 5; return true;
}
export function travel(state, biome) {
  if (!Object.hasOwn(BIOMES, biome)) return;
  state.biome = biome; state.x = 480; state.y = 440;
  if (biome === 'ranch') state.health = 3;
}
export function takeHit(state) {
  if (state.biome === 'ranch') return false;
  state.health--;
  if (state.health <= 0) { travel(state, 'ranch'); return true; }
  return false;
}
