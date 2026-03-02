export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type BoardTheme = 'classic' | 'dark' | 'forest' | 'ocean';
export type PieceStyle = 'unicode' | 'letters';
export type TimeControl = {minutes: number;increment: number;label: string;};

export interface GameState {
  fen: string;
  pgn: string;
  turn: PieceColor;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  moveHistory: string[];
  capturedPieces: {w: string[];b: string[];};
}

export interface MatchSettings {
  boardTheme: BoardTheme;
  pieceStyle: PieceStyle;
  timeControl: TimeControl | null;
  playerNames: {w: string;b: string;};
}

export interface RoomState {
  roomId: string;
  gameState: GameState;
  settings: MatchSettings;
  playerColor: PieceColor | null;
  connectedPlayers: number;
  lastMove: {from: string;to: string;} | null;
}

export interface TimerState {
  whiteTime: number;
  blackTime: number;
  activeColor: PieceColor;
  isExpired: boolean;
}

export interface BroadcastMessage {
  type:
  'join' |
  'move' |
  'settings' |
  'state' |
  'resign' |
  'draw_offer' |
  'draw_accept' |
  'rematch';
  payload: Record<string, unknown>;
  senderId: string;
  timestamp: number;
}