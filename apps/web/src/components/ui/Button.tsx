import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all focus:outline-none opacity-50 hover:opacity-100 border-2 font-stencil';

  const variants = {
    primary:
      'bg-military-red text-paper-light border-ink hover:bg-red-500 shadow-[4px_4px_0px_0px_rgba(44,36,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(44,36,27,1)]',
    secondary:
      'bg-military-navy text-paper-light border-ink hover:bg-blue-900 shadow-[4px_4px_0px_0px_rgba(44,36,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(44,36,27,1)]',
    outline:
      'bg-transparent border-ink text-ink hover:bg-ink/10',
    ghost:
      'bg-transparent border-transparent text-ink-faded hover:text-ink hover:bg-ink/5',
    danger:
      'bg-red-800 text-paper-light border-ink hover:bg-red-900',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-12 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </motion.button>
  );
}
