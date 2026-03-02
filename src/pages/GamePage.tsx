import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ChessBoard } from '../components/ChessBoard';
import { GameSidebar } from '../components/GameSidebar';
import { MatchSettings } from '../components/MatchSettings';
import { useChessGame } from '../hooks/useChessGame';
import { useRealTimeSync } from '../hooks/useRealTimeSync';
import { useTimer } from '../hooks/useTimer';
import {
  getPlayerColor,
  getRoomUrl,
  saveGameToStorage,
  loadGameFromStorage } from
'../utils/matchUtils';
import type {
  MatchSettings as MatchSettingsType,
  PieceColor } from
'../types/chess';
import {
  CopyIcon,
  CheckIcon,
  Users2Icon,
  ArrowLeftIcon,
  RotateCcwIcon } from
'lucide-react';
interface GamePageProps {
  roomId: string;
}
const DEFAULT_SETTINGS: MatchSettingsType = {
  boardTheme: 'classic',
  pieceStyle: 'unicode',
  timeControl: null,
  playerNames: {
    w: 'White',
    b: 'Black'
  }
};
export function GamePage({ roomId }: GamePageProps) {
  const [playerColor] = useState<PieceColor>(() => getPlayerColor(roomId));
  const [settings, setSettings] = useState<MatchSettingsType>(() => {
    // Try to load saved settings or use homepage prefs
    const saved = loadGameFromStorage(roomId);
    if (saved) return saved.settings;
    try {
      const prefs = localStorage.getItem('chesslink_prefs');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed
        };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState(1);
  const [linkCopied, setLinkCopied] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [resignedColor, setResignedColor] = useState<PieceColor | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [drawAccepted, setDrawAccepted] = useState(false);
  const {
    gameState,
    makeMove,
    resetGame,
    loadFromFenAndHistory,
    getValidMoves
  } = useChessGame();
  const {
    timerState,
    expiredColor,
    isRunning: timerRunning,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer
  } = useTimer(settings.timeControl, gameState.turn);
  // Handle timer expiry
  useEffect(() => {
    if (expiredColor && !isGameOver) {
      const winner = expiredColor === 'w' ? 'Black' : 'White';
      setGameResult(`${winner} wins on time!`);
      setIsGameOver(true);
      pauseTimer();
    }
  }, [expiredColor, isGameOver, pauseTimer]);
  // Handle game over from chess rules
  useEffect(() => {
    if (gameState.isGameOver && !isGameOver) {
      setIsGameOver(true);
      pauseTimer();
      if (gameState.isCheckmate) {
        const winner = gameState.turn === 'w' ? 'Black' : 'White';
        setGameResult(`Checkmate! ${winner} wins.`);
      } else if (gameState.isStalemate) {
        setGameResult('Stalemate! Draw.');
      } else if (gameState.isDraw) {
        setGameResult('Draw!');
      }
    }
  }, [
  gameState.isGameOver,
  gameState.isCheckmate,
  gameState.isStalemate,
  gameState.isDraw,
  gameState.turn,
  isGameOver,
  pauseTimer]
  );
  const handleRemoteMove = useCallback(
    (
    from: string,
    to: string,
    promotion: string | undefined,
    fen: string,
    history: string[],
    captured: {
      w: string[];
      b: string[];
    }) =>
    {
      loadFromFenAndHistory(fen, history, captured);
      setLastMove({
        from,
        to
      });
      setSelectedSquare(null);
      setValidMoves([]);
      if (!timerRunning && settings.timeControl) {
        startTimer();
      }
    },
    [loadFromFenAndHistory, timerRunning, settings.timeControl, startTimer]
  );
  const handleRemoteSettings = useCallback((newSettings: MatchSettingsType) => {
    setSettings(newSettings);
  }, []);
  const handlePlayerCountChange = useCallback(
    (count: number) => {
      setConnectedPlayers(count);
      if (count === 2 && settings.timeControl && !timerRunning && !isGameOver) {
        startTimer();
      }
    },
    [settings.timeControl, timerRunning, isGameOver, startTimer]
  );
  const handleRemoteResign = useCallback(
    (color: PieceColor) => {
      setResignedColor(color);
      const winner = color === 'w' ? 'Black' : 'White';
      setGameResult(`${winner} wins by resignation.`);
      setIsGameOver(true);
      pauseTimer();
    },
    [pauseTimer]
  );
  const handleRemoteDrawOffer = useCallback(() => {
    setDrawOffered(true);
  }, []);
  const handleRemoteDrawAccept = useCallback(() => {
    setDrawAccepted(true);
    setGameResult('Draw by agreement.');
    setIsGameOver(true);
    pauseTimer();
  }, [pauseTimer]);
  const handleRemoteRematch = useCallback(() => {
    resetGame();
    resetTimer();
    setIsGameOver(false);
    setGameResult(null);
    setLastMove(null);
    setSelectedSquare(null);
    setValidMoves([]);
    setDrawOffered(false);
    setDrawAccepted(false);
    setResignedColor(null);
  }, [resetGame, resetTimer]);
  const {
    isConnected,
    syncMove,
    syncSettings,
    syncResign,
    syncDrawOffer,
    syncDrawAccept,
    syncRematch
  } = useRealTimeSync({
    roomId,
    playerColor,
    onRemoteMove: handleRemoteMove,
    onRemoteSettings: handleRemoteSettings,
    onPlayerCountChange: handlePlayerCountChange,
    onRemoteResign: handleRemoteResign,
    onRemoteDrawOffer: handleRemoteDrawOffer,
    onRemoteDrawAccept: handleRemoteDrawAccept,
    onRemoteRematch: handleRemoteRematch
  });
  // Save game state
  useEffect(() => {
    saveGameToStorage(roomId, {
      gameState,
      settings
    });
  }, [gameState, settings, roomId]);
  const handleSquareClick = useCallback(
    (square: string) => {
      if (isGameOver) return;
      if (gameState.turn !== playerColor) return; // Not your turn
      if (selectedSquare) {
        if (validMoves.includes(square)) {
          // Check for pawn promotion
          const piece = gameState.fen.split(' ')[0];
          // Simple promotion detection: pawn moving to rank 1 or 8
          const isPromotion =
          selectedSquare[1] === '7' && square[1] === '8' ||
          selectedSquare[1] === '2' && square[1] === '1';
          const success = makeMove(
            selectedSquare,
            square,
            isPromotion ? 'q' : undefined
          );
          if (success) {
            setLastMove({
              from: selectedSquare,
              to: square
            });
            syncMove(
              selectedSquare,
              square,
              isPromotion ? 'q' : undefined,
              gameState.fen,
              gameState.moveHistory,
              gameState.capturedPieces
            );
            if (!timerRunning && settings.timeControl) startTimer();
          }
          setSelectedSquare(null);
          setValidMoves([]);
        } else {
          // Select new square
          const moves = getValidMoves(square);
          if (moves.length > 0) {
            setSelectedSquare(square);
            setValidMoves(moves);
          } else {
            setSelectedSquare(null);
            setValidMoves([]);
          }
        }
      } else {
        const moves = getValidMoves(square);
        if (moves.length > 0) {
          setSelectedSquare(square);
          setValidMoves(moves);
        }
      }
    },
    [
    isGameOver,
    gameState,
    playerColor,
    selectedSquare,
    validMoves,
    makeMove,
    syncMove,
    getValidMoves,
    timerRunning,
    settings.timeControl,
    startTimer]

  );
  const handleSettingsChange = useCallback(
    (newSettings: MatchSettingsType) => {
      setSettings(newSettings);
      syncSettings(newSettings);
    },
    [syncSettings]
  );
  const handleResign = useCallback(() => {
    if (isGameOver) return;
    setResignedColor(playerColor);
    const winner = playerColor === 'w' ? 'Black' : 'White';
    setGameResult(`${winner} wins by resignation.`);
    setIsGameOver(true);
    pauseTimer();
    syncResign(playerColor);
  }, [isGameOver, playerColor, pauseTimer, syncResign]);
  const handleOfferDraw = useCallback(() => {
    if (isGameOver) return;
    syncDrawOffer();
  }, [isGameOver, syncDrawOffer]);
  const handleAcceptDraw = useCallback(() => {
    setDrawAccepted(true);
    setGameResult('Draw by agreement.');
    setIsGameOver(true);
    pauseTimer();
    syncDrawAccept();
    setDrawOffered(false);
  }, [pauseTimer, syncDrawAccept]);
  const handleRematch = useCallback(() => {
    resetGame();
    resetTimer();
    setIsGameOver(false);
    setGameResult(null);
    setLastMove(null);
    setSelectedSquare(null);
    setValidMoves([]);
    setDrawOffered(false);
    setDrawAccepted(false);
    setResignedColor(null);
    syncRematch();
  }, [resetGame, resetTimer, syncRematch]);
  const handleCopyLink = useCallback(async () => {
    const url = getRoomUrl(roomId);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {

      // Fallback
    }}, [roomId]);
  const isWaiting = connectedPlayers < 2;
  const isBoardDisabled =
  isGameOver || gameState.turn !== playerColor || isWaiting;
  return (
    <div className="min-h-screen w-full bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-900 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Back to home">

            <ArrowLeftIcon size={16} />
          </a>
          <div className="flex items-center gap-2">
            <span className="text-lg">♞</span>
            <span className="font-bold text-white text-sm hidden sm:block">
              ChessLink
            </span>
          </div>
          <div className="h-4 w-px bg-gray-800 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? isWaiting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400' : 'bg-red-400'}`} />

            <span className="text-xs text-gray-400">
              {isWaiting ? 'Waiting for opponent' : '2 players connected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-mono hidden sm:block">
            {roomId}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-600/50 rounded-lg text-xs text-gray-300 hover:text-white transition-all">

            {linkCopied ?
            <CheckIcon size={13} className="text-green-400" /> :

            <CopyIcon size={13} />
            }
            <span>{linkCopied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </header>

      {/* Waiting banner */}
      {isWaiting &&
      <div className="bg-amber-900/30 border-b border-amber-800/40 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users2Icon size={15} className="text-amber-400" />
            <span className="text-sm text-amber-300">
              Share this link to invite your opponent
            </span>
          </div>
          <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700/60 hover:bg-amber-600/60 rounded-lg text-xs text-amber-200 font-medium transition-colors">

            {linkCopied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
            <span className="hidden sm:block">{getRoomUrl(roomId)}</span>
            <span className="sm:hidden">Copy</span>
          </button>
        </div>
      }

      {/* Main game area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Board container */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="w-full"
            style={{
              maxWidth: 'min(100%, calc(100vh - 200px))'
            }}>

            {/* Player color indicator */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-gray-600">
                You are playing as{' '}
                <span className="text-amber-400 font-semibold">
                  {playerColor === 'w' ? 'White ♔' : 'Black ♚'}
                </span>
              </span>
              {gameState.isCheck && !isGameOver &&
              <span className="text-xs font-bold text-red-400 animate-pulse">
                  ⚠ Check!
                </span>
              }
            </div>

            <div className="relative">
              <ChessBoard
                gameState={gameState}
                settings={settings}
                playerColor={playerColor}
                onMove={makeMove}
                lastMove={lastMove}
                validMoves={validMoves}
                selectedSquare={selectedSquare}
                onSquareClick={handleSquareClick}
                disabled={isBoardDisabled} />


              {/* Game over overlay */}
              {isGameOver && gameResult &&
              <div
                className="absolute inset-0 flex items-center justify-center rounded"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(4px)'
                }}>

                  <div className="text-center bg-gray-900 border border-gray-700 rounded-2xl px-8 py-6 shadow-2xl mx-4">
                    <div className="text-4xl mb-3">
                      {gameResult.includes('Checkmate') ?
                    '♛' :
                    gameResult.includes('time') ?
                    '⏱' :
                    '🤝'}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Game Over
                    </h2>
                    <p className="text-amber-300 font-medium mb-5">
                      {gameResult}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                      onClick={handleRematch}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">

                        <RotateCcwIcon size={15} />
                        Rematch
                      </button>
                      <a
                      href="/"
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-medium rounded-xl transition-colors">

                        <ArrowLeftIcon size={15} />
                        Home
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-72 xl:w-80 flex-shrink-0">
          <GameSidebar
            gameState={gameState}
            settings={settings}
            playerColor={playerColor}
            timerState={timerState}
            onSettingsOpen={() => setSettingsOpen(true)}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            isGameOver={isGameOver}
            gameResult={gameResult}
            drawOffered={drawOffered}
            onAcceptDraw={handleAcceptDraw} />

        </aside>
      </main>

      {/* Settings modal */}
      <MatchSettings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onClose={() => setSettingsOpen(false)}
        isOpen={settingsOpen} />

    </div>);

}