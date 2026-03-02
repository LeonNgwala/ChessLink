import React from 'react';
import { PieceType, PieceColor, PieceStyle } from '../types/chess';
import { getPieceUnicode, getPieceSymbol } from '../utils/chessUtils';
interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  style: PieceStyle;
  size?: number;
  isDragging?: boolean;
}
export function ChessPiece({
  type,
  color,
  style,
  size = 48,
  isDragging = false
}: ChessPieceProps) {
  const fontSize = size * 0.72;
  if (style === 'letters') {
    const symbol = getPieceSymbol(type, color);
    return (
      <span
        style={{
          fontSize: `${fontSize * 0.7}px`,
          lineHeight: 1
        }}
        className={`
          font-bold select-none pointer-events-none
          ${color === 'w' ? 'text-white' : 'text-gray-900'}
          ${isDragging ? 'opacity-70 scale-110' : ''}
        `}
        aria-label={`${color === 'w' ? 'White' : 'Black'} ${type}`}>

        {symbol}
      </span>);

  }
  const unicode = getPieceUnicode(type, color);
  return (
    <span
      style={{
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        textShadow:
        color === 'w' ?
        '0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.6)' :
        '0 1px 2px rgba(255,255,255,0.15)',
        filter:
        color === 'w' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none'
      }}
      className={`
        select-none pointer-events-none transition-transform duration-100
        ${isDragging ? 'scale-110' : ''}
      `}
      aria-label={`${color === 'w' ? 'White' : 'Black'} ${type}`}>

      {unicode}
    </span>);

}