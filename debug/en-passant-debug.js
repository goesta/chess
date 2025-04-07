const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

// Set up a position where en passant will be possible
const customBoard = Array(8).fill().map(() => Array(8).fill(null));

// Place white pawn on e5 (row 3, col 4)
customBoard[3][4] = 'wP';

// Place black pawn on f7 (row 1, col 5)
customBoard[1][5] = 'bP';

// Place kings (required for valid position)
customBoard[7][4] = 'wK';
customBoard[0][4] = 'bK';

// Set up the position with black to move
engine.setPosition(customBoard, { currentTurn: 'b' });

console.log('Initial board:');
printBoard(engine.board);

// 1. Move black pawn from f7 to f5 (double move next to white pawn)
console.log('\nMoving black pawn from f7 to f5:');
const moveResult = engine.makeMove(1, 5, 3, 5);
console.log('Move result:', moveResult);
console.log('En passant target:', engine.enPassantTarget);

printBoard(engine.board);

// 2. Get valid moves for white pawn
console.log('\nValid moves for white pawn at e5:');
const whitePawnMoves = engine.getValidMoves(3, 4);
console.log(whitePawnMoves);

// 3. Check if en passant capture is possible
const enPassantMove = whitePawnMoves.find(move => move.row === 2 && move.col === 5);
console.log('En passant move available:', !!enPassantMove);

// 4. Attempt en passant capture
if (enPassantMove) {
  console.log('\nAttempting en passant capture:');
  const captureResult = engine.makeMove(3, 4, 2, 5);
  console.log('Capture result:', captureResult);
  
  console.log('\nBoard after capture:');
  printBoard(engine.board);
  
  // Check if the black pawn was properly captured
  console.log('Black pawn at f5 after capture:', engine.board[3][5]);
}

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