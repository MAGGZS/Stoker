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
      className={`min-h-screen pb-[100px] overflow-x-clip bg-[#0C0D11] text-zinc-100 ${className}`}
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
        {eyebrow && <p className="text-xs font-medium text-zinc-400 mb-0.5">{eyebrow}</p>}
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 truncate">
          <span>{title}</span>
          {accent && <span className="text-[#DC2626] font-semibold">{accent}</span>}
          {accent && <span className="text-rose-500 font-semibold">{accent}</span>}
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
      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
        active
          ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-[0_2px_10px_rgba(220,38,38,0.3)]'
          : 'bg-[#1E1E22] text-[rgba(255,255,255,0.8)] border-[rgba(255,255,255,0.08)] hover:text-white'
          ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/40'
          : 'bg-[#14161F] text-zinc-300 border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
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
    'bg-[#14161F] border border-[#232838] rounded-xl p-4 transition-all';

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
      className={`${baseClass} text-left w-full block active:scale-[0.98] cursor-pointer hover:border-[#2F364C] ${className}`}
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
          className="bg-[#14161F] border border-[#232838] rounded-xl p-3 text-center flex flex-col justify-center"
        >
          <p
            className={`text-lg font-bold tracking-tight leading-tight ${
              highlight ? 'text-[#DC2626]' : 'text-white'
              highlight ? 'text-rose-400' : 'text-zinc-100'
            }`}
          >
            {value}
          </p>
          <p className="text-[11px] text-[rgba(255,255,255,0.5)] mt-1 font-medium leading-tight">
          <p className="text-xs text-zinc-400 mt-1 font-medium leading-tight">
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
      className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 active:scale-[0.98] disabled:opacity-50 transition-[transform,background-color] cursor-pointer ${className}`}
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
      className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-[#1A1E29] hover:bg-[#232838] text-zinc-200 border border-[#262C3D] active:scale-[0.98] disabled:opacity-50 transition-[transform,background-color] cursor-pointer ${className}`}
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
      <h2 className="text-sm font-semibold text-zinc-300">
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
      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
        active
          ? 'bg-[#DC2626] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)]'
          : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] hover:text-white'
          ? 'bg-rose-600 text-white'
          : 'bg-[#14161F] text-zinc-300 border border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
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
      {label && <label htmlFor={fieldId} className="text-xs font-medium text-zinc-300">{label}</label>}
      <input
        id={fieldId}
        className={`w-full bg-[#1E1E22] text-[rgba(255,255,255,0.96)] text-base rounded-[14px] px-4 py-3 border outline-none transition-all ${
          error ? 'border-[#EF4444]' : 'border-[rgba(255,255,255,0.08)] focus:border-[#DC2626]'
        className={`w-full bg-[#14161F] text-zinc-100 text-sm rounded-xl px-3.5 py-2.5 border outline-none transition-[border-color,box-shadow] ${
          error ? 'border-rose-500/80 focus:border-rose-500' : 'border-[#232838] focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30'
        }`}
        style={style}
        {...props}
      />
      {error && <span className="text-xs text-[#EF4444]">{error}</span>}
      {error && <span className="text-xs text-rose-400 font-medium">{error}</span>}
    </div>
  );
}

export function MSelect({ label, error, options = [], ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <span className="text-xs font-medium text-[rgba(255,255,255,0.65)]">{label}</span>}
      {label && <span className="text-xs font-medium text-zinc-300">{label}</span>}
      <Select options={options} error={error} {...props} />
    </div>
  );
}

