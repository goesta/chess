const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

console.log('===== TESTING EN PASSANT AFTER PAWN ADVANCE =====');
console.log('Test case: d2->d4, h7->h5, d4->d5, e7->e5, then d5 should capture e5 via en passant');

// Recreate the moves in sequence
console.log('\n1. White pawn from d2 to d4:');
const move1 = engine.makeMove(6, 3, 4, 3); // d2 -> d4
console.log('Move result:', move1);
console.log('En passant target:', engine.enPassantTarget);
printBoard(engine.board);

console.log('\n2. Black pawn from h7 to h5:');
const move2 = engine.makeMove(1, 7, 3, 7); // h7 -> h5
console.log('Move result:', move2);
console.log('En passant target:', engine.enPassantTarget);
printBoard(engine.board);

console.log('\n3. White pawn from d4 to d5:');
const move3 = engine.makeMove(4, 3, 3, 3); // d4 -> d5
console.log('Move result:', move3);
console.log('En passant target:', engine.enPassantTarget);
printBoard(engine.board);

console.log('\n4. Black pawn from e7 to e5:');
const move4 = engine.makeMove(1, 4, 3, 4); // e7 -> e5
console.log('Move result:', move4);
console.log('En passant target:', engine.enPassantTarget);
printBoard(engine.board);

console.log('\n5. Checking if white pawn at d5 can capture via en passant:');
const whitePawnMoves = engine.getValidMoves(3, 3); // d5
console.log('White pawn at d5 moves:', whitePawnMoves);

// Check if there's a move to capture e5 via en passant
const hasEnPassantMove = whitePawnMoves.some(move => move.row === 2 && move.col === 4);
console.log('Can capture e5 via en passant:', hasEnPassantMove);

// Now attempt to execute the en passant capture
console.log('\n6. Attempting en passant capture (d5xe5):');
const enPassantCaptureResult = engine.makeMove(3, 3, 2, 4); // d5 takes e5
console.log('Capture result:', enPassantCaptureResult);

// Check if the en passant capture was executed correctly
console.log('\nBoard after en passant capture attempt:');
printBoard(engine.board);

// Verify that the black pawn was captured
const blackPawnCaptured = engine.board[3][4] === null;
console.log('Black pawn at e5 was captured:', blackPawnCaptured);
console.log('White pawn moved to e6:', engine.board[2][4] === 'wP');

// Helper function to print the board
function printBoard(board) {
  const symbols = {
    wP: '♙', wR: '♖', wN: '♘', wB: '♗', wQ: '♕', wK: '♔',
    bP: '♟', bR: '♜', bN: '♞', bB: '♝', bQ: '♛', bK: '♚'
  };
  
  console.log('  a b c d e f g h');
  for (let row = 0; row < 8; row++) {
    let rowStr = `${8-row} `;
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        rowStr += symbols[piece] + ' ';
      } else {
        rowStr += '. ';
      }
    }
    rowStr += `${8-row}`;
    console.log(rowStr);
  }
  console.log('  a b c d e f g h');
}

// Debug the en passant conditions specifically
const whitePawnColor = 'w';
const whitePawnRow = 3; // d5
const whitePawnCol = 3;

// Check if our pawn is directly to the left or right of the en passant target
console.log('\nDebugging en passant conditions:');
if (engine.enPassantTarget) {
  console.log(`White pawn position: [${whitePawnRow},${whitePawnCol}]`);
  console.log(`En passant target: [${engine.enPassantTarget.row},${engine.enPassantTarget.col}]`);
  console.log(`Adjacent to target: ${Math.abs(whitePawnCol - engine.enPassantTarget.col) === 1}`);
  
  // For white pawns (moving up the board)
  if (whitePawnColor === 'w' && whitePawnRow === 3) {
    console.log('White pawn is on the correct rank (3/5th rank)');
    // Check if our pawn is adjacent to the en passant target
    if (Math.abs(whitePawnCol - engine.enPassantTarget.col) === 1 && 
        engine.enPassantTarget.row === 2) {
      console.log('CORRECT: En passant capture should be allowed');
    } else {
      console.log('ISSUE: En passant target is not at the expected position or pawn is not adjacent');
      console.log(`Expected target row: 2, Actual: ${engine.enPassantTarget.row}`);
    }
  } else {
    console.log(`ISSUE: White pawn is not on rank 3 (it's on ${whitePawnRow})`);
  }
} 