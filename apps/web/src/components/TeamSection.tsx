import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Swords, Crown } from 'lucide-react';
import { CountryAvatar, CountryStatus } from './CountryAvatar';

interface Country {
  id: string;
  name: string;
  flagImage: string;
  status: CountryStatus;
  assignedToPlayer?: string; // Player name
}

interface Player {
  id: string;
  name: string;
  color: string;
  team: 'axis' | 'allies' | null;
  assignedCountries: string[];
  connected?: boolean;
  isHost?: boolean;
}

interface TeamSectionProps {
  team: 'axis' | 'allies';
  countries: Country[];
  players: Player[];
  currentPlayerId: string;
  currentPlayerTeam: 'axis' | 'allies' | null;
  onCountryDragStart: (countryId: string) => void;
  onCountryDrop: (countryId: string, playerId: string) => void;
  onCountryUnassign: (countryId: string) => void;
  onPlayerDrop: (playerId: string) => void;
}

export function TeamSection({
  team,
  countries,
  players,
  currentPlayerId,
  currentPlayerTeam,
  onCountryDragStart,
  onCountryDrop,
  onCountryUnassign,
  onPlayerDrop,
}: TeamSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAvailableZoneDragOver, setIsAvailableZoneDragOver] = useState(false);

  const isAxis = team === 'axis';
  const teamColor = isAxis ? 'military-red' : 'military-navy';
  const teamName = isAxis ? 'Axis Powers' : 'Allied Forces';
  const TeamIcon = isAxis ? Swords : Shield;

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
    // Handle player drop (joining team)
    if (currentPlayerTeam === null) {
      onPlayerDrop(currentPlayerId);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: isAxis ? 0.1 : 0.2 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        bg-paper-light border-4 border-ink rounded-lg overflow-hidden
        shadow-[6px_6px_0px_0px_rgba(44,36,27,0.3)]
        transition-all duration-200
        ${isDragOver ? 'ring-4 ring-military-khaki scale-[1.02]' : ''}
      `}
    >
      {/* Team Header */}
      <div className={`bg-${teamColor} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <TeamIcon size={24} className="text-paper-light" />
          <h2 className="font-stencil text-xl uppercase tracking-widest text-paper-light">
            {teamName}
          </h2>
        </div>
        <span className="font-typewriter text-sm text-paper-light/70">
          {players.length} Commander{players.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Countries Row - Only show available (unassigned) countries */}
      {/* This is also a drop zone to unassign countries */}
      <div
        className={`px-4 py-3 border-b border-ink/20 bg-paper-aged/30 transition-all ${
          isAvailableZoneDragOver ? 'ring-2 ring-military-khaki bg-paper-aged/60' : ''
        }`}
        onDragOver={(e) => {
          if (currentPlayerTeam === team) {
            e.preventDefault();
            setIsAvailableZoneDragOver(true);
          }
        }}
        onDragLeave={() => setIsAvailableZoneDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsAvailableZoneDragOver(false);
          const countryId = e.dataTransfer.getData('text/plain');
          if (countryId && currentPlayerTeam === team) {
            onCountryUnassign(countryId);
          }
        }}
      >
        <span className="font-stencil text-xs uppercase tracking-widest text-ink-faded mb-2 block">
          Available Territories {isAvailableZoneDragOver && '(Drop to unassign)'}
        </span>
        <div className="flex flex-wrap gap-3 min-h-[48px]">
          {countries.filter(c => c.status === 'available').length === 0 ? (
            <span className="text-xs font-typewriter text-ink-faded italic">
              {isAvailableZoneDragOver ? 'Drop here to release territory' : 'All territories assigned'}
            </span>
          ) : (
            countries
              .filter((country) => country.status === 'available')
              .map((country) => (
                <CountryAvatar
                  key={country.id}
                  id={country.id}
                  name={country.name}
                  flagImage={country.flagImage}
                  status={country.status}
                  size="md"
                  isDraggable={currentPlayerTeam === team}
                  onDragStart={() => onCountryDragStart(country.id)}
                />
              ))
          )}
        </div>
      </div>

      {/* Players Area */}
      <div className="p-4 min-h-[200px]">
        <span className="font-stencil text-xs uppercase tracking-widest text-ink-faded mb-3 block">
          Commanders
        </span>

        {players.length === 0 ? (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-ink/20 rounded">
            <p className="font-typewriter text-sm text-ink-faded italic">
              Drag a player here to join {teamName}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                countries={countries}
                isCurrentPlayer={player.id === currentPlayerId}
                canReceiveCountries={currentPlayerTeam === team}
                onCountryDrop={(countryId) => onCountryDrop(countryId, player.id)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface PlayerCardProps {
  player: Player;
  countries: Country[];
  isCurrentPlayer: boolean;
  canReceiveCountries: boolean;
  onCountryDrop: (countryId: string) => void;
}

function PlayerCard({
  player,
  countries,
  isCurrentPlayer,
  canReceiveCountries,
  onCountryDrop,
}: PlayerCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const assignedCountries = countries.filter((c) =>
    player.assignedCountries.includes(c.id)
  );

  const handleDragOver = (e: React.DragEvent) => {
    if (canReceiveCountries) {
      e.preventDefault();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const countryId = e.dataTransfer.getData('text/plain');
    if (countryId && canReceiveCountries) {
      onCountryDrop(countryId);
    }
  };

  const isDisconnected = player.connected === false;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        p-3 rounded border-2 transition-all
        ${isCurrentPlayer ? 'border-military-khaki bg-military-khaki/10' : 'border-ink/20 bg-paper'}
        ${isDragOver ? 'ring-2 ring-military-green scale-[1.02]' : ''}
        ${isDisconnected ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          draggable={isCurrentPlayer}
          onDragStart={(e) => {
            if (isCurrentPlayer) {
              e.dataTransfer.setData('text/plain', player.id);
              e.dataTransfer.effectAllowed = 'move';
            }
          }}
          className={`flex items-center gap-2 ${
            isCurrentPlayer ? 'cursor-grab active:cursor-grabbing hover:bg-military-khaki/20 px-2 py-1 -mx-2 -my-1 rounded' : ''
          }`}
        >
          <div className={`w-4 h-4 rounded-full ${player.color} ${isDisconnected ? 'grayscale' : ''}`} />
          <span className={`font-typewriter font-bold ${isDisconnected ? 'text-ink-faded' : 'text-ink'}`}>
            {player.name}
            {player.isHost && (
              <Crown size={14} className="inline ml-1 text-military-khaki" />
            )}
            {isCurrentPlayer && (
              <span className="text-ink-faded font-normal ml-1">(You - drag to leave)</span>
            )}
            {isDisconnected && (
              <span className="text-military-red font-normal ml-1 text-xs">(Offline)</span>
            )}
          </span>
        </div>
      </div>

      {/* Assigned Countries */}
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {assignedCountries.length === 0 ? (
          <span className="text-xs font-typewriter text-ink-faded italic">
            {canReceiveCountries
              ? 'Drag territories here'
              : 'No territories assigned'}
          </span>
        ) : (
          assignedCountries.map((country) => (
            <div
              key={country.id}
              draggable={canReceiveCountries}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', country.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className={`flex items-center gap-1 px-2 py-1 bg-paper-aged rounded border border-ink/20 ${
                canReceiveCountries ? 'cursor-grab active:cursor-grabbing hover:bg-paper-aged/80' : ''
              }`}
            >
              <img
                src={country.flagImage}
                alt={country.name}
                className="w-5 h-5 rounded-full object-cover pointer-events-none"
              />
              <span className="text-xs font-typewriter pointer-events-none">{country.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
