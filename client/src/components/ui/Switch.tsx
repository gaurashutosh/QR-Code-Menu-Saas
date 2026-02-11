'use client';

import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  onLabel?: string;
  offLabel?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  onLabel = 'Available',
  offLabel = 'Unavailable',
  className = '',
}: SwitchProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
          checked ? 'bg-green-600 dark:bg-green-700' : 'bg-gray-200 dark:bg-zinc-800'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-200 shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {(onLabel || offLabel) && (
        <span className={`text-xs font-medium ${checked ? 'text-green-700 dark:text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
          {checked ? onLabel : offLabel}
        </span>
      )}
    </div>
  );
}
