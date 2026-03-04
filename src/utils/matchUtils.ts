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

export function getRoomUrl(roomId: string, color?: 'w' | 'b'): string {
  const base = window.location.origin + window.location.pathname;
  let url = `${base}?room=${roomId}`;
  if (color) url += `&color=${color}`;
  return url;
}

export function parseRoomFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

export function parseColorFromUrl(): 'w' | 'b' | null {
  const params = new URLSearchParams(window.location.search);
  const color = params.get('color');
  return color === 'w' || color === 'b' ? color : null;
}

export function getPlayerColor(roomId: string): 'w' | 'b' {
  // 1. Check URL first (important for shared links)
  const urlColor = parseColorFromUrl();
  if (urlColor) {
    const key = `${PLAYER_COLOR_PREFIX}${roomId}`;
    localStorage.setItem(key, urlColor);
    return urlColor;
  }

  // 2. Check local storage
  const key = `${PLAYER_COLOR_PREFIX}${roomId}`;
  const stored = localStorage.getItem(key);
  if (stored === 'w' || stored === 'b') return stored;

  // 3. Fallback (default to white for creator if no color specified)
  localStorage.setItem(key, 'w');
  return 'w';
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