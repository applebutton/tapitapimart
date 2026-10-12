# Tapitapimart

A collection of small progressive web games. The first game is tic tac toe, with a computer opponent or local two-player play, alternating starting players, and session scores.

Choose Easy for random moves, Medium for immediate wins and blocks, or Hard for an unbeatable minimax opponent. You play X against the computer. Changing opponent or difficulty clears the current board and scores. Computer play also works offline.

## Wildhaven

Open `games/wildhaven/`, or choose Wildhaven on the game shelf. A cute, open-ended first-person 3D survival adventure: explore three biomes with a magical vacuum, collect six small creature species and wild giants, gather berries/wood/moonstones, and build a home at your ranch.

Swipe or drag the world to look around. Move with WASD / arrow keys or the on-screen direction buttons. Q / R turn and Page Up / Page Down look up and down. Space / E or **Vacuum** collects a creature or material near the center of your view and within reach. **Inventory** (or I) shows everything carried, capped at 30 of each material and creature type. Inventory, wardrobe, and shop dialogs pause exploration while open. Stardust is a separate reward currency.

At the ranch, choose a pen in Inventory and **Put into pen**. Three fully enclosed pens contain autonomous wandering creatures. Only vacuuming moves them back into inventory; full inventory slots leave penned creatures untouched. Feed and pet penned friends for happiness and gifts. Petting is free; resources regrow, so supplies never block play.

Combine any two small carried creatures (including two of the same species) into one giant at the ranch. The preview names the result before combining; there are 21 possible giant combinations. Giants can be carried and placed in pens just like small creatures. Wood and moonstones build three permanent home stages: a cozy cabin, flower porch, and dream cottage.

Purple wisps cause bumps. Three hits respawn you at the ranch with full hearts and all inventory, penned creatures, home upgrades, and rewards intact. There is no win or lose state. Progress saves automatically on this device and works offline after assets are cached. Saves do not sync across devices; clearing browser storage removes them. Earlier Wildhaven saves migrate companions into pens and preserve their cabin and rewards. No account, backend, or external artwork service is required. All illustrations are included locally. WebGL 2 is required for 3D rendering. Three.js 0.180.0 is vendored locally with its MIT license and included in the offline cache; no install or build step is needed.

### Creator’s Shed & avatar

At the ranch, the Creator’s Shed sits next to your home. Its button opens the shop and moves you to its entrance. All purchases use earned stardust, never real money. Categories include clothing and hairstyle unlocks, accessories, vacuum skins, longer reach and faster vacuum upgrades, cute/modern ranch themes, furniture placed automatically on the patio, following pets, building supplies, and creature food. Every inventory material is capped at 30, including purchased metal and star cookies; a purchase that will overflow a slot is rejected without spending currency. Owned permanent items can be equipped again without repurchasing.

**Style my avatar** opens an illustrated anime wardrobe. Skin tone, hair color, and starter hairstyles/clothes are free. Purchased styles unlock automatically. Your chosen skin and clothing also appear on the first-person vacuum hand/sleeve. Star cookies feed penned creatures for 40 happiness. All unlocks, choices, supplies, pets, and decorations persist on the same device. Prior save versions migrate automatically.

## Develop

Requires Python 3 and Node.js 18+ (for tests). No package installation or build step is needed.

```sh
npm start
npm test
```

The development server runs on port 8000. Serve this directory over HTTPS in production; service workers and installation require HTTPS or localhost. The app caches its local assets on first load and then plays offline. Chrome and Edge expose the install button when eligible; on iOS use Safari's Share → Add to Home Screen.

Game logic lives in `games/tic-tac-toe/engine.js`. Add future games under `games/` and extend the game shelf. Include new offline assets in `sw.js` and bump its cache version whenever cached files change.

Scores last for the current page session. Reset scores also starts a fresh X-first round. New round clears the board and alternates the starting player.

## GitHub Pages

In repository Settings → Pages, select **Deploy from a branch**, then **main** and **/ (root)**, and save. GitHub serves this static app directly; `.nojekyll` disables Jekyll processing. Subsequent pushes to main update the site automatically.

The expected URL is https://applebutton.github.io/tapitapimart/. All asset paths, the manifest, and the service worker support this repository subpath. Free GitHub Pages requires a public repository on GitHub Free; do not change repository visibility without reviewing what will become public.

Wildhaven v13 uses first-person eye-level viewing indoors and outside. Drag/swipe to look, WASD/arrows to move, Q/R to turn. Rounded scenery, houses, furniture, supplies, and tools share cel shading and dark silhouettes. The wardrobe combines matching illustrated heads and eight outfits, including Blossom tea dress, Ivory rose lace, and Bluebell ribbon mage in the Creator’s Shed. High-density canvases and unblurred dialogs keep artwork sharp.
