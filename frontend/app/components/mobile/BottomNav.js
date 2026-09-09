'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Plus,
  ArrowDownUp,
  SlidersHorizontal,
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
    { href: 'ACTION_CENTER', label: 'Ação', icon: Plus, isAction: true },
    { href: '/movimentacoes', label: 'Movimentos', icon: ArrowDownUp },
    { href: '/estoques', label: 'Ajustes', icon: SlidersHorizontal },
  ];

  return (
    <>
      {/* Barra de navegação inferior */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141417]/95 backdrop-blur-md border-t border-[rgba(255,255,255,0.08)] pb-[env(safe-area-inset-bottom)]"
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
                    className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#B91C1C] to-[#EF4444] text-white flex items-center justify-center shadow-[0_4px_18px_rgba(220,38,38,0.45)] border-2 border-[#141417] active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={24} strokeWidth={2.5} />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
                  isActive
                    ? 'text-[#DC2626] font-semibold'
                    : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.8)]'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Action Sheet flutuante com as duas ações imediatas */}
      {actionSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center p-0">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setActionSheetOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#141417] border-t border-[rgba(255,255,255,0.1)] rounded-t-[24px] p-5 pb-8 anim-pop-in z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h3 className="text-base font-bold text-white">Movimentação Rápida</h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">Escolha o tipo de operação para registrar</p>
              </div>
              <button
                onClick={() => setActionSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1E1E22] text-[rgba(255,255,255,0.6)] flex items-center justify-center cursor-pointer"
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
                className="flex flex-col items-center text-center p-4 rounded-[16px] bg-[#1E1E22] hover:bg-[#25252B] border border-[#10B981]/25 active:scale-98 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <ArrowDownLeft size={24} />
                </div>
                <span className="text-sm font-bold text-white">Nova Entrada (+)</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.45)] mt-0.5">Compra, devolução ou reposição</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionSheetOpen(false);
                  if (onOpenOutbound) onOpenOutbound();
                }}
                className="flex flex-col items-center text-center p-4 rounded-[16px] bg-[#1E1E22] hover:bg-[#25252B] border border-[#EF4444]/25 active:scale-98 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <ArrowUpRight size={24} />
                </div>
                <span className="text-sm font-bold text-white">Nova Saída (-)</span>
                <span className="text-[11px] text-[rgba(255,255,255,0.45)] mt-0.5">Venda, consumo ou descarte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

