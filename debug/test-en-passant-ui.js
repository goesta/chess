const ChessEngine = require('../scripts/chess-engine');

// Create a new chess engine
const engine = new ChessEngine();

console.log('===== TESTING EN PASSANT UI DISPLAY =====');
console.log('Scenario: d2->d4, h7->h5, d4->d5, e7->e5 - checking if d5 can capture e5 via en passant');

// Set up a custom board for direct testing
const customBoard = Array(8).fill().map(() => Array(8).fill(null));

// Setup the position with key pieces
customBoard[3][3] = 'wP'; // White pawn on d5
customBoard[3][4] = 'bP'; // Black pawn on e5 (just moved there)
customBoard[7][4] = 'wK'; // White king
customBoard[0][4] = 'bK'; // Black king

// Set up the position with white to move and an en passant target
engine.setPosition(customBoard, { 
    currentTurn: 'w', 
    enPassantTarget: { row: 2, col: 4 } // e6 square (target for the en passant capture)
});

console.log('Board position set up:');
printBoard(engine.board);

console.log('En passant target:', engine.enPassantTarget);
console.log(`En passant target in algebraic: e${8 - engine.enPassantTarget.row}`);

// Get the valid moves for the white pawn on d5
const whitePawnMoves = engine.getValidMoves(3, 3); // d5
console.log('Valid moves for white pawn on d5:', whitePawnMoves);

// Check if an en passant capture move is in the list
const hasEnPassantMove = whitePawnMoves.some(move => 
    move.row === engine.enPassantTarget.row && move.col === engine.enPassantTarget.col);

console.log('Can capture via en passant:', hasEnPassantMove);

if (hasEnPassantMove) {
    console.log('The en passant move would be captured as follows:');
    
    // Make the en passant capture
    const result = engine.makeMove(3, 3, 2, 4); // d5 takes e6 (en passant)
    console.log('Move result:', result);
    
    // Verify the board after capture
    console.log('Board after en passant capture:');
    printBoard(engine.board);
    
    // Check that the black pawn at e5 was captured
    console.log('Black pawn at e5 has been captured:', engine.board[3][4] === null);
}

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