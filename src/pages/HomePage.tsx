import React, { useState } from 'react';
import { generateRoomId, getRoomUrl } from '../utils/matchUtils';
import { TIME_CONTROLS, boardThemeColors } from '../utils/chessUtils';
import type { BoardTheme, TimeControl } from '../types/chess';
import { LinkIcon, ArrowRightIcon, ClockIcon, PaletteIcon } from 'lucide-react';
const BOARD_THEMES: {
  id: BoardTheme;
  label: string;
}[] = [
{
  id: 'classic',
  label: 'Classic'
},
{
  id: 'forest',
  label: 'Forest'
},
{
  id: 'ocean',
  label: 'Ocean'
},
{
  id: 'dark',
  label: 'Dark'
}];

export function HomePage() {
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [selectedTime, setSelectedTime] = useState<TimeControl | null>(
    TIME_CONTROLS[3]
  );
  const [selectedTheme, setSelectedTheme] = useState<BoardTheme>('classic');
  const [copied, setCopied] = useState(false);
  const handleCreateMatch = () => {
    const roomId = generateRoomId();
    // Creator plays as White
    const url = getRoomUrl(roomId, 'w');
    // Store initial settings preference
    localStorage.setItem(
      `chesslink_prefs`,
      JSON.stringify({
        timeControl: selectedTime,
        boardTheme: selectedTheme
      })
    );
    window.location.href = url;
  };
  const handleJoinMatch = () => {
    const input = joinInput.trim();
    if (!input) {
      setJoinError('Please enter a room link or ID');
      return;
    }
    
    let roomId = input;
    let color: 'w' | 'b' | undefined = undefined;
    
    // Try to parse as URL
    try {
      if (input.includes('http') || input.includes('?room=')) {
        const url = new URL(input.startsWith('http') ? input : window.location.origin + '/' + input);
        const room = url.searchParams.get('room');
        const c = url.searchParams.get('color');
        if (room) roomId = room;
        if (c === 'w' || c === 'b') color = c;
      }
    } catch (e) {
      // Not a URL or invalid URL, treat as room ID directly
    }

    if (roomId.length < 4) {
      setJoinError('Invalid room ID');
      return;
    }
    
    // If no color specified, default to 'b' for someone joining
    window.location.href = getRoomUrl(roomId, color || 'b');
  };
  return (
    <div className="min-h-screen w-full bg-gray-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background board pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        aria-hidden="true">

        <div className="grid grid-cols-8 w-full h-full">
          {Array.from({
            length: 64
          }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isLight = (row + col) % 2 === 0;
            return (
              <div
                key={i}
                className={isLight ? 'bg-white' : 'bg-transparent'} />);


          })}
        </div>
      </div>

      {/* Decorative chess pieces */}
      <div
        className="absolute top-8 left-8 text-8xl opacity-5 select-none pointer-events-none"
        aria-hidden="true">

        ♜
      </div>
      <div
        className="absolute bottom-8 right-8 text-8xl opacity-5 select-none pointer-events-none"
        aria-hidden="true">

        ♖
      </div>
      <div
        className="absolute top-1/4 right-12 text-6xl opacity-5 select-none pointer-events-none"
        aria-hidden="true">

        ♛
      </div>
      <div
        className="absolute bottom-1/4 left-12 text-6xl opacity-5 select-none pointer-events-none"
        aria-hidden="true">

        ♕
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/50">
              <span className="text-2xl">♞</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              ChessLink
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Play chess with anyone, anywhere
          </p>
        </div>

        {/* Main card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Quick settings */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-800">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Match Settings
            </h2>

            {/* Time control */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon size={13} className="text-amber-400" />
                <span className="text-xs text-gray-400 font-medium">
                  Time Control
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedTime(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedTime === null ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'}`}>

                  No limit
                </button>
                {TIME_CONTROLS.map((tc) =>
                <button
                  key={tc.label}
                  onClick={() => setSelectedTime(tc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedTime?.label === tc.label ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600'}`}>

                    {tc.label}
                  </button>
                )}
              </div>
            </div>

            {/* Board theme */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PaletteIcon size={13} className="text-amber-400" />
                <span className="text-xs text-gray-400 font-medium">
                  Board Theme
                </span>
              </div>
              <div className="flex gap-2">
                {BOARD_THEMES.map((theme) => {
                  const colors = boardThemeColors[theme.id];
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${selectedTheme === theme.id ? 'border-amber-500 bg-amber-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>

                      <div className="grid grid-cols-2 w-8 h-8 rounded overflow-hidden">
                        <div
                          style={{
                            backgroundColor: colors.light
                          }} />

                        <div
                          style={{
                            backgroundColor: colors.dark
                          }} />

                        <div
                          style={{
                            backgroundColor: colors.dark
                          }} />

                        <div
                          style={{
                            backgroundColor: colors.light
                          }} />

                      </div>
                      <span
                        className={`text-xs ${selectedTheme === theme.id ? 'text-amber-300' : 'text-gray-500'}`}>

                        {theme.label}
                      </span>
                    </button>);

                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 space-y-3">
            <button
              onClick={handleCreateMatch}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/40 hover:shadow-amber-900/60 active:scale-[0.98]">

              <span className="text-lg">♟</span>
              <span>Create New Match</span>
              <ArrowRightIcon size={16} />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-900 px-3 text-xs text-gray-600">
                  or join existing
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => {
                    setJoinInput(e.target.value);
                    setJoinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinMatch();
                  }}
                  placeholder="Paste room link or ID..."
                  className="flex-1 bg-gray-800 border border-gray-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors" />

                <button
                  onClick={handleJoinMatch}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 rounded-xl text-white transition-all"
                  aria-label="Join match">

                  <LinkIcon size={16} />
                </button>
              </div>
              {joinError &&
              <p className="text-red-400 text-xs px-1">{joinError}</p>
              }
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl">🔗</div>
            <p className="text-xs text-gray-500">Create & share a link</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">👥</div>
            <p className="text-xs text-gray-500">Friend opens the link</p>
          </div>
          <div className="space-y-1">
            <div className="text-2xl">♟</div>
            <p className="text-xs text-gray-500">Play instantly</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">
          No account needed · Works in any browser
        </p>
      </div>
    </div>);

}