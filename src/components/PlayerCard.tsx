import React from 'react';
import type { PieceColor } from '../types/chess';
import { getPieceUnicode } from '../utils/chessUtils';
import type { PieceType } from '../types/chess';
interface PlayerCardProps {
  name: string;
  color: PieceColor;
  capturedPieces: string[];
  isActive: boolean;
  materialAdvantage: number;
}
export function PlayerCard({
  name,
  color,
  capturedPieces,
  isActive,
  materialAdvantage
}: PlayerCardProps) {
  const displayName = name || (color === 'w' ? 'White' : 'Black');
  const capturedDisplay = capturedPieces.map((p, i) => {
    const type = p[0] as PieceType;
    const pieceColor = p[1] as PieceColor;
    return (
      <span key={i} className="text-sm leading-none opacity-80">
        {getPieceUnicode(type, pieceColor)}
      </span>);

  });
  return (
    <div
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive ? 'bg-gray-800/80 border border-amber-600/40' : 'bg-gray-900/60 border border-gray-800/60'}
      `}>

      {/* Color indicator */}
      <div
        className={`
          w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-base
          ${color === 'w' ? 'bg-white shadow-sm' : 'bg-gray-900 border-2 border-gray-600'}
        `}>

        <span
          style={{
            fontSize: '14px'
          }}>

          {getPieceUnicode('k', color)}
        </span>
      </div>

      {/* Name and captured */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>

            {displayName}
          </span>
          {isActive &&
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          }
        </div>
        {capturedDisplay.length > 0 &&
        <div className="flex flex-wrap gap-0 mt-0.5">
            {capturedDisplay}
            {materialAdvantage > 0 &&
          <span className="text-xs text-gray-500 ml-1">
                +{materialAdvantage}
              </span>
          }
          </div>
        }
      </div>
    </div>);

}