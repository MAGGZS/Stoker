'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import { StockSwitcher } from '../StockSwitcher';
import {
  LayoutDashboard,
  Package,
  ArrowDownUp,
  ClipboardCheck,
  History,
  Users,
  LogOut,
  Boxes,
} from 'lucide-react';

export function Sidebar({ onOpenCreateStock, onOpenJoinStock }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navLinks = [
    { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/itens', label: 'Catálogo de Itens', icon: Package },
    { href: '/movimentacoes', label: 'Movimentações', icon: ArrowDownUp },
    { href: '/balanco', label: 'Balanço Geral', icon: ClipboardCheck },
    { href: '/historico', label: 'Trilha de Auditoria', icon: History },
    { href: '/estoques', label: 'Estoque & Membros', icon: Users },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#121215] border-r border-[rgba(255,255,255,0.08)] h-screen sticky top-0 shrink-0 z-30 p-4">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-tr from-[#B91C1C] to-[#EF4444] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(220,38,38,0.35)] shrink-0">
          <Boxes size={22} strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
            STOKER
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          </span>
          <p className="text-[10px] font-medium text-[rgba(255,255,255,0.45)] uppercase tracking-wider">
            Gestão de Estoques
          </p>
        </div>
      </div>

      {/* Seletor de Estoque */}
      <div className="mb-4">
        <StockSwitcher
          onOpenCreate={onOpenCreateStock}
          onOpenJoin={onOpenJoinStock}
        />
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        <p className="text-[10px] font-semibold text-[rgba(255,255,255,0.4)] uppercase tracking-wider px-3 py-2">
          Menu Principal
        </p>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#DC2626] text-white font-semibold shadow-[0_2px_10px_rgba(220,38,38,0.25)]'
                  : 'text-[rgba(255,255,255,0.7)] hover:bg-[#1E1E22] hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.8} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cartão de Usuário e Logout */}
      <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] mt-auto">
        <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-[#1A1A1E] border border-[rgba(255,255,255,0.06)]">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-[11px] text-[rgba(255,255,255,0.45)] truncate">
              {user?.email || ''}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sair do sistema"
            className="w-8 h-8 rounded-[10px] bg-[#222228] hover:bg-[#EF4444]/20 text-[rgba(255,255,255,0.6)] hover:text-[#EF4444] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

