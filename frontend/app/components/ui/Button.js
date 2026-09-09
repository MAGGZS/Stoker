'use client';
import { forwardRef } from 'react';

export const Button = forwardRef(function Button(
  {
    children,
    type = 'button',
    variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
    size = 'md', // 'sm' | 'md' | 'lg'
    loading = false,
    disabled = false,
    className = '',
    style = {},
    icon,
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[14px] cursor-pointer outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'text-xs px-3 py-2 gap-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-base px-5 py-3 gap-2.5 min-h-[50px]',
  };

  const variantClasses = {
    primary:
      'bg-[#DC2626] hover:bg-[#EF4444] text-white shadow-[0_2px_10px_rgba(220,38,38,0.25)] active:scale-[0.98]',
    secondary:
      'bg-[#1E1E22] hover:bg-[#2A2A30] text-[rgba(255,255,255,0.92)] border border-[rgba(255,255,255,0.08)] active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.8)] active:scale-[0.98]',
    danger:
      'bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/20 active:scale-[0.98]',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
});

