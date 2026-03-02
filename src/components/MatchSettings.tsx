import React, { useState } from 'react';
import type {
  MatchSettings,
  BoardTheme,
  PieceStyle,
  TimeControl } from
'../types/chess';
import { TIME_CONTROLS, boardThemeColors } from '../utils/chessUtils';
import { XIcon, ClockIcon, PaletteIcon, TypeIcon, UserIcon } from 'lucide-react';
interface MatchSettingsProps {
  settings: MatchSettings;
  onSettingsChange: (settings: MatchSettings) => void;
  onClose: () => void;
  isOpen: boolean;
}
const THEME_LABELS: Record<BoardTheme, string> = {
  classic: 'Classic',
  dark: 'Dark',
  forest: 'Forest',
  ocean: 'Ocean'
};
export function MatchSettings({
  settings,
  onSettingsChange,
  onClose,
  isOpen
}: MatchSettingsProps) {
  const [local, setLocal] = useState<MatchSettings>(settings);
  if (!isOpen) return null;
  const handleSave = () => {
    onSettingsChange(local);
    onClose();
  };
  const setTimeControl = (tc: TimeControl | null) => {
    setLocal((prev) => ({
      ...prev,
      timeControl: tc
    }));
  };
  const setTheme = (theme: BoardTheme) => {
    setLocal((prev) => ({
      ...prev,
      boardTheme: theme
    }));
  };
  const setPieceStyle = (style: PieceStyle) => {
    setLocal((prev) => ({
      ...prev,
      pieceStyle: style
    }));
  };
  const setPlayerName = (color: 'w' | 'b', name: string) => {
    setLocal((prev) => ({
      ...prev,
      playerNames: {
        ...prev.playerNames,
        [color]: name
      }
    }));
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0,0,0,0.7)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Match Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close settings">

            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Player Names */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <UserIcon size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Player Names
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-white flex-shrink-0" />
                <input
                  type="text"
                  value={local.playerNames.w}
                  onChange={(e) => setPlayerName('w', e.target.value)}
                  placeholder="White player"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors" />

              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-gray-900 border-2 border-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  value={local.playerNames.b}
                  onChange={(e) => setPlayerName('b', e.target.value)}
                  placeholder="Black player"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors" />

              </div>
            </div>
          </section>

          {/* Time Control */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Time Control
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setTimeControl(null)}
                className={`
                  px-2 py-2 rounded-lg text-xs font-medium transition-all border
                  ${local.timeControl === null ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
                `}>

                None
              </button>
              {TIME_CONTROLS.map((tc) =>
              <button
                key={tc.label}
                onClick={() => setTimeControl(tc)}
                className={`
                    px-2 py-2 rounded-lg text-xs font-medium transition-all border
                    ${local.timeControl?.label === tc.label ? 'bg-amber-600 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'}
                  `}>

                  {tc.label}
                </button>
              )}
            </div>
          </section>

          {/* Board Theme */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <PaletteIcon size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Board Theme
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(THEME_LABELS) as BoardTheme[]).map((theme) => {
                const colors = boardThemeColors[theme];
                return (
                  <button
                    key={theme}
                    onClick={() => setTheme(theme)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all
                      ${local.boardTheme === theme ? 'border-amber-500 bg-amber-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}
                    `}>

                    {/* Mini board preview */}
                    <div className="grid grid-cols-2 w-8 h-8 rounded overflow-hidden flex-shrink-0">
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
                      className={`text-sm font-medium ${local.boardTheme === theme ? 'text-amber-300' : 'text-gray-300'}`}>

                      {THEME_LABELS[theme]}
                    </span>
                  </button>);

              })}
            </div>
          </section>

          {/* Piece Style */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TypeIcon size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Piece Style
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPieceStyle('unicode')}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all
                  ${local.pieceStyle === 'unicode' ? 'border-amber-500 bg-amber-900/20 text-amber-300' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}
                `}>

                <span className="text-xl">♟</span>
                <span className="text-sm font-medium">Unicode</span>
              </button>
              <button
                onClick={() => setPieceStyle('letters')}
                className={`
                  flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all
                  ${local.pieceStyle === 'letters' ? 'border-amber-500 bg-amber-900/20 text-amber-300' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}
                `}>

                <span className="text-lg font-bold">K</span>
                <span className="text-sm font-medium">Letters</span>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors">

            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors">

            Apply Settings
          </button>
        </div>
      </div>
    </div>);

}