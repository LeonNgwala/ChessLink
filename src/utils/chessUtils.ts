import type {
  BoardTheme,
  PieceColor,
  PieceType,
  TimeControl } from
'../types/chess';

export function squareToCoords(square: string): {row: number;col: number;} {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = 8 - parseInt(square[1]);
  return { row, col };
}

export function coordsToSquare(row: number, col: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = String(8 - row);
  return file + rank;
}

export function getPieceUnicode(type: PieceType, color: PieceColor): string {
  const pieces: Record<PieceColor, Record<PieceType, string>> = {
    w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
    b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
  };
  return pieces[color][type];
}

export function getPieceSymbol(type: PieceType, color: PieceColor): string {
  const symbols: Record<PieceType, string> = {
    k: 'K',
    q: 'Q',
    r: 'R',
    b: 'B',
    n: 'N',
    p: 'P'
  };
  const symbol = symbols[type];
  return color === 'w' ? symbol : symbol.toLowerCase();
}

export interface ThemeColors {
  light: string;
  dark: string;
  highlight: string;
  lastMove: string;
  checkHighlight: string;
}

export const boardThemeColors: Record<BoardTheme, ThemeColors> = {
  classic: {
    light: '#f0d9b5',
    dark: '#b58863',
    highlight: 'rgba(255,255,0,0.5)',
    lastMove: 'rgba(255,255,0,0.25)',
    checkHighlight: 'rgba(255,0,0,0.6)'
  },
  dark: {
    light: '#9e9e9e',
    dark: '#424242',
    highlight: 'rgba(100,200,255,0.5)',
    lastMove: 'rgba(100,200,255,0.25)',
    checkHighlight: 'rgba(255,80,80,0.6)'
  },
  forest: {
    light: '#eeeed2',
    dark: '#769656',
    highlight: 'rgba(255,255,0,0.5)',
    lastMove: 'rgba(255,255,0,0.25)',
    checkHighlight: 'rgba(255,0,0,0.6)'
  },
  ocean: {
    light: '#dee3e6',
    dark: '#8ca2ad',
    highlight: 'rgba(0,200,255,0.5)',
    lastMove: 'rgba(0,200,255,0.25)',
    checkHighlight: 'rgba(255,80,80,0.6)'
  }
};

export const TIME_CONTROLS: TimeControl[] = [
{ minutes: 1, increment: 0, label: '1 min' },
{ minutes: 3, increment: 0, label: '3 min' },
{ minutes: 3, increment: 2, label: '3+2' },
{ minutes: 5, increment: 0, label: '5 min' },
{ minutes: 10, increment: 0, label: '10 min' },
{ minutes: 15, increment: 10, label: '15+10' },
{ minutes: 30, increment: 0, label: '30 min' }];


export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getCapturedPiecesDisplay(pieces: string[]): string {
  return pieces.
  map((p) => {
    const type = p[0] as PieceType;
    const color = p[1] as PieceColor;
    return getPieceUnicode(type, color);
  }).
  join('');
}

export function getMaterialAdvantage(capturedPieces: {
  w: string[];
  b: string[];
}): {w: number;b: number;} {
  const pieceValues: Record<PieceType, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0
  };
  const calcValue = (pieces: string[]) =>
  pieces.reduce((sum, p) => sum + (pieceValues[p[0] as PieceType] || 0), 0);
  const wVal = calcValue(capturedPieces.w);
  const bVal = calcValue(capturedPieces.b);
  return { w: wVal - bVal, b: bVal - wVal };
}