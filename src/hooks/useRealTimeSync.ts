import { useEffect, useRef, useCallback, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
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
    captured: { w: string[]; b: string[] }
  ) => void;
  onRemoteSettings: (settings: MatchSettings) => void;
  onPlayerCountChange: (count: number) => void;
  onRemoteResign: (color: PieceColor) => void;
  onRemoteDrawOffer: () => void;
  onRemoteDrawAccept: () => void;
  onRemoteRematch: () => void;
  onRemoteState: (state: { gameState: GameState; settings: MatchSettings }) => void;
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
  onRemoteRematch,
  onRemoteState
}: UseRealTimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState(1);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Helper to handle incoming messages
  const handleIncomingMessage = useCallback((msg: BroadcastMessage) => {
    switch (msg.type) {
      case 'join':
        setConnectedPlayers(2);
        onPlayerCountChange(2);
        break;
      case 'state':
        onRemoteState(msg.payload as any);
        setConnectedPlayers(2);
        onPlayerCountChange(2);
        break;
      case 'move': {
        const { from, to, promotion, fen, history, captured } = msg.payload as any;
        onRemoteMove(from, to, promotion, fen, history, captured);
        break;
      }
      case 'settings':
        onRemoteSettings(msg.payload.settings as MatchSettings);
        break;
      case 'resign':
        onRemoteResign(msg.payload.color as PieceColor);
        break;
      case 'draw_offer':
        onRemoteDrawOffer();
        break;
      case 'draw_accept':
        onRemoteDrawAccept();
        break;
      case 'rematch':
        onRemoteRematch();
        break;
    }
  }, [onRemoteMove, onRemoteSettings, onPlayerCountChange, onRemoteResign, onRemoteDrawOffer, onRemoteDrawAccept, onRemoteRematch, onRemoteState]);

  // PeerJS setup
  useEffect(() => {
    if (!roomId || !playerColor) return;

    const peerId = `chesslink_${roomId}_${playerColor}`;
    const opponentId = `chesslink_${roomId}_${playerColor === 'w' ? 'b' : 'w'}`;

    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', () => {
      setIsConnected(true);
      if (playerColor === 'b') {
        const conn = peer.connect(opponentId);
        setupConnection(conn);
      }
    });

    peer.on('connection', (conn) => {
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      console.warn('PeerJS error:', err);
      setupBroadcastChannel();
    });

    function setupConnection(conn: DataConnection) {
      connectionRef.current = conn;
      
      conn.on('open', () => {
        setConnectedPlayers(2);
        onPlayerCountChange(2);
        // White will usually send the current state when Black connects
        conn.send({ type: 'join', payload: {}, senderId: peerId, timestamp: Date.now() });
      });

      conn.on('data', (data: any) => {
        handleIncomingMessage(data as BroadcastMessage);
      });

      conn.on('close', () => {
        setConnectedPlayers(1);
        onPlayerCountChange(1);
        connectionRef.current = null;
      });
    }

    function setupBroadcastChannel() {
      if (broadcastChannelRef.current) return;
      const channel = new BroadcastChannel(`chesslink_${roomId}`);
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => handleIncomingMessage(event.data);
    }

    return () => {
      peer.destroy();
      broadcastChannelRef.current?.close();
    };
  }, [roomId, playerColor, handleIncomingMessage, onPlayerCountChange]);

  const sync = useCallback((type: BroadcastMessage['type'], payload: Record<string, unknown>) => {
    const message: BroadcastMessage = {
      type,
      payload,
      senderId: `chesslink_${roomId}_${playerColor}`,
      timestamp: Date.now()
    };

    if (connectionRef.current && connectionRef.current.open) {
      connectionRef.current.send(message);
    }
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage(message);
    }
  }, [roomId, playerColor]);

  return {
    isConnected,
    connectedPlayers,
    syncMove: (from: string, to: string, promotion: string | undefined, fen: string, history: string[], captured: { w: string[]; b: string[] }) => 
      sync('move', { from, to, promotion, fen, history, captured }),
    syncSettings: (settings: MatchSettings) => sync('settings', { settings }),
    syncResign: (color: PieceColor) => sync('resign', { color }),
    syncDrawOffer: () => sync('draw_offer', {}),
    syncDrawAccept: () => sync('draw_accept', {}),
    syncRematch: () => sync('rematch', {}),
    syncState: (gameState: GameState, settings: MatchSettings) => sync('state', { gameState, settings })
  };
}
