# Tapitapimart

A collection of small progressive web games. The first game is tic tac toe, with a computer opponent or local two-player play, alternating starting players, and session scores.

Choose Easy for random moves, Medium for immediate wins and blocks, or Hard for an unbeatable minimax opponent. You play X against the computer. Changing opponent or difficulty clears the current board and scores. Computer play also works offline.

## Wildhaven

Open `games/wildhaven/`, or choose Wildhaven on the game shelf. Explore three biomes, catch six kinds of magical creatures, and care for them at your ranch. Move with WASD / arrow keys, the on-screen direction buttons, or a tap on the map. Space / E or Catch / gather befriends a nearby creature or gathers berries. Each catch earns 3 stardust; happy ranch companions give 8-stardust gifts at one-minute intervals. Petting is free, and berries regrow in the wild, so supplies never block play.

Purple wisps cause bumps. Three hits respawn you at the ranch with full hearts and all companions and rewards intact. There is no win or lose state. Device-local progress is saved automatically; it does not sync across devices. Clearing browser storage removes the save. The game works offline after its assets have been cached. No account, backend, external artwork, or runtime dependencies are required.

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
