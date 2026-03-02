import { useState, useEffect, useRef, useCallback } from 'react';
import type { PieceColor, TimeControl } from '../types/chess';
import type { TimerState } from '../types/chess';

export function useTimer(
timeControl: TimeControl | null,
currentTurn: PieceColor)
{
  const initialSeconds = timeControl ? timeControl.minutes * 60 : 0;
  const increment = timeControl?.increment || 0;

  const [whiteTime, setWhiteTime] = useState(initialSeconds);
  const [blackTime, setBlackTime] = useState(initialSeconds);
  const [activeColor, setActiveColor] = useState<PieceColor>('w');
  const [isRunning, setIsRunning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiredColor, setExpiredColor] = useState<PieceColor | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTurnRef = useRef<PieceColor>('w');

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!timeControl) return;

    // When turn changes, add increment to the player who just moved
    if (prevTurnRef.current !== currentTurn && isRunning) {
      const justMoved = prevTurnRef.current;
      if (justMoved === 'w') {
        setWhiteTime((t) => t + increment);
      } else {
        setBlackTime((t) => t + increment);
      }
      setActiveColor(currentTurn);
    }
    prevTurnRef.current = currentTurn;
  }, [currentTurn, increment, isRunning, timeControl]);

  useEffect(() => {
    if (!isRunning || !timeControl) return;

    clearTimer();
    intervalRef.current = setInterval(() => {
      if (activeColor === 'w') {
        setWhiteTime((t) => {
          if (t <= 1) {
            clearTimer();
            setIsRunning(false);
            setIsExpired(true);
            setExpiredColor('w');
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            clearTimer();
            setIsRunning(false);
            setIsExpired(true);
            setExpiredColor('b');
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return clearTimer;
  }, [isRunning, activeColor, timeControl, clearTimer]);

  const start = useCallback(() => {
    if (!timeControl) return;
    setIsRunning(true);
  }, [timeControl]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const switchTurn = useCallback((color: PieceColor) => {
    setActiveColor(color);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsExpired(false);
    setExpiredColor(null);
    setWhiteTime(initialSeconds);
    setBlackTime(initialSeconds);
    setActiveColor('w');
    prevTurnRef.current = 'w';
  }, [clearTimer, initialSeconds]);

  const timerState: TimerState = {
    whiteTime,
    blackTime,
    activeColor,
    isExpired
  };

  return {
    timerState,
    expiredColor,
    isRunning,
    start,
    pause,
    switchTurn,
    reset
  };
}