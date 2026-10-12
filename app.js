import { createRound, play } from './games/tic-tac-toe/engine.js';
import { chooseMove } from './games/tic-tac-toe/computer.js';

let starter = 'X';
let round = createRound(starter);
let scores = { X: 0, O: 0, draw: 0 };
let computerTimer;
const opponent = document.querySelector('#opponent');
const difficulty = document.querySelector('#difficulty');
const computerTurn = () => opponent.value === 'computer' && round.turn === 'O' && !round.winner && !round.draw;

function makeMove(index) {
  const next = play(round, index);
  if (next === round) return;
  round = next;
  if (round.winner) scores[round.winner]++;
  else if (round.draw) scores.draw++;
  render();
  scheduleComputer();
}

function scheduleComputer() {
  clearTimeout(computerTimer);
  if (computerTurn()) computerTimer = setTimeout(() => {
    if (computerTurn()) makeMove(chooseMove(round, difficulty.value));
  }, 400);
}
const board = document.querySelector('#board');
const buttons = Array.from({ length: 9 }, (_, index) => {
  const button = document.createElement('button');
  button.className = 'cell';
  button.addEventListener('click', () => {
    if (!computerTurn()) makeMove(index);
  });
  board.append(button);
  return button;
});

function render() {
  buttons.forEach((button, i) => {
    button.textContent = round.cells[i] ?? '';
    button.className = `cell ${round.cells[i]?.toLowerCase() ?? ''}${round.line.includes(i) ? ' winning' : ''}`;
    button.setAttribute('aria-label', `Row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}: ${round.cells[i] ?? 'empty'}`);
    button.disabled = Boolean(round.cells[i] || round.winner || round.draw || computerTurn());
  });
  document.querySelector('#status').textContent = round.winner ? `${round.winner} wins! Time for a rematch?` : round.draw ? "It's a draw. One more round?" : `${round.turn}'s turn — make your move`;
  if (opponent.value === 'computer') {
    if (round.winner) document.querySelector('#status').textContent = round.winner === 'X' ? 'You win! Time for a rematch?' : 'Computer wins! Try another round?';
    else if (!round.draw) document.querySelector('#status').textContent = computerTurn() ? 'Computer is thinking…' : 'Your turn — you play X';
  }
  for (const key of ['X', 'O', 'draw']) document.querySelector(`#score-${key.toLowerCase()}`).textContent = scores[key];
  for (const key of ['X', 'O']) document.querySelector(`#player-${key.toLowerCase()}`).classList.toggle('active', !round.draw && round.turn === key);
}

document.querySelector('#new-round').addEventListener('click', () => {
  starter = starter === 'X' ? 'O' : 'X';
  round = createRound(starter);
  clearTimeout(computerTimer);
  render();
  scheduleComputer();
  if (!computerTurn()) buttons[0].focus();
});
function resetSession() {
  clearTimeout(computerTimer);
  scores = { X: 0, O: 0, draw: 0 };
  starter = 'X';
  round = createRound(starter);
  render();
}
document.querySelector('#reset').addEventListener('click', resetSession);
function updateSettings() {
  const solo = opponent.value === 'computer';
  document.querySelector('#difficulty-label').hidden = !solo;
  document.querySelector('#label-x').textContent = solo ? 'YOU · X' : 'PLAYER X';
  document.querySelector('#label-o').textContent = solo ? 'COMPUTER' : 'PLAYER O';
  document.querySelector('#difficulty-note').textContent = solo ? {
    easy: 'Easy: relaxed, random moves. A good place to start.',
    medium: 'Medium: spots wins and blocks your next winning move.',
    hard: 'Hard: plays perfectly. Can you hold it to a draw?',
  }[difficulty.value] : 'Take turns on the same screen. Changing settings resets scores.';
  resetSession();
}
opponent.addEventListener('change', updateSettings);
difficulty.addEventListener('change', updateSettings);
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
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) document.querySelector('#update-app').hidden = false;
  });
  document.querySelector('#update-app').addEventListener('click', () => window.location.reload());
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(async registration => {
    // Explicitly check for a new worker when returning to an existing install.
    registration.update().catch(() => {});
    await navigator.serviceWorker.ready;
    document.querySelector('#connection').textContent = '✳ Ready for offline play';
  }).catch(() => {
    document.querySelector('#connection').textContent = 'Offline setup unavailable · play online';
  });
}
