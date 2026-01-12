import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function Select({ options, value, onChange, label, className = '' }: SelectProps) {
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-bold text-ink uppercase tracking-widest font-stencil"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3
          bg-paper-light
          border-2 border-ink
          text-ink
          font-typewriter uppercase tracking-wider
          focus:outline-none focus:ring-2 focus:ring-ink/30 focus:border-ink
          transition-all duration-200
          cursor-pointer
          appearance-none
          bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%232c241b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")]
          bg-no-repeat bg-[right_12px_center]
          ${className}
        `}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
