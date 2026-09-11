'use client';
import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    options = [],
    className = '',
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium text-zinc-300 select-none"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-[#14161F] text-zinc-100 text-sm rounded-xl px-3.5 py-2.5 pr-10 min-h-[42px] transition-[border-color,box-shadow] duration-150 border outline-none appearance-none cursor-pointer ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
              : 'border-[#232838] hover:border-[#2F364C] focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#14161F] text-zinc-200 py-2"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 text-zinc-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>

      {error ? (
        <span className="text-xs text-rose-400 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-zinc-500">{helperText}</span>
      ) : null}
    </div>
  );
});

