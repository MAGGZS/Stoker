'use client';

export function Card({
  children,
  className = '',
  onClick,
  style = {},
  hover = false,
  ...props
}) {
  const isClickable = Boolean(onClick);

  const baseStyle =
    'bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 sm:p-5 transition-all';
  const hoverStyle =
  const hoverClass =
    hover || isClickable
      ? 'hover:border-[rgba(220,38,38,0.4)] hover:bg-[#18181C] cursor-pointer'
      ? 'hover:border-[#2F364C] hover:bg-[#181B26] active:scale-[0.99] cursor-pointer'
      : '';

  if (isClickable) {
    return (
      <button
        type="button"
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        className={`${baseStyle} ${hoverStyle} text-left w-full block ${className}`}
        style={style}
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
      </button>
      </div>
    );
  }

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${className}`}
      style={style}
      className={`bg-[#14161F] border border-[#232838] rounded-2xl p-4 sm:p-5 transition-[background-color,border-color] duration-150 ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

