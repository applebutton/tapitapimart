import { createRound, play } from './games/tic-tac-toe/engine.js';

let starter = 'X';
let round = createRound(starter);
let scores = { X: 0, O: 0, draw: 0 };
const board = document.querySelector('#board');
const buttons = Array.from({ length: 9 }, (_, index) => {
  const button = document.createElement('button');
  button.className = 'cell';
  button.addEventListener('click', () => {
    const next = play(round, index);
    if (next === round) return;
    round = next;
    if (round.winner) scores[round.winner]++;
    else if (round.draw) scores.draw++;
    render();
  });
  board.append(button);
  return button;
});

function render() {
  buttons.forEach((button, i) => {
    button.textContent = round.cells[i] ?? '';
    button.className = `cell ${round.cells[i]?.toLowerCase() ?? ''}${round.line.includes(i) ? ' winning' : ''}`;
    button.setAttribute('aria-label', `Row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}: ${round.cells[i] ?? 'empty'}`);
    button.disabled = Boolean(round.cells[i] || round.winner || round.draw);
  });
  document.querySelector('#status').textContent = round.winner ? `${round.winner} wins! Time for a rematch?` : round.draw ? "It's a draw. One more round?" : `${round.turn}'s turn — make your move`;
  for (const key of ['X', 'O', 'draw']) document.querySelector(`#score-${key.toLowerCase()}`).textContent = scores[key];
  for (const key of ['X', 'O']) document.querySelector(`#player-${key.toLowerCase()}`).classList.toggle('active', !round.draw && round.turn === key);
}

document.querySelector('#new-round').addEventListener('click', () => {
  starter = starter === 'X' ? 'O' : 'X';
  round = createRound(starter);
  render();
  buttons[0].focus();
});
document.querySelector('#reset').addEventListener('click', () => {
  scores = { X: 0, O: 0, draw: 0 };
  starter = 'X';
  round = createRound(starter);
  render();
});
render();

let installPrompt;
const installButton = document.querySelector('#install');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; });
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(async registration => {
    await navigator.serviceWorker.ready;
    document.querySelector('#connection').textContent = '✳ Ready for offline play';
  }).catch(() => {
    document.querySelector('#connection').textContent = 'Offline setup unavailable · play online';
  });
}
