# Pin Detection in the Chess Engine

## Overview

Pin detection is a critical part of a chess engine, as it affects the legality of moves. A piece is "pinned" when moving it would expose the king to check. A pinned piece can only move along the line of the pin or capture the pinning piece.

## Implementation Approach

Our implementation uses a general approach that leverages the `wouldBeInCheck` method to determine if a move is valid when a piece is pinned:

```javascript
/**
 * Filter moves to handle pins and prevent leaving the king in check
 */
filterMovesForPinsAndChecks(moves, fromRow, fromCol, color) {
    // Simply filter any move that would leave the king in check
    // This covers all pin scenarios generically
    return moves.filter(move => !this.wouldBeInCheck(fromRow, fromCol, move.row, move.col, color));
}
```

Instead of manually calculating pin directions and valid moves along a pin line, we simulate each potential move on a temporary board and check if the king would be in check after the move. This provides a robust, general solution to pin detection.

## How It Works

1. For each potential move of a piece, the `wouldBeInCheck` method:
   - Creates a temporary copy of the board
   - Makes the move on the temporary board
   - Checks if the king is under attack on the temporary board
   - Returns true if the king would be in check, false otherwise

2. The `filterMovesForPinsAndChecks` method then filters out any moves that would leave the king in check.

## Benefits of This Approach

1. **Simplicity**: The code is much simpler and easier to understand.
2. **Generality**: It handles all pin scenarios without special cases.
3. **Robustness**: It correctly handles complex scenarios like double pins or obscure pin angles.
4. **Maintainability**: Fewer lines of code mean fewer potential bugs.

## Test Cases

The `pin-detection.test.js` file contains test cases for various pin scenarios:

1. **Horizontal Pin**: A white rook pinned by a black rook along a rank
   - The rook can move along the pin line or capture the pinning piece
   - Example: Rook can move to (7,0), (7,1), or (7,3)

2. **Vertical Pin**: A white queen pinned by a black queen along a file
   - The queen can move along the pin line or capture the pinning piece

3. **Diagonal Pin**: A white bishop pinned by a black bishop along a diagonal
   - The bishop can move along the pin line or capture the pinning piece
   - Example: Bishop can move to (5,5) or (4,4)

4. **Knight Limitation**: A knight pinned to the king cannot move at all
   - Since knights move in an "L" shape, they can never stay on the pin line

5. **Pawn Limitation**: A pawn pinned diagonally can only capture along the pin line
   - Example: Pawn can capture at (5,5) but cannot move forward

## Implementation Notes

The pin detection logic is primarily implemented in these methods:
- `filterMovesForPinsAndChecks`: Filters moves that would leave the king in check
- `wouldBeInCheck`: Simulates a move and checks if the king would be in check
- `isSquareAttackedAfterMove`: Checks if a square is under attack on a given board state

This approach is both concise and comprehensive, ensuring that the chess engine correctly handles all pin scenarios without relying on special cases. 