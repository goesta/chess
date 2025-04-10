# [ChessLink: Chess with URL State Sharing](https://goesta.github.io/chess/)
Another AI experiment. I had the idea of a simple serverless chess game with URL sharing capabilities. This is what Claude and I came up with.

A web-based chess application that allows two players to play remotely by sharing URLs, without requiring accounts or server infrastructure.

## How It Works

1. The first player opens the website and gets a fresh chess board with white pieces at the bottom.
2. After making a move, they get a URL with the game state encoded in it.
3. They share this URL with their opponent.
4. The opponent opens the URL, sees the current board state with black pieces at the bottom, makes their move, and gets a new URL.
5. This process continues until the game ends.

## Features

- The board automatically reorients to show the current player's pieces at the bottom
- Each player sees the board from their perspective (white or black)
- Game state is preserved through URL sharing
- Simple, intuitive interface with visual move indicators
- Coordinate labels around the board (a-h, 1-8)

## Security

The game state in the URL is encoded and includes a checksum to detect any tampering or modification.

## Technologies Used

- HTML5, CSS3, JavaScript
- No external dependencies required

## How to Run

Simply open the `index.html` file in a web browser or host it on any web server. 
