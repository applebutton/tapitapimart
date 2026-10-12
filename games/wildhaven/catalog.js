export const AVATAR_OPTIONS = {
  skin: ['#f5d8bb', '#e7b98e', '#ce936c', '#aa7250', '#805239', '#543929'],
  hairColor: ['#3e302e', '#79523b', '#c39458', '#e8cc8d', '#c58da8', '#efa0bd', '#8b80b0'],
  hair: ['bob', 'curls', 'ponytail', 'space-buns', 'sugarcloud-waves'],
  outfit: ['overalls', 'hoodie', 'cloud-dress', 'star-hoodie', 'sugarcloud-dress', 'blossom-tea', 'ivory-lace', 'ribbon-mage', 'petal-swimsuit', 'coral-rashguard', 'starlight-swimsuit'],
  accessory: ['none', 'star-clip', 'round-glasses', 'bunny-beret'],
};
export const OUTFIT_COLORS={'overalls':'#a9c1a3','hoodie':'#edafcc','cloud-dress':'#bcd7ef','star-hoodie':'#c6a9e5','sugarcloud-dress':'#dbb7ed','blossom-tea':'#f2b1d2','ivory-lace':'#fff0e1','ribbon-mage':'#b6bce9','petal-swimsuit':'#efb1cc','coral-rashguard':'#a9dfd2','starlight-swimsuit':'#b6b8eb'};
export const HOUSE_STYLES={
 'sakura-cottage':{name:'Sakura cottage',wall:'#ffe2ef',roof:'#d9b4ea',trim:'#f4afce',shape:'gable'},
 'seaside-home':{name:'Seashell beach house',wall:'#fdf0d7',roof:'#aadadf',trim:'#95c7d3',shape:'beach'},
 'forest-cabin':{name:'Woodland storybook cabin',wall:'#e4d2b5',roof:'#a3c6ad',trim:'#c2aa8d',shape:'woodland'},
 'modern-home':{name:'Pastel modern home',wall:'#fff2f4',roof:'#cabbe2',trim:'#c1dcd8',shape:'modern'},
};
export const SWIM_OUTFITS=['petal-swimsuit','coral-rashguard','starlight-swimsuit'];
export const FENCE_STYLES={
 'bunny-fence':{name:'Bunny bow fence',color:'#f2c3dc',accent:'#fff0f8',charm:'bunny'},
 'star-fence':{name:'Starlight charm fence',color:'#cbc1ef',accent:'#fff0ad',charm:'star'},
 'shell-fence':{name:'Seashell pearl fence',color:'#b8e2dc',accent:'#f8d3e5',charm:'shell'},
};
export const POOL_STYLES={
 'blossom-pool':{name:'Blossom bow pool',color:'#efbed8',accent:'#fff2f8',water:'#8bdedc',charm:'bunny'},
 'moon-pool':{name:'Moonbeam star pool',color:'#c4b6e6',accent:'#fff0ac',water:'#a3cdec',charm:'star'},
 'shell-pool':{name:'Pearl lagoon pool',color:'#adddd4',accent:'#f5d7e7',water:'#7cd8d8',charm:'shell'},
};
export const SHOP = [
 {id:'coral-rashguard',category:'Swimwear',name:'Coral rashguard set',price:14,kind:'avatar',slot:'outfit',value:'coral-rashguard',icon:'≈',color:'#c0e8df',description:'A cute mint swim shirt, swim shorts and water shoes. Ready for lakes, pools and the reef.'},
 {id:'starlight-swimsuit',category:'Swimwear',name:'Starlight swim dress',price:16,kind:'avatar',slot:'outfit',value:'starlight-swimsuit',icon:'★',color:'#d1c9ef',description:'A periwinkle one-piece with a little swim skirt, flutter sleeves and golden stars.'},
 ...Object.entries(FENCE_STYLES).map(([id,p])=>({id,category:'Fences',name:p.name,price:22,kind:'fence',value:id,icon:'♡',color:p.color,description:'Decorates all three pens with matching charms, bows and glowing fairy lights. Switch owned styles free.'})),
 ...Object.entries(POOL_STYLES).map(([id,p])=>({id,category:'Pools',name:p.name,price:30,kind:'pool',value:id,icon:'≈',color:p.color,description:'A swimmable ranch pool beside your pens, with floating lights and cute decorations. Switch owned pool styles free.'})),
 {id:'blossom-tea',category:'Avatar',name:'Blossom tea dress',price:18,kind:'avatar',slot:'outfit',value:'blossom-tea',icon:'♡',color:'#f2c4df',description:'Pink and lavender ruffles, puff sleeves, and big ribbon bows. Illustrated in our shared anime style.'},
 {id:'ivory-lace',category:'Avatar',name:'Ivory rose lace',price:18,kind:'avatar',slot:'outfit',value:'ivory-lace',icon:'❀',color:'#f5e6db',description:'An ivory tea dress with rose embroidery, long sleeves, and layers of lace.'},
 {id:'ribbon-mage',category:'Avatar',name:'Bluebell ribbon mage',price:20,kind:'avatar',slot:'outfit',value:'ribbon-mage',icon:'✧',color:'#cdd3ef',description:'A blue-and-pink cape dress with a huge bow, frilled skirt, and a bunny pocket.'},
 {id:'sakura-cottage',category:'Houses',name:'Sakura cottage',price:45,kind:'house',value:'sakura-cottage',icon:'⌂',color:'#f1c8e1',description:'An entire pink cottage with a lavender roof. Includes a room to enter and decorate.'},
 {id:'seaside-home',category:'Houses',name:'Seashell beach house',price:45,kind:'house',value:'seaside-home',icon:'⌂',color:'#b9dfe4',description:'A raised seaside home with a mint roof and porch. Includes a decoratable interior.'},
 {id:'forest-cabin',category:'Houses',name:'Woodland storybook cabin',price:40,kind:'house',value:'forest-cabin',icon:'⌂',color:'#cbdcbd',description:'A timber cabin with a green roof and chimney. Make its interior your own.'},
 {id:'modern-home',category:'Houses',name:'Pastel modern home',price:50,kind:'house',value:'modern-home',icon:'⌂',color:'#dbd0ed',description:'A cream and lilac home with a flat roof and wide windows. Includes a decoratable interior.'},
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
export const FREE_AVATAR = { hair:['bob','curls','ponytail','sugarcloud-waves'], outfit:['overalls','hoodie','sugarcloud-dress','petal-swimsuit'], accessory:['none','bunny-beret'] };
