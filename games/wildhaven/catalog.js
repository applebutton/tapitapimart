export const AVATAR_OPTIONS = {
  skin: ['#f5d8bb', '#e7b98e', '#ce936c', '#aa7250', '#805239', '#543929'],
  hairColor: ['#3e302e', '#79523b', '#c39458', '#e8cc8d', '#c58da8', '#efa0bd', '#8b80b0'],
  hair: ['bob', 'curls', 'ponytail', 'space-buns', 'sugarcloud-waves'],
  outfit: ['overalls', 'hoodie', 'cloud-dress', 'star-hoodie', 'sugarcloud-dress'],
  accessory: ['none', 'star-clip', 'round-glasses', 'bunny-beret'],
};
export const SHOP = [
  { id:'cloud-dress', category:'Avatar', name:'Cloud dress', price:14, kind:'avatar', slot:'outfit', value:'cloud-dress', icon:'☁', color:'#c9d8ee', description:'A soft sky-blue dress for your wanderer.' },
  { id:'star-hoodie', category:'Avatar', name:'Star hoodie', price:16, kind:'avatar', slot:'outfit', value:'star-hoodie', icon:'★', color:'#e6c9df', description:'A rosy hoodie with a little golden star.' },
  { id:'space-buns', category:'Avatar', name:'Double-bun hair', price:10, kind:'avatar', slot:'hair', value:'space-buns', icon:'●', color:'#bb967d', description:'Two fluffy round buns. Pick any hair color.' },
  { id:'star-clip', category:'Avatar', name:'Star hair clip', price:8, kind:'avatar', slot:'accessory', value:'star-clip', icon:'✦', color:'#ead386', description:'A tiny shining star tucked into your hair.' },
  { id:'round-glasses', category:'Avatar', name:'Round glasses', price:8, kind:'avatar', slot:'accessory', value:'round-glasses', icon:'◎', color:'#b9d7d5', description:'Round frames for a curious little explorer.' },
  { id:'petal-vac', category:'Tools', name:'Petal vacuum skin', price:12, kind:'tool', value:'petal', icon:'❀', color:'#e7b5cd', description:'A strawberry-pink vacuum with mint glass.' },
  { id:'starlight-vac', category:'Tools', name:'Starlight vacuum skin', price:16, kind:'tool', value:'starlight', icon:'✧', color:'#c5b8e1', description:'Lavender, gold, and a little moonlight.' },
  { id:'long-reach', category:'Tools', name:'Long-reach nozzle', price:22, kind:'upgrade', icon:'➜', color:'#a8d5d4', description:'Reach creatures and supplies from farther away.' },
  { id:'quick-vac', category:'Tools', name:'Whirlwind motor', price:18, kind:'upgrade', icon:'↻', color:'#b5d6c5', description:'Scoop again sooner with a faster magical motor.' },
  { id:'cute-theme', category:'Ranch', name:'Marshmallow theme', price:18, kind:'theme', value:'cute', icon:'♡', color:'#efc7d5', description:'Pink home colors and lilac fences. Decorates your tent or cabin; build a cabin separately with materials.' },
  { id:'modern-theme', category:'Ranch', name:'Cozy modern theme', price:18, kind:'theme', value:'modern', icon:'▣', color:'#c8d9d4', description:'Cream and mint colors for your home and fences. A color theme; cabin construction uses materials.' },
  { id:'lanterns', category:'Ranch', name:'Star lanterns', price:12, kind:'furniture', icon:'✧', color:'#ecd896', description:'Warm glowing lamps beside your home and shed.' },
  { id:'sofa', category:'Furniture', name:'Cloud sofa', price:16, kind:'furniture', icon:'☁', color:'#dabed8', description:'A soft, rounded sofa on your outdoor patio.' },
  { id:'table', category:'Furniture', name:'Pebble table', price:10, kind:'furniture', icon:'●', color:'#d8c2a9', description:'A little modern round table for your patio.' },
  { id:'chair', category:'Furniture', name:'Bubble chair', price:10, kind:'furniture', icon:'◔', color:'#b8d4ca', description:'A cute mint chair with a rounded back.' },
  { id:'planter', category:'Furniture', name:'Smiley planter', price:7, kind:'furniture', icon:'❋', color:'#dfc59d', description:'A happy plant pot beside your front door.' },
  { id:'cloud-cat', category:'Pets', name:'Cloud kitten', price:20, kind:'pet', value:'cloud-cat', icon:'♡', color:'#f0e6d7', description:'A round little kitten that follows you on adventures.' },
  { id:'star-pup', category:'Pets', name:'Starpuff puppy', price:20, kind:'pet', value:'star-pup', icon:'✦', color:'#e5c195', description:'A bouncy little puppy to wander with you.' },
  { id:'wood-pack', category:'Supplies', name:'5 wood', price:3, kind:'supply', material:'wood', amount:5, icon:'▰', color:'#c9a37b', description:'Handy building supplies. Needs room in your inventory.' },
  { id:'metal-pack', category:'Supplies', name:'5 metal', price:4, kind:'supply', material:'metal', amount:5, icon:'◆', color:'#a7bac7', description:'Shiny metal pieces to collect and keep for your ranch.' },
  { id:'stone-pack', category:'Supplies', name:'5 moonstones', price:4, kind:'supply', material:'stone', amount:5, icon:'◆', color:'#b4c4df', description:'A handful of smooth stones for home building.' },
  { id:'berry-pack', category:'Food', name:'5 berries', price:5, kind:'supply', material:'berries', amount:5, icon:'●', color:'#e6b0ba', description:'A favorite snack. Each berry gives 25 happiness.' },
  { id:'cookie-pack', category:'Food', name:'3 star cookies', price:6, kind:'supply', material:'starfood', amount:3, icon:'★', color:'#ead298', description:'A special snack. Each cookie gives 40 happiness.' },
];
export const SKU = Object.fromEntries(SHOP.map(item=>[item.id,item]));
export const FREE_AVATAR = { hair:['bob','curls','ponytail','sugarcloud-waves'], outfit:['overalls','hoodie','sugarcloud-dress'], accessory:['none','bunny-beret'] };
