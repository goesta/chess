const ChessEngine = require('./chess-engine');

describe('ChessEngine - Basic functionality', () => {
  let engine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  test('should initialize board correctly', () => {
    const initialState = engine.getGameState();
    
    // Check board dimensions
    expect(initialState.board.length).toBe(8);
    initialState.board.forEach(row => {
      expect(row.length).toBe(8);
    });
    
    // Check specific pieces
    expect(initialState.board[0][0]).toBe('bR'); // Black rook
    expect(initialState.board[0][4]).toBe('bK'); // Black king
    expect(initialState.board[7][4]).toBe('wK'); // White king
    expect(initialState.board[1][0]).toBe('bP'); // Black pawn
    expect(initialState.board[6][0]).toBe('wP'); // White pawn
    
    // Check game state
    expect(initialState.currentTurn).toBe('w');
    expect(initialState.gameOver).toBe(false);
    expect(initialState.checkStatus).toBe(false);
  });

  test('should identify valid pawn moves', () => {
    // White pawn can move 1 or 2 squares from starting position
    const whitePawnMoves = engine.getValidMoves(6, 0);
    expect(whitePawnMoves).toContainEqual({ row: 5, col: 0 });
    expect(whitePawnMoves).toContainEqual({ row: 4, col: 0 });
    expect(whitePawnMoves.length).toBe(2);
    
    // Black pawn can move 1 or 2 squares from starting position
    engine.currentTurn = 'b';
    const blackPawnMoves = engine.getValidMoves(1, 0);
    expect(blackPawnMoves).toContainEqual({ row: 2, col: 0 });
    expect(blackPawnMoves).toContainEqual({ row: 3, col: 0 });
    expect(blackPawnMoves.length).toBe(2);
  });

  test('should correctly identify knight moves', () => {
    // White knight
    const whiteKnightMoves = engine.getValidMoves(7, 1);
    expect(whiteKnightMoves).toContainEqual({ row: 5, col: 0 });
    expect(whiteKnightMoves).toContainEqual({ row: 5, col: 2 });
    expect(whiteKnightMoves.length).toBe(2);
    
    // Move a pawn to open up more knight moves
    engine.makeMove(6, 0, 4, 0);
    const blackKnightMoves = engine.getValidMoves(0, 1);
    expect(blackKnightMoves).toContainEqual({ row: 2, col: 0 });
    expect(blackKnightMoves).toContainEqual({ row: 2, col: 2 });
    expect(blackKnightMoves.length).toBe(2);
  });
});

describe('ChessEngine - Special moves', () => {
  let engine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  // En Passant tests
  describe('En Passant', () => {
    test('should allow en passant capture after pawn double move', () => {
      // Set up a position where en passant is possible
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      // Place a white pawn on e5 (row 3, col 4)
      customBoard[3][4] = 'wP';
      // Place a black pawn on f7 (row 1, col 5)
      customBoard[1][5] = 'bP';
      // Place kings (required for valid position)
      customBoard[7][4] = 'wK';
      customBoard[0][4] = 'bK';
      
      // Set up the position
      engine.setPosition(customBoard, { currentTurn: 'b' });
      
      // Black moves pawn from f7 to f5 (double move next to white pawn)
      engine.makeMove(1, 5, 3, 5);
      
      // Check that en passant target is set correctly
      expect(engine.enPassantTarget).toEqual({ row: 2, col: 5 });
      expect(engine.currentTurn).toBe('w');
      
      // Get valid moves for white pawn on e5
      const whitePawnMoves = engine.getValidMoves(3, 4);
      console.log('En passant test - whitePawnMoves:', JSON.stringify(whitePawnMoves));
      console.log('En passant target:', JSON.stringify(engine.enPassantTarget));
      
      // It should be able to capture en passant
      const enPassantMove = whitePawnMoves.find(move => 
        move.row === 2 && move.col === 5);
      expect(enPassantMove).toBeTruthy();
      
      // Perform the en passant capture
      engine.makeMove(3, 4, 2, 5);
      
      // Verify the black pawn was captured
      expect(engine.board[3][5]).toBeNull();
      expect(engine.board[2][5]).toBe('wP');
      expect(engine.lastMove.enPassant).toBe(true);
    });

    test('should only allow en passant capture immediately after the double pawn move', () => {
      // Set up a position where en passant is possible
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      customBoard[3][4] = 'wP'; // White pawn on e5
      customBoard[3][6] = 'wP'; // White pawn on g5
      customBoard[1][5] = 'bP'; // Black pawn on f7
      customBoard[7][4] = 'wK'; // Kings
      customBoard[0][4] = 'bK';
      
      engine.setPosition(customBoard, { currentTurn: 'b' });
      
      // Black moves pawn from f7 to f5
      engine.makeMove(1, 5, 3, 5);
      
      // White makes a different move instead of capturing en passant
      engine.makeMove(3, 6, 2, 6); // White pawn from g5 to g6
      
      // Black makes any move
      engine.makeMove(0, 4, 0, 3); // Move the king
      
      // Now try to capture en passant with the e5 pawn - should not be possible
      const whitePawnMoves = engine.getValidMoves(3, 4);
      
      // En passant capture should not be among valid moves
      const enPassantMove = whitePawnMoves.find(move => 
        move.row === 2 && move.col === 5);
      expect(enPassantMove).toBeFalsy();
    });
  });

  // Castling tests
  describe('Castling', () => {
    test('should allow kingside castling when path is clear', () => {
      // Set up a position where kingside castling is possible
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Place white king and rook in starting positions
      customBoard[7][4] = 'wK';
      customBoard[7][7] = 'wR';
      // Place black king 
      customBoard[0][4] = 'bK';
      
      // Set up the position, keeping castling rights
      engine.setPosition(customBoard, { 
        currentTurn: 'w',
        castlingRights: { 
          w: { kingSide: true, queenSide: false }, 
          b: { kingSide: false, queenSide: false } 
        }
      });
      
      // Get valid moves for white king
      const whiteKingMoves = engine.getValidMoves(7, 4);
      
      // Should include kingside castling
      const castlingMove = whiteKingMoves.find(move => 
        move.row === 7 && move.col === 6 && move.castling === 'kingside');
      expect(castlingMove).toBeTruthy();
      
      // Perform castling
      engine.makeMove(7, 4, 7, 6);
      
      // Verify king and rook positions after castling
      expect(engine.board[7][6]).toBe('wK');
      expect(engine.board[7][5]).toBe('wR');
      expect(engine.board[7][4]).toBeNull();
      expect(engine.board[7][7]).toBeNull();
      expect(engine.lastMove.castling).toBe('kingside');
    });

    test('should allow queenside castling when path is clear', () => {
      // Set up a position where queenside castling is possible
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Place white king and rook in starting positions
      customBoard[7][4] = 'wK';
      customBoard[7][0] = 'wR';
      // Place black king 
      customBoard[0][4] = 'bK';
      
      // Set up the position, keeping castling rights
      engine.setPosition(customBoard, { 
        currentTurn: 'w',
        castlingRights: { 
          w: { kingSide: false, queenSide: true }, 
          b: { kingSide: false, queenSide: false } 
        }
      });
      
      // Get valid moves for white king
      const whiteKingMoves = engine.getValidMoves(7, 4);
      
      // Should include queenside castling
      const castlingMove = whiteKingMoves.find(move => 
        move.row === 7 && move.col === 2 && move.castling === 'queenside');
      expect(castlingMove).toBeTruthy();
      
      // Perform castling
      engine.makeMove(7, 4, 7, 2);
      
      // Verify king and rook positions after castling
      expect(engine.board[7][2]).toBe('wK');
      expect(engine.board[7][3]).toBe('wR');
      expect(engine.board[7][4]).toBeNull();
      expect(engine.board[7][0]).toBeNull();
      expect(engine.lastMove.castling).toBe('queenside');
    });

    test('should not allow castling through check', () => {
      // Set up a position where castling would pass through check
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Place white king and rook in starting positions
      customBoard[7][4] = 'wK';
      customBoard[7][7] = 'wR';
      
      // Place black rook to attack f1 square (between king and rook)
      customBoard[0][5] = 'bR';
      
      // Place black king
      customBoard[0][4] = 'bK';
      
      // Set up the position
      engine.setPosition(customBoard, { 
        currentTurn: 'w',
        castlingRights: { 
          w: { kingSide: true, queenSide: false }, 
          b: { kingSide: false, queenSide: false } 
        }
      });
      
      // Get valid moves for white king
      const whiteKingMoves = engine.getValidMoves(7, 4);
      
      // Should NOT include kingside castling
      const castlingMove = whiteKingMoves.find(move => 
        move.row === 7 && move.col === 6 && move.castling === 'kingside');
      expect(castlingMove).toBeFalsy();
    });

    test('should not allow castling out of check', () => {
      // Set up a position where the king is in check
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Place white king and rook in starting positions
      customBoard[7][4] = 'wK';
      customBoard[7][7] = 'wR';
      
      // Place black rook to attack the king
      customBoard[4][4] = 'bR';
      
      // Place black king
      customBoard[0][4] = 'bK';
      
      // Set up the position
      engine.setPosition(customBoard, { 
        currentTurn: 'w',
        castlingRights: { 
          w: { kingSide: true, queenSide: false }, 
          b: { kingSide: false, queenSide: false } 
        }
      });
      
      // Get valid moves for white king
      const whiteKingMoves = engine.getValidMoves(7, 4);
      
      // Should NOT include kingside castling
      const castlingMove = whiteKingMoves.find(move => 
        move.row === 7 && move.col === 6 && move.castling === 'kingside');
      expect(castlingMove).toBeFalsy();
    });

    test('should not allow castling after king has moved', () => {
      // Set up a fresh position with castling rights
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Place white king and rook in starting positions
      customBoard[7][4] = 'wK';
      customBoard[7][7] = 'wR';
      
      // Place black king
      customBoard[0][4] = 'bK';
      
      // Set up the position
      engine.setPosition(customBoard, { 
        currentTurn: 'w',
        castlingRights: { 
          w: { kingSide: true, queenSide: false }, 
          b: { kingSide: false, queenSide: false } 
        }
      });
      
      // Move king and then back
      engine.makeMove(7, 4, 7, 5);
      engine.makeMove(0, 4, 0, 5);
      engine.makeMove(7, 5, 7, 4);
      engine.makeMove(0, 5, 0, 4);
      
      // Get valid moves for white king
      const whiteKingMoves = engine.getValidMoves(7, 4);
      
      // Should NOT include kingside castling
      const castlingMove = whiteKingMoves.find(move => 
        move.row === 7 && move.col === 6 && move.castling === 'kingside');
      expect(castlingMove).toBeFalsy();
      
      // Check castling rights were updated
      expect(engine.castlingRights.w.kingSide).toBe(false);
    });
  });

  // Pawn promotion tests
  describe('Pawn Promotion', () => {
    test('should automatically promote pawn to queen when reaching the last rank', () => {
      // Set up a position where pawn promotion is possible
      const customBoard = Array(8).fill().map(() => Array(8).fill(null));
      
      // Place white pawn one step from promotion
      customBoard[1][4] = 'wP';
      
      // Place kings
      customBoard[7][4] = 'wK';
      customBoard[0][0] = 'bK';
      
      // Set up the position
      engine.setPosition(customBoard, { currentTurn: 'w' });
      
      // Move pawn to promotion rank
      engine.makeMove(1, 4, 0, 4);
      
      // Verify pawn was promoted to queen
      expect(engine.board[0][4]).toBe('wQ');
      expect(engine.lastMove.promotion).toBe(true);
    });
  });
});

describe('ChessEngine - Check and Checkmate', () => {
  let engine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  test('should identify when a king is in check', () => {
    // Set up a position with the white king in check
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king
    customBoard[7][4] = 'wK';
    
    // Place black rook giving check
    customBoard[4][4] = 'bR';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // White king should be in check
    expect(engine.checkStatus).toBe(true);
    
    // Get valid moves for white king
    const whiteKingMoves = engine.getValidMoves(7, 4);
    
    // King should have legal moves to escape check
    expect(whiteKingMoves.length).toBeGreaterThan(0);
    
    // All king's moves should get it out of check
    for (const move of whiteKingMoves) {
      // Create a copy of engine to test the move
      const testEngine = new ChessEngine();
      testEngine.setPosition(customBoard, { currentTurn: 'w' });
      
      // Make the move
      testEngine.makeMove(7, 4, move.row, move.col);
      
      // King should no longer be in check
      expect(testEngine.isKingInCheck('w')).toBe(false);
    }
  });

  test('should identify checkmate', () => {
    // Set up a clearer checkmate position - king in corner with nowhere to go
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // White king in corner
    customBoard[7][0] = 'wK';
    
    // Black rooks for checkmate - one gives check, the other covers escape squares
    customBoard[0][0] = 'bR';
    customBoard[1][1] = 'bR';
    
    // Black king
    customBoard[5][5] = 'bK';
    
    // Log the board setup
    console.log('Clearer checkmate board setup:');
    for (let row = 0; row < 8; row++) {
        console.log(`Row ${row}:`, customBoard[row].map(p => p || '--').join(' '));
    }
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Analyze what moves are possible for white king
    console.log('King moves:', JSON.stringify(engine.getValidMoves(7, 0)));
    
    console.log('Checkmate test - checkStatus:', engine.checkStatus);
    console.log('Checkmate test - king in check:', engine.isKingInCheck('w'));
    console.log('Checkmate test - has legal moves:', engine.doesPlayerHaveLegalMoves('w'));
    console.log('Checkmate test - game over:', engine.gameOver);
    console.log('Checkmate test - result:', engine.gameResult);
    
    // White king should be in check
    expect(engine.checkStatus).toBe(true);
    
    // White should have no legal moves
    expect(engine.doesPlayerHaveLegalMoves('w')).toBe(false);
    
    // Game should be over with checkmate
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('black');
    expect(engine.gameResultReason).toBe('checkmate');
  });

  test('should identify stalemate', () => {
    // Set up a stalemate position
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king in a corner
    customBoard[7][0] = 'wK';
    
    // Place black queen and king in positions causing stalemate
    customBoard[5][1] = 'bQ';
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // White king should not be in check
    expect(engine.checkStatus).toBe(false);
    
    // White should have no legal moves
    expect(engine.doesPlayerHaveLegalMoves('w')).toBe(false);
    
    // Game should be over with stalemate
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('draw');
    expect(engine.gameResultReason).toBe('stalemate');
  });
  
  test('should prevent moves that would put or leave own king in check', () => {
    // Set up a position where a piece is pinned to the king
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and bishop
    customBoard[7][4] = 'wK';
    customBoard[6][3] = 'wB'; // Pinned bishop
    
    // Place black rook creating the pin
    customBoard[5][2] = 'bR';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Get valid moves for the pinned bishop
    const bishopMoves = engine.getValidMoves(6, 3);
    console.log('Pinned bishop test - bishopMoves:', JSON.stringify(bishopMoves));
    
    // Verify the moves include capturing the pinning rook and moving along the pin line
    expect(bishopMoves).toContainEqual({ row: 5, col: 2 }); // Capture the rook
    expect(bishopMoves).toContainEqual({ row: 5, col: 4 }); // Move along pin line
  });
});

describe('ChessEngine - Draw conditions', () => {
  let engine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  test('should identify insufficient material draw with kings only', () => {
    // Set up a position with only kings
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place kings
    customBoard[7][4] = 'wK';
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Should be a draw by insufficient material
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('draw');
    expect(engine.gameResultReason).toBe('insufficient_material');
  });

  test('should identify insufficient material draw with king and bishop vs king', () => {
    // Set up a position with king+bishop vs king
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and bishop
    customBoard[7][4] = 'wK';
    customBoard[6][3] = 'wB';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Should be a draw by insufficient material
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('draw');
    expect(engine.gameResultReason).toBe('insufficient_material');
  });

  test('should identify insufficient material draw with king and knight vs king', () => {
    // Set up a position with king+knight vs king
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and knight
    customBoard[7][4] = 'wK';
    customBoard[6][3] = 'wN';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Should be a draw by insufficient material
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('draw');
    expect(engine.gameResultReason).toBe('insufficient_material');
  });

  test('should identify insufficient material with bishops on same color squares', () => {
    // Set up a position with king+bishop vs king+bishop on same color squares
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and bishop on light square
    customBoard[7][4] = 'wK';
    customBoard[7][2] = 'wB'; // Light square bishop
    
    // Place black king and bishop on light square
    customBoard[0][4] = 'bK';
    customBoard[0][2] = 'bB'; // Light square bishop
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    console.log('Same color bishops test - hasInsufficientMaterial:', engine.hasInsufficientMaterial());
    console.log('Same color bishops test - gameOver:', engine.gameOver);
    console.log('Same color bishops test - gameResult:', engine.gameResult);
    
    // Should be a draw by insufficient material
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('draw');
    expect(engine.gameResultReason).toBe('insufficient_material');
  });

  test('should not identify insufficient material with bishops on opposite color squares', () => {
    // Set up a position with king+bishop vs king+bishop on opposite color squares
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and bishop on light square
    customBoard[7][4] = 'wK';
    customBoard[7][2] = 'wB'; // Light square bishop
    
    // Place black king and bishop on dark square
    customBoard[0][4] = 'bK';
    customBoard[0][1] = 'bB'; // Dark square bishop
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    console.log('Opposite color bishops test - hasInsufficientMaterial:', engine.hasInsufficientMaterial());
    console.log('Opposite color bishops test - gameOver:', engine.gameOver);
    console.log('Opposite color bishops test - square colors:',
                'white bishop:', (7+2)%2, 'black bishop:', (0+1)%2);
    
    // Should not be a draw by insufficient material
    expect(engine.gameOver).toBe(false);
  });

  test('should identify 50-move rule draw', () => {
    // Set up a position
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place kings and knights to allow moves but not captures
    customBoard[7][4] = 'wK';
    customBoard[5][5] = 'wN';
    customBoard[0][4] = 'bK';
    customBoard[2][2] = 'bN';
    
    // Set up the position with halfMoveClock at 99
    engine.setPosition(customBoard, { 
      currentTurn: 'w',
      halfMoveClock: 99
    });
    
    // Make one more move to trigger 50-move rule
    engine.makeMove(5, 5, 3, 4);
    
    // Should be a draw by 50-move rule
    expect(engine.gameOver).toBe(true);
    expect(engine.gameResult).toBe('draw');
    expect(engine.gameResultReason).toBe('fifty_move_rule');
  });

  test('should reset 50-move counter after pawn move', () => {
    // Set up a position with a pawn
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place pieces
    customBoard[7][4] = 'wK';
    customBoard[6][0] = 'wP';
    customBoard[0][4] = 'bK';
    
    // Set up the position with halfMoveClock at 40
    engine.setPosition(customBoard, { 
      currentTurn: 'w',
      halfMoveClock: 40
    });
    
    // Make a pawn move
    engine.makeMove(6, 0, 5, 0);
    
    // halfMoveClock should be reset to 0
    expect(engine.halfMoveClock).toBe(0);
  });

  test('should reset 50-move counter after a capture', () => {
    // Set up a position with a capture possible
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place pieces
    customBoard[7][4] = 'wK';
    customBoard[5][5] = 'wR';
    customBoard[0][4] = 'bK';
    customBoard[5][2] = 'bN'; // Knight will be captured
    
    // Set up the position with halfMoveClock at 40
    engine.setPosition(customBoard, { 
      currentTurn: 'w',
      halfMoveClock: 40
    });
    
    // Make a capture
    engine.makeMove(5, 5, 5, 2);
    
    // halfMoveClock should be reset to 0
    expect(engine.halfMoveClock).toBe(0);
  });
}); 