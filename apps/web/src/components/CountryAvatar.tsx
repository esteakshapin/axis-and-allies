import React from 'react';
import { motion } from 'framer-motion';

export type CountryStatus = 'available' | 'assigned' | 'locked';

interface CountryAvatarProps {
  id: string;
  name: string;
  flagImage: string;
  status: CountryStatus;
  size?: 'sm' | 'md' | 'lg';
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function CountryAvatar({
  id,
  name,
  flagImage,
  status,
  size = 'md',
  isDraggable = false,
  onDragStart,
  onDragEnd,
}: CountryAvatarProps) {
  const sizes = {
    sm: { container: 'w-8 h-8', img: 'w-6 h-6' },
    md: { container: 'w-12 h-12', img: 'w-10 h-10' },
    lg: { container: 'w-16 h-16', img: 'w-14 h-14' },
  };

  const statusStyles = {
    available: 'border-ink/50 bg-paper-light hover:border-ink hover:bg-paper',
    assigned: 'border-military-green bg-military-green/20',
    locked: 'border-ink-faded/30 bg-ink-faded/10 opacity-50',
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e);
  };

  const canDrag = isDraggable && status === 'available';

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      title={name}
    >
      <motion.div
        whileHover={canDrag ? { scale: 1.1 } : {}}
        whileTap={canDrag ? { scale: 0.95 } : {}}
        className={`
          ${sizes[size].container}
          ${statusStyles[status]}
          rounded-full border-2
          flex items-center justify-center
          transition-all duration-200
          ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
      >
        <img
          src={flagImage}
          alt={name}
          className={`${sizes[size].img} rounded-full object-cover select-none pointer-events-none`}
        />
      </motion.div>
    </div>
  );
}

interface CountryAvatarWithLabelProps extends CountryAvatarProps {
  showLabel?: boolean;
}

export function CountryAvatarWithLabel({
  showLabel = true,
  name,
  ...props
}: CountryAvatarWithLabelProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <CountryAvatar name={name} {...props} />
      {showLabel && (
        <span className="text-xs font-typewriter text-ink-faded uppercase tracking-wider">
          {name}
        </span>
      )}
    </div>
  );
}
