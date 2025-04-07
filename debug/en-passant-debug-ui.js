/**
 * Debug script for en passant UI issues
 * Run this in the browser console while playing the game
 */

(function() {
    console.log("Loading en passant UI debugger...");
    
    // Quick fix to expose the engine if not already exposed
    if (!window.engine) {
        console.log("Looking for chess engine instance...");
        const engineInstance = document.querySelector('#chessboard');
        if (engineInstance && engineInstance._instance && engineInstance._instance.getValidMoves) {
            console.log("Found engine instance on chessboard element");
            window.engine = engineInstance._instance;
        }
    }
    
    // Check if we can access engine - ignore the ChessEngine class check
    if (!window.engine) {
        console.error("Cannot find chess engine instance. Make sure you're running this in the browser console after the page has loaded.");
        return;
    }
    
    console.log("Found chess engine instance:", window.engine);
    
    // Get the current game state
    console.log("Getting current chess board state...");
    
    // Look for the active engine instance in the UI
    const squares = document.querySelectorAll('.square');
    if (!squares || squares.length === 0) {
        console.error("No chess squares found on the page!");
        return;
    }
    
    console.log("Chess board found on page.");
    
    // Debug the showPossibleMoves function
    console.log("Analyzing the showPossibleMoves function:");
    
    // Find a pawn that could potentially capture en passant
    const gameState = window.engine.getGameState();
    
    console.log("Current board state from engine:");
    console.log("En passant target:", gameState.enPassantTarget);
    if (gameState.enPassantTarget) {
        console.log("En passant target in algebraic:", 
            `${String.fromCharCode(97 + gameState.enPassantTarget.col)}${8 - gameState.enPassantTarget.row}`);
    }
    printBoard(gameState.board);
    
    // Debug the css classes being applied
    console.log("Checking CSS classes on squares:");
    console.log("- Squares with 'possible-move' class:", document.querySelectorAll('.possible-move').length);
    console.log("- Squares with 'possible-capture' class:", document.querySelectorAll('.possible-capture').length);
    console.log("- Squares with 'en-passant-capture' class:", document.querySelectorAll('.en-passant-capture').length);
    
    // Add a direct way to check valid moves
    window.checkMovesFor = function(row, col) {
        if (!window.engine) {
            console.error("Engine not available");
            return;
        }
        
        console.log(`Checking valid moves for piece at (${row},${col}):`);
        
        // Get the piece at the specified position
        const piece = gameState.board[row][col];
        if (!piece) {
            console.log("No piece at this position");
            return;
        }
        
        // Get valid moves directly from the engine
        const validMoves = window.engine.getValidMoves(row, col);
        console.log("Valid moves from engine:", validMoves);
        
        // Check if any of these moves match the en passant target
        if (gameState.enPassantTarget) {
            const enPassantMoves = validMoves.filter(move => 
                move.row === gameState.enPassantTarget.row && 
                move.col === gameState.enPassantTarget.col);
            
            if (enPassantMoves.length > 0) {
                console.log("✅ En passant move is available in valid moves!");
                console.log("En passant moves:", enPassantMoves);
            } else {
                console.log("❌ No en passant move found in valid moves");
            }
        } else {
            console.log("No en passant target available");
        }
        
        return validMoves;
    };
    
    // Test patch for the showPossibleMoves function
    window.debugEnPassant = function() {
        // Find all current pawns
        const pawns = [];
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const pieceElement = square.querySelector('.piece');
            
            if (pieceElement && (pieceElement.textContent === '♙' || pieceElement.textContent === '♟')) {
                pawns.push({ row, col, color: pieceElement.textContent === '♙' ? 'w' : 'b' });
            }
        });
        
        console.log("Found pawns:", pawns);
        
        // For each pawn, check its valid moves using engine
        pawns.forEach(pawn => {
            console.log(`Testing pawn at row ${pawn.row}, col ${pawn.col}`);
            // Use the direct engine check
            checkMovesFor(pawn.row, pawn.col);
        });
    };
    
    // Helper function to click on a square and check what happens
    window.testClickSquare = function(row, col) {
        const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
        if (!square) {
            console.error(`No square found at (${row}, ${col})`);
            return;
        }
        
        console.log(`Simulating click on square at (${row}, ${col})`);
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        square.dispatchEvent(event);
        
        // After click, check highlighted squares
        setTimeout(() => {
            console.log("Highlighted squares after click:");
            console.log("- Possible moves:", document.querySelectorAll('.possible-move').length);
            console.log("- Possible captures:", document.querySelectorAll('.possible-capture').length);
            console.log("- En passant captures:", document.querySelectorAll('.en-passant-capture').length);
            
            document.querySelectorAll('.en-passant-capture').forEach(el => {
                console.log("  En passant square:", el.dataset.row, el.dataset.col);
            });
        }, 100);
    };
    
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
    
    // Add an emergency fix function
    window.applyEnPassantUIFix = function() {
        console.log("Applying emergency en passant UI fix...");
        
        // Store the original function
        const originalShowPossibleMoves = window.showPossibleMoves;
        
        if (!originalShowPossibleMoves) {
            console.error("Cannot find showPossibleMoves function!");
            return;
        }
        
        // Replace with fixed version
        window.showPossibleMoves = function(row, col) {
            console.log("Using patched showPossibleMoves function");
            const possibleMoves = window.engine.getValidMoves(row, col);
            const gameState = window.engine.getGameState();
            const piece = gameState.board[row][col];
            
            console.log("En passant debugging:");
            console.log("- Selected piece:", piece, "at position:", row, col);
            console.log("- En passant target:", gameState.enPassantTarget);
            console.log("- Valid moves:", possibleMoves);
            
            // Check each move
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
                    console.log("Found en passant move to", move.row, move.col);
                }
                
                // Apply proper highlight
                if (isEnPassantMove) {
                    square.classList.add('en-passant-capture');
                } else if (gameState.board[move.row][move.col]) {
                    square.classList.add('possible-capture');
                } else {
                    square.classList.add('possible-move');
                }
            }
        };
        
        console.log("Patched showPossibleMoves function. Try clicking on a pawn that can capture en passant.");
    };
    
    console.log("En passant UI debugger loaded!");
    console.log("Available commands:");
    console.log("- window.debugEnPassant() - Check all pawns for en passant captures");
    console.log("- window.checkMovesFor(row, col) - Check valid moves for piece at position");
    console.log("- window.testClickSquare(row, col) - Test clicking on a square");
    console.log("- window.applyEnPassantUIFix() - Apply a direct fix to the showPossibleMoves function");
})(); 