import React, { useCallback, useState } from 'react';
import type { GameState, MatchSettings, PieceColor } from '../types/chess';
import type { PieceType } from '../types/chess';
import { ChessPiece } from './ChessPiece';
import {
  coordsToSquare,
  squareToCoords,
  boardThemeColors } from
'../utils/chessUtils';
interface ChessBoardProps {
  gameState: GameState;
  settings: MatchSettings;
  playerColor: PieceColor | null;
  onMove: (from: string, to: string, promotion?: string) => boolean;
  lastMove: {
    from: string;
    to: string;
  } | null;
  validMoves: string[];
  selectedSquare: string | null;
  onSquareClick: (square: string) => void;
  disabled?: boolean;
}
interface PieceOnBoard {
  type: PieceType;
  color: PieceColor;
}
function parseFen(fen: string): (PieceOnBoard | null)[][] {
  const board: (PieceOnBoard | null)[][] = Array(8).
  fill(null).
  map(() => Array(8).fill(null));
  const rows = fen.split(' ')[0].split('/');
  rows.forEach((row, rowIdx) => {
    let colIdx = 0;
    for (const char of row) {
      if (/\d/.test(char)) {
        colIdx += parseInt(char);
      } else {
        const color: PieceColor = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase() as PieceType;
        board[rowIdx][colIdx] = {
          type,
          color
        };
        colIdx++;
      }
    }
  });
  return board;
}
export function ChessBoard({
  gameState,
  settings,
  playerColor,
  onMove,
  lastMove,
  validMoves,
  selectedSquare,
  onSquareClick,
  disabled = false
}: ChessBoardProps) {
  const [promotionPending, setPromotionPending] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const theme = boardThemeColors[settings.boardTheme];
  const isFlipped = playerColor === 'b';
  const board = parseFen(gameState.fen);
  const rows = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const getSquareStyle = (row: number, col: number): React.CSSProperties => {
    const square = coordsToSquare(row, col);
    const isLight = (row + col) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isValidMove = validMoves.includes(square);
    const isLastMoveFrom = lastMove?.from === square;
    const isLastMoveTo = lastMove?.to === square;
    const isKingInCheck =
    gameState.isCheck &&
    gameState.turn === board[row][col]?.color &&
    board[row][col]?.type === 'k';
    let bg = isLight ? theme.light : theme.dark;
    if (isKingInCheck) {
      return {
        backgroundColor: bg,
        boxShadow: `inset 0 0 0 3px ${theme.checkHighlight}`,
        position: 'relative'
      };
    }
    if (isSelected) {
      return {
        backgroundColor: theme.highlight,
        position: 'relative'
      };
    }
    if (isLastMoveFrom || isLastMoveTo) {
      return {
        backgroundColor: bg,
        boxShadow: `inset 0 0 0 100px ${theme.lastMove}`,
        position: 'relative'
      };
    }
    return {
      backgroundColor: bg,
      position: 'relative'
    };
  };
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (disabled) return;
      const square = coordsToSquare(row, col);
      onSquareClick(square);
    },
    [disabled, onSquareClick]
  );
  const handlePromotion = (piece: string) => {
    if (!promotionPending) return;
    onMove(promotionPending.from, promotionPending.to, piece);
    setPromotionPending(null);
  };
  const files = isFlipped ?
  ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] :
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isFlipped ?
  ['1', '2', '3', '4', '5', '6', '7', '8'] :
  ['8', '7', '6', '5', '4', '3', '2', '1'];
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: '1/1'
      }}>

      {/* Board */}
      <div
        className="w-full h-full grid"
        style={{
          gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
          gridTemplateRows: 'auto repeat(8, 1fr)'
        }}>

        {/* Top-left corner spacer */}
        <div />
        {/* File labels top */}
        {files.map((f) =>
        <div
          key={f}
          className="flex items-center justify-center pb-0.5"
          style={{
            height: '18px'
          }}>

            <span
            className="text-xs font-medium opacity-60 text-gray-300"
            style={{
              fontSize: '11px'
            }}>

              {f}
            </span>
          </div>
        )}

        {rows.map((row, rowDisplayIdx) =>
        <>
            {/* Rank label */}
            <div
            key={`rank-${row}`}
            className="flex items-center justify-center pr-1"
            style={{
              width: '18px'
            }}>

              <span
              className="text-xs font-medium opacity-60 text-gray-300"
              style={{
                fontSize: '11px'
              }}>

                {ranks[rowDisplayIdx]}
              </span>
            </div>
            {/* Squares */}
            {cols.map((col) => {
            const square = coordsToSquare(row, col);
            const piece = board[row][col];
            const isValidMove = validMoves.includes(square);
            const hasPiece = !!piece;
            return (
              <div
                key={`${row}-${col}`}
                style={getSquareStyle(row, col)}
                className="flex items-center justify-center cursor-pointer transition-all duration-75 select-none"
                onClick={() => handleSquareClick(row, col)}
                role="button"
                aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                  handleSquareClick(row, col);
                }}>

                  {/* Valid move indicator */}
                  {isValidMove && !hasPiece &&
                <div
                  className="rounded-full pointer-events-none"
                  style={{
                    width: '30%',
                    height: '30%',
                    backgroundColor: 'rgba(0,0,0,0.2)'
                  }} />

                }
                  {isValidMove && hasPiece &&
                <div
                  className="absolute inset-0 rounded-sm pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.3)'
                  }} />

                }
                  {/* Piece */}
                  {piece &&
                <div className="flex items-center justify-center w-full h-full">
                      <ChessPiece
                    type={piece.type}
                    color={piece.color}
                    style={settings.pieceStyle}
                    size={48} />

                    </div>
                }
                </div>);

          })}
          </>
        )}
      </div>

      {/* Promotion modal */}
      {promotionPending &&
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl">
            <p className="text-white text-sm font-medium mb-3 text-center">
              Promote pawn to:
            </p>
            <div className="flex gap-2">
              {(['q', 'r', 'b', 'n'] as const).map((p) =>
            <button
              key={p}
              onClick={() => handlePromotion(p)}
              className="w-14 h-14 bg-gray-800 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors border border-gray-700 hover:border-amber-500">

                  <ChessPiece
                type={p}
                color={gameState.turn === 'w' ? 'w' : 'b'}
                style={settings.pieceStyle}
                size={44} />

                </button>
            )}
            </div>
          </div>
        </div>
      }
    </div>);

}