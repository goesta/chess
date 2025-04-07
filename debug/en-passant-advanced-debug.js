const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

console.log('===== TEST 1: WHITE CAPTURING BLACK EN PASSANT =====');
// Set up a position where white can capture black en passant
const test1Board = Array(8).fill().map(() => Array(8).fill(null));
test1Board[3][4] = 'wP'; // White pawn on e5
test1Board[1][5] = 'bP'; // Black pawn on f7
test1Board[7][4] = 'wK'; // White king
test1Board[0][4] = 'bK'; // Black king

// Set up the position with black to move
engine.setPosition(test1Board, { currentTurn: 'b' });

// 1. Move black pawn from f7 to f5
const move1 = engine.makeMove(1, 5, 3, 5);
console.log('Black pawn f7-f5 result:', move1);
console.log('En passant target:', engine.enPassantTarget);

// 2. Check if white can capture en passant
const whitePawnMoves = engine.getValidMoves(3, 4);
console.log('White pawn e5 valid moves:', whitePawnMoves);
const hasEnPassantMove = whitePawnMoves.some(move => move.row === 2 && move.col === 5);
console.log('Can capture en passant:', hasEnPassantMove);

// 3. Execute en passant capture
const capture1 = engine.makeMove(3, 4, 2, 5);
console.log('En passant capture result:', capture1);
console.log('Captured pawn removed:', engine.board[3][5] === null);

// Display board after capture
console.log('\nBoard after white captures en passant:');
printBoard(engine.board);

console.log('\n===== TEST 2: BLACK CAPTURING WHITE EN PASSANT =====');
// Set up a position where black can capture white en passant
const test2Board = Array(8).fill().map(() => Array(8).fill(null));
test2Board[4][4] = 'bP'; // Black pawn on e4
test2Board[6][5] = 'wP'; // White pawn on f2
test2Board[7][4] = 'wK'; // White king
test2Board[0][4] = 'bK'; // Black king

// Set up the position with white to move
engine.setPosition(test2Board, { currentTurn: 'w' });

// 1. Move white pawn from f2 to f4
const move2 = engine.makeMove(6, 5, 4, 5);
console.log('White pawn f2-f4 result:', move2);
console.log('En passant target:', engine.enPassantTarget);

// 2. Check if black can capture en passant
const blackPawnMoves = engine.getValidMoves(4, 4);
console.log('Black pawn e4 valid moves:', blackPawnMoves);
const hasEnPassantMove2 = blackPawnMoves.some(move => move.row === 5 && move.col === 5);
console.log('Can capture en passant:', hasEnPassantMove2);

// 3. Execute en passant capture
const capture2 = engine.makeMove(4, 4, 5, 5);
console.log('En passant capture result:', capture2);
console.log('Captured pawn removed:', engine.board[4][5] === null);

// Display board after capture
console.log('\nBoard after black captures en passant:');
printBoard(engine.board);

console.log('\n===== TEST 3: EN PASSANT OPPORTUNITY EXPIRES =====');
// Set up a position to test en passant opportunity expiring
const test3Board = Array(8).fill().map(() => Array(8).fill(null));
test3Board[3][4] = 'wP'; // White pawn on e5
test3Board[1][5] = 'bP'; // Black pawn on f7
test3Board[7][4] = 'wK'; // White king
test3Board[0][4] = 'bK'; // Black king
test3Board[7][0] = 'wR'; // White rook on a1

// Set up the position with black to move
engine.setPosition(test3Board, { currentTurn: 'b' });

// 1. Move black pawn from f7 to f5
const move3 = engine.makeMove(1, 5, 3, 5);
console.log('Black pawn f7-f5 result:', move3);
console.log('En passant target:', engine.enPassantTarget);

// 2. Instead of capturing en passant, white moves rook
const moveRook = engine.makeMove(7, 0, 6, 0);
console.log('White rook a1-a2 result:', moveRook);
console.log('En passant target after rook move:', engine.enPassantTarget);

// 3. Black makes another move
const moveBlack = engine.makeMove(0, 4, 0, 3);
console.log('Black king e8-d8 result:', moveBlack);

// 4. Check if white can still capture en passant (should be false)
const whitePawnMovesLater = engine.getValidMoves(3, 4);
console.log('White pawn e5 valid moves after opportunity expires:', whitePawnMovesLater);
const hasExpiredEnPassant = whitePawnMovesLater.some(move => move.row === 2 && move.col === 5);
console.log('Can still capture en passant:', hasExpiredEnPassant);

// Helper function to print the board
function printBoard(board) {
  for (let row = 0; row < 8; row++) {
    let rowStr = '';
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      rowStr += (piece ? piece : '..') + ' ';
    }
    console.log(rowStr);
  }
} 