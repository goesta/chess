const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

console.log('===== DEBUGGING EN PASSANT + wouldBeInCheck =====');

// Set up a position where en passant should be possible
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

// 2. Get potential moves BEFORE filtering
console.log('\nBasic pawn moves (before filtering):');
const basicMoves = getPawnMovesWithoutFiltering(engine, 3, 4);
console.log(basicMoves);
console.log('Includes en passant move:', 
  basicMoves.some(move => move.row === 2 && move.col === 5));

// 3. Test wouldBeInCheck for the en passant move
const enPassantMove = { row: 2, col: 5 };
console.log('\nTesting wouldBeInCheck for en passant move:');
const wouldLeaveInCheck = debugWouldBeInCheck(engine, 3, 4, 
  enPassantMove.row, enPassantMove.col, 'w');
console.log('Would leave king in check:', wouldLeaveInCheck);

// 4. Get valid moves after filtering
console.log('\nValid moves after filtering:');
const validMoves = engine.getValidMoves(3, 4);
console.log(validMoves);
console.log('Includes en passant move:', 
  validMoves.some(move => move.row === 2 && move.col === 5));

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

// Helper function to get pawn moves without filtering for pins/checks
function getPawnMovesWithoutFiltering(engine, row, col) {
  const piece = engine.board[row][col];
  if (!piece || piece[1] !== 'P') return [];
  
  const color = piece[0];
  const direction = color === 'w' ? -1 : 1;
  const startRow = color === 'w' ? 6 : 1;
  const moves = [];
  
  // Helper function to check if a square is empty
  const isEmpty = (r, c) => r >= 0 && r <= 7 && c >= 0 && c <= 7 && !engine.board[r][c];
  
  // Helper function to check if a square has an enemy piece
  const hasEnemy = (r, c) => {
    return r >= 0 && r <= 7 && c >= 0 && c <= 7 && 
           engine.board[r][c] && engine.board[r][c][0] !== color;
  };
  
  // Move forward one square
  if (isEmpty(row + direction, col)) {
    moves.push({ row: row + direction, col });
    
    // Move forward two squares from starting position
    if (row === startRow && isEmpty(row + 2 * direction, col)) {
      moves.push({ row: row + 2 * direction, col });
    }
  }
  
  // Capture diagonally
  if (hasEnemy(row + direction, col - 1)) {
    moves.push({ row: row + direction, col: col - 1 });
  }
  
  if (hasEnemy(row + direction, col + 1)) {
    moves.push({ row: row + direction, col: col + 1 });
  }
  
  // En passant capture - general case
  if (engine.enPassantTarget) {
    // For white pawns (moving up the board)
    if (color === 'w' && row === 3) {
      // Check if our pawn is adjacent to the en passant target
      if (Math.abs(col - engine.enPassantTarget.col) === 1 && 
          engine.enPassantTarget.row === 2) {
        moves.push({ row: 2, col: engine.enPassantTarget.col });
      }
    }
    // For black pawns (moving down the board)
    else if (color === 'b' && row === 4) {
      // Check if our pawn is adjacent to the en passant target
      if (Math.abs(col - engine.enPassantTarget.col) === 1 && 
          engine.enPassantTarget.row === 5) {
        moves.push({ row: 5, col: engine.enPassantTarget.col });
      }
    }
  }
  
  return moves;
}

// Helper function to debug wouldBeInCheck method
function debugWouldBeInCheck(engine, fromRow, fromCol, toRow, toCol, color) {
  console.log(`Debugging wouldBeInCheck(${fromRow}, ${fromCol}, ${toRow}, ${toCol}, ${color})`);
  
  // Make a temporary copy of the board
  const tempBoard = engine.board.map(row => [...row]);
  const savedBoard = engine.board;
  
  // Remember the old en passant target
  const savedEnPassantTarget = engine.enPassantTarget;
  console.log(`En passant target: ${JSON.stringify(savedEnPassantTarget)}`);
  
  // Temporarily set the board to the copy
  engine.board = tempBoard;
  
  // Get the moving piece
  const movingPiece = engine.board[fromRow][fromCol];
  console.log(`Moving piece: ${movingPiece}`);
  
  // For other pieces, temporarily make the move
  tempBoard[toRow][toCol] = movingPiece;
  tempBoard[fromRow][fromCol] = null;
  
  // Check if this is an en passant capture
  let isEnPassant = false;
  
  if (movingPiece && movingPiece[1] === 'P' && engine.enPassantTarget) {
    console.log(`Checking if this is an en passant capture...`);
    
    // Check if this matches the formula in the wouldBeInCheck method
    const formulaMatch = toRow === engine.enPassantTarget.row + (color === 'w' ? -1 : 1) && 
                         toCol === engine.enPassantTarget.col;
    console.log(`Formula match: ${formulaMatch}`);
    console.log(`toRow (${toRow}) === enPassantTarget.row + direction (${engine.enPassantTarget.row + (color === 'w' ? -1 : 1)})`);
    console.log(`toCol (${toCol}) === enPassantTarget.col (${engine.enPassantTarget.col})`);
    
    // Check if this matches the explicit conditions in the makeMove method
    let explicitMatch = false;
    if (color === 'w' && fromRow === 3 && toRow === 2 && 
        toCol === engine.enPassantTarget.col && engine.enPassantTarget.row === 2) {
      explicitMatch = true;
    } else if (color === 'b' && fromRow === 4 && toRow === 5 && 
              toCol === engine.enPassantTarget.col && engine.enPassantTarget.row === 5) {
      explicitMatch = true;
    }
    console.log(`Explicit match: ${explicitMatch}`);
    
    // If either match, simulate the en passant capture
    if (formulaMatch || explicitMatch) {
      console.log(`Simulating en passant capture, removing pawn at [${engine.enPassantTarget.row},${engine.enPassantTarget.col}]`);
      tempBoard[engine.enPassantTarget.row][engine.enPassantTarget.col] = null;
      isEnPassant = true;
    }
  }
  
  // Find the king's position
  let kingRow, kingCol;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (tempBoard[r][c] === `${color}K`) {
        kingRow = r;
        kingCol = c;
        break;
      }
    }
    if (kingRow !== undefined) break;
  }
  
  console.log(`King found at [${kingRow},${kingCol}]`);
  
  // Check if the king is attacked on the temporary board
  console.log(`Checking if king is attacked after move...`);
  const isInCheck = engine.isSquareAttackedAfterMove(kingRow, kingCol, color, tempBoard);
  console.log(`Is king in check: ${isInCheck}`);
  
  // Print the temporary board for debugging
  console.log('Temporary board after move:');
  for (let row = 0; row < 8; row++) {
    let rowStr = '';
    for (let col = 0; col < 8; col++) {
      const piece = tempBoard[row][col];
      rowStr += (piece ? piece : '..') + ' ';
    }
    console.log(rowStr);
  }
  
  // Restore the original board and en passant target
  engine.board = savedBoard;
  engine.enPassantTarget = savedEnPassantTarget;
  
  return isInCheck;
} 