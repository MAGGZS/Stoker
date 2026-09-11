'use client';

export function Card({
  children,
  className = '',
  onClick,
  hover = false,
  ...props
}) {
  const isClickable = Boolean(onClick);

  const hoverClass =
    hover || isClickable
      ? 'hover:border-[#2F364C] hover:bg-[#181B26] active:scale-[0.99] cursor-pointer'
      : '';

  if (isClickable) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        }}
        className={`bg-[#14161F] border border-[#232838] rounded-2xl p-4 sm:p-5 transition-[background-color,border-color,transform] duration-150 text-left outline-none ${hoverClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`bg-[#14161F] border border-[#232838] rounded-2xl p-4 sm:p-5 transition-[background-color,border-color] duration-150 ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

