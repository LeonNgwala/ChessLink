import React from 'react';
import { parseRoomFromUrl } from './utils/matchUtils';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
export function App() {
  const roomId = parseRoomFromUrl();
  if (roomId) {
    return <GamePage roomId={roomId} />;
  }
  return <HomePage />;
}