import { motion } from 'framer-motion';

interface PlayerAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

export function PlayerAvatar({
  name,
  color,
  size = 'md',
  className = '',
  showName = false,
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <div
        className={`
          ${sizeClasses[size]}
          ${color}
          rounded-full
          flex items-center justify-center
          font-stencil font-bold
          text-paper-light
          border-2 border-paper-light/30
          shadow-md
        `}
      >
        {initial}
      </div>
      {showName && (
        <span className="font-typewriter text-sm">{name}</span>
      )}
    </motion.div>
  );
}
