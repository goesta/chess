const ChessEngine = require('../scripts/chess-engine');

describe('Pin Detection - Multiple Scenarios', () => {
  let engine;

  beforeEach(() => {
    engine = new ChessEngine();
  });

  test('Horizontal pin: rook pinned by rook', () => {
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and rook
    customBoard[7][4] = 'wK';
    customBoard[7][2] = 'wR'; // Pinned rook
    
    // Place black rook creating the pin
    customBoard[7][0] = 'bR';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Get valid moves for the pinned rook
    const rookMoves = engine.getValidMoves(7, 2);
    console.log('Horizontal pin test - rookMoves:', JSON.stringify(rookMoves));
    
    // Rook can move to 3 squares: capture the rook, block the pin, and move to col 3
    expect(rookMoves.length).toBe(3); 
    expect(rookMoves).toContainEqual({ row: 7, col: 0 }); // Capture the enemy rook
    expect(rookMoves).toContainEqual({ row: 7, col: 1 }); // Move along the pin line
    expect(rookMoves).toContainEqual({ row: 7, col: 3 }); // Move along the pin line in the other direction
  });

  test('Vertical pin: queen pinned by queen', () => {
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and queen
    customBoard[7][4] = 'wK';
    customBoard[5][4] = 'wQ'; // Pinned queen
    
    // Place black queen creating the pin
    customBoard[2][4] = 'bQ';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Get valid moves for the pinned queen
    const queenMoves = engine.getValidMoves(5, 4);
    
    // Queen should only be able to move vertically (same column)
    const verticalMoves = queenMoves.filter(move => move.col === 4);
    expect(verticalMoves.length).toBe(4); // Can move to rows 3, 4, 6, and capture the black queen
    expect(queenMoves).toContainEqual({ row: 2, col: 4 }); // Capture the enemy queen
  });

  test('Diagonal pin: bishop pinned by bishop', () => {
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and bishop
    customBoard[7][7] = 'wK';
    customBoard[6][6] = 'wB'; // Pinned bishop
    
    // Place black bishop creating the pin
    customBoard[4][4] = 'bB';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Get valid moves for the pinned bishop
    const bishopMoves = engine.getValidMoves(6, 6);
    console.log('Diagonal pin test - bishopMoves:', JSON.stringify(bishopMoves));
    
    // Bishop can only move along the diagonal
    expect(bishopMoves).toContainEqual({ row: 5, col: 5 }); // Move along pin line
    expect(bishopMoves).toContainEqual({ row: 4, col: 4 }); // Capture the enemy bishop
  });

  test('Knight completely immobilized by pin', () => {
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and knight
    customBoard[7][4] = 'wK';
    customBoard[6][4] = 'wN'; // Pinned knight
    
    // Place black rook creating the pin
    customBoard[4][4] = 'bR';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Get valid moves for the pinned knight
    const knightMoves = engine.getValidMoves(6, 4);
    
    // Knight should have no legal moves when pinned
    expect(knightMoves.length).toBe(0); // Knights can't move along a pin line
  });

  test('Pawn limited by diagonal pin', () => {
    const customBoard = Array(8).fill().map(() => Array(8).fill(null));
    
    // Place white king and pawn
    customBoard[7][7] = 'wK';
    customBoard[6][6] = 'wP'; // Pinned pawn
    
    // Place black bishop creating the pin
    customBoard[5][5] = 'bB';
    
    // Place black king
    customBoard[0][4] = 'bK';
    
    // Set up the position
    engine.setPosition(customBoard, { currentTurn: 'w' });
    
    // Get valid moves for the pinned pawn
    const pawnMoves = engine.getValidMoves(6, 6);
    
    // Pawn should only be able to capture the bishop
    expect(pawnMoves.length).toBe(1); // Can only capture the pinning bishop
    expect(pawnMoves).toContainEqual({ row: 5, col: 5 }); // Capture the enemy bishop
  });
}); 