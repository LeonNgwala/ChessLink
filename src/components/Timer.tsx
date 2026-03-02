import React from 'react';
import { formatTime } from '../utils/chessUtils';
import type { PieceColor } from '../types/chess';
interface TimerProps {
  time: number;
  isActive: boolean;
  color: PieceColor;
  playerName: string;
  hasTimeControl: boolean;
}
export function Timer({
  time,
  isActive,
  color,
  playerName,
  hasTimeControl
}: TimerProps) {
  if (!hasTimeControl) return null;
  const isWarning = time < 30 && time > 10;
  const isCritical = time <= 10;
  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-300
        ${isActive ? isCritical ? 'bg-red-900/80 border border-red-500 shadow-lg shadow-red-900/50' : isWarning ? 'bg-yellow-900/60 border border-yellow-600' : 'bg-amber-900/40 border border-amber-600/60' : 'bg-gray-800/60 border border-gray-700/50'}
      `}>

      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color === 'w' ? 'bg-white' : 'bg-gray-900 border border-gray-500'}`} />

        <span
          className={`text-sm font-medium truncate max-w-[100px] ${isActive ? 'text-white' : 'text-gray-400'}`}>

          {playerName || (color === 'w' ? 'White' : 'Black')}
        </span>
      </div>
      <span
        className={`
          font-mono font-bold text-lg tabular-nums
          ${isActive ? isCritical ? 'text-red-300 animate-pulse' : isWarning ? 'text-yellow-300' : 'text-amber-300' : 'text-gray-500'}
        `}>

        {formatTime(time)}
      </span>
    </div>);

}