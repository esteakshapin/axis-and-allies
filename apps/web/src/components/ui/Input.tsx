import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className = '', label, id, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-bold text-ink uppercase tracking-widest font-stencil"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3
          bg-paper-light
          border-2 border-ink
          text-ink
          font-typewriter uppercase tracking-wider
          placeholder:text-ink-faded placeholder:uppercase
          focus:outline-none focus:ring-2 focus:ring-ink/30 focus:border-ink
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
    </div>
  );
}
