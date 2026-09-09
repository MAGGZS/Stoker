'use client';
import { useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { useStockStore } from '../store/stock';
import { Sidebar } from './desktop/Sidebar';
import { Header } from './desktop/Header';
import { BottomNav } from './mobile/BottomNav';
import { StockSwitcher } from './StockSwitcher';
import { NovaEntradaModal } from './modals/NovaEntradaModal';
import { NovaSaidaModal } from './modals/NovaSaidaModal';
import { NovoItemModal } from './modals/NovoItemModal';
import { NovoEstoqueModal } from './modals/NovoEstoqueModal';
import { EntrarEstoqueModal } from './modals/EntrarEstoqueModal';

const AppShellContext = createContext(null);

export function useAppShell() {
  return useContext(AppShellContext);
}

export function AppShell({ children, title, subtitle, onRefresh }) {
  const { user, isLoading } = useAuthStore();
  const { activeStock, activeRole, fetchStocks } = useStockStore();
  const router = useRouter();

  // Modals state
  const [inboundOpen, setInboundOpen] = useState(false);
  const [outboundOpen, setOutboundOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newStockOpen, setNewStockOpen] = useState(false);
  const [joinStockOpen, setJoinStockOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const openInbound = (itemId = null) => {
    setSelectedItemId(itemId);
    setInboundOpen(true);
  };

  const openOutbound = (itemId = null) => {
    setSelectedItemId(itemId);
    setOutboundOpen(true);
  };

  const openNewItem = () => setNewItemOpen(true);
  const openNewStock = () => setNewStockOpen(true);
  const openJoinStock = () => setJoinStockOpen(true);

  const handleActionSuccess = () => {
    fetchStocks().catch(() => {});
    if (onRefresh) onRefresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0C] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  return (
    <AppShellContext.Provider
      value={{
        openInbound,
        openOutbound,
        openNewItem,
        openNewStock,
        openJoinStock,
        activeStock,
        activeRole,
      }}
    >
      <div className="min-h-screen bg-[#0B0B0C] text-[rgba(255,255,255,0.95)] flex">
        {/* Sidebar Desktop */}
        <Sidebar
          onOpenCreateStock={openNewStock}
          onOpenJoinStock={openJoinStock}
        />

        {/* Área de Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
          {/* Top Bar Mobile exclusiva */}
          <div className="lg:hidden sticky top-0 z-30 bg-[#0B0B0C]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.06)] px-4 py-3 pt-[calc(12px+env(safe-area-inset-top))]">
            <StockSwitcher
              onOpenCreate={openNewStock}
              onOpenJoin={openJoinStock}
            />
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {/* Header Desktop */}
            <Header
              title={title}
              subtitle={subtitle}
              onOpenInbound={() => openInbound()}
              onOpenOutbound={() => openOutbound()}
              onOpenNewItem={openNewItem}
            />

            {children}
          </main>
        </div>

        {/* Bottom Nav Mobile */}
        <BottomNav
          onOpenInbound={() => openInbound()}
          onOpenOutbound={() => openOutbound()}
        />

        {/* Modais Globais */}
        <NovaEntradaModal
          isOpen={inboundOpen}
          onClose={() => setInboundOpen(false)}
          onSuccess={handleActionSuccess}
          initialItemId={selectedItemId}
        />

        <NovaSaidaModal
          isOpen={outboundOpen}
          onClose={() => setOutboundOpen(false)}
          onSuccess={handleActionSuccess}
          initialItemId={selectedItemId}
        />

        <NovoItemModal
          isOpen={newItemOpen}
          onClose={() => setNewItemOpen(false)}
          onSuccess={handleActionSuccess}
        />

        <NovoEstoqueModal
          isOpen={newStockOpen}
          onClose={() => setNewStockOpen(false)}
          onSuccess={handleActionSuccess}
        />

        <EntrarEstoqueModal
          isOpen={joinStockOpen}
          onClose={() => setJoinStockOpen(false)}
          onSuccess={handleActionSuccess}
        />
      </div>
    </AppShellContext.Provider>
  );
}

