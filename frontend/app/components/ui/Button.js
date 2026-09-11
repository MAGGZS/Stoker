'use client';
import { forwardRef } from 'react';

export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    className = '',
    onClick,
    ...props
  },
  ref
) {
  const baseClasses =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-[transform,background-color,border-color,color] duration-150 outline-none select-none disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0D11]';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[34px]',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2 min-h-[40px]',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 min-h-[46px]',
  };

  const variantClasses = {
    primary:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 active:scale-[0.98]',
    secondary:
      'bg-[#14161F] hover:bg-[#1A1E29] text-zinc-200 border border-[#232838] hover:border-[#2F364C] active:scale-[0.98]',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950/40 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-[#14161F] text-zinc-400 hover:text-zinc-100 active:scale-[0.98]',
    outline:
      'bg-transparent border border-[#232838] hover:border-[#2F364C] text-zinc-200 hover:bg-[#14161F] active:scale-[0.98]',
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
});

