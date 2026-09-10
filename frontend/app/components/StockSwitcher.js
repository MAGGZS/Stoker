'use client';
import { useState, useRef, useEffect } from 'react';
import { useStockStore } from '../store/stock';
import { roleLabel, isOwner } from '../lib/stockRoles';
import { ChevronDown, Check, Plus, KeyRound, Building2 } from 'lucide-react';

export function StockSwitcher({ onOpenCreate, onOpenJoin, className = '' }) {
  const { stocks, activeStock, activeRole, switchStock } = useStockStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRole = roleLabel(activeRole);
  const isCurrentOwner = isOwner(activeRole);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Gatilho */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] bg-[#1E1E22] hover:bg-[#26262B] border border-[rgba(255,255,255,0.08)] transition-all cursor-pointer text-left w-full sm:w-auto"
      >
        <div className="w-8 h-8 rounded-[10px] bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center shrink-0">
          <Building2 size={16} />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[10px] font-semibold tracking-wider text-[rgba(255,255,255,0.45)] uppercase leading-none">
            Estoque Ativo
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]">
              {activeStock?.name || 'Selecione o estoque'}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight shrink-0 ${
                isCurrentOwner
                  ? 'bg-[#DC2626]/20 text-[#F87171] border border-[#DC2626]/30'
                  : 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.7)]'
              }`}
            >
              {currentRole}
            </span>
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-[rgba(255,255,255,0.4)] transition-transform duration-200 ${
            open ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Menu dropdown */}
      {open && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#141417] border border-[rgba(255,255,255,0.1)] rounded-[18px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] p-2 z-50 anim-pop-in">
          <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
              Seus Vínculos ({stocks.length})
            </p>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-1">
            {stocks.map((stock) => {
              const isSelected = stock.id === activeStock?.id;
              const owner = isOwner(stock.role);

              return (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => {
                    switchStock(stock.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-[12px] text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#DC2626]/15 border border-[#DC2626]/30 text-white'
                      : 'hover:bg-[#1E1E22] text-[rgba(255,255,255,0.8)] border border-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs sm:text-sm font-semibold truncate text-white">
                      {stock.name}
                    </p>
                    <p className="text-[10px] text-[rgba(255,255,255,0.45)] mt-0.5">
                      Vínculo: <span className="text-white/80">{roleLabel(stock.role)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        owner
                          ? 'bg-[#DC2626]/20 text-[#F87171]'
                          : 'bg-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.65)]'
                      }`}
                    >
                      {roleLabel(stock.role)}
                    </span>
                    {isSelected && <Check size={14} className="text-[#DC2626]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-1 pt-2 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (onOpenCreate) onOpenCreate();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-white bg-[#1E1E22] hover:bg-[#26262B] border border-[rgba(255,255,255,0.08)] rounded-[10px] transition-all cursor-pointer"
            >
              <Plus size={13} className="text-[#DC2626]" />
              <span>Novo Estoque</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (onOpenJoin) onOpenJoin();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-[rgba(255,255,255,0.85)] bg-[#1E1E22] hover:bg-[#26262B] border border-[rgba(255,255,255,0.08)] rounded-[10px] transition-all cursor-pointer"
            >
              <KeyRound size={13} className="text-[#DC2626]" />
              <span>Entrar c/ Código</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

