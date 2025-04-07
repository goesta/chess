const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

console.log("===== TESTING MISSING KING DETECTION =====");
console.log("Setting up board position with missing black king from the user's example:");

/**
   a b c d e f g h
 8 ♜ . ♝ . ♕ . ♞ ♜ 8
 7 . ♟ . . . ♟ ♟ ♟ 7
 6 . . . . . . . . 6
 5 ♟ . ♟ ♘ . . ♛ . 5
 4 . . . . . . . . 4
 3 ♙ . . . ♙ . . . 3
 2 ♙ . . ♔ . ♙ ♙ ♙ 2
 1 ♞ . ♗ ♕ . ♗ ♘ ♖ 1
 */

// Create a custom board with the provided layout
const customBoard = Array(8).fill().map(() => Array(8).fill(null));

// Row 8 (index 0)
customBoard[0][0] = 'bR'; // a8
customBoard[0][2] = 'bB'; // c8
customBoard[0][4] = 'wQ'; // e8
customBoard[0][6] = 'bN'; // g8
customBoard[0][7] = 'bR'; // h8

// Row 7 (index 1)
customBoard[1][1] = 'bP'; // b7
customBoard[1][5] = 'bP'; // f7
customBoard[1][6] = 'bP'; // g7
customBoard[1][7] = 'bP'; // h7

// Row 5 (index 3)
customBoard[3][0] = 'bP'; // a5
customBoard[3][2] = 'bP'; // c5
customBoard[3][3] = 'wN'; // d5
customBoard[3][6] = 'bQ'; // g5

// Row 3 (index 5)
customBoard[5][0] = 'wP'; // a3
customBoard[5][4] = 'wP'; // e3

// Row 2 (index 6)
customBoard[6][0] = 'wP'; // a2
customBoard[6][3] = 'wK'; // d2
customBoard[6][5] = 'wP'; // f2
customBoard[6][6] = 'wP'; // g2
customBoard[6][7] = 'wP'; // h2

// Row 1 (index 7)
customBoard[7][0] = 'bN'; // a1
customBoard[7][2] = 'wB'; // c1
customBoard[7][3] = 'wQ'; // d1
customBoard[7][5] = 'wB'; // f1
customBoard[7][6] = 'wN'; // g1
customBoard[7][7] = 'wR'; // h1

// Set position with current turn as white
engine.setPosition(customBoard, { currentTurn: 'w' });

// Print the board for verification
console.log("Board position:");
printBoard(engine.board);

// Check for missing kings
const whiteKingPosition = engine.findKing('w');
const blackKingPosition = engine.findKing('b');

console.log(`White king found: ${whiteKingPosition ? 'Yes, at ' + algebraicNotation(whiteKingPosition) : 'No'}`);
console.log(`Black king found: ${blackKingPosition ? 'Yes, at ' + algebraicNotation(blackKingPosition) : 'No'}`);

console.log(`Game over: ${engine.gameOver}`);
console.log(`Game result: ${engine.gameResult}`);
console.log(`Game result reason: ${engine.gameResultReason}`);

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