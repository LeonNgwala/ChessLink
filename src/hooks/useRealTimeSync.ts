import { useEffect, useRef, useCallback, useState } from 'react';
import type { GameState, MatchSettings, PieceColor } from '../types/chess';
import type { BroadcastMessage } from '../types/chess';

interface UseRealTimeSyncOptions {
  roomId: string;
  playerColor: PieceColor | null;
  onRemoteMove: (
  from: string,
  to: string,
  promotion: string | undefined,
  fen: string,
  history: string[],
  captured: {w: string[];b: string[];})
  => void;
  onRemoteSettings: (settings: MatchSettings) => void;
  onPlayerCountChange: (count: number) => void;
  onRemoteResign: (color: PieceColor) => void;
  onRemoteDrawOffer: () => void;
  onRemoteDrawAccept: () => void;
  onRemoteRematch: () => void;
}

export function useRealTimeSync({
  roomId,
  playerColor,
  onRemoteMove,
  onRemoteSettings,
  onPlayerCountChange,
  onRemoteResign,
  onRemoteDrawOffer,
  onRemoteDrawAccept,
  onRemoteRematch
}: UseRealTimeSyncOptions) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const senderIdRef = useRef<string>(
    `player_${Math.random().toString(36).slice(2)}`
  );
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState(1);
  const connectedPlayersRef = useRef(1);

  const broadcast = useCallback(
    (type: BroadcastMessage['type'], payload: Record<string, unknown>) => {
      if (!channelRef.current) return;
      const message: BroadcastMessage = {
        type,
        payload,
        senderId: senderIdRef.current,
        timestamp: Date.now()
      };
      try {
        channelRef.current.postMessage(message);
      } catch {

        // Channel might be closed
      }},
    []
  );

  useEffect(() => {
    if (!roomId) return;

    const isBroadcastSupported = typeof BroadcastChannel !== 'undefined';
    if (!isBroadcastSupported) {
      setIsConnected(true);
      return;
    }

    const channel = new BroadcastChannel(`chesslink_${roomId}`);
    channelRef.current = channel;
    setIsConnected(true);

    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const msg = event.data;
      if (msg.senderId === senderIdRef.current) return;

      switch (msg.type) {
        case 'join':{
            // New player joined, update count
            const newCount = Math.min(connectedPlayersRef.current + 1, 2);
            connectedPlayersRef.current = newCount;
            setConnectedPlayers(newCount);
            onPlayerCountChange(newCount);
            // Respond with our presence
            broadcast('state', { playerColor, connectedPlayers: newCount });
            break;
          }
        case 'state':{
            const newCount = Math.min(
              msg.payload.connectedPlayers as number || 2,
              2
            );
            connectedPlayersRef.current = newCount;
            setConnectedPlayers(newCount);
            onPlayerCountChange(newCount);
            break;
          }
        case 'move':{
            const { from, to, promotion, fen, history, captured } =
            msg.payload as {
              from: string;
              to: string;
              promotion: string | undefined;
              fen: string;
              history: string[];
              captured: {w: string[];b: string[];};
            };
            onRemoteMove(from, to, promotion, fen, history, captured);
            break;
          }
        case 'settings':{
            onRemoteSettings(msg.payload.settings as MatchSettings);
            break;
          }
        case 'resign':{
            onRemoteResign(msg.payload.color as PieceColor);
            break;
          }
        case 'draw_offer':{
            onRemoteDrawOffer();
            break;
          }
        case 'draw_accept':{
            onRemoteDrawAccept();
            break;
          }
        case 'rematch':{
            onRemoteRematch();
            break;
          }
      }
    };

    // Announce our presence
    broadcast('join', { playerColor });

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [roomId]);

  const syncMove = useCallback(
    (
    from: string,
    to: string,
    promotion: string | undefined,
    fen: string,
    history: string[],
    captured: {w: string[];b: string[];}) =>
    {
      broadcast('move', { from, to, promotion, fen, history, captured });
    },
    [broadcast]
  );

  const syncSettings = useCallback(
    (settings: MatchSettings) => {
      broadcast('settings', { settings });
    },
    [broadcast]
  );

  const syncResign = useCallback(
    (color: PieceColor) => {
      broadcast('resign', { color });
    },
    [broadcast]
  );

  const syncDrawOffer = useCallback(() => {
    broadcast('draw_offer', {});
  }, [broadcast]);

  const syncDrawAccept = useCallback(() => {
    broadcast('draw_accept', {});
  }, [broadcast]);

  const syncRematch = useCallback(() => {
    broadcast('rematch', {});
  }, [broadcast]);

  return {
    isConnected,
    connectedPlayers,
    syncMove,
    syncSettings,
    syncResign,
    syncDrawOffer,
    syncDrawAccept,
    syncRematch
  };
}