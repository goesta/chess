/**
 * Chess engine to handle all game logic, separated from UI for testing
 */
class ChessEngine {
    constructor() {
        // Constants for chess pieces
        this.PIECES = {
            // White pieces 
            'wP': '♟︎', 'wR': '♜', 'wN': '♞', 'wB': '♝', 'wQ': '♛', 'wK': '♚',
            // Black pieces
            'bP': '♟︎', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
        };

        // Initial state of the board (standard chess setup)
        this.INITIAL_BOARD = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];

        this.resetGame();
    }

    /**
     * Reset to a brand new game
     */
    resetGame() {
        this.board = JSON.parse(JSON.stringify(this.INITIAL_BOARD));
        this.currentTurn = 'w';
        this.moves = [];
        this.gameOver = false;
        this.checkStatus = false;
        this.lastMove = null;
        
        // Reset advanced chess rules state
        this.castlingRights = { 
            w: { kingSide: true, queenSide: true }, 
            b: { kingSide: true, queenSide: true } 
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.gameResult = null;
        this.gameResultReason = null;
        
        return this; // For chaining
    }

    /**
     * Get valid moves for a piece
     */
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        
        if (!piece) {
            return [];
        }
        
        const color = piece[0];
        const pieceType = piece[1];
        
        let moves = [];
        
        if (pieceType === 'P') {
            moves = this.getPawnMoves(row, col, color);
        } else if (pieceType === 'N') {
            moves = this.getKnightMoves(row, col, color);
        } else if (pieceType === 'B') {
            moves = this.getBishopMoves(row, col, color);
        } else if (pieceType === 'R') {
            moves = this.getRookMoves(row, col, color);
        } else if (pieceType === 'Q') {
            moves = this.getQueenMoves(row, col, color);
        } else if (pieceType === 'K') {
            moves = this.getKingMoves(row, col, color);
        }
        
        // Filter out any moves that would leave the king in check
        moves = this.filterMovesForPinsAndChecks(moves, row, col, color);
        
        return moves;
    }

    /**
     * Filter moves to handle pins and prevent leaving the king in check
     */
    filterMovesForPinsAndChecks(moves, fromRow, fromCol, color) {
        // Simply filter any move that would leave the king in check
        // This covers all pin scenarios generically
        return moves.filter(move => !this.wouldBeInCheck(fromRow, fromCol, move.row, move.col, color));
    }

    /**
     * Check if a move is valid
     */
    isValidMove(fromRow, fromCol, toRow, toCol) {
        const moves = this.getValidMoves(fromRow, fromCol);
        return moves.some(move => move.row === toRow && move.col === toCol);
    }

    /**
     * Make a move on the board
     */
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        if (piece[0] !== this.currentTurn) return false;
        
        // Ensure the move is valid
        if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) return false;
        
        const pieceType = piece[1];
        const pieceColor = piece[0];
        const isCapture = this.board[toRow][toCol] !== null;
        
        // Check if we're capturing a king, which shouldn't be possible in normal chess
        // but we want to handle it gracefully by ending the game
        if (isCapture && this.board[toRow][toCol]) {
            const capturedPiece = this.board[toRow][toCol];
            if (capturedPiece[1] === 'K') {
                console.error(`Error: Attempting to capture a king at ${toRow},${toCol}. This should not happen in a valid chess game.`);
                // Handle this as a win for the capturing player
                this.gameOver = true;
                this.gameResult = pieceColor === 'w' ? 'white' : 'black';
                this.gameResultReason = 'missing_king';
                return true;
            }
        }
        
        // Store the last move
        this.lastMove = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece
        };
        
        // Special moves handling
        let isEnPassant = false;
        
        // Handle castling
        if (pieceType === 'K') {
            // Update castling rights
            this.castlingRights[pieceColor].kingSide = false;
            this.castlingRights[pieceColor].queenSide = false;
            
            // Handle kingside castling
            if (fromCol === 4 && toCol === 6) {
                // Move the rook from h1/h8 to f1/f8
                const rookRow = pieceColor === 'w' ? 7 : 0;
                this.board[rookRow][5] = this.board[rookRow][7];
                this.board[rookRow][7] = null;
                this.lastMove.castling = 'kingside';
            }
            // Handle queenside castling
            else if (fromCol === 4 && toCol === 2) {
                // Move the rook from a1/a8 to d1/d8
                const rookRow = pieceColor === 'w' ? 7 : 0;
                this.board[rookRow][3] = this.board[rookRow][0];
                this.board[rookRow][0] = null;
                this.lastMove.castling = 'queenside';
            }
        }
        
        // Update castling rights if a rook moves
        if (pieceType === 'R') {
            const rookRow = pieceColor === 'w' ? 7 : 0;
            if (fromRow === rookRow) {
                if (fromCol === 0) {
                    this.castlingRights[pieceColor].queenSide = false;
                } else if (fromCol === 7) {
                    this.castlingRights[pieceColor].kingSide = false;
                }
            }
        }
        
        // Update castling rights if a rook is captured
        if (isCapture && this.board[toRow][toCol]) {
            const capturedPiece = this.board[toRow][toCol];
            const capturedType = capturedPiece[1];
            const capturedColor = capturedPiece[0];
            
            if (capturedType === 'R') {
                const rookRow = capturedColor === 'w' ? 7 : 0;
                if (toRow === rookRow) {
                    if (toCol === 0) {
                        this.castlingRights[capturedColor].queenSide = false;
                    } else if (toCol === 7) {
                        this.castlingRights[capturedColor].kingSide = false;
                    }
                }
            }
        }
        
        // Handle en passant capture
        if (pieceType === 'P' && this.enPassantTarget) {
            // White pawn capturing en passant
            if (pieceColor === 'w' && fromRow === 3 && toRow === 2 && 
                toCol === this.enPassantTarget.col && this.enPassantTarget.row === 2) {
                this.board[3][toCol] = null; // Remove the black pawn
                isEnPassant = true;
                this.lastMove.enPassant = true;
            }
            // Black pawn capturing en passant
            else if (pieceColor === 'b' && fromRow === 4 && toRow === 5 && 
                     toCol === this.enPassantTarget.col && this.enPassantTarget.row === 5) {
                this.board[4][toCol] = null; // Remove the white pawn
                isEnPassant = true;
                this.lastMove.enPassant = true;
            }
        }
        
        // Reset en passant target
        const oldEnPassantTarget = this.enPassantTarget;
        this.enPassantTarget = null;
        
        // Set en passant target if a pawn moves two squares
        if (pieceType === 'P' && Math.abs(fromRow - toRow) === 2) {
            this.enPassantTarget = {
                row: (fromRow + toRow) / 2, // Middle square
                col: fromCol
            };
        }
        
        // Move the piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Check for pawn promotion (simplified - auto queen)
        if (pieceType === 'P' && (toRow === 0 || toRow === 7)) {
            this.board[toRow][toCol] = `${pieceColor}Q`;
            this.lastMove.promotion = true;
        }
        
        // Update half-move clock for 50-move rule
        if (pieceType === 'P' || isCapture || isEnPassant) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
        
        // Update full move number
        if (pieceColor === 'b') {
            this.fullMoveNumber++;
        }
        
        // Switch turn
        this.currentTurn = this.currentTurn === 'w' ? 'b' : 'w';
        
        // Check game status for the new current player
        this.checkGameStatus();
        
        return true;
    }

    /**
     * Check if a square is under attack by the opponent
     */
    isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'w' ? 'b' : 'w';
        
        // Check for attacks by pawns
        // Pawns attack diagonally forward, so we need to check the squares in FRONT of them
        // For white pawns attacking, check one row below the target
        // For black pawns attacking, check one row above the target
        if (attackingColor === 'w') {
            // White pawns attack diagonally upward (lower row index)
            const pawnRow = row + 1; // One row down from the target in array (where the attacking pawn would be)
            if (pawnRow >= 0 && pawnRow <= 7) {
                // Check bottom-left diagonal
                if (col - 1 >= 0 && this.board[pawnRow][col - 1] === 'wP') {
                    return true;
                }
                // Check bottom-right diagonal
                if (col + 1 <= 7 && this.board[pawnRow][col + 1] === 'wP') {
                    return true;
                }
            }
        } else { // attackingColor === 'b'
            // Black pawns attack diagonally downward (higher row index)
            const pawnRow = row - 1; // One row up from the target in array (where the attacking pawn would be)
            if (pawnRow >= 0 && pawnRow <= 7) {
                // Check top-left diagonal
                if (col - 1 >= 0 && this.board[pawnRow][col - 1] === 'bP') {
                    return true;
                }
                // Check top-right diagonal
                if (col + 1 <= 7 && this.board[pawnRow][col + 1] === 'bP') {
                    return true;
                }
            }
        }
        
        // Check for attacks by knights
        const knightMoves = [
            {r: row - 2, c: col - 1}, {r: row - 2, c: col + 1},
            {r: row - 1, c: col - 2}, {r: row - 1, c: col + 2},
            {r: row + 1, c: col - 2}, {r: row + 1, c: col + 2},
            {r: row + 2, c: col - 1}, {r: row + 2, c: col + 1}
        ];
        
        for (const move of knightMoves) {
            const r = move.r;
            const c = move.c;
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && this.board[r][c] === `${attackingColor}N`) {
                return true;
            }
        }
        
        // Check for attacks by king
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r === row && c === col) continue;
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && this.board[r][c] === `${attackingColor}K`) {
                    return true;
                }
            }
        }
        
        // Check for attacks by rooks/queens (horizontal/vertical)
        const directions = [
            {dr: -1, dc: 0}, // up
            {dr: 1, dc: 0},  // down
            {dr: 0, dc: -1}, // left
            {dr: 0, dc: 1}   // right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (this.board[r][c]) {
                    if (this.board[r][c] === `${attackingColor}R` || this.board[r][c] === `${attackingColor}Q`) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // Check for attacks by bishops/queens (diagonals)
        const diagonals = [
            {dr: -1, dc: -1}, // top-left
            {dr: -1, dc: 1},  // top-right
            {dr: 1, dc: -1},  // bottom-left
            {dr: 1, dc: 1}    // bottom-right
        ];
        
        for (const dir of diagonals) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (this.board[r][c]) {
                    if (this.board[r][c] === `${attackingColor}B` || this.board[r][c] === `${attackingColor}Q`) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return false;
    }

    /**
     * Check if making a move would leave the king in check
     */
    wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Make a temporary copy of the board
        const tempBoard = this.board.map(row => [...row]);
        const savedBoard = this.board;
        
        // Remember the old en passant target
        const savedEnPassantTarget = this.enPassantTarget;
        
        // Temporarily set the board to the copy
        this.board = tempBoard;
        
        // Get the moving piece
        const movingPiece = this.board[fromRow][fromCol];
        
        // If the piece is a king, the destination square must not be under attack
        if (movingPiece && movingPiece[1] === 'K') {
            // Check if the destination square is under attack
            const isDestUnderAttack = this.isSquareAttacked(toRow, toCol, color);
            
            // Restore the original board state
            this.board = savedBoard;
            this.enPassantTarget = savedEnPassantTarget;
            
            return isDestUnderAttack;
        }
        
        // For other pieces, temporarily make the move
        tempBoard[toRow][toCol] = movingPiece;
        tempBoard[fromRow][fromCol] = null;
        
        // Handle en passant capture - Use explicit conditions matching makeMove
        if (movingPiece && movingPiece[1] === 'P' && this.enPassantTarget) {
            // White pawn capturing en passant
            if (color === 'w' && fromRow === 3 && toRow === 2 && 
                toCol === this.enPassantTarget.col && this.enPassantTarget.row === 2) {
                tempBoard[3][toCol] = null; // Remove the black pawn
            }
            // Black pawn capturing en passant
            else if (color === 'b' && fromRow === 4 && toRow === 5 && 
                    toCol === this.enPassantTarget.col && this.enPassantTarget.row === 5) {
                tempBoard[4][toCol] = null; // Remove the white pawn
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
        
        if (kingRow === undefined) {
            // This shouldn't happen in a valid game state
            this.board = savedBoard;
            this.enPassantTarget = savedEnPassantTarget;
            return false;
        }
        
        // Check if the king is attacked on the temporary board
        const isInCheck = this.isSquareAttackedAfterMove(kingRow, kingCol, color, tempBoard);
        
        // Restore the original board and en passant target
        this.board = savedBoard;
        this.enPassantTarget = savedEnPassantTarget;
        
        return isInCheck;
    }

    /**
     * Helper method to check if a square is attacked after a move
     * This variation works on a provided board state rather than the current board
     */
    isSquareAttackedAfterMove(row, col, defendingColor, boardState) {
        const attackingColor = defendingColor === 'w' ? 'b' : 'w';
        
        // Check for attacks by pawns
        // Pawns attack diagonally forward, so we need to check the squares in FRONT of them
        if (attackingColor === 'w') {
            // White pawns attack diagonally upward (lower row index)
            const pawnRow = row + 1; // One row down from the target in array (where the attacking pawn would be)
            if (pawnRow >= 0 && pawnRow <= 7) {
                // Check bottom-left diagonal
                if (col - 1 >= 0 && boardState[pawnRow][col - 1] === 'wP') {
                    return true;
                }
                // Check bottom-right diagonal
                if (col + 1 <= 7 && boardState[pawnRow][col + 1] === 'wP') {
                    return true;
                }
            }
        } else { // attackingColor === 'b'
            // Black pawns attack diagonally downward (higher row index)
            const pawnRow = row - 1; // One row up from the target in array (where the attacking pawn would be)
            if (pawnRow >= 0 && pawnRow <= 7) {
                // Check top-left diagonal
                if (col - 1 >= 0 && boardState[pawnRow][col - 1] === 'bP') {
                    return true;
                }
                // Check top-right diagonal
                if (col + 1 <= 7 && boardState[pawnRow][col + 1] === 'bP') {
                    return true;
                }
            }
        }
        
        // Check for attacks by knights
        const knightMoves = [
            {r: row - 2, c: col - 1}, {r: row - 2, c: col + 1},
            {r: row - 1, c: col - 2}, {r: row - 1, c: col + 2},
            {r: row + 1, c: col - 2}, {r: row + 1, c: col + 2},
            {r: row + 2, c: col - 1}, {r: row + 2, c: col + 1}
        ];
        
        for (const move of knightMoves) {
            const r = move.r;
            const c = move.c;
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && boardState[r][c] === `${attackingColor}N`) {
                return true;
            }
        }
        
        // Check for attacks by king
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r === row && c === col) continue;
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && boardState[r][c] === `${attackingColor}K`) {
                    return true;
                }
            }
        }
        
        // Check for attacks by rooks/queens (horizontal/vertical)
        const directions = [
            {dr: -1, dc: 0}, // up
            {dr: 1, dc: 0},  // down
            {dr: 0, dc: -1}, // left
            {dr: 0, dc: 1}   // right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (boardState[r][c]) {
                    if (boardState[r][c] === `${attackingColor}R` || boardState[r][c] === `${attackingColor}Q`) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // Check for attacks by bishops/queens (diagonals)
        const diagonals = [
            {dr: -1, dc: -1}, // top-left
            {dr: -1, dc: 1},  // top-right
            {dr: 1, dc: -1},  // bottom-left
            {dr: 1, dc: 1}    // bottom-right
        ];
        
        for (const dir of diagonals) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (boardState[r][c]) {
                    if (boardState[r][c] === `${attackingColor}B` || boardState[r][c] === `${attackingColor}Q`) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return false;
    }

    /**
     * Check if the king of the specified color is in check
     */
    isKingInCheck(color) {
        // Find the king
        const kingPosition = this.findKing(color);
        
        if (!kingPosition) {
            // If king not found, we can't determine check status
            // This should be caught by areBothKingsPresent check in checkGameStatus
            console.warn(`Warning: ${color === 'w' ? 'White' : 'Black'} king not found when checking check status`);
            return false;
        }
        
        // Check if the king's position is under attack
        return this.isSquareAttacked(kingPosition.row, kingPosition.col, color);
    }

    /**
     * Check if the current player has any legal moves
     */
    doesPlayerHaveLegalMoves(color) {
        // First check if the king exists - if not, there are no legal moves
        const kingPosition = this.findKing(color);
        if (!kingPosition) {
            console.warn(`Warning: ${color === 'w' ? 'White' : 'Black'} king not found when checking for legal moves`);
            return false;
        }

        // Normal check for legal moves
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece[0] === color) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.length > 0) {
                        return true; // Found at least one legal move
                    }
                }
            }
        }
        return false; // No legal moves found
    }

    /**
     * Check for insufficient material draw
     * 
     * Insufficient material is a draw condition where neither player 
     * can possibly checkmate the opponent with their remaining pieces.
     * 
     * Standard cases are:
     * - King vs. King
     * - King and Bishop vs. King
     * - King and Knight vs. King
     * - King and Bishop vs. King and Bishop (same-colored bishops)
     */
    hasInsufficientMaterial() {
        /**
         * Check if the current position has insufficient material for either player to deliver checkmate
         * 
         * Standard insufficient material scenarios:
         * - King vs. King
         * - King vs. King + Knight
         * - King vs. King + Bishop
         * - King + Bishop vs. King + Bishop (with bishops on same colored squares)
         * 
         * Note: King + 2 Knights technically can checkmate but it's extremely rare and difficult,
         * so some implementations also consider this insufficient material
         */
        // Count pieces by type
        const pieces = {
            w: { count: 0, pieces: {} },
            b: { count: 0, pieces: {} },
            bishopSquares: { w: [], b: [] }
        };

        // Count all pieces by type and track bishop square positions
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;
                
                const color = piece.charAt(0);
                const type = piece.charAt(1);
                
                if (!pieces[color].pieces[type]) {
                    pieces[color].pieces[type] = 0;
                }
                
                pieces[color].pieces[type]++;
                pieces[color].count++;
                
                // Track bishop positions for later color comparison
                if (type === 'B') {
                    pieces.bishopSquares[color].push({ row, col });
                }
            }
        }

        // Check for known insufficient material scenarios
        if (this.isKingVsKing(pieces)) return true;
        if (this.isKingVsMinorPiece(pieces)) return true;
        if (this.isKingsAndSameColoredBishops(pieces)) return true;
        
        // All other scenarios have sufficient material
        return false;
    }

    /**
     * Determine if a square is light or dark colored
     * In chess, squares where row+col is even are one color,
     * and squares where row+col is odd are the other color
     */
    getSquareColor(row, col) {
        // In chess, light squares are when row+col is even (0,2,4,6),
        // dark squares are when row+col is odd (1,3,5,7)
        return (row + col) % 2 === 0 ? 'light' : 'dark';
    }

    isKingVsKing(pieces) {
        return pieces.w.count === 1 && pieces.b.count === 1 &&
               pieces.w.pieces.K === 1 && pieces.b.pieces.K === 1;
    }

    isKingVsMinorPiece(pieces) {
        const whiteHasKingOnly = pieces.w.count === 1 && pieces.w.pieces.K === 1;
        const blackHasKingOnly = pieces.b.count === 1 && pieces.b.pieces.K === 1;
        
        const whiteHasKingAndMinor = pieces.w.count === 2 && pieces.w.pieces.K === 1 && 
                                    (pieces.w.pieces.B === 1 || pieces.w.pieces.N === 1);
        const blackHasKingAndMinor = pieces.b.count === 2 && pieces.b.pieces.K === 1 && 
                                    (pieces.b.pieces.B === 1 || pieces.b.pieces.N === 1);
        
        return (whiteHasKingOnly && blackHasKingAndMinor) || 
               (blackHasKingOnly && whiteHasKingAndMinor);
    }

    isKingsAndSameColoredBishops(pieces) {
        // Both sides must have only a king and a bishop
        const whiteHasKingAndBishop = pieces.w.count === 2 && pieces.w.pieces.K === 1 && pieces.w.pieces.B === 1;
        const blackHasKingAndBishop = pieces.b.count === 2 && pieces.b.pieces.K === 1 && pieces.b.pieces.B === 1;
        
        if (!whiteHasKingAndBishop || !blackHasKingAndBishop) {
            return false;
        }
        
        // Check if bishops are on the same colored square
        const whiteBishopSquare = pieces.bishopSquares.w[0];
        const blackBishopSquare = pieces.bishopSquares.b[0];
        
        const whiteBishopColor = this.getSquareColor(whiteBishopSquare.row, whiteBishopSquare.col);
        const blackBishopColor = this.getSquareColor(blackBishopSquare.row, blackBishopSquare.col);
        
        console.log('Bishop color check:', 
                    'white bishop at', whiteBishopSquare, 'is on', whiteBishopColor, 
                    'black bishop at', blackBishopSquare, 'is on', blackBishopColor);
        
        // If bishops are on the same colored squares, it's a draw
        return whiteBishopColor === blackBishopColor;
    }

    /**
     * Check if both kings are present on the board
     * Returns null if both kings are present, or the winning color if a king is missing
     */
    areBothKingsPresent() {
        let whiteKingFound = false;
        let blackKingFound = false;
        
        // Loop through the board to find kings
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece === 'wK') {
                    whiteKingFound = true;
                } else if (piece === 'bK') {
                    blackKingFound = true;
                }
                
                // If both kings found, we can stop searching
                if (whiteKingFound && blackKingFound) {
                    return null; // null means both kings are present
                }
            }
        }
        
        // Return the winning color if a king is missing
        if (!whiteKingFound) {
            return 'black'; // Black wins if white king is missing
        } else if (!blackKingFound) {
            return 'white'; // White wins if black king is missing
        }
        
        return null; // Should never happen, but just in case
    }

    /**
     * Check game status (checks for mate, stalemate, etc.)
     */
    checkGameStatus() {
        // First check if both kings are present
        const missingKingResult = this.areBothKingsPresent();
        if (missingKingResult) {
            // A king is missing, end the game
            this.gameOver = true;
            this.gameResult = missingKingResult;
            this.gameResultReason = 'missing_king';
            return;
        }

        // Check if the king is in check
        const inCheck = this.isKingInCheck(this.currentTurn);
        this.checkStatus = inCheck;
        
        // Check if the current player has any legal moves
        const hasLegalMoves = this.doesPlayerHaveLegalMoves(this.currentTurn);
        
        if (!hasLegalMoves) {
            if (inCheck) {
                // Checkmate - king is in check and no legal moves
                this.gameOver = true;
                this.gameResult = this.currentTurn === 'w' ? 'black' : 'white';
                this.gameResultReason = 'checkmate';
                return;
            } else {
                // Stalemate - not in check but no legal moves
                this.gameOver = true;
                this.gameResult = 'draw';
                this.gameResultReason = 'stalemate';
                return;
            }
        }
        
        // Check for insufficient material (K vs K, K vs KB, K vs KN, etc.)
        if (this.hasInsufficientMaterial()) {
            this.gameOver = true;
            this.gameResult = 'draw';
            this.gameResultReason = 'insufficient_material';
            return;
        }
        
        // Check for 50-move rule
        if (this.halfMoveClock >= 100) { // 50 moves = 100 half moves
            this.gameOver = true;
            this.gameResult = 'draw';
            this.gameResultReason = 'fifty_move_rule';
            return;
        }
        
        // If none of the above conditions are met, the game continues
        this.gameOver = false;
        this.gameResult = null;
        this.gameResultReason = null;
    }

    /**
     * Get the game state
     */
    getGameState() {
        return {
            board: this.board.map(row => [...row]),
            currentTurn: this.currentTurn,
            checkStatus: this.checkStatus,
            gameOver: this.gameOver,
            lastMove: this.lastMove ? {...this.lastMove} : null,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            enPassantTarget: this.enPassantTarget ? {...this.enPassantTarget} : null,
            halfMoveClock: this.halfMoveClock,
            fullMoveNumber: this.fullMoveNumber,
            gameResult: this.gameResult,
            gameResultReason: this.gameResultReason
        };
    }

    /**
     * Set up a specific position for testing
     */
    setPosition(board, options = {}) {
        this.board = board.map(row => [...row]);
        this.currentTurn = options.currentTurn || 'w';
        this.castlingRights = options.castlingRights || { 
            w: { kingSide: false, queenSide: false }, 
            b: { kingSide: false, queenSide: false } 
        };
        this.enPassantTarget = options.enPassantTarget || null;
        this.halfMoveClock = options.halfMoveClock || 0;
        this.fullMoveNumber = options.fullMoveNumber || 1;
        this.lastMove = options.lastMove || null;
        this.gameOver = options.gameOver || false;
        this.gameResult = options.gameResult || null;
        this.gameResultReason = options.gameResultReason || null;
        
        // Check game status after setting up position
        this.checkGameStatus();
        
        return this;
    }

    /**
     * Get valid pawn moves
     */
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;
        
        // Helper function to check if a square is empty
        const isEmpty = (r, c) => r >= 0 && r <= 7 && c >= 0 && c <= 7 && !this.board[r][c];
        
        // Helper function to check if a square has an enemy piece
        const hasEnemy = (r, c) => {
            return r >= 0 && r <= 7 && c >= 0 && c <= 7 && 
                   this.board[r][c] && this.board[r][c][0] !== color;
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
        if (this.enPassantTarget) {
            // For white pawns (moving up the board)
            if (color === 'w' && row === 3) {
                // Check if our pawn is adjacent to the en passant target
                if (Math.abs(col - this.enPassantTarget.col) === 1 && 
                    this.enPassantTarget.row === 2) {
                    moves.push({ row: 2, col: this.enPassantTarget.col });
                }
            }
            // For black pawns (moving down the board)
            else if (color === 'b' && row === 4) {
                // Check if our pawn is adjacent to the en passant target
                if (Math.abs(col - this.enPassantTarget.col) === 1 && 
                    this.enPassantTarget.row === 5) {
                    moves.push({ row: 5, col: this.enPassantTarget.col });
                }
            }
        }
        
        return moves;
    }

    /**
     * Get valid knight moves
     */
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            {r: row - 2, c: col - 1}, {r: row - 2, c: col + 1},
            {r: row - 1, c: col - 2}, {r: row - 1, c: col + 2},
            {r: row + 1, c: col - 2}, {r: row + 1, c: col + 2},
            {r: row + 2, c: col - 1}, {r: row + 2, c: col + 1}
        ];
        
        for (const move of knightMoves) {
            const r = move.r;
            const c = move.c;
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && 
                (!this.board[r][c] || this.board[r][c][0] !== color)) {
                moves.push({ row: r, col: c });
            }
        }
        
        return moves;
    }

    /**
     * Get valid bishop moves
     */
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [
            {dr: -1, dc: -1},  // top-left
            {dr: -1, dc: 1},   // top-right
            {dr: 1, dc: -1},   // bottom-left
            {dr: 1, dc: 1}     // bottom-right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (!this.board[r][c]) {
                    moves.push({ row: r, col: c });
                } else {
                    if (this.board[r][c][0] !== color) {
                        moves.push({ row: r, col: c });
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }

    /**
     * Get valid rook moves
     */
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [
            {dr: -1, dc: 0},  // up
            {dr: 1, dc: 0},   // down
            {dr: 0, dc: -1},  // left
            {dr: 0, dc: 1}    // right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (!this.board[r][c]) {
                    moves.push({ row: r, col: c });
                } else {
                    if (this.board[r][c][0] !== color) {
                        moves.push({ row: r, col: c });
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }

    /**
     * Get valid queen moves (combination of rook and bishop moves)
     */
    getQueenMoves(row, col, color) {
        return [
            ...this.getRookMoves(row, col, color),
            ...this.getBishopMoves(row, col, color)
        ];
    }

    /**
     * Get valid king moves
     */
    getKingMoves(row, col, color) {
        const moves = [];
        
        // Regular king moves (one square in any direction)
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r === row && c === col) continue;
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && 
                    (!this.board[r][c] || this.board[r][c][0] !== color)) {
                    moves.push({ row: r, col: c });
                }
            }
        }
        
        // Castling
        if (this.castlingRights[color]) {
            // King must be in its initial position
            const kingRow = color === 'w' ? 7 : 0;
            if (row === kingRow && col === 4) {
                // Check kingside castling
                if (this.castlingRights[color].kingSide &&
                    !this.board[kingRow][5] && !this.board[kingRow][6] &&
                    !this.isSquareAttacked(kingRow, 4, color) &&
                    !this.isSquareAttacked(kingRow, 5, color) &&
                    !this.isSquareAttacked(kingRow, 6, color)) {
                    
                    moves.push({ row: kingRow, col: 6, castling: 'kingside' });
                }
                
                // Check queenside castling
                if (this.castlingRights[color].queenSide &&
                    !this.board[kingRow][3] && !this.board[kingRow][2] && !this.board[kingRow][1] &&
                    !this.isSquareAttacked(kingRow, 4, color) &&
                    !this.isSquareAttacked(kingRow, 3, color) &&
                    !this.isSquareAttacked(kingRow, 2, color)) {
                    
                    moves.push({ row: kingRow, col: 2, castling: 'queenside' });
                }
            }
        }
        
        return moves;
    }

    /**
     * Find the king's position
     */
    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] === `${color}K`) {
                    return { row: r, col: c };
                }
            }
        }
        return null; // King not found - handled by calling code
    }
}

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
} 