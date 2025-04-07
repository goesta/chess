const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

// Print the current turn
console.log('Initial turn:', engine.currentTurn);

// Make a move as white - e2 to e4
const moveResult = engine.makeMove(6, 4, 4, 4);
console.log('Move result:', moveResult);

// Print the state after the move
console.log('Turn after move:', engine.currentTurn);
console.log('Check status:', engine.checkStatus);
console.log('Game over:', engine.gameOver);

// Get valid moves for a black pawn
const blackPawnMoves = engine.getValidMoves(1, 4); // e7 pawn
console.log('Valid moves for black pawn at e7:', blackPawnMoves);

// Try getting moves for other black pieces
const blackKnightMoves = engine.getValidMoves(0, 1); // b8 knight
console.log('Valid moves for black knight at b8:', blackKnightMoves);

// Print all valid moves for each black piece
console.log('\nAll valid moves for black pieces:');
for (let row = 0; row < 2; row++) {
  for (let col = 0; col < 8; col++) {
    const piece = engine.board[row][col];
    if (piece && piece[0] === 'b') {
      const moves = engine.getValidMoves(row, col);
      console.log(`Piece at (${row},${col}) - ${piece}: ${moves.length} valid moves`);
    }
  }
}

// Check if black has any legal moves
console.log('Does black have legal moves?', engine.doesPlayerHaveLegalMoves('b'));

// Print a simple visualization of the board
console.log('\nCurrent board:');
for (let row = 0; row < 8; row++) {
  let rowStr = '';
  for (let col = 0; col < 8; col++) {
    const piece = engine.board[row][col];
    rowStr += (piece ? piece : '..') + ' ';
  }
  console.log(rowStr);
} 