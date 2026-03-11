# ChessLink

ChessLink is a peer-to-peer real-time chess application built with React, TypeScript, and PeerJS. It allows players to create game rooms and share links to play against each other without the need for a centralized game server.

## Features

- **P2P Multiplayer**: Real-time game synchronization using PeerJS.
- **Room System**: Create a game room and share the URL or QR code with an opponent.
- **Move History**: Track every move made during the game.
- **Game Timer**: Integrated clocks for both players with customizable match settings.
- **Responsive Design**: Built with TailwindCSS for a seamless experience on both desktop and mobile.
- **No Account Required**: Simply open the app, create a room, and start playing.

## Tech Stack

- **Frontend**: [React](https://reactjs.org/) with [TypeScript]
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Networking**: [PeerJS](https://peerjs.com/) (WebRTC)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Codes**: [qrcode.react](https://www.npmjs.com/package/qrcode.react)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chesslink
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

## Project Structure

- `src/components/`: Reusable UI components (ChessBoard, Piece, Timer, etc.).
- `src/hooks/`: Custom React hooks for game logic, timers, and P2P synchronization.
- `src/pages/`: Main application views (HomePage and GamePage).
- `src/utils/`: Helper functions for chess rules and match management.
- `src/types/`: TypeScript interfaces and type definitions.

## License

This project is open-source and available under the MIT License.
