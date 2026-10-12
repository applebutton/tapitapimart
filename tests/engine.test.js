import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, play, winningLines } from '../games/tic-tac-toe/engine.js';

test('all eight winning lines end the round for either player', () => {
  for (const player of ['X', 'O']) for (const line of winningLines) {
    const state = createRound(player);
    state.cells[line[0]] = player;
    state.cells[line[1]] = player;
    const won = play(state, line[2]);
    assert.equal(won.winner, player);
    assert.deepEqual(won.line, line);
    assert.equal(play(won, 8), won);
  }
});
test('a full board with no winning line is a draw', () => {
  let state = createRound();
  for (const index of [0, 1, 2, 4, 3, 5, 7, 6, 8]) state = play(state, index);
  assert.equal(state.draw, true);
  assert.equal(state.winner, null);
  assert.equal(play(state, 0), state);
});
test('turns alternate, occupied and invalid moves are ignored, input is unchanged', () => {
  const initial = createRound();
  const next = play(initial, 4);
  assert.equal(next.turn, 'O');
  assert.equal(initial.cells[4], null);
  for (const index of [4, -1, 9, 1.5]) assert.equal(play(next, index), next);
  assert.equal(createRound('O').turn, 'O');
});
