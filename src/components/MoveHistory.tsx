import React, { useEffect, useRef } from 'react';
interface MoveHistoryProps {
  moves: string[];
  currentMoveIndex?: number;
}
export function MoveHistory({ moves, currentMoveIndex }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);
  const movePairs: {
    white: string;
    black: string | null;
    index: number;
  }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      white: moves[i],
      black: moves[i + 1] || null,
      index: Math.floor(i / 2)
    });
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Moves
        </span>
        <span className="text-xs text-gray-600">{moves.length} half-moves</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin"
        style={{
          maxHeight: '200px'
        }}>

        {movePairs.length === 0 ?
        <div className="flex items-center justify-center h-12">
            <span className="text-xs text-gray-600 italic">No moves yet</span>
          </div> :

        <div className="space-y-0.5">
            {movePairs.map((pair) => {
            const whiteIdx = pair.index * 2;
            const blackIdx = pair.index * 2 + 1;
            return (
              <div
                key={pair.index}
                className="flex items-center gap-1 text-sm">

                  <span className="text-gray-600 w-6 text-right flex-shrink-0 text-xs">
                    {pair.index + 1}.
                  </span>
                  <span
                  className={`
                      flex-1 px-2 py-0.5 rounded font-mono text-xs
                      ${currentMoveIndex === whiteIdx ? 'bg-amber-600/30 text-amber-300' : 'text-gray-300 hover:bg-gray-800'}
                    `}>

                    {pair.white}
                  </span>
                  <span
                  className={`
                      flex-1 px-2 py-0.5 rounded font-mono text-xs
                      ${pair.black ? currentMoveIndex === blackIdx ? 'bg-amber-600/30 text-amber-300' : 'text-gray-300 hover:bg-gray-800' : ''}
                    `}>

                    {pair.black || ''}
                  </span>
                </div>);

          })}
          </div>
        }
      </div>
    </div>);

}