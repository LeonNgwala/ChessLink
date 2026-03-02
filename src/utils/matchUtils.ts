import type { GameState, MatchSettings } from '../types/chess';

const STORAGE_PREFIX = 'chesslink_game_';
const PLAYER_COLOR_PREFIX = 'chesslink_color_';

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getRoomUrl(roomId: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?room=${roomId}`;
}

export function parseRoomFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

export function getPlayerColor(roomId: string): 'w' | 'b' {
  const key = `${PLAYER_COLOR_PREFIX}${roomId}`;
  const stored = localStorage.getItem(key);
  if (stored === 'w' || stored === 'b') return stored;

  // Check if white is already taken
  const whiteKey = `${PLAYER_COLOR_PREFIX}${roomId}_white_taken`;
  const whiteTaken = localStorage.getItem(whiteKey);

  if (!whiteTaken) {
    // First player gets white
    localStorage.setItem(key, 'w');
    localStorage.setItem(whiteKey, 'true');
    return 'w';
  } else {
    // Second player gets black
    localStorage.setItem(key, 'b');
    return 'b';
  }
}

export function saveGameToStorage(
roomId: string,
state: {gameState: GameState;settings: MatchSettings;})
: void {
  try {
    const key = `${STORAGE_PREFIX}${roomId}`;
    localStorage.setItem(key, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {

    // Storage might be full or unavailable
  }}

export function loadGameFromStorage(
roomId: string)
: {gameState: GameState;settings: MatchSettings;} | null {
  try {
    const key = `${STORAGE_PREFIX}${roomId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { gameState: parsed.gameState, settings: parsed.settings };
  } catch {
    return null;
  }
}

export function clearGameFromStorage(roomId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${roomId}`);
  } catch {

    // ignore
  }}