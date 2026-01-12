import { motion } from 'framer-motion';
import {
  MapPin,
  Shield,
  Activity,
  Grid,
  Swords,
  Map as MapIcon,
} from 'lucide-react';

export interface UnitType {
  type:
    | 'infantry'
    | 'artillery'
    | 'tank'
    | 'fighter'
    | 'bomber'
    | 'submarine'
    | 'destroyer'
    | 'carrier'
    | 'battleship'
    | 'transport'
    | 'aa-gun'
    | 'factory';
  count: number;
}

export interface TerritoryData {
  id: string;
  name: string;
  type: 'Land Territory' | 'Sea Zone';
  ipcValue: number;
  originalOwner: string;
  neighbors: string[];
  units?: UnitType[];
  polygons: {
    count: number;
    totalVertices: number;
    center: [number, number];
  };
}

interface TerritoryInfoPanelProps {
  territory?: TerritoryData | null;
  className?: string;
  onNeighborClick?: (neighborId: string) => void;
}

// Unit type to icon/emoji mapping
const UNIT_ICONS: Record<UnitType['type'], string> = {
  infantry: '🪖',
  artillery: '🎯',
  tank: '🛡️',
  fighter: '✈️',
  bomber: '🛩️',
  submarine: '🚢',
  destroyer: '⚓',
  carrier: '🛳️',
  battleship: '⛴️',
  transport: '🚤',
  'aa-gun': '🎯',
  factory: '🏭',
};

const UNIT_LABELS: Record<UnitType['type'], string> = {
  infantry: 'Infantry',
  artillery: 'Artillery',
  tank: 'Tank',
  fighter: 'Fighter',
  bomber: 'Bomber',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
  carrier: 'Carrier',
  battleship: 'Battleship',
  transport: 'Transport',
  'aa-gun': 'AA Gun',
  factory: 'Factory',
};

export function TerritoryInfoPanel({
  territory,
  className = '',
  onNeighborClick,
}: TerritoryInfoPanelProps) {
  if (!territory) {
    return (
      <div
        className={`w-80 md:w-96 bg-paper-light border-l-4 border-ink flex flex-col h-full relative ${className}`}
      >
        <div className="absolute inset-0 bg-paper-texture opacity-50 pointer-events-none" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
          <MapIcon size={48} className="text-ink mb-4" />
          <p className="font-stencil text-xl uppercase tracking-widest text-ink">
            Select Territory
          </p>
          <p className="font-typewriter text-sm mt-2 text-ink-faded">
            Click on a region to view strategic intelligence
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{
        x: 20,
        opacity: 0,
      }}
      animate={{
        x: 0,
        opacity: 1,
      }}
      className={`w-80 md:w-96 bg-paper-light border-l-4 border-ink flex flex-col h-full relative shadow-[-10px_0_20px_rgba(0,0,0,0.1)] ${className}`}
    >
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-paper-texture opacity-50 pointer-events-none" />

      {/* Decorative Paper Clip */}
      <div className="absolute -top-3 right-8 z-20">
        <div className="w-4 h-12 border-2 border-zinc-400 rounded-full bg-transparent shadow-sm transform rotate-3" />
        <div className="w-4 h-8 border-2 border-zinc-400 rounded-full bg-transparent absolute top-0 left-0 transform rotate-3 border-t-0" />
      </div>

      {/* Header Section */}
      <div className="p-6 border-b-2 border-ink/20 relative z-10 bg-paper-aged/30">
        <div className="absolute top-4 right-4 opacity-10 transform rotate-12">
          <div className="border-2 border-ink rounded-full p-2">
            <Shield size={40} />
          </div>
        </div>

        <h2 className="text-3xl font-stencil font-bold uppercase tracking-wider text-military-red mb-1 break-words">
          {territory.name}
        </h2>
        <div className="flex items-center gap-2 text-ink-faded">
          <MapPin size={14} />
          <span className="font-typewriter text-xs uppercase tracking-widest">
            Sector {territory.id}
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar">
        {/* INFO Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ink/20 pb-1 mb-2">
            <Activity size={16} className="text-ink" />
            <h3 className="font-stencil text-sm font-bold uppercase tracking-widest text-ink">
              Strategic Info
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-paper-aged p-3 border border-ink/10 shadow-sm">
              <span className="block text-[10px] uppercase tracking-widest text-primary font-stencil mb-1 font-bold">
                Type
              </span>
              <span className="font-typewriter font-bold text-ink">
                {territory.type}
              </span>
            </div>

            <div className="bg-paper-aged p-3 border border-ink/10 shadow-sm">
              <span className="block text-[10px] uppercase tracking-widest text-ink/60 font-stencil mb-1 font-bold">
                IPC Value
              </span>
              <span className="font-typewriter font-bold text-ink">
                {territory.ipcValue}
              </span>
            </div>

            <div className="col-span-2 bg-paper-aged p-3 border border-ink/10 shadow-sm">
              <span className="block text-[10px] uppercase tracking-widest text-ink/60 font-stencil mb-1 font-bold">
                Original Owner
              </span>
              <span className="font-typewriter font-bold text-ink uppercase">
                {territory.originalOwner}
              </span>
            </div>
          </div>
        </section>

        {/* UNITS Section */}
        {territory.units && territory.units.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 border-b border-ink/20 pb-1 mb-2">
              <Swords size={16} className="text-ink" />
              <h3 className="font-stencil text-sm font-bold uppercase tracking-widest text-ink">
                Military Forces
              </h3>
            </div>

            <div className="bg-paper-aged p-4 border border-ink/10 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                {territory.units.map((unit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-paper-light p-2 border border-ink/10 shadow-sm"
                  >
                    <span className="text-2xl">{UNIT_ICONS[unit.type]}</span>
                    <div className="flex-1">
                      <div className="font-typewriter text-[10px] text-ink/70 uppercase font-bold tracking-wide">
                        {UNIT_LABELS[unit.type]}
                      </div>
                      <div className="font-stencil text-lg font-bold text-ink">
                        {unit.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* NEIGHBORS Section - Pill Design */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-ink/20 pb-1 mb-2">
            <Grid size={16} className="text-ink" />
            <h3 className="font-stencil text-sm font-bold uppercase tracking-widest text-ink">
              Neighbors ({territory.neighbors.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {territory.neighbors.map((neighbor, idx) => (
              <motion.button
                key={idx}
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() => onNeighborClick?.(neighbor)}
                className="
                  px-4 py-2
                  bg-ink/90 text-paper-light
                  rounded-full
                  font-typewriter text-sm
                  hover:bg-military-red
                  transition-colors
                  cursor-pointer
                  border border-ink
                  shadow-sm
                "
              >
                {neighbor}
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Stamp */}
      <div className="p-4 border-t border-ink/20 bg-paper-aged/50 text-center relative z-10">
        <span className="font-stencil text-[10px] uppercase tracking-[0.2em] text-ink-faded opacity-70">
          Top Secret • Eyes Only
        </span>
      </div>
    </motion.div>
  );
}
