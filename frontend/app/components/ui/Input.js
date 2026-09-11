'use client';
import { forwardRef, useId } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon,
    className = '',
    type = 'text',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[rgba(255,255,255,0.7)] select-none"
          className="text-xs font-medium text-zinc-300 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-[rgba(255,255,255,0.4)] pointer-events-none">
          <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full bg-[#1E1E22] text-[rgba(255,255,255,0.96)] placeholder-[rgba(255,255,255,0.35)] text-base rounded-[14px] px-4 py-3 min-h-[46px] transition-all border outline-none ${
            icon ? 'pl-11' : ''
          className={`w-full bg-[#14161F] text-zinc-100 placeholder-zinc-500 text-sm rounded-xl px-3.5 py-2.5 min-h-[42px] transition-[border-color,box-shadow] duration-150 border outline-none ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
              : 'border-[rgba(255,255,255,0.08)] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/50'
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              : 'border-[#232838] hover:border-[#2F364C] focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <span className="text-xs text-[#EF4444]">{error}</span>
        <span className="text-xs text-rose-400 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-[rgba(255,255,255,0.45)]">{helperText}</span>
        <span className="text-xs text-zinc-500">{helperText}</span>
      ) : null}
    </div>
  );
});

