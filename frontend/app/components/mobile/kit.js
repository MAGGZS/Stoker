'use client';
import { useId } from 'react';
import { T, R } from '../../lib/theme';
import { Select } from '../ui/Select';

export const RESPIRO_TOPO = 'calc(16px + env(safe-area-inset-top))';

/**
 * Container base da tela mobile: cuida do respiro do notch e da barra de navegação inferior.
 */
export function MPage({ children, pad = true, className = '' }) {
  return (
    <main
      className={`min-h-screen pb-[100px] overflow-x-clip bg-[#0B0B0C] text-[rgba(255,255,255,0.95)] ${className}`}
    >
      <div className="anim-pop-in" style={{ padding: pad ? '0 16px' : 0 }}>
        {children}
      </div>
    </main>
  );
}

/**
 * Barra de topo mobile com logo/título e ações redondas à direita.
 */
export function MTopBar({ eyebrow, title, accent, actions, leftAction, className = '' }) {
  return (
    <header
      className={`flex items-center gap-3 pt-[calc(16px+env(safe-area-inset-top))] pb-4 ${className}`}
    >
      {leftAction}
      <div className="flex-1 min-w-0">
        {eyebrow && <p className="text-[11px] font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-wider mb-0.5">{eyebrow}</p>}
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
          <span>{title}</span>
          {accent && <span className="text-[#DC2626] font-semibold">{accent}</span>}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/**
 * Botão redondo de ação rápida no topo.
 */
export function MRound({ children, onClick, active = false, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
        active
          ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-[0_2px_10px_rgba(220,38,38,0.3)]'
          : 'bg-[#1E1E22] text-[rgba(255,255,255,0.8)] border-[rgba(255,255,255,0.08)] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Cartão de conteúdo mobile com toque ativo.
 */
export function MCard({ children, style = {}, onClick, className = '', label }) {
  const baseClass =
    'bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 transition-all';

  if (!onClick) {
    return (
      <div className={`${baseClass} ${className}`} style={style}>
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${baseClass} text-left w-full block active:scale-[0.99] cursor-pointer hover:border-[rgba(220,38,38,0.4)] ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

/**
 * Grade de estatísticas/contadores em colunas.
 */
export function MStats({ items = [] }) {
  return (
    <div
      className="grid gap-2 my-2"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map(({ value, label, highlight }) => (
        <div
          key={label}
          className="bg-[#1E1E22] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3 text-center flex flex-col justify-center"
        >
          <p
            className={`text-lg font-bold tracking-tight leading-tight ${
              highlight ? 'text-[#DC2626]' : 'text-white'
            }`}
          >
            {value}
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-1 font-medium leading-tight">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function MButton({ children, onClick, type = 'button', disabled, loading, style = {}, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3.5 px-4 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 bg-[#DC2626] hover:bg-[#EF4444] text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer ${className}`}
      style={style}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

export function MButtonSoft({ children, onClick, type = 'button', disabled, loading, style = {}, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-3.5 px-4 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 bg-[#1E1E22] hover:bg-[#2A2A30] text-[rgba(255,255,255,0.9)] border border-[rgba(255,255,255,0.08)] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

export function MSectionHead({ title, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 mt-6 mb-3 ${className}`}>
      <h2 className="text-sm font-semibold tracking-wide text-white uppercase text-[rgba(255,255,255,0.7)]">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function MPill({ children, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
        active
          ? 'bg-[#DC2626] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)]'
          : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function MField({ label, error, style = {}, ...props }) {
  const generatedId = useId();
  const fieldId = props.id ?? props.name ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label htmlFor={fieldId} className="text-xs font-medium text-[rgba(255,255,255,0.65)]">{label}</label>}
      <input
        id={fieldId}
        className={`w-full bg-[#1E1E22] text-[rgba(255,255,255,0.96)] text-base rounded-[14px] px-4 py-3 border outline-none transition-all ${
          error ? 'border-[#EF4444]' : 'border-[rgba(255,255,255,0.08)] focus:border-[#DC2626]'
        }`}
        style={style}
        {...props}
      />
      {error && <span className="text-xs text-[#EF4444]">{error}</span>}
    </div>
  );
}

export function MSelect({ label, error, options = [], ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-xs font-medium text-[rgba(255,255,255,0.65)]">{label}</span>}
      <Select options={options} error={error} {...props} />
    </div>
  );
}

