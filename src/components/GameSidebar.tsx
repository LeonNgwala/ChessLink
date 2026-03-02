import React from 'react';
import { FlagIcon, HandshakeIcon, SettingsIcon, TrophyIcon } from 'lucide-react';
import type { GameState, MatchSettings, PieceColor } from '../types/chess';
import type { TimerState } from '../types/chess';
import { PlayerCard } from './PlayerCard';
import { MoveHistory } from './MoveHistory';
import { Timer } from './Timer';
import { getMaterialAdvantage } from '../utils/chessUtils';
interface GameSidebarProps {
  gameState: GameState;
  settings: MatchSettings;
  playerColor: PieceColor | null;
  timerState: TimerState;
  onSettingsOpen: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  isGameOver: boolean;
  gameResult: string | null;
  drawOffered: boolean;
  onAcceptDraw: () => void;
}
export function GameSidebar({
  gameState,
  settings,
  playerColor,
  timerState,
  onSettingsOpen,
  onResign,
  onOfferDraw,
  isGameOver,
  gameResult,
  drawOffered,
  onAcceptDraw
}: GameSidebarProps) {
  const topColor: PieceColor = playerColor === 'b' ? 'w' : 'b';
  const bottomColor: PieceColor = playerColor === 'b' ? 'b' : 'w';
  const materialAdv = getMaterialAdvantage(gameState.capturedPieces);
  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Top player (opponent) */}
      <div className="space-y-1.5">
        <Timer
          time={topColor === 'w' ? timerState.whiteTime : timerState.blackTime}
          isActive={gameState.turn === topColor && !isGameOver}
          color={topColor}
          playerName={settings.playerNames[topColor]}
          hasTimeControl={!!settings.timeControl} />

        <PlayerCard
          name={settings.playerNames[topColor]}
          color={topColor}
          capturedPieces={gameState.capturedPieces[topColor]}
          isActive={gameState.turn === topColor && !isGameOver}
          materialAdvantage={topColor === 'w' ? materialAdv.w : materialAdv.b} />

      </div>

      {/* Game status banner */}
      {isGameOver && gameResult &&
      <div className="bg-amber-900/40 border border-amber-600/60 rounded-xl px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrophyIcon size={16} className="text-amber-400" />
            <span className="text-amber-300 font-bold text-sm">Game Over</span>
          </div>
          <p className="text-white text-sm font-medium">{gameResult}</p>
        </div>
      }

      {/* Draw offer */}
      {drawOffered && !isGameOver &&
      <div className="bg-blue-900/40 border border-blue-600/60 rounded-xl px-4 py-3 text-center">
          <p className="text-blue-300 text-sm font-medium mb-2">Draw offered</p>
          <button
          onClick={onAcceptDraw}
          className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors">

            Accept Draw
          </button>
        </div>
      }

      {/* Move history */}
      <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden min-h-0">
        <MoveHistory moves={gameState.moveHistory} />
      </div>

      {/* Bottom player (self) */}
      <div className="space-y-1.5">
        <PlayerCard
          name={settings.playerNames[bottomColor]}
          color={bottomColor}
          capturedPieces={gameState.capturedPieces[bottomColor]}
          isActive={gameState.turn === bottomColor && !isGameOver}
          materialAdvantage={
          bottomColor === 'w' ? materialAdv.w : materialAdv.b
          } />

        <Timer
          time={
          bottomColor === 'w' ? timerState.whiteTime : timerState.blackTime
          }
          isActive={gameState.turn === bottomColor && !isGameOver}
          color={bottomColor}
          playerName={settings.playerNames[bottomColor]}
          hasTimeControl={!!settings.timeControl} />

      </div>

      {/* Action buttons */}
      {!isGameOver &&
      <div className="flex gap-2">
          <button
          onClick={onSettingsOpen}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl text-gray-300 hover:text-white text-xs font-medium transition-all"
          aria-label="Open settings">

            <SettingsIcon size={14} />
            <span>Settings</span>
          </button>
          <button
          onClick={onOfferDraw}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl text-gray-300 hover:text-white text-xs font-medium transition-all"
          aria-label="Offer draw">

            <HandshakeIcon size={14} />
            <span>Draw</span>
          </button>
          <button
          onClick={onResign}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-red-900/60 border border-gray-700 hover:border-red-700 rounded-xl text-gray-300 hover:text-red-300 text-xs font-medium transition-all"
          aria-label="Resign">

            <FlagIcon size={14} />
            <span>Resign</span>
          </button>
        </div>
      }
    </div>);

}