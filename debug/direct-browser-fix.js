// Direct browser console fix for en passant UI
// Copy and paste this entire code into your browser console

// Fix showPossibleMoves function to correctly highlight en passant captures
(function() {
    if (!window.engine) {
        console.error("ERROR: Chess engine not found! Make sure the game is loaded.");
        return;
    }
    
    console.log("Applying en passant UI fix...");
    
    // Store the original function if it exists
    const originalShowPossibleMoves = window.showPossibleMoves;
    
    if (!originalShowPossibleMoves) {
        console.error("ERROR: showPossibleMoves function not found!");
        return;
    }
    
    // Replace with fixed version
    window.showPossibleMoves = function(row, col) {
        console.log("Using fixed showPossibleMoves function");
        const possibleMoves = window.engine.getValidMoves(row, col);
        const gameState = window.engine.getGameState();
        const piece = gameState.board[row][col];
        
        // Debug information
        if (gameState.enPassantTarget) {
            console.log("En passant target available at:", 
                `${String.fromCharCode(97 + gameState.enPassantTarget.col)}${8 - gameState.enPassantTarget.row}`);
        }
        
        // Process each valid move
        for (const move of possibleMoves) {
            const square = document.querySelector(`.square[data-row="${move.row}"][data-col="${move.col}"]`);
            if (!square) continue;
            
            // Is this move an en passant capture?
            let isEnPassantMove = false;
            
            // Simple check: if there's an en passant target and this move goes to that target
            if (gameState.enPassantTarget && 
                piece && piece[1] === 'P' &&
                move.row === gameState.enPassantTarget.row && 
                move.col === gameState.enPassantTarget.col) {
                
                isEnPassantMove = true;
                console.log("✅ En passant capture available to", 
                    `${String.fromCharCode(97 + move.col)}${8 - move.row}`);
            }
            
            // Apply highlight
            if (isEnPassantMove) {
                square.classList.add('en-passant-capture');
            } else if (gameState.board[move.row][move.col]) {
                square.classList.add('possible-capture');
            } else {
                square.classList.add('possible-move');
            }
        }
    };
    
    console.log("✅ Fix applied successfully! Try clicking on a pawn that can capture en passant.");
})(); 