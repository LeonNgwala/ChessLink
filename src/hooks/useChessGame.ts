import { useState, useCallback, useRef } from 'react';
import { GameState, PieceColor } from '../types/chess';

// ─── Minimal Chess Engine ────────────────────────────────────────────────────

type PT = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type PC = 'w' | 'b';
interface Piece {
  type: PT;
  color: PC;
}
type Board = (Piece | null)[][];

interface CastlingRights {
  wk: boolean;
  wq: boolean;
  bk: boolean;
  bq: boolean;
}

interface ChessState {
  board: Board;
  turn: PC;
  castling: CastlingRights;
  enPassant: string | null;
  halfMoves: number;
  fullMoves: number;
  history: MoveRecord[];
}

interface MoveRecord {
  from: [number, number];
  to: [number, number];
  piece: Piece;
  captured: Piece | null;
  promotion: PT | null;
  enPassantCapture: [number, number] | null;
  castling: 'k' | 'q' | null;
  prevCastling: CastlingRights;
  prevEnPassant: string | null;
  san: string;
  fen: string;
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function parseFen(fen: string): ChessState {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const board = emptyBoard();
  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (/\d/.test(ch)) {
        c += parseInt(ch);
        continue;
      }
      const color: PC = ch === ch.toUpperCase() ? 'w' : 'b';
      const type = ch.toLowerCase() as PT;
      board[r][c] = { type, color };
      c++;
    }
  }
  const turn = (parts[1] || 'w') as PC;
  const castleStr = parts[2] || '-';
  const castling: CastlingRights = {
    wk: castleStr.includes('K'),
    wq: castleStr.includes('Q'),
    bk: castleStr.includes('k'),
    bq: castleStr.includes('q')
  };
  const epStr = parts[3] || '-';
  const enPassant = epStr === '-' ? null : epStr;
  const halfMoves = parseInt(parts[4] || '0');
  const fullMoves = parseInt(parts[5] || '1');
  return { board, turn, castling, enPassant, halfMoves, fullMoves, history: [] };
}

function boardToFenPieces(board: Board): string {
  return board.
  map((row) => {
    let s = '';
    let empty = 0;
    for (const sq of row) {
      if (!sq) {
        empty++;
        continue;
      }
      if (empty) {
        s += empty;
        empty = 0;
      }
      const ch =
      sq.type === 'n' ?
      sq.color === 'w' ?
      'N' :
      'n' :
      sq.color === 'w' ?
      sq.type.toUpperCase() :
      sq.type;
      s += ch;
    }
    if (empty) s += empty;
    return s;
  }).
  join('/');
}

function stateToFen(state: ChessState): string {
  const pieces = boardToFenPieces(state.board);
  const castle =
  [
  state.castling.wk ? 'K' : '',
  state.castling.wq ? 'Q' : '',
  state.castling.bk ? 'k' : '',
  state.castling.bq ? 'q' : ''].
  join('') || '-';
  const ep = state.enPassant || '-';
  return `${pieces} ${state.turn} ${castle} ${ep} ${state.halfMoves} ${state.fullMoves}`;
}

function sqToRC(sq: string): [number, number] {
  const col = sq.charCodeAt(0) - 97;
  const row = 8 - parseInt(sq[1]);
  return [row, col];
}

function rcToSq(r: number, c: number): string {
  return String.fromCharCode(97 + c) + (8 - r);
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function pseudoMoves(
state: ChessState,
r: number,
c: number)
: [number, number][] {
  const piece = state.board[r][c];
  if (!piece) return [];
  const { type, color } = piece;
  const opp: PC = color === 'w' ? 'b' : 'w';
  const moves: [number, number][] = [];

  const slide = (dr: number, dc: number) => {
    let nr = r + dr,
      nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = state.board[nr][nc];
      if (!target) {
        moves.push([nr, nc]);
      } else {
        if (target.color === opp) moves.push([nr, nc]);
        break;
      }
      nr += dr;
      nc += dc;
    }
  };

  const jump = (dr: number, dc: number) => {
    const nr = r + dr,
      nc = c + dc;
    if (!inBounds(nr, nc)) return;
    const target = state.board[nr][nc];
    if (!target || target.color === opp) moves.push([nr, nc]);
  };

  if (type === 'p') {
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    if (inBounds(r + dir, c) && !state.board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !state.board[r + 2 * dir][c])
      moves.push([r + 2 * dir, c]);
    }
    for (const dc of [-1, 1]) {
      const nr = r + dir,
        nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = state.board[nr][nc];
      if (target && target.color === opp) moves.push([nr, nc]);
      if (state.enPassant && rcToSq(nr, nc) === state.enPassant)
      moves.push([nr, nc]);
    }
  } else if (type === 'n') {
    for (const [dr, dc] of [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1]])

    jump(dr, dc);
  } else if (type === 'b') {
    for (const [dr, dc] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]])

    slide(dr, dc);
  } else if (type === 'r') {
    for (const [dr, dc] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]])

    slide(dr, dc);
  } else if (type === 'q') {
    for (const [dr, dc] of [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]])

    slide(dr, dc);
  } else if (type === 'k') {
    for (const [dr, dc] of [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]])

    jump(dr, dc);
    const backRank = color === 'w' ? 7 : 0;
    if (r === backRank && c === 4) {
      if (
      (color === 'w' ? state.castling.wk : state.castling.bk) &&
      !state.board[backRank][5] &&
      !state.board[backRank][6])
      {
        moves.push([backRank, 6]);
      }
      if (
      (color === 'w' ? state.castling.wq : state.castling.bq) &&
      !state.board[backRank][3] &&
      !state.board[backRank][2] &&
      !state.board[backRank][1])
      {
        moves.push([backRank, 2]);
      }
    }
  }
  return moves;
}

function isSquareAttacked(
board: Board,
r: number,
c: number,
byColor: PC)
: boolean {
  for (const [dr, dc] of [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1]])
  {
    const nr = r + dr,
      nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[nr][nc];
    if (p && p.color === byColor && p.type === 'n') return true;
  }
  const dirs: [number, number, PT[]][] = [
  [-1, 0, ['r', 'q']],
  [1, 0, ['r', 'q']],
  [0, -1, ['r', 'q']],
  [0, 1, ['r', 'q']],
  [-1, -1, ['b', 'q']],
  [-1, 1, ['b', 'q']],
  [1, -1, ['b', 'q']],
  [1, 1, ['b', 'q']]];

  for (const [dr, dc, types] of dirs) {
    let nr = r + dr,
      nc = c + dc;
    while (inBounds(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === byColor && types.includes(p.type)) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
  const pawnDir = byColor === 'w' ? 1 : -1;
  for (const dc of [-1, 1]) {
    const nr = r + pawnDir,
      nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[nr][nc];
    if (p && p.color === byColor && p.type === 'p') return true;
  }
  for (const [dr, dc] of [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]])
  {
    const nr = r + dr,
      nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const p = board[nr][nc];
    if (p && p.color === byColor && p.type === 'k') return true;
  }
  return false;
}

function findKing(board: Board, color: PC): [number, number] | null {
  for (let r = 0; r < 8; r++)
  for (let c = 0; c < 8; c++)
  if (board[r][c]?.type === 'k' && board[r][c]?.color === color)
  return [r, c];
  return null;
}

function isInCheck(board: Board, color: PC): boolean {
  const king = findKing(board, color);
  if (!king) return false;
  return isSquareAttacked(board, king[0], king[1], color === 'w' ? 'b' : 'w');
}

function applyMoveToBoard(
board: Board,
from: [number, number],
to: [number, number],
promotion: PT | null,
enPassant: string | null)
: {
  board: Board;
  epCapture: [number, number] | null;
  castling: 'k' | 'q' | null;
} {
  const newBoard: Board = board.map((row) => [...row]);
  const [fr, fc] = from;
  const [tr, tc] = to;
  const piece = newBoard[fr][fc]!;
  let epCapture: [number, number] | null = null;
  let castlingMove: 'k' | 'q' | null = null;

  if (piece.type === 'p' && enPassant && rcToSq(tr, tc) === enPassant) {
    const captureRow = fr;
    newBoard[captureRow][tc] = null;
    epCapture = [captureRow, tc];
  }

  if (piece.type === 'k' && Math.abs(tc - fc) === 2) {
    const backRank = fr;
    if (tc === 6) {
      newBoard[backRank][5] = newBoard[backRank][7];
      newBoard[backRank][7] = null;
      castlingMove = 'k';
    } else {
      newBoard[backRank][3] = newBoard[backRank][0];
      newBoard[backRank][0] = null;
      castlingMove = 'q';
    }
  }

  newBoard[tr][tc] = promotion ? { type: promotion, color: piece.color } : piece;
  newBoard[fr][fc] = null;
  return { board: newBoard, epCapture, castling: castlingMove };
}

function getLegalMoves(
state: ChessState,
r: number,
c: number)
: [number, number][] {
  const piece = state.board[r][c];
  if (!piece || piece.color !== state.turn) return [];
  const pseudo = pseudoMoves(state, r, c);
  return pseudo.filter(([tr, tc]) => {
    const { board: newBoard } = applyMoveToBoard(
      state.board,
      [r, c],
      [tr, tc],
      null,
      state.enPassant
    );
    return !isInCheck(newBoard, piece.color);
  });
}

function hasAnyLegalMove(state: ChessState): boolean {
  for (let r = 0; r < 8; r++)
  for (let c = 0; c < 8; c++) {
    const p = state.board[r][c];
    if (p && p.color === state.turn && getLegalMoves(state, r, c).length > 0)
    return true;
  }
  return false;
}

function isInsufficientMaterial(board: Board): boolean {
  const pieces: Piece[] = [];
  for (let r = 0; r < 8; r++)
  for (let c = 0; c < 8; c++) if (board[r][c]) pieces.push(board[r][c]!);
  if (pieces.length === 2) return true;
  if (pieces.length === 3) {
    const minor = pieces.find((p) => p.type === 'n' || p.type === 'b');
    if (minor) return true;
  }
  return false;
}

function generateSan(
board: Board,
from: [number, number],
to: [number, number],
piece: Piece,
captured: Piece | null,
promotion: PT | null,
castling: 'k' | 'q' | null,
isCheck: boolean,
isMate: boolean)
: string {
  if (castling === 'k') return isMate ? 'O-O#' : isCheck ? 'O-O+' : 'O-O';
  if (castling === 'q') return isMate ? 'O-O-O#' : isCheck ? 'O-O-O+' : 'O-O-O';

  const pieceLetters: Record<PT, string> = {
    p: '',
    n: 'N',
    b: 'B',
    r: 'R',
    q: 'Q',
    k: 'K'
  };
  const toSq = rcToSq(to[0], to[1]);
  const fromSq = rcToSq(from[0], from[1]);
  let san = '';

  if (piece.type === 'p') {
    if (captured) san = fromSq[0] + 'x' + toSq;else
    san = toSq;
    if (promotion)
    san += '=' + (pieceLetters[promotion] || promotion.toUpperCase());
  } else {
    san = pieceLetters[piece.type];
    const ambiguous: [number, number][] = [];
    for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if (r === from[0] && c === from[1]) continue;
      const p = board[r][c];
      if (p && p.type === piece.type && p.color === piece.color) {
        const pm = pseudoMoves(
          {
            board,
            turn: piece.color,
            castling: { wk: false, wq: false, bk: false, bq: false },
            enPassant: null,
            halfMoves: 0,
            fullMoves: 1,
            history: []
          },
          r,
          c
        );
        if (pm.some(([pr, pc]) => pr === to[0] && pc === to[1]))
        ambiguous.push([r, c]);
      }
    }
    if (ambiguous.length > 0) {
      const sameFile = ambiguous.some(([, ac]) => ac === from[1]);
      const sameRank = ambiguous.some(([ar]) => ar === from[0]);
      if (!sameFile) san += fromSq[0];else
      if (!sameRank) san += fromSq[1];else
      san += fromSq;
    }
    if (captured) san += 'x';
    san += toSq;
  }

  if (isMate) san += '#';else
  if (isCheck) san += '+';
  return san;
}

// ─── Main Hook ───────────────────────────────────────────────────────────────

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function computeGameState(
state: ChessState,
overrideCaptured?: {w: string[];b: string[];},
overrideHistory?: string[])
: GameState {
  const fen = stateToFen(state);
  const inCheck = isInCheck(state.board, state.turn);
  const anyLegal = hasAnyLegalMove(state);
  const isCheckmate = inCheck && !anyLegal;
  const isStalemate = !inCheck && !anyLegal;
  const isDraw =
  isStalemate || isInsufficientMaterial(state.board) || state.halfMoves >= 100;

  const moveHistory = overrideHistory ?? state.history.map((m) => m.san);

  const pieceUnicode: Record<string, string> = {
    wp: '♙',
    wn: '♘',
    wb: '♗',
    wr: '♖',
    wq: '♕',
    wk: '♔',
    bp: '♟',
    bn: '♞',
    bb: '♝',
    br: '♜',
    bq: '♛',
    bk: '♚'
  };

  let capturedPieces: {w: string[];b: string[];};
  if (overrideCaptured) {
    capturedPieces = overrideCaptured;
  } else {
    capturedPieces = { w: [], b: [] };
    for (const m of state.history) {
      if (m.captured) {
        const key = m.captured.color + m.captured.type;
        const sym = pieceUnicode[key] || m.captured.type;
        if (m.captured.color === 'w') capturedPieces.b.push(sym);else
        capturedPieces.w.push(sym);
      }
    }
  }

  return {
    fen,
    pgn: moveHistory.join(' '),
    turn: state.turn,
    isCheck: inCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    isGameOver: isCheckmate || isDraw,
    moveHistory,
    capturedPieces
  };
}

export function useChessGame() {
  const stateRef = useRef<ChessState>(parseFen(STARTING_FEN));
  const [gameState, setGameState] = useState<GameState>(() =>
  computeGameState(stateRef.current)
  );

  const refresh = useCallback(
    (
    overrideCaptured?: {w: string[];b: string[];},
    overrideHistory?: string[]) =>
    {
      setGameState(
        computeGameState(stateRef.current, overrideCaptured, overrideHistory)
      );
    },
    []
  );

  const makeMove = useCallback(
    (fromSq: string, toSq: string, promotion?: string): boolean => {
      const state = stateRef.current;
      const [fr, fc] = sqToRC(fromSq);
      const [tr, tc] = sqToRC(toSq);
      const piece = state.board[fr][fc];
      if (!piece || piece.color !== state.turn) return false;

      const legal = getLegalMoves(state, fr, fc);
      if (!legal.some(([lr, lc]) => lr === tr && lc === tc)) return false;

      let promo: PT | null = null;
      if (piece.type === 'p' && (tr === 0 || tr === 7)) {
        promo = promotion as PT || 'q';
      }

      const captured = state.board[tr][tc];
      const prevCastling = { ...state.castling };
      const prevEnPassant = state.enPassant;

      const {
        board: newBoard,
        epCapture,
        castling: castlingMove
      } = applyMoveToBoard(
        state.board,
        [fr, fc],
        [tr, tc],
        promo,
        state.enPassant
      );

      const newCastling = { ...state.castling };
      if (piece.type === 'k') {
        if (piece.color === 'w') {
          newCastling.wk = false;
          newCastling.wq = false;
        } else {
          newCastling.bk = false;
          newCastling.bq = false;
        }
      }
      if (piece.type === 'r') {
        if (fr === 7 && fc === 7) newCastling.wk = false;
        if (fr === 7 && fc === 0) newCastling.wq = false;
        if (fr === 0 && fc === 7) newCastling.bk = false;
        if (fr === 0 && fc === 0) newCastling.bq = false;
      }
      if (tr === 7 && tc === 7) newCastling.wk = false;
      if (tr === 7 && tc === 0) newCastling.wq = false;
      if (tr === 0 && tc === 7) newCastling.bk = false;
      if (tr === 0 && tc === 0) newCastling.bq = false;

      let newEp: string | null = null;
      if (piece.type === 'p' && Math.abs(tr - fr) === 2) {
        newEp = rcToSq((fr + tr) / 2, fc);
      }

      const nextTurn: PC = state.turn === 'w' ? 'b' : 'w';
      const newHalf = piece.type === 'p' || captured ? 0 : state.halfMoves + 1;
      const newFull = state.turn === 'b' ? state.fullMoves + 1 : state.fullMoves;

      const nextState: ChessState = {
        board: newBoard,
        turn: nextTurn,
        castling: newCastling,
        enPassant: newEp,
        halfMoves: newHalf,
        fullMoves: newFull,
        history: state.history
      };

      const inCheck = isInCheck(newBoard, nextTurn);
      const anyLegal = hasAnyLegalMove(nextState);
      const isMate = inCheck && !anyLegal;

      const san = generateSan(
        state.board,
        [fr, fc],
        [tr, tc],
        piece,
        captured,
        promo,
        castlingMove,
        inCheck,
        isMate
      );

      const record: MoveRecord = {
        from: [fr, fc],
        to: [tr, tc],
        piece,
        captured,
        promotion: promo,
        enPassantCapture: epCapture,
        castling: castlingMove,
        prevCastling,
        prevEnPassant,
        san,
        fen: stateToFen(nextState)
      };

      stateRef.current = { ...nextState, history: [...state.history, record] };
      refresh();
      return true;
    },
    [refresh]
  );

  const resetGame = useCallback(() => {
    stateRef.current = parseFen(STARTING_FEN);
    refresh();
  }, [refresh]);

  const loadGame = useCallback(
    (fen: string) => {
      try {
        stateRef.current = parseFen(fen);
        refresh();
      } catch {

        // invalid FEN, ignore
      }},
    [refresh]
  );

  const loadFromFenAndHistory = useCallback(
    (
    fen: string,
    history: string[],
    captured: {w: string[];b: string[];}) =>
    {
      try {
        const newState = parseFen(fen);
        newState.history = history.map((san) => ({
          from: [0, 0] as [number, number],
          to: [0, 0] as [number, number],
          piece: { type: 'p' as PT, color: 'w' as PC },
          captured: null,
          promotion: null,
          enPassantCapture: null,
          castling: null,
          prevCastling: { wk: false, wq: false, bk: false, bq: false },
          prevEnPassant: null,
          san,
          fen
        }));
        stateRef.current = newState;
        refresh(captured, history);
      } catch {

        // ignore
      }},
    [refresh]
  );

  const getValidMoves = useCallback((square: string): string[] => {
    const [r, c] = sqToRC(square);
    return getLegalMoves(stateRef.current, r, c).map(([lr, lc]) =>
    rcToSq(lr, lc)
    );
  }, []);

  return {
    gameState,
    makeMove,
    resetGame,
    loadGame,
    loadFromFenAndHistory,
    getValidMoves
  };
}