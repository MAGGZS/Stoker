'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Plus,
  ArrowDownUp,
  Warehouse,
  ArrowDownLeft,
  ArrowUpRight,
  X,
} from 'lucide-react';

export function BottomNav({ onOpenInbound, onOpenOutbound }) {
  const pathname = usePathname();
  const [actionSheetOpen, setActionSheetOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/itens', label: 'Itens', icon: Package },
    { href: 'ACTION_CENTER', label: 'Lançar', icon: Plus, isAction: true },
    { href: '/movimentacoes', label: 'Histórico', icon: ArrowDownUp },
    { href: '/estoques', label: 'Estoques', icon: Warehouse },
  ];

  return (
    <>
      {/* Barra de navegação inferior */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#11131A]/95 backdrop-blur-md border-t border-[#232838] pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação mobile"
      >
        <div className="flex items-center justify-around h-16 px-2 max-w-md mx-auto relative">
          {navItems.map((item) => {
            if (item.isAction) {
              return (
                <div key="action-center" className="relative -top-3">
                  <button
                    type="button"
                    onClick={() => setActionSheetOpen(true)}
                    aria-label="Registrar movimentação rápida"
                    className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 border-2 border-[#11131A] active:scale-95 transition-transform cursor-pointer"
                  >
                    <Plus size={24} strokeWidth={2.4} />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/estoques' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
                  isActive
                    ? 'text-rose-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Painel de ações rápidas (Action Sheet) */}
      {actionSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center p-0">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setActionSheetOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#14161F] border-t border-[#232838] rounded-t-3xl p-5 pb-8 anim-pop-in z-10 space-y-4 shadow-2xl shadow-black/90">
            <div className="flex items-center justify-between pb-2 border-b border-[#232838]">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Registrar operação</h3>
                <p className="text-xs text-zinc-400">Escolha a movimentação que deseja lançar</p>
              </div>
              <button
                onClick={() => setActionSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1A1E29] text-zinc-400 hover:text-zinc-100 flex items-center justify-center cursor-pointer border border-[#262C3D]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActionSheetOpen(false);
                  if (onOpenInbound) onOpenInbound();
                }}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#1A1E29] hover:bg-[#202534] border border-emerald-500/20 active:scale-[0.98] transition-[transform,background-color] cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <ArrowDownLeft size={22} />
                </div>
                <span className="text-sm font-semibold text-zinc-100">Nova entrada</span>
                <span className="text-[11px] text-zinc-400 mt-0.5">Compra, devolução ou reposição</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionSheetOpen(false);
                  if (onOpenOutbound) onOpenOutbound();
                }}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#1A1E29] hover:bg-[#202534] border border-rose-500/20 active:scale-[0.98] transition-[transform,background-color] cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <ArrowUpRight size={22} />
                </div>
                <span className="text-sm font-semibold text-zinc-100">Nova saída</span>
                <span className="text-[11px] text-zinc-400 mt-0.5">Venda, consumo ou baixa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

