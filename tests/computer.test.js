import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, play } from '../games/tic-tac-toe/engine.js';
import { chooseMove } from '../games/tic-tac-toe/computer.js';

test('easy chooses random empty cells and leaves input untouched', () => {
  const state = play(createRound(), 0);
  assert.equal(chooseMove(state, 'easy', () => 0), 1);
  assert.equal(chooseMove(state, 'easy', () => 0.999), 8);
  assert.equal(state.cells.filter(Boolean).length, 1);
});
test('medium takes a win before blocking and blocks immediate threats', () => {
  const state = { ...createRound('O'), cells: ['O', 'O', null, 'X', 'X', null, null, null, null] };
  assert.equal(chooseMove(state, 'medium'), 2);
  state.cells[1] = null;
  assert.equal(chooseMove(state, 'medium'), 5);
});
test('hard cannot lose against any human moves, with either starting player', () => {
  let completed = 0;
  function explore(state) {
    assert.notEqual(state.winner, 'X');
    if (state.winner || state.draw) { completed++; return; }
    if (state.turn === 'O') explore(play(state, chooseMove(state, 'hard')));
    else state.cells.forEach((cell, i) => { if (!cell) explore(play(state, i)); });
  }
  explore(createRound('X'));
  explore(createRound('O'));
  assert.ok(completed > 100);
});
test('computer does not move after a draw or win', () => {
  const won = { ...createRound(), winner: 'X' };
  const draw = { ...createRound(), draw: true };
  for (const difficulty of ['easy', 'medium', 'hard']) {
    assert.equal(chooseMove(won, difficulty), null);
    assert.equal(chooseMove(draw, difficulty), null);
  }
});
