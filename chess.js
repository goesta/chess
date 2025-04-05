document.addEventListener('DOMContentLoaded', () => {
    // Constants for chess pieces using Unicode characters
    const PIECES = {
        // White pieces (will use the same solid symbols as black but styled white with outline)
        'wP': '♟', 'wR': '♜', 'wN': '♞', 'wB': '♝', 'wQ': '♛', 'wK': '♚',
        // Black pieces (solid symbols)
        'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
    };

    // Initial state of the board (standard chess setup)
    const INITIAL_BOARD = [
        ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
        ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null],
        ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
        ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
    ];

    // DOM elements
    const chessboard = document.getElementById('chessboard');
    const turnInfo = document.getElementById('turn-info');
    const gameStatus = document.getElementById('game-status');
    const shareUrl = document.getElementById('share-url');
    const copyButton = document.getElementById('copy-button');
    const newGameButton = document.getElementById('new-game-button');
    const gameSection = document.getElementById('game-section');
    const shareSection = document.getElementById('share-section');
    const continueButton = document.getElementById('continue-button');
    const emailButton = document.getElementById('email-button');
    const welcomeSection = document.getElementById('welcome-section');
    const startGameButton = document.getElementById('start-game-button');

    // Game state variables
    let board = [];
    let currentTurn = 'w'; // 'w' for white, 'b' for black
    let selectedSquare = null;
    let moves = [];
    let gameOver = false;
    let checkStatus = false;
    let lastMove = null; // Store the last move (from and to positions)
    
    // Advanced chess rules tracking
    let castlingRights = { 
        w: { kingSide: true, queenSide: true }, 
        b: { kingSide: true, queenSide: true } 
    };
    let enPassantTarget = null; // Stores the position of a pawn that can be captured en passant
    let halfMoveClock = 0; // For 50-move rule: increments after each move, resets on pawn move or capture
    let fullMoveNumber = 1; // Increments after black's move

    // Initialize the game
    function initGame(loadFromUrl = false) {
        // Hide welcome section
        if (welcomeSection) {
            welcomeSection.classList.add('hidden');
        }
        
        // Show New Game button in controls
        if (newGameButton && newGameButton.parentElement) {
            newGameButton.parentElement.classList.remove('hidden');
        }
        
        // Clear the chessboard
        chessboard.innerHTML = '';
        
        // Show game section, hide share section
        gameSection.classList.remove('hidden');
        shareSection.classList.add('hidden');
        
        // Initialize board state
        if (loadFromUrl) {
            try {
                // Try to load the game state from the URL
                parseGameStateFromUrl();
            } catch (error) {
                console.error('Error parsing URL:', error);
                alert('Invalid game URL. Starting a new game.');
                resetToNewGame();
            }
        } else {
            // Start a new game
            resetToNewGame();
        }
        
        // Create the chess board UI
        createChessBoard();
        
        // Update the UI
        updateGameInfo();
        generateShareUrl();
        
        // Initialize the email button
        if (emailButton) {
            emailButton.href = createEmailLink();
        }
    }
    
    // Reset to a brand new game
    function resetToNewGame() {
        board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        currentTurn = 'w';
        selectedSquare = null;
        moves = [];
        gameOver = false;
        checkStatus = false;
        lastMove = null;
        
        // Reset advanced chess rules state
        castlingRights = { 
            w: { kingSide: true, queenSide: true }, 
            b: { kingSide: true, queenSide: true } 
        };
        enPassantTarget = null;
        halfMoveClock = 0;
        fullMoveNumber = 1;
    }

    // Create the chess board squares
    function createChessBoard() {
        // Add row and column labels
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        // Create a wrapper for the board with labels
        const boardContainer = document.querySelector('.board-container');
        boardContainer.innerHTML = '';
        
        // Create board wrapper element
        const boardWrapper = document.createElement('div');
        boardWrapper.className = 'board-wrapper';
        
        // Create the file labels (top row)
        const topLabelsRow = document.createElement('div');
        topLabelsRow.className = 'file-labels-row';
        
        // Add empty corner first
        let cornerLabel = document.createElement('div');
        cornerLabel.className = 'corner-label';
        topLabelsRow.appendChild(cornerLabel);
        
        // Add file labels (adjust based on current turn)
        const fileOrder = currentTurn === 'w' ? [...files] : [...files].reverse();
        for (let i = 0; i < 8; i++) {
            const fileLabel = document.createElement('div');
            fileLabel.className = 'file-label';
            fileLabel.textContent = fileOrder[i];
            topLabelsRow.appendChild(fileLabel);
        }
        
        // Add empty corner last
        cornerLabel = document.createElement('div');
        cornerLabel.className = 'corner-label';
        topLabelsRow.appendChild(cornerLabel);
        
        boardWrapper.appendChild(topLabelsRow);
        
        // Create the main board area with rank labels
        const boardArea = document.createElement('div');
        boardArea.className = 'board-area';
        
        // Create left rank labels (adjust based on current turn)
        const rankOrder = currentTurn === 'w' ? [...ranks] : [...ranks].reverse();
        const leftLabels = document.createElement('div');
        leftLabels.className = 'rank-labels';
        for (let i = 0; i < 8; i++) {
            const rankLabel = document.createElement('div');
            rankLabel.className = 'rank-label';
            rankLabel.textContent = rankOrder[i];
            leftLabels.appendChild(rankLabel);
        }
        boardArea.appendChild(leftLabels);
        
        // Create the actual chessboard
        chessboard.innerHTML = '';
        
        // Determine the order of rows and columns based on current turn
        const rowOrder = Array.from({ length: 8 }, (_, i) => currentTurn === 'w' ? i : 7 - i);
        const colOrder = Array.from({ length: 8 }, (_, i) => currentTurn === 'w' ? i : 7 - i);
        
        // Create squares with pieces
        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                // Get actual row/col from the board array based on perspective
                const actualRow = rowOrder[displayRow];
                const actualCol = colOrder[displayCol];
                
                const square = document.createElement('div');
                square.className = `square ${(actualRow + actualCol) % 2 === 0 ? 'white' : 'black'}`;
                
                // Check if this square is part of the last move
                if (lastMove) {
                    if (actualRow === lastMove.from.row && actualCol === lastMove.from.col) {
                        square.classList.add('last-move-from');
                    }
                    if (actualRow === lastMove.to.row && actualCol === lastMove.to.col) {
                        square.classList.add('last-move-to');
                    }
                }
                
                square.dataset.row = actualRow;
                square.dataset.col = actualCol;
                
                // Add piece if there is one
                if (board[actualRow][actualCol]) {
                    const piece = document.createElement('div');
                    const pieceCode = board[actualRow][actualCol];
                    const pieceColor = pieceCode[0]; // 'w' or 'b'
                    
                    // Add color-specific class to the piece
                    piece.className = `piece ${pieceColor === 'w' ? 'white-piece' : 'black-piece'}`;
                    piece.textContent = PIECES[pieceCode];
                    square.appendChild(piece);
                }
                
                // Add event listener
                square.addEventListener('click', handleSquareClick);
                
                chessboard.appendChild(square);
            }
        }
        boardArea.appendChild(chessboard);
        
        // Create right rank labels (adjust based on current turn)
        const rightLabels = document.createElement('div');
        rightLabels.className = 'rank-labels';
        for (let i = 0; i < 8; i++) {
            const rankLabel = document.createElement('div');
            rankLabel.className = 'rank-label';
            rankLabel.textContent = rankOrder[i];
            rightLabels.appendChild(rankLabel);
        }
        boardArea.appendChild(rightLabels);
        
        boardWrapper.appendChild(boardArea);
        
        // Create the file labels (bottom row)
        const bottomLabelsRow = document.createElement('div');
        bottomLabelsRow.className = 'file-labels-row';
        
        // Add empty corner first
        cornerLabel = document.createElement('div');
        cornerLabel.className = 'corner-label';
        bottomLabelsRow.appendChild(cornerLabel);
        
        // Add file labels
        for (let i = 0; i < 8; i++) {
            const fileLabel = document.createElement('div');
            fileLabel.className = 'file-label';
            fileLabel.textContent = fileOrder[i];
            bottomLabelsRow.appendChild(fileLabel);
        }
        
        // Add empty corner last
        cornerLabel = document.createElement('div');
        cornerLabel.className = 'corner-label';
        bottomLabelsRow.appendChild(cornerLabel);
        
        boardWrapper.appendChild(bottomLabelsRow);
        
        // Add the board wrapper to the container
        boardContainer.appendChild(boardWrapper);
    }

    // Handle click on a square
    function handleSquareClick(event) {
        if (gameOver) return;
        
        const square = event.currentTarget;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // If a square is already selected
        if (selectedSquare) {
            const selectedRow = parseInt(selectedSquare.dataset.row);
            const selectedCol = parseInt(selectedSquare.dataset.col);
            
            // If clicking on a possible move
            if (isValidMove(selectedRow, selectedCol, row, col)) {
                // Make the move
                makeMove(selectedRow, selectedCol, row, col);
                clearHighlights();
                selectedSquare = null;
                
                // Update UI (don't switch turn here as it's done in makeMove)
                updateGameInfo();
                
                // Generate new URL with updated state
                generateShareUrl();
                
                // Check game status
                checkGameStatus();
                
                // Show share section, hide game section
                gameSection.classList.add('hidden');
                shareSection.classList.remove('hidden');
            } else {
                // If clicking on another square, update selection
                clearHighlights();
                
                // If clicking own piece, select it
                if (board[row][col] && board[row][col][0] === currentTurn) {
                    selectedSquare = square;
                    highlightSquare(square);
                    showPossibleMoves(row, col);
                } else {
                    selectedSquare = null;
                }
            }
        } else {
            // If selecting a square for the first time
            if (board[row][col] && board[row][col][0] === currentTurn) {
                selectedSquare = square;
                highlightSquare(square);
                showPossibleMoves(row, col);
            }
        }
    }

    // Show game section and hide share section
    function showGameSection() {
        gameSection.classList.remove('hidden');
        shareSection.classList.add('hidden');
    }

    // Highlight a square
    function highlightSquare(square) {
        square.classList.add('highlighted');
    }

    // Show possible moves for a piece
    function showPossibleMoves(row, col) {
        moves = getValidMoves(row, col);
        
        for (const move of moves) {
            const square = getSquareElement(move.row, move.col);
            if (board[move.row][move.col]) {
                // Highlight as a capture
                square.classList.add('possible-capture');
            } else {
                // Highlight as a move
                square.classList.add('possible-move');
            }
        }
    }

    // Get a square element by row and column
    function getSquareElement(row, col) {
        return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }

    // Clear all highlights
    function clearHighlights() {
        document.querySelectorAll('.highlighted, .possible-move, .possible-capture').forEach(el => {
            el.classList.remove('highlighted', 'possible-move', 'possible-capture');
        });
    }

    // Check if a move is in the valid moves list
    function isValidMove(fromRow, fromCol, toRow, toCol) {
        return moves.some(move => move.row === toRow && move.col === toCol);
    }

    // Get valid moves for a piece
    function getValidMoves(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const validMoves = [];
        const pieceType = piece[1];
        const pieceColor = piece[0];
        
        // Helper function to check if a square is empty or has enemy piece
        const canMoveTo = (r, c) => {
            if (r < 0 || r > 7 || c < 0 || c > 7) return false;
            return !board[r][c] || board[r][c][0] !== pieceColor;
        };
        
        // Helper function to add move if valid
        const addMove = (r, c) => {
            if (canMoveTo(r, c)) {
                validMoves.push({ row: r, col: c });
            }
        };
        
        // Pawn moves
        if (pieceType === 'P') {
            const direction = pieceColor === 'w' ? -1 : 1;
            const startRow = pieceColor === 'w' ? 6 : 1;
            
            // Move forward one square
            if (!board[row + direction][col]) {
                addMove(row + direction, col);
                
                // Move forward two squares from starting position
                if (row === startRow && !board[row + 2 * direction][col]) {
                    addMove(row + 2 * direction, col);
                }
            }
            
            // Capture diagonally
            if (col > 0 && board[row + direction][col - 1] && board[row + direction][col - 1][0] !== pieceColor) {
                addMove(row + direction, col - 1);
            }
            if (col < 7 && board[row + direction][col + 1] && board[row + direction][col + 1][0] !== pieceColor) {
                addMove(row + direction, col + 1);
            }
            
            // En passant capture
            if (enPassantTarget) {
                const epRow = enPassantTarget.row;
                const epCol = enPassantTarget.col;
                
                // Check if this pawn is in the correct position to perform en passant
                if (row === epRow && Math.abs(col - epCol) === 1) {
                    addMove(epRow + direction, epCol);
                }
            }
        }
        
        // Rook moves (horizontal and vertical)
        if (pieceType === 'R' || pieceType === 'Q') {
            // Horizontal moves (left and right)
            for (let c = col - 1; c >= 0; c--) {
                if (!board[row][c]) {
                    addMove(row, c);
                } else {
                    if (board[row][c][0] !== pieceColor) {
                        addMove(row, c);
                    }
                    break;
                }
            }
            
            for (let c = col + 1; c <= 7; c++) {
                if (!board[row][c]) {
                    addMove(row, c);
                } else {
                    if (board[row][c][0] !== pieceColor) {
                        addMove(row, c);
                    }
                    break;
                }
            }
            
            // Vertical moves (up and down)
            for (let r = row - 1; r >= 0; r--) {
                if (!board[r][col]) {
                    addMove(r, col);
                } else {
                    if (board[r][col][0] !== pieceColor) {
                        addMove(r, col);
                    }
                    break;
                }
            }
            
            for (let r = row + 1; r <= 7; r++) {
                if (!board[r][col]) {
                    addMove(r, col);
                } else {
                    if (board[r][col][0] !== pieceColor) {
                        addMove(r, col);
                    }
                    break;
                }
            }
        }
        
        // Bishop moves (diagonals)
        if (pieceType === 'B' || pieceType === 'Q') {
            // Diagonal: top-left
            for (let r = row - 1, c = col - 1; r >= 0 && c >= 0; r--, c--) {
                if (!board[r][c]) {
                    addMove(r, c);
                } else {
                    if (board[r][c][0] !== pieceColor) {
                        addMove(r, c);
                    }
                    break;
                }
            }
            
            // Diagonal: top-right
            for (let r = row - 1, c = col + 1; r >= 0 && c <= 7; r--, c++) {
                if (!board[r][c]) {
                    addMove(r, c);
                } else {
                    if (board[r][c][0] !== pieceColor) {
                        addMove(r, c);
                    }
                    break;
                }
            }
            
            // Diagonal: bottom-left
            for (let r = row + 1, c = col - 1; r <= 7 && c >= 0; r++, c--) {
                if (!board[r][c]) {
                    addMove(r, c);
                } else {
                    if (board[r][c][0] !== pieceColor) {
                        addMove(r, c);
                    }
                    break;
                }
            }
            
            // Diagonal: bottom-right
            for (let r = row + 1, c = col + 1; r <= 7 && c <= 7; r++, c++) {
                if (!board[r][c]) {
                    addMove(r, c);
                } else {
                    if (board[r][c][0] !== pieceColor) {
                        addMove(r, c);
                    }
                    break;
                }
            }
        }
        
        // Knight moves (L-shape)
        if (pieceType === 'N') {
            const knightMoves = [
                {r: row - 2, c: col - 1}, {r: row - 2, c: col + 1},
                {r: row - 1, c: col - 2}, {r: row - 1, c: col + 2},
                {r: row + 1, c: col - 2}, {r: row + 1, c: col + 2},
                {r: row + 2, c: col - 1}, {r: row + 2, c: col + 1}
            ];
            
            for (const move of knightMoves) {
                addMove(move.r, move.c);
            }
        }
        
        // King moves (one square in any direction)
        if (pieceType === 'K') {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r === row && c === col) continue;
                    addMove(r, c);
                }
            }
            
            // Castling
            if (castlingRights[pieceColor]) {
                // King must be in its initial position
                const kingRow = pieceColor === 'w' ? 7 : 0;
                if (row === kingRow && col === 4) {
                    // Check kingside castling
                    if (castlingRights[pieceColor].kingSide &&
                        !board[kingRow][5] && !board[kingRow][6] &&
                        !isSquareAttacked(kingRow, 4, pieceColor) &&
                        !isSquareAttacked(kingRow, 5, pieceColor) &&
                        !isSquareAttacked(kingRow, 6, pieceColor)) {
                        
                        validMoves.push({ row: kingRow, col: 6, castling: 'kingside' });
                    }
                    
                    // Check queenside castling
                    if (castlingRights[pieceColor].queenSide &&
                        !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] &&
                        !isSquareAttacked(kingRow, 4, pieceColor) &&
                        !isSquareAttacked(kingRow, 3, pieceColor) &&
                        !isSquareAttacked(kingRow, 2, pieceColor)) {
                        
                        validMoves.push({ row: kingRow, col: 2, castling: 'queenside' });
                    }
                }
            }
        }
        
        // Filter out moves that would put or leave the king in check
        return validMoves.filter(move => !wouldBeInCheck(row, col, move.row, move.col, pieceColor));
    }
    
    // Check if a square is under attack by the opponent
    function isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'w' ? 'b' : 'w';
        
        // Check for attacks by pawns
        const pawnDirection = attackingColor === 'w' ? -1 : 1;
        const pawnRow = row + pawnDirection;
        
        if (pawnRow >= 0 && pawnRow <= 7) {
            // Left diagonal
            if (col - 1 >= 0 && board[pawnRow][col - 1] === `${attackingColor}P`) {
                return true;
            }
            // Right diagonal
            if (col + 1 <= 7 && board[pawnRow][col + 1] === `${attackingColor}P`) {
                return true;
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
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && board[r][c] === `${attackingColor}N`) {
                return true;
            }
        }
        
        // Check for attacks by king
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r === row && c === col) continue;
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && board[r][c] === `${attackingColor}K`) {
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
                if (board[r][c]) {
                    if (board[r][c] === `${attackingColor}R` || board[r][c] === `${attackingColor}Q`) {
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
                if (board[r][c]) {
                    if (board[r][c] === `${attackingColor}B` || board[r][c] === `${attackingColor}Q`) {
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
    
    // Check if making a move would leave the king in check
    function wouldBeInCheck(fromRow, fromCol, toRow, toCol, color) {
        // Make a temporary copy of the board
        const tempBoard = board.map(row => [...row]);
        
        // Temporarily make the move
        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = null;
        
        // Find the king
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
        
        // Check if the king is attacked on the temporary board
        const oppColor = color === 'w' ? 'b' : 'w';
        
        // Check pawn attacks
        const pawnDir = oppColor === 'w' ? -1 : 1;
        if (kingRow + pawnDir >= 0 && kingRow + pawnDir <= 7) {
            if (kingCol - 1 >= 0 && tempBoard[kingRow + pawnDir][kingCol - 1] === `${oppColor}P`) {
                return true;
            }
            if (kingCol + 1 <= 7 && tempBoard[kingRow + pawnDir][kingCol + 1] === `${oppColor}P`) {
                return true;
            }
        }
        
        // Check knight attacks
        const knightMoves = [
            {r: kingRow - 2, c: kingCol - 1}, {r: kingRow - 2, c: kingCol + 1},
            {r: kingRow - 1, c: kingCol - 2}, {r: kingRow - 1, c: kingCol + 2},
            {r: kingRow + 1, c: kingCol - 2}, {r: kingRow + 1, c: kingCol + 2},
            {r: kingRow + 2, c: kingCol - 1}, {r: kingRow + 2, c: kingCol + 1}
        ];
        
        for (const move of knightMoves) {
            const r = move.r;
            const c = move.c;
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && tempBoard[r][c] === `${oppColor}N`) {
                return true;
            }
        }
        
        // Check king proximity
        for (let r = kingRow - 1; r <= kingRow + 1; r++) {
            for (let c = kingCol - 1; c <= kingCol + 1; c++) {
                if (r === kingRow && c === kingCol) continue;
                if (r >= 0 && r <= 7 && c >= 0 && c <= 7 && tempBoard[r][c] === `${oppColor}K`) {
                    return true;
                }
            }
        }
        
        // Check rook and queen attacks (horizontal and vertical)
        const lines = [
            {dr: -1, dc: 0}, // up
            {dr: 1, dc: 0},  // down
            {dr: 0, dc: -1}, // left
            {dr: 0, dc: 1}   // right
        ];
        
        for (const dir of lines) {
            let r = kingRow + dir.dr;
            let c = kingCol + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (tempBoard[r][c]) {
                    if (tempBoard[r][c] === `${oppColor}R` || tempBoard[r][c] === `${oppColor}Q`) {
                        return true;
                    }
                    break;
                }
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // Check bishop and queen attacks (diagonals)
        const diagonals = [
            {dr: -1, dc: -1}, // top-left
            {dr: -1, dc: 1},  // top-right
            {dr: 1, dc: -1},  // bottom-left
            {dr: 1, dc: 1}    // bottom-right
        ];
        
        for (const dir of diagonals) {
            let r = kingRow + dir.dr;
            let c = kingCol + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                if (tempBoard[r][c]) {
                    if (tempBoard[r][c] === `${oppColor}B` || tempBoard[r][c] === `${oppColor}Q`) {
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

    // Make a move on the board
    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        const pieceType = piece[1];
        const pieceColor = piece[0];
        const isCapture = board[toRow][toCol] !== null;
        
        // Store the last move
        lastMove = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece
        };
        
        // Special moves handling
        let isEnPassant = false;
        
        // Handle castling
        if (pieceType === 'K') {
            // Update castling rights
            castlingRights[pieceColor].kingSide = false;
            castlingRights[pieceColor].queenSide = false;
            
            // Handle kingside castling
            if (fromCol === 4 && toCol === 6) {
                // Move the rook from h1/h8 to f1/f8
                const rookRow = pieceColor === 'w' ? 7 : 0;
                board[rookRow][5] = board[rookRow][7];
                board[rookRow][7] = null;
                lastMove.castling = 'kingside';
            }
            // Handle queenside castling
            else if (fromCol === 4 && toCol === 2) {
                // Move the rook from a1/a8 to d1/d8
                const rookRow = pieceColor === 'w' ? 7 : 0;
                board[rookRow][3] = board[rookRow][0];
                board[rookRow][0] = null;
                lastMove.castling = 'queenside';
            }
        }
        
        // Update castling rights if a rook moves
        if (pieceType === 'R') {
            const rookRow = pieceColor === 'w' ? 7 : 0;
            if (fromRow === rookRow) {
                if (fromCol === 0) {
                    castlingRights[pieceColor].queenSide = false;
                } else if (fromCol === 7) {
                    castlingRights[pieceColor].kingSide = false;
                }
            }
        }
        
        // Update castling rights if a rook is captured
        if (isCapture && board[toRow][toCol]) {
            const capturedPiece = board[toRow][toCol];
            const capturedType = capturedPiece[1];
            const capturedColor = capturedPiece[0];
            
            if (capturedType === 'R') {
                const rookRow = capturedColor === 'w' ? 7 : 0;
                if (toRow === rookRow) {
                    if (toCol === 0) {
                        castlingRights[capturedColor].queenSide = false;
                    } else if (toCol === 7) {
                        castlingRights[capturedColor].kingSide = false;
                    }
                }
            }
        }
        
        // Handle en passant capture
        if (pieceType === 'P' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
            // Remove the pawn that was captured en passant
            const passantPawnRow = pieceColor === 'w' ? toRow + 1 : toRow - 1;
            board[passantPawnRow][toCol] = null;
            isEnPassant = true;
            lastMove.enPassant = true;
        }
        
        // Reset en passant target
        enPassantTarget = null;
        
        // Set en passant target if a pawn moves two squares
        if (pieceType === 'P' && Math.abs(fromRow - toRow) === 2) {
            enPassantTarget = {
                row: pieceColor === 'w' ? fromRow - 1 : fromRow + 1,
                col: fromCol
            };
        }
        
        // Move the piece
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = null;
        
        // Check for pawn promotion (simplified - auto queen)
        if (pieceType === 'P' && (toRow === 0 || toRow === 7)) {
            board[toRow][toCol] = `${pieceColor}Q`;
            lastMove.promotion = true;
        }
        
        // Update half-move clock for 50-move rule
        if (pieceType === 'P' || isCapture || isEnPassant) {
            halfMoveClock = 0;
        } else {
            halfMoveClock++;
        }
        
        // Update full move number
        if (pieceColor === 'b') {
            fullMoveNumber++;
        }
        
        // Switch turn
        currentTurn = currentTurn === 'w' ? 'b' : 'w';
        
        // Check if the king is in check
        checkStatus = isKingInCheck(currentTurn);
        
        // Redraw the board
        createChessBoard();
    }
    
    // Check if the king of the specified color is in check
    function isKingInCheck(color) {
        // Find the king
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === `${color}K`) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }
        
        // Check if the king's position is under attack
        return isSquareAttacked(kingRow, kingCol, color);
    }

    // Update game information display
    function updateGameInfo() {
        turnInfo.textContent = `${currentTurn === 'w' ? 'White' : 'Black'}'s turn`;
        
        if (checkStatus) {
            gameStatus.textContent = 'Check!';
        } else if (gameOver) {
            gameStatus.textContent = 'Checkmate!';
        } else {
            gameStatus.textContent = '';
        }
    }

    // Check game status (checks for mate, stalemate, etc.)
    function checkGameStatus() {
        // Check if the king is in check
        checkStatus = isKingInCheck(currentTurn);
        
        // Check if the current player has any legal moves
        const hasLegalMoves = doesPlayerHaveLegalMoves(currentTurn);
        
        if (!hasLegalMoves) {
            if (checkStatus) {
                // Checkmate - king is in check and no legal moves
                gameOver = true;
                // Set status info for win by the other player
                const winner = currentTurn === 'w' ? 'Black' : 'White';
                gameStatus.textContent = `Checkmate! ${winner} wins!`;
            } else {
                // Stalemate - not in check but no legal moves
                gameOver = true;
                gameStatus.textContent = 'Stalemate! Game is drawn.';
            }
            return;
        }
        
        // Check for insufficient material (K vs K, K vs KB, K vs KN)
        if (hasInsufficientMaterial()) {
            gameOver = true;
            gameStatus.textContent = 'Draw by insufficient material!';
            return;
        }
        
        // Check for 50-move rule
        if (halfMoveClock >= 100) { // 50 moves = 100 half moves
            gameOver = true;
            gameStatus.textContent = 'Draw by 50-move rule!';
            return;
        }
    }
    
    // Check if a player has any legal moves
    function doesPlayerHaveLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece[0] === color) {
                    const moves = getValidMoves(row, col);
                    if (moves.length > 0) {
                        return true; // Found at least one legal move
                    }
                }
            }
        }
        return false; // No legal moves found
    }
    
    // Check for insufficient material draw
    function hasInsufficientMaterial() {
        // Count the pieces
        let whitePieces = [];
        let blackPieces = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    if (piece[0] === 'w') {
                        whitePieces.push(piece);
                    } else {
                        blackPieces.push(piece);
                    }
                }
            }
        }
        
        // King only vs King only
        if (whitePieces.length === 1 && blackPieces.length === 1) {
            return true;
        }
        
        // King vs King and Bishop
        if ((whitePieces.length === 1 && blackPieces.length === 2 && blackPieces.some(p => p[1] === 'B')) ||
            (blackPieces.length === 1 && whitePieces.length === 2 && whitePieces.some(p => p[1] === 'B'))) {
            return true;
        }
        
        // King vs King and Knight
        if ((whitePieces.length === 1 && blackPieces.length === 2 && blackPieces.some(p => p[1] === 'N')) ||
            (blackPieces.length === 1 && whitePieces.length === 2 && whitePieces.some(p => p[1] === 'N'))) {
            return true;
        }
        
        // King and Bishop vs King and Bishop (same color bishops)
        if (whitePieces.length === 2 && blackPieces.length === 2 &&
            whitePieces.some(p => p[1] === 'B') && blackPieces.some(p => p[1] === 'B')) {
            
            // Find the bishops
            const whiteBishop = whitePieces.find(p => p[1] === 'B');
            const blackBishop = blackPieces.find(p => p[1] === 'B');
            
            if (whiteBishop && blackBishop) {
                // If bishops are on the same color squares
                let whiteBishopSquare = null;
                let blackBishopSquare = null;
                
                // Find the bishop positions
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        if (board[row][col] === whiteBishop) {
                            whiteBishopSquare = { row, col };
                        }
                        if (board[row][col] === blackBishop) {
                            blackBishopSquare = { row, col };
                        }
                    }
                }
                
                if (whiteBishopSquare && blackBishopSquare) {
                    // Check if both bishops are on the same color square
                    const whiteSquareColor = (whiteBishopSquare.row + whiteBishopSquare.col) % 2;
                    const blackSquareColor = (blackBishopSquare.row + blackBishopSquare.col) % 2;
                    
                    if (whiteSquareColor === blackSquareColor) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // Generate share URL with encoded game state
    function generateShareUrl() {
        // Create a more compact board representation
        let boardString = '';
        let emptyCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]) {
                    // If we had empty squares before, add the count first
                    if (emptyCount > 0) {
                        boardString += emptyCount;
                        emptyCount = 0;
                    }
                    
                    // Add piece code: compress 'wP' to just 'P' (uppercase for white)
                    // and 'bP' to 'p' (lowercase for black)
                    const pieceCode = board[row][col];
                    const pieceType = pieceCode[1];
                    const pieceColor = pieceCode[0];
                    
                    boardString += pieceColor === 'w' ? pieceType : pieceType.toLowerCase();
                } else {
                    // Count consecutive empty squares
                    emptyCount++;
                }
            }
            
            // If we're not at the last row, add row separator
            if (row < 7) {
                if (emptyCount > 0) {
                    boardString += emptyCount;
                    emptyCount = 0;
                }
                boardString += '/';
            }
        }
        
        // Add any remaining empty count
        if (emptyCount > 0) {
            boardString += emptyCount;
        }
        
        // Encode turn in a single character
        const turnChar = currentTurn;
        
        // Encode castling rights
        let castlingStr = '';
        if (castlingRights.w.kingSide) castlingStr += 'K';
        if (castlingRights.w.queenSide) castlingStr += 'Q';
        if (castlingRights.b.kingSide) castlingStr += 'k';
        if (castlingRights.b.queenSide) castlingStr += 'q';
        if (castlingStr === '') castlingStr = '-';
        
        // Encode en passant target
        let epStr = '-';
        if (enPassantTarget) {
            const file = 'abcdefgh'.charAt(enPassantTarget.col);
            const rank = 8 - enPassantTarget.row;
            epStr = file + rank;
        }
        
        // Encode last move in a compact format if it exists
        let lastMoveStr = '-';
        if (lastMove) {
            const fromFile = 'abcdefgh'.charAt(lastMove.from.col);
            const fromRank = 8 - lastMove.from.row;
            const toFile = 'abcdefgh'.charAt(lastMove.to.col);
            const toRank = 8 - lastMove.to.row;
            
            lastMoveStr = fromFile + fromRank + toFile + toRank;
            if (lastMove.promotion) lastMoveStr += 'q'; // Simplify to always queen
            if (lastMove.castling) lastMoveStr += lastMove.castling.charAt(0); // 'k' or 'q'
            if (lastMove.enPassant) lastMoveStr += 'e';
        }
        
        // Combine all parts with separators (similar to FEN format)
        const stateStr = `${boardString} ${turnChar} ${castlingStr} ${epStr} ${halfMoveClock} ${fullMoveNumber} ${lastMoveStr}`;
        
        // Use base64url encoding (URL-safe version of base64)
        const encodedState = btoa(stateStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        // Generate a shorter checksum (first 6 chars are usually enough)
        const checksum = generateChecksum(stateStr).substring(0, 6);
        
        // Set URL
        const url = `${window.location.origin}${window.location.pathname}?s=${encodedState}&c=${checksum}`;
        shareUrl.value = url;
        
        // Update email button href
        updateEmailButton(url);
    }
    
    // Update email button with current game URL
    function updateEmailButton(url) {
        const emailButton = document.getElementById('email-button');
        if (emailButton) {
            // Create mailto link with pre-filled subject and body
            const subject = encodeURIComponent("Chess Game - Your Turn");
            const body = encodeURIComponent(`It's your turn in our chess game!\n\n${url}\n\nClick the link to continue the game.`);
            emailButton.href = `mailto:?subject=${subject}&body=${body}`;
        }
    }

    // Generate a simple checksum to validate the state
    function generateChecksum(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    // Parse game state from URL
    function parseGameStateFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedState = urlParams.get('s') || urlParams.get('state'); // Support both formats
        const checksum = urlParams.get('c') || urlParams.get('checksum'); // Support both formats
        
        
        if (!encodedState || !checksum) {
            throw new Error('Missing state or checksum in URL');
        }
        
        try {
            // Decode state - handle the URL-safe base64
            const stateString = atob(encodedState.replace(/-/g, '+').replace(/_/g, '/'));
            
            // Verify checksum
            const calculatedChecksum = generateChecksum(stateString).substring(0, checksum.length);
            
            if (calculatedChecksum !== checksum) {
                throw new Error('Invalid checksum - state may have been tampered with');
            }
            
            // Parse state parts - split by spaces
            const stateParts = stateString.split(' ');
            if (stateParts.length < 6) {
                throw new Error('Invalid state format');
            }
            
            const boardFEN = stateParts[0];
            const turnChar = stateParts[1];
            const castling = stateParts[2];
            const enPassant = stateParts[3];
            halfMoveClock = parseInt(stateParts[4]);
            fullMoveNumber = parseInt(stateParts[5]);
            const lastMoveNotation = stateParts.length > 6 ? stateParts[6] : '-';
            
            // Parse castling rights
            castlingRights = {
                w: { kingSide: castling.includes('K'), queenSide: castling.includes('Q') },
                b: { kingSide: castling.includes('k'), queenSide: castling.includes('q') }
            };
            
            // Parse en passant target
            enPassantTarget = null;
            if (enPassant !== '-') {
                const file = enPassant.charAt(0);
                const rank = enPassant.charAt(1);
                const col = 'abcdefgh'.indexOf(file);
                const row = 8 - parseInt(rank);
                enPassantTarget = { row, col };
            }
            
            // Reconstruct the board from FEN-like notation
            board = Array(8).fill().map(() => Array(8).fill(null));
            let row = 0;
            let col = 0;
            
            const ranks = boardFEN.split('/');
            for (const rank of ranks) {
                col = 0;
                for (let i = 0; i < rank.length; i++) {
                    const char = rank.charAt(i);
                    
                    // If it's a digit, skip that many squares
                    if (/\d/.test(char)) {
                        col += parseInt(char);
                    } else {
                        // Otherwise it's a piece - uppercase is white, lowercase is black
                        const isWhite = char === char.toUpperCase();
                        const pieceType = char.toUpperCase();
                        board[row][col] = `${isWhite ? 'w' : 'b'}${pieceType}`;
                        col++;
                    }
                }
                row++;
                if (row >= 8) break;
            }
            
            // Set current turn
            currentTurn = turnChar;
            
            // Parse last move if available
            lastMove = null;
            if (lastMoveNotation !== '-') {
                // Need at least 4 chars for from/to positions
                if (lastMoveNotation.length >= 4) {
                    const fromFile = lastMoveNotation.charAt(0);
                    const fromRank = lastMoveNotation.charAt(1);
                    const toFile = lastMoveNotation.charAt(2);
                    const toRank = lastMoveNotation.charAt(3);
                    
                    const fromCol = 'abcdefgh'.indexOf(fromFile);
                    const fromRow = 8 - parseInt(fromRank);
                    const toCol = 'abcdefgh'.indexOf(toFile);
                    const toRow = 8 - parseInt(toRank);
                    
                    // Check for flags in the last move notation
                    const hasPromotion = lastMoveNotation.includes('q');
                    const hasCastling = lastMoveNotation.includes('k') || lastMoveNotation.includes('q');
                    const hasEnPassant = lastMoveNotation.includes('e');
                    
                    // Create last move object
                    lastMove = {
                        from: { row: fromRow, col: fromCol },
                        to: { row: toRow, col: toCol },
                        piece: board[toRow][toCol], // Use piece at destination since source is now empty
                        promotion: hasPromotion,
                        enPassant: hasEnPassant
                    };
                    
                    // Add castling info if present
                    if (hasCastling) {
                        lastMove.castling = lastMoveNotation.includes('k') ? 'kingside' : 'queenside';
                    }
                    
                    // Adjust piece type if it was a promotion
                    if (hasPromotion) {
                        const pieceColor = lastMove.piece[0];
                        lastMove.piece = `${pieceColor}P`; // Original piece was a pawn
                    }
                }
            }
            
            // Check for checkmate or check
            checkStatus = isKingInCheck(currentTurn);
            
        } catch (error) {
            console.error('Error parsing state:', error);
            throw error;
        }
    }

    // Copy URL to clipboard
    copyButton.addEventListener('click', () => {
        shareUrl.select();
        document.execCommand('copy');
        
        // Visual feedback
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = 'Copy';
        }, 2000);
    });

    // Continue button to show board again
    continueButton.addEventListener('click', () => {
        showGameSection();
    });

    // New game button
    newGameButton.addEventListener('click', () => {
        if (confirm('Start a new game?')) {
            resetToNewGame();
            initGame(false);
        }
    });
    
    // Check if there's a state in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('s') || urlParams.has('state')) {
        // Hide welcome section, show game with state from URL
        if (welcomeSection) welcomeSection.classList.add('hidden');
        if (newGameButton) newGameButton.parentElement.classList.remove('hidden');
        initGame(true);
    } else {
        // Show welcome section, hide game section and new game button
        if (welcomeSection) welcomeSection.classList.remove('hidden');
        if (gameSection) gameSection.classList.add('hidden');
        if (newGameButton) newGameButton.parentElement.classList.add('hidden');
    }
    
    // Start game button event listener
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            // Show the game and the new game button when starting a game
            if (newGameButton) newGameButton.parentElement.classList.remove('hidden');
            initGame(false);
        });
    }

    // Create email link with pre-filled content
    function createEmailLink() {
        const subject = encodeURIComponent("Chess Game - Your Turn");
        const body = encodeURIComponent(`It's your turn in our chess game!\n\n${shareUrl.value}\n\nClick the link to continue the game.`);
        return `mailto:?subject=${subject}&body=${body}`;
    }
}); 