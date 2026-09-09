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
    hover || isClickable
      ? 'hover:border-[rgba(220,38,38,0.4)] hover:bg-[#18181C] cursor-pointer'
      : '';

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseStyle} ${hoverStyle} text-left w-full block ${className}`}
        style={style}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

