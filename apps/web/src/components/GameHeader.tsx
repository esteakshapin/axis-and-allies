import { Star, Globe } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

interface GameHeaderProps {
  gameName?: string;
  turn?: number;
  phase?: string;
  activePlayer?: {
    name: string;
    color: string;
  };
}

export function GameHeader({
  gameName = 'Axis & Allies Global 1940',
  turn = 1,
  phase = 'Combat Move',
  activePlayer = {
    name: 'Player 1',
    color: 'bg-military-red',
  },
}: GameHeaderProps) {
  return (
    <header className="h-16 bg-ink text-paper-light border-b-4 border-military-red flex items-center justify-between px-4 shadow-lg relative z-50">
      {/* Left: Game Title */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-military-khaki rounded-full text-ink">
          <Star size={20} fill="currentColor" />
        </div>
        <h1 className="font-stencil font-bold uppercase tracking-widest text-lg md:text-xl text-military-khaki hidden md:block">
          {gameName}
        </h1>
        <h1 className="font-stencil font-bold uppercase tracking-widest text-lg md:text-xl text-military-khaki md:hidden">
          A&A 1940
        </h1>
      </div>

      {/* Center: Game Status */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-ink-faded uppercase tracking-widest font-stencil">
            Turn
          </span>
          <span className="font-typewriter font-bold text-lg leading-none">
            {turn}
          </span>
        </div>

        <div className="h-8 w-px bg-white/20" />

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-ink-faded uppercase tracking-widest font-stencil">
            Phase
          </span>
          <span className="font-typewriter font-bold text-sm leading-none text-military-khaki uppercase">
            {phase}
          </span>
        </div>
      </div>

      {/* Right: Stats & Player */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-4 text-xs font-typewriter text-ink-faded/80">
          <div className="flex items-center gap-1.5">
            <Globe size={14} />
            <span>208 Land</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 bg-current rounded-full" />
            <span>128 Sea Zones</span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/20 hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-ink-faded uppercase tracking-widest font-stencil">
              Commander
            </div>
            <div className="font-bold font-typewriter text-sm leading-none">
              {activePlayer.name}
            </div>
          </div>
          <PlayerAvatar
            name={activePlayer.name}
            color={activePlayer.color}
            size="sm"
            className="border-paper-light"
          />
        </div>
      </div>
    </header>
  );
}
