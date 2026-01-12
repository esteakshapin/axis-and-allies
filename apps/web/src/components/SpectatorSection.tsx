import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  color: string;
  team: 'axis' | 'allies' | null;
  assignedCountries: string[];
}

interface SpectatorSectionProps {
  spectators: Player[];
  currentPlayerId: string;
  onPlayerDragStart: (playerId: string) => void;
  onPlayerDrop: (playerId: string) => void;
}

export function SpectatorSection({
  spectators,
  currentPlayerId,
  onPlayerDragStart,
  onPlayerDrop,
}: SpectatorSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const playerId = e.dataTransfer.getData('text/plain');
    if (playerId) {
      onPlayerDrop(playerId);
    }
  };

  return (
    <div
      className={`bg-paper-aged/50 border-2 border-dashed border-ink/30 rounded-lg p-4 transition-all ${
        isDragOver ? 'ring-2 ring-military-khaki bg-paper-aged/70 scale-[1.01]' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-3">
        <Eye size={16} className="text-ink-faded" />
        <span className="font-stencil text-sm uppercase tracking-widest text-ink-faded">
          Spectators / Unassigned {isDragOver && '(Drop to leave team)'}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 min-h-[40px]">
        {spectators.length === 0 ? (
          <span className="text-xs font-typewriter text-ink-faded italic">
            {isDragOver ? 'Drop here to leave your team' : 'All players assigned to teams'}
          </span>
        ) : (
          spectators.map((player) => (
            <div
              key={player.id}
              draggable={player.id === currentPlayerId}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', player.id);
                e.dataTransfer.effectAllowed = 'move';
                onPlayerDragStart(player.id);
              }}
            >
              <motion.div
                whileHover={player.id === currentPlayerId ? { scale: 1.05 } : {}}
                whileTap={player.id === currentPlayerId ? { scale: 0.95 } : {}}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded
                  border-2 border-ink/20 bg-paper-light
                  ${player.id === currentPlayerId ? 'cursor-grab active:cursor-grabbing ring-2 ring-military-khaki' : ''}
                `}
              >
                <div className={`w-3 h-3 rounded-full ${player.color}`} />
                <span className="font-typewriter text-sm text-ink">
                  {player.name}
                  {player.id === currentPlayerId && (
                    <span className="text-ink-faded ml-1">(You)</span>
                  )}
                </span>
              </motion.div>
            </div>
          ))
        )}
      </div>

      {spectators.some((s) => s.id === currentPlayerId) && (
        <p className="mt-3 text-xs font-typewriter text-ink-faded italic">
          Drag yourself to the Axis or Allied section to join a team
        </p>
      )}
    </div>
  );
}
