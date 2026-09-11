'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStockStore } from '../store/stock';
import { roleLabel, isOwner } from '../lib/stockRoles';
import { ChevronDown, Check, Plus, KeyRound, Building2 } from 'lucide-react';
import { ChevronDown, Check, Plus, KeyRound, Building2, Grid } from 'lucide-react';

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
      {/* Botão Seletor */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] bg-[#1E1E22] hover:bg-[#26262B] border border-[rgba(255,255,255,0.08)] transition-all cursor-pointer text-left w-full sm:w-auto"
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#14161F] hover:bg-[#1A1E29] border border-[#232838] hover:border-[#2F364C] transition-[background-color,border-color] cursor-pointer text-left w-full sm:w-auto outline-none focus-visible:ring-1 focus-visible:ring-rose-500/50"
      >
        <div className="w-8 h-8 rounded-[10px] bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#1A1E29] border border-[#262C3D] text-rose-400 flex items-center justify-center shrink-0">
          <Building2 size={16} />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[10px] font-semibold tracking-wider text-[rgba(255,255,255,0.45)] uppercase leading-none">
            Estoque Ativo
          <p className="text-[10px] font-medium text-zinc-400 leading-none">
            Estoque em uso
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]">
              {activeStock?.name || 'Selecione o estoque'}
            <span className="text-xs sm:text-sm font-semibold text-zinc-100 truncate max-w-[130px] sm:max-w-[180px]">
              {activeStock?.name || 'Selecione um estoque'}
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
            {activeStock && (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-tight shrink-0 ${
                  isCurrentOwner
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-[#1A1E29] text-zinc-300 border border-[#262C3D]'
                }`}
              >
                {currentRole}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={`text-[rgba(255,255,255,0.4)] transition-transform duration-200 ${
            open ? 'rotate-180 text-white' : ''
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${
            open ? 'rotate-180 text-zinc-100' : ''
          }`}
        />
      </button>

      {/* Menu dropdown */}
      {open && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#141417] border border-[rgba(255,255,255,0.1)] rounded-[18px] shadow-[0_20px_40px_rgba(0,0,0,0.6)] p-2 z-50 anim-pop-in">
          <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.06)]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
              Seus Vínculos ({stocks.length})
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-[#14161F] border border-[#232838] rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 anim-pop-in">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#232838]">
            <p className="text-xs font-semibold text-zinc-400">
              Seus estoques ({stocks.length})
            </p>
            <Link
              href="/estoques"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Grid size={12} />
              <span>Ver todos</span>
            </Link>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-1">
            {stocks.map((stock) => {
              const isSelected = stock.id === activeStock?.id;
              const owner = isOwner(stock.role);
            {stocks.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                Nenhum estoque encontrado
              </div>
            ) : (
              stocks.map((stock) => {
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
                return (
                  <button
                    key={stock.id}
                    type="button"
                    onClick={() => {
                      switchStock(stock.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-[background-color,border-color] cursor-pointer ${
                      isSelected
                        ? 'bg-[#1A1E29] border border-rose-500/40 text-zinc-100'
                        : 'hover:bg-[#181B26] text-zinc-300 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-semibold truncate text-zinc-100">
                        {stock.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {roleLabel(stock.role)}
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
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          owner
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                            : 'bg-[#1A1E29] text-zinc-400 border border-[#262C3D]'
                        }`}
                      >
                        {roleLabel(stock.role)}
                      </span>
                      {isSelected && <Check size={14} className="text-rose-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-1 pt-2 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-2 gap-1.5">
          <div className="mt-1 pt-2 border-t border-[#232838] grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (onOpenCreate) onOpenCreate();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-white bg-[#1E1E22] hover:bg-[#26262B] border border-[rgba(255,255,255,0.08)] rounded-[10px] transition-all cursor-pointer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-zinc-200 bg-[#1A1E29] hover:bg-[#232838] border border-[#262C3D] rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={13} className="text-[#DC2626]" />
              <span>Novo Estoque</span>
              <Plus size={13} className="text-rose-400" />
              <span>Novo estoque</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (onOpenJoin) onOpenJoin();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-[rgba(255,255,255,0.85)] bg-[#1E1E22] hover:bg-[#26262B] border border-[rgba(255,255,255,0.08)] rounded-[10px] transition-all cursor-pointer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-medium text-zinc-300 bg-[#1A1E29] hover:bg-[#232838] border border-[#262C3D] rounded-xl transition-colors cursor-pointer"
            >
              <KeyRound size={13} className="text-[#DC2626]" />
              <span>Entrar c/ Código</span>
              <KeyRound size={13} className="text-rose-400" />
              <span>Entrar c/ código</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

