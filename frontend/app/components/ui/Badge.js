'use client';

export function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'danger' | 'warning' | 'accent' | 'purple'
  size = 'md', // 'sm' | 'md'
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantClasses = {
    default: 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.8)]',
    accent: 'bg-[#DC2626]/20 text-[#F87171] border border-[#DC2626]/30',
    success: 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30',
    danger: 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30',
    warning: 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30',
    purple: 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

