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
  Boxes,
  LogOut,
  Warehouse,
} from 'lucide-react';

export function Sidebar({ onOpenCreateStock, onOpenJoinStock }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navLinks = [
    { href: '/estoques', label: 'Meus estoques', icon: Warehouse },
    { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
    { href: '/itens', label: 'Catálogo de itens', icon: Package },
    { href: '/movimentacoes', label: 'Movimentações', icon: ArrowDownUp },
    { href: '/balanco', label: 'Balanço e contagem', icon: ClipboardCheck },
    { href: '/historico', label: 'Auditoria e histórico', icon: History },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-[#11131A] border-r border-[#232838] h-screen sticky top-0 shrink-0 z-30 p-4">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-2 py-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#14161F] border border-[#232838] text-rose-500 flex items-center justify-center shadow-lg shadow-black/40 shrink-0">
          <Boxes size={22} strokeWidth={2.2} />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1">
            Stoker
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
          </span>
          <p className="text-[11px] font-medium text-zinc-400">
            Gestão de estoques
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
        <p className="text-[11px] font-medium text-zinc-400 px-3 py-2">
          Navegação
        </p>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/estoques' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-[background-color,color] ${
                isActive
                  ? 'bg-rose-600 text-white font-medium shadow-md shadow-rose-950/40'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#14161F]'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Perfil de Usuário e Logout */}
      <div className="pt-3 border-t border-[#232838] mt-auto">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#14161F] border border-[#232838]">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-zinc-100 truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {user?.email || ''}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sair da conta"
            className="w-8 h-8 rounded-lg bg-[#1A1E29] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-[#262C3D]"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

