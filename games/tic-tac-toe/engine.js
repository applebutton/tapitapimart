export const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function createRound(starter = 'X') {
  return { cells: Array(9).fill(null), turn: starter, winner: null, line: [], draw: false };
}

export function play(state, index) {
  if (!Number.isInteger(index) || index < 0 || index > 8 || state.cells[index] || state.winner || state.draw) return state;
  const cells = [...state.cells];
  cells[index] = state.turn;
  const line = winningLines.find(line => line.every(i => cells[i] === state.turn));
  return {
    cells,
    turn: line ? state.turn : state.turn === 'X' ? 'O' : 'X',
    winner: line ? state.turn : null,
    line: line ?? [],
    draw: !line && cells.every(Boolean),
  };
}
