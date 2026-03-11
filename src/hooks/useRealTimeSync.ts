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
    let retryTimeout: number | null = null;
    let isDestroyed = false;

    console.log(`[P2P] Initializing Peer with ID: ${peerId}`);
    const peer = new Peer(peerId, {
      debug: 2, // Log errors and warnings
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });
    peerRef.current = peer;

    const connectToOpponent = () => {
      if (isDestroyed || connectionRef.current?.open) return;
      
      if (playerColor === 'b') {
        console.log(`[P2P] Attempting to connect to opponent: ${opponentId}`);
        const conn = peer.connect(opponentId, {
          reliable: true
        });
        setupConnection(conn);
      }
    };

    peer.on('open', (id) => {
      console.log(`[P2P] Peer server connection opened. My ID: ${id}`);
      setIsConnected(true);
      connectToOpponent();
    });

    peer.on('connection', (conn) => {
      console.log(`[P2P] Incoming connection from: ${conn.peer}`);
      if (connectionRef.current?.open) {
        console.log(`[P2P] Already have an active connection, ignoring new one`);
        return;
      }
      setupConnection(conn);
    });

    peer.on('error', (err) => {
      if (isDestroyed) return;
      console.error(`[P2P] Peer error: ${err.type}`, err);
      
      if (err.type === 'peer-unavailable') {
        console.log(`[P2P] Opponent ${opponentId} not found, retrying in 3s...`);
        retryTimeout = window.setTimeout(() => {
          connectToOpponent();
        }, 3000);
      } else if (err.type === 'unavailable-id') {
        setIsConnected(false);
      } else {
        setupBroadcastChannel();
      }
    });

    function setupConnection(conn: DataConnection) {
      if (connectionRef.current === conn) return;
      connectionRef.current = conn;
      
      conn.on('open', () => {
        console.log(`[P2P] Data connection established with: ${conn.peer}`);
        setConnectedPlayers(2);
        onPlayerCountChange(2);
        conn.send({ 
          type: 'join', 
          payload: {}, 
          senderId: peerId, 
          timestamp: Date.now() 
        });
      });

      conn.on('data', (data: any) => {
        console.log(`[P2P] Message received:`, data.type);
        handleIncomingMessage(data as BroadcastMessage);
      });

      conn.on('close', () => {
        console.log(`[P2P] Connection closed`);
        if (isDestroyed) return;
        setConnectedPlayers(1);
        onPlayerCountChange(1);
        connectionRef.current = null;
        retryTimeout = window.setTimeout(connectToOpponent, 3000);
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        conn.close();
      });
    }

    function setupBroadcastChannel() {
      if (broadcastChannelRef.current) return;
      const channel = new BroadcastChannel(`chesslink_${roomId}`);
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => handleIncomingMessage(event.data);
    }

    return () => {
      isDestroyed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
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
