import { play } from './engine.js';

function available(state) {
  return state.cells.flatMap((cell, i) => cell ? [] : [i]);
}

function minimax(state, computer, depth = 0) {
  if (state.winner) return state.winner === computer ? 10 - depth : depth - 10;
  if (state.draw) return 0;
  const values = available(state).map(i => minimax(play(state, i), computer, depth + 1));
  return state.turn === computer ? Math.max(...values) : Math.min(...values);
}

export function chooseMove(state, difficulty = 'medium', random = Math.random) {
  if (state.winner || state.draw) return null;
  const moves = available(state);
  if (!moves.length) return null;
  if (difficulty === 'hard') {
    // Prefer the center, then corners, when several moves are equally good.
    const ordered = [4, 0, 2, 6, 8, 1, 3, 5, 7].filter(i => moves.includes(i));
    let best = ordered[0];
    let score = -Infinity;
    for (const i of ordered) {
      const value = minimax(play(state, i), state.turn);
      if (value > score) { best = i; score = value; }
    }
    return best;
  }
  if (difficulty === 'medium') {
    const win = moves.find(i => play(state, i).winner === state.turn);
    if (win !== undefined) return win;
    const opponent = { ...state, turn: state.turn === 'X' ? 'O' : 'X' };
    const block = moves.find(i => play(opponent, i).winner === opponent.turn);
    if (block !== undefined) return block;
  }
  return moves[Math.floor(random() * moves.length)];
}
