document.addEventListener('DOMContentLoaded', () => {
    // Import the ChessEngine
    const engine = new ChessEngine();
    
    // Make absolutely sure the engine is globally accessible
    window.engine = engine;
    console.log("Chess engine exposed as window.engine:", engine !== undefined);

    // Configuration options with default values
    const config = {
        showShareScreenAfterMove: true, // Set to true to show share screen after each move
        autoRotateBoard: true,           // Set to false to keep the board orientation fixed (white at bottom)
    };

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
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const showShareToggle = document.getElementById('show-share-toggle');
    const autoRotateToggle = document.getElementById('auto-rotate-toggle');

    // UI state
    let selectedSquare = null;
    let possibleMoves = [];

    // Load settings from localStorage
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('chesslink-settings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                // Update config with saved values, keeping defaults for any missing settings
                if (typeof parsedSettings.showShareScreenAfterMove === 'boolean') {
                    config.showShareScreenAfterMove = parsedSettings.showShareScreenAfterMove;
                }
                if (typeof parsedSettings.autoRotateBoard === 'boolean') {
                    config.autoRotateBoard = parsedSettings.autoRotateBoard;
                }
                
                console.log('Settings loaded from localStorage:', config);
            }
            
            // Always update UI toggles with current config values, 
            // whether from localStorage or the default values
            if (showShareToggle) {
                showShareToggle.checked = config.showShareScreenAfterMove;
            }
            if (autoRotateToggle) {
                autoRotateToggle.checked = config.autoRotateBoard;
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
            // Continue with default settings if there was an error
            
            // Still update UI toggles with default config values
            if (showShareToggle) {
                showShareToggle.checked = config.showShareScreenAfterMove;
            }
            if (autoRotateToggle) {
                autoRotateToggle.checked = config.autoRotateBoard;
            }
        }
    }
    
    // Save settings to localStorage
    function saveSettings() {
        try {
            localStorage.setItem('chesslink-settings', JSON.stringify(config));
            console.log('Settings saved to localStorage:', config);
        } catch (error) {
            console.error('Error saving settings to localStorage:', error);
        }
    }

    // Initialize the game
    function initGame(loadFromUrl = false) {
        // Load user settings first
        loadSettings();
        
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
                engine.resetGame();
            }
        } else {
            // Start a new game
            engine.resetGame();
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
        
        // Get current game state
        const gameState = engine.getGameState();
        
        // Determine if board should be rotated
        // If autoRotateBoard is true, rotate based on currentTurn
        // If autoRotateBoard is false, always show white at bottom (like standard board)
        const isRotated = config.autoRotateBoard ? gameState.currentTurn === 'b' : false;
        
        // Add file labels (adjust based on current turn)
        const fileOrder = isRotated ? [...files].reverse() : [...files];
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
        const rankOrder = isRotated ? [...ranks].reverse() : [...ranks];
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
        
        // Determine the order of rows and columns based on board orientation
        const rowOrder = Array.from({ length: 8 }, (_, i) => isRotated ? 7 - i : i);
        const colOrder = Array.from({ length: 8 }, (_, i) => isRotated ? 7 - i : i);
        
        // Create squares with pieces
        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                // Get actual row/col from the board array based on perspective
                const actualRow = rowOrder[displayRow];
                const actualCol = colOrder[displayCol];
                
                const square = document.createElement('div');
                square.className = `square ${(actualRow + actualCol) % 2 === 0 ? 'white' : 'black'}`;
                
                // Check if this square is part of the last move
                if (gameState.lastMove) {
                    if (actualRow === gameState.lastMove.from.row && actualCol === gameState.lastMove.from.col) {
                        square.classList.add('last-move-from');
                    }
                    if (actualRow === gameState.lastMove.to.row && actualCol === gameState.lastMove.to.col) {
                        square.classList.add('last-move-to');
                    }
                }
                
                square.dataset.row = actualRow;
                square.dataset.col = actualCol;
                
                // Add piece if there is one
                if (gameState.board[actualRow][actualCol]) {
                    const piece = document.createElement('div');
                    const pieceCode = gameState.board[actualRow][actualCol];
                    const pieceColor = pieceCode[0]; // 'w' or 'b'
                    
                    // Add color-specific class to the piece
                    piece.className = `piece ${pieceColor === 'w' ? 'white-piece' : 'black-piece'}`;
                    piece.textContent = engine.PIECES[pieceCode];
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
        const gameState = engine.getGameState();
        if (gameState.gameOver) return;
        
        const square = event.currentTarget;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // If a square is already selected
        if (selectedSquare) {
            const selectedRow = parseInt(selectedSquare.dataset.row);
            const selectedCol = parseInt(selectedSquare.dataset.col);
            
            // If clicking on a possible move
            if (possibleMoves.some(move => move.row === row && move.col === col)) {
                // Make the move
                engine.makeMove(selectedRow, selectedCol, row, col);
                clearHighlights();
                selectedSquare = null;
                possibleMoves = [];
                
                // Update UI
                updateGameInfo();
                
                // Generate new URL with updated state and update browser URL
                generateShareUrl();
                
                // Check if game is over
                const updatedState = engine.getGameState();
                if (updatedState.gameOver) {
                    displayGameEndMessage(updatedState);
                    // Always show share screen on game over
                    gameSection.classList.add('hidden');
                    shareSection.classList.remove('hidden');
                } else if (config.showShareScreenAfterMove) {
                    // Only show share screen if configured to do so
                    gameSection.classList.add('hidden');
                    shareSection.classList.remove('hidden');
                }
            } else {
                // If clicking on another square, update selection
                clearHighlights();
                
                // If clicking own piece, select it
                if (gameState.board[row][col] && gameState.board[row][col][0] === gameState.currentTurn) {
                    selectedSquare = square;
                    highlightSquare(square);
                    showPossibleMoves(row, col);
                } else {
                    selectedSquare = null;
                    possibleMoves = [];
                }
            }
        } else {
            // If selecting a square for the first time
            if (gameState.board[row][col] && gameState.board[row][col][0] === gameState.currentTurn) {
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
        possibleMoves = engine.getValidMoves(row, col);
        const gameState = engine.getGameState();
        const piece = gameState.board[row][col];
        
        // Add debug message for en passant situations
        if (gameState.enPassantTarget) {
            console.log("En passant debugging:");
            console.log("- Selected piece:", piece, "at position:", row, col);
            console.log("- En passant target:", gameState.enPassantTarget);
            console.log("- Valid moves:", possibleMoves);
        }
        
        // Check each move to determine its type
        for (const move of possibleMoves) {
            const square = getSquareElement(move.row, move.col);
            
            // Is this move an en passant capture?
            let isEnPassantMove = false;
            
            // The key simplification: if there's an enPassantTarget and a pawn's move
            // matches exactly that target position, it MUST be an en passant capture
            if (gameState.enPassantTarget && 
                piece && piece[1] === 'P' &&
                move.row === gameState.enPassantTarget.row && 
                move.col === gameState.enPassantTarget.col) {
                
                isEnPassantMove = true;
                console.log("Found en passant move to", move.row, move.col);
            }
            
            // Apply appropriate highlight
            if (isEnPassantMove) {
                square.classList.add('en-passant-capture');
            } else if (gameState.board[move.row][move.col]) {
                // Regular capture
                square.classList.add('possible-capture');
            } else {
                // Regular move
                square.classList.add('possible-move');
            }
        }
    }

    // Also expose this function globally for debugging purposes
    window.showPossibleMoves = showPossibleMoves;

    // Get a square element by row and column
    function getSquareElement(row, col) {
        return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    }

    // Clear all highlights
    function clearHighlights() {
        document.querySelectorAll('.highlighted, .possible-move, .possible-capture, .en-passant-capture').forEach(el => {
            el.classList.remove('highlighted', 'possible-move', 'possible-capture', 'en-passant-capture');
        });
    }

    // Update game information display
    function updateGameInfo() {
        const gameState = engine.getGameState();
        
        turnInfo.textContent = `${gameState.currentTurn === 'w' ? 'White' : 'Black'}'s turn`;
        
        if (gameState.checkStatus) {
            gameStatus.textContent = 'Check!';
        } else if (gameState.gameOver) {
            displayGameEndMessage(gameState);
        } else {
            gameStatus.textContent = '';
        }
        
        // Recreate the board to update piece positions
        createChessBoard();
    }

    // Display game end message
    function displayGameEndMessage(gameState) {
        if (gameState.gameResultReason === 'checkmate') {
            const winner = gameState.gameResult;
            gameStatus.textContent = `Checkmate! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
        } else if (gameState.gameResultReason === 'stalemate') {
            gameStatus.textContent = 'Stalemate! Game is drawn.';
        } else if (gameState.gameResultReason === 'insufficient_material') {
            gameStatus.textContent = 'Draw by insufficient material!';
        } else if (gameState.gameResultReason === 'fifty_move_rule') {
            gameStatus.textContent = 'Draw by 50-move rule!';
        }
    }

    // Generate share URL with encoded game state
    function generateShareUrl() {
        // Create a more compact board representation
        const gameState = engine.getGameState();
        let boardString = '';
        let emptyCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (gameState.board[row][col]) {
                    // If we had empty squares before, add the count first
                    if (emptyCount > 0) {
                        boardString += emptyCount;
                        emptyCount = 0;
                    }
                    
                    // Add piece code: compress 'wP' to just 'P' (uppercase for white)
                    // and 'bP' to 'p' (lowercase for black)
                    const pieceCode = gameState.board[row][col];
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
        const turnChar = gameState.currentTurn;
        
        // Encode castling rights
        let castlingStr = '';
        if (gameState.castlingRights.w.kingSide) castlingStr += 'K';
        if (gameState.castlingRights.w.queenSide) castlingStr += 'Q';
        if (gameState.castlingRights.b.kingSide) castlingStr += 'k';
        if (gameState.castlingRights.b.queenSide) castlingStr += 'q';
        if (castlingStr === '') castlingStr = '-';
        
        // Encode en passant target
        let epStr = '-';
        if (gameState.enPassantTarget) {
            const file = 'abcdefgh'.charAt(gameState.enPassantTarget.col);
            const rank = 8 - gameState.enPassantTarget.row;
            epStr = file + rank;
        }
        
        // Encode last move in a compact format if it exists
        let lastMoveStr = '-';
        if (gameState.lastMove) {
            const fromFile = 'abcdefgh'.charAt(gameState.lastMove.from.col);
            const fromRank = 8 - gameState.lastMove.from.row;
            const toFile = 'abcdefgh'.charAt(gameState.lastMove.to.col);
            const toRank = 8 - gameState.lastMove.to.row;
            
            lastMoveStr = fromFile + fromRank + toFile + toRank;
            if (gameState.lastMove.promotion) lastMoveStr += 'q'; // Simplify to always queen
            if (gameState.lastMove.castling) lastMoveStr += gameState.lastMove.castling.charAt(0); // 'k' or 'q'
            if (gameState.lastMove.enPassant) lastMoveStr += 'e';
        }
        
        // Combine all parts with separators (similar to FEN format)
        const stateStr = `${boardString} ${turnChar} ${castlingStr} ${epStr} ${gameState.halfMoveClock} ${gameState.fullMoveNumber} ${lastMoveStr}`;
        
        // Use base64url encoding (URL-safe version of base64)
        const encodedState = btoa(stateStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        // Generate a shorter checksum (first 6 chars are usually enough)
        const checksum = generateChecksum(stateStr).substring(0, 6);
        
        // Set URL
        const url = `${window.location.origin}${window.location.pathname}?s=${encodedState}&c=${checksum}`;
        shareUrl.value = url;
        
        // Update the browser's URL without reloading the page
        const urlWithoutOrigin = `${window.location.pathname}?s=${encodedState}&c=${checksum}`;
        window.history.replaceState({}, document.title, urlWithoutOrigin);
        
        // Update email button href
        updateEmailButton(url);
        
        return url;
    }
    
    // Update email button with current game URL
    function updateEmailButton(url) {
        const emailButton = document.getElementById('email-button');
        if (emailButton) {
            // Create mailto link with pre-filled subject and body
            const subject = encodeURIComponent("ChessLink - Your Turn");
            const body = encodeURIComponent(`It's your turn in our ChessLink game!\n\n${url}\n\nClick the link to continue the game.`);
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
            const halfMoveClock = parseInt(stateParts[4]);
            const fullMoveNumber = parseInt(stateParts[5]);
            const lastMoveNotation = stateParts.length > 6 ? stateParts[6] : '-';
            
            // Parse castling rights
            const castlingRights = {
                w: { kingSide: castling.includes('K'), queenSide: castling.includes('Q') },
                b: { kingSide: castling.includes('k'), queenSide: castling.includes('q') }
            };
            
            // Parse en passant target
            let enPassantTarget = null;
            if (enPassant !== '-') {
                const file = enPassant.charAt(0);
                const rank = enPassant.charAt(1);
                const col = 'abcdefgh'.indexOf(file);
                const row = 8 - parseInt(rank);
                enPassantTarget = { row, col };
            }
            
            // Reconstruct the board from FEN-like notation
            const board = Array(8).fill().map(() => Array(8).fill(null));
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
            
            // Parse last move if available
            let lastMove = null;
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
            
            // Set up the engine with parsed state
            const options = {
                currentTurn: turnChar,
                castlingRights: castlingRights,
                enPassantTarget: enPassantTarget,
                halfMoveClock: halfMoveClock, 
                fullMoveNumber: fullMoveNumber,
                lastMove: lastMove
            };
            
            engine.setPosition(board, options);
            
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
            engine.resetGame();
            initGame(false);
        }
    });
    
    // Settings button toggle
    if (settingsButton && settingsPanel) {
        settingsButton.addEventListener('click', () => {
            settingsPanel.classList.toggle('hidden');
        });
        
        // Close settings when clicking outside
        document.addEventListener('click', (event) => {
            if (!settingsButton.contains(event.target) && !settingsPanel.contains(event.target)) {
                settingsPanel.classList.add('hidden');
            }
        });
    }
    
    // Settings toggle handlers
    if (showShareToggle) {
        // Initialize toggle based on config - moved to loadSettings()
        
        // Handle toggle change
        showShareToggle.addEventListener('change', () => {
            config.showShareScreenAfterMove = showShareToggle.checked;
            saveSettings(); // Save settings when changed
        });
    }
    
    if (autoRotateToggle) {
        // Initialize toggle based on config - moved to loadSettings()
        
        // Handle toggle change
        autoRotateToggle.addEventListener('change', () => {
            config.autoRotateBoard = autoRotateToggle.checked;
            saveSettings(); // Save settings when changed
            // Immediately redraw the board to apply the change
            createChessBoard();
        });
    }

    // Load settings before checking URL parameters
    loadSettings();

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
        const subject = encodeURIComponent("ChessLink - Your Turn");
        const body = encodeURIComponent(`It's your turn in our ChessLink game!\n\n${shareUrl.value}\n\nClick the link to continue the game.`);
        return `mailto:?subject=${subject}&body=${body}`;
    }
}); 