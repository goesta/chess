const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

console.log("===== TESTING CHECK DETECTION =====");
console.log("Setting up board position with black king in check from white pawn:");

/**
  a b c d e f g h
8 ♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜ 8
7 ♟ ♟ ♟ ♙ . . ♟ ♟ 7
6 . . ♟ . . . . . 6
5 . . . . . . . . 5
4 . . . . ♟ . . . 4
3 . . . . . ♟ . . 3
2 ♙ ♙ . . ♙ ♙ ♙ ♙ 2
1 ♖ ♘ ♗ ♕ ♔ ♗ ♘ ♖ 1
  a b c d e f g h
 */

// Create a custom board with the provided layout
const customBoard = Array(8).fill().map(() => Array(8).fill(null));

// Row 8 (index 0)
customBoard[0][0] = 'bR'; // a8
customBoard[0][1] = 'bN'; // b8
customBoard[0][2] = 'bB'; // c8
customBoard[0][3] = 'bQ'; // d8
customBoard[0][4] = 'bK'; // e8
customBoard[0][5] = 'bB'; // f8
customBoard[0][6] = 'bN'; // g8
customBoard[0][7] = 'bR'; // h8

// Row 7 (index 1)
customBoard[1][0] = 'bP'; // a7
customBoard[1][1] = 'bP'; // b7
customBoard[1][2] = 'bP'; // c7
customBoard[1][3] = 'wP'; // d7 - white pawn checking black king
customBoard[1][6] = 'bP'; // g7
customBoard[1][7] = 'bP'; // h7

// Row 6 (index 2)
customBoard[2][2] = 'bP'; // c6

// Row 4 (index 4)
customBoard[4][4] = 'bP'; // e4

// Row 3 (index 5)
customBoard[5][5] = 'bP'; // f3

// Row 2 (index 6)
customBoard[6][0] = 'wP'; // a2
customBoard[6][1] = 'wP'; // b2
customBoard[6][4] = 'wP'; // e2
customBoard[6][5] = 'wP'; // f2
customBoard[6][6] = 'wP'; // g2
customBoard[6][7] = 'wP'; // h2

// Row 1 (index 7)
customBoard[7][0] = 'wR'; // a1
customBoard[7][1] = 'wN'; // b1
customBoard[7][2] = 'wB'; // c1
customBoard[7][3] = 'wQ'; // d1
customBoard[7][4] = 'wK'; // e1
customBoard[7][5] = 'wB'; // f1
customBoard[7][6] = 'wN'; // g1
customBoard[7][7] = 'wR'; // h1

// Set position with current turn as black (since black is in check)
engine.setPosition(customBoard, { currentTurn: 'b' });

// Print the board for verification
console.log("Board position:");
printBoard(engine.board);

// Debug check detection
debugCheckDetection(engine, 'b');

// Helper function to debug check detection
function debugCheckDetection(engine, color) {
    const kingPosition = engine.findKing(color);
    console.log(`${color === 'w' ? 'White' : 'Black'} king position: ${algebraicNotation(kingPosition)}`);
    
    // Manually check if king is under attack by pawns
    const attackingColor = color === 'w' ? 'b' : 'w';
    const pawnDirection = attackingColor === 'w' ? -1 : 1;
    
    // Check if any pawns are attacking the king
    console.log("\nChecking pawn attacks:");
    const row = kingPosition.row;
    const col = kingPosition.col;
    
    // Check left diagonal
    if (row + pawnDirection >= 0 && row + pawnDirection <= 7 && col - 1 >= 0) {
        const piece = engine.board[row + pawnDirection][col - 1];
        console.log(`Piece at ${algebraicNotation({row: row + pawnDirection, col: col - 1})}: ${piece || 'none'}`);
        if (piece === `${attackingColor}P`) {
            console.log(`King is attacked by a ${attackingColor} pawn from the left diagonal`);
        }
    }
    
    // Check right diagonal
    if (row + pawnDirection >= 0 && row + pawnDirection <= 7 && col + 1 <= 7) {
        const piece = engine.board[row + pawnDirection][col + 1];
        console.log(`Piece at ${algebraicNotation({row: row + pawnDirection, col: col + 1})}: ${piece || 'none'}`);
        if (piece === `${attackingColor}P`) {
            console.log(`King is attacked by a ${attackingColor} pawn from the right diagonal`);
        }
    }
    
    // Check using the engine's methods
    console.log("\nEngine check detection:");
    console.log(`Is king in check according to isSquareAttacked: ${engine.isSquareAttacked(row, col, color)}`);
    console.log(`Is king in check according to isKingInCheck: ${engine.isKingInCheck(color)}`);
    console.log(`Check status in game state: ${engine.checkStatus}`);
    
    // Test the pawn attack detection directly
    console.log("\nTesting isSquareAttacked with specific arguments:");
    const attacked = engine.isSquareAttacked(kingPosition.row, kingPosition.col, color);
    console.log(`Square ${algebraicNotation(kingPosition)} attacked: ${attacked}`);
}

// Helper function to print the board
function printBoard(board) {
    const symbols = {
        'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
        'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
    };
    
    console.log('  a b c d e f g h');
    for (let row = 0; row < 8; row++) {
        let rowStr = `${8 - row} `;
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            rowStr += piece ? symbols[piece] : '. ';
        }
        rowStr += `${8 - row}`;
        console.log(rowStr);
    }
    console.log('  a b c d e f g h');
}

// Helper function to convert row/col to algebraic notation
function algebraicNotation(position) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return files[position.col] + ranks[position.row];
} 