import { create } from 'zustand';
import { api } from '../lib/api';
import { getStoredActiveStockId, setStoredActiveStockId } from '../lib/session';

export const useStockStore = create((set, get) => ({
  stocks: [],
  activeStockId: null,
  activeStock: null,
  activeRole: null,
  isLoading: false,

  fetchStocks: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/stocks');
      const stocks = data || [];

      let activeId = getStoredActiveStockId();
      // Valida se o estoque ativo salvo ainda existe na lista do usuário
      if (activeId && !stocks.some((s) => s.id === activeId)) {
        activeId = null;
        setStoredActiveStockId(null);
      }

      const active = stocks.find((s) => s.id === activeId) || null;

      set({
        stocks,
        activeStockId: activeId,
        activeStock: active,
        activeRole: active?.role || null,
        isLoading: false,
      });

      return stocks;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  switchStock: (stockId) => {
    const { stocks } = get();
    const active = stocks.find((s) => s.id === stockId);
    if (active) {
      setStoredActiveStockId(stockId);
      set({
        activeStockId: stockId,
        activeStock: active,
        activeRole: active.role,
      });
    }
  },

  createStock: async (payload) => {
    const { data } = await api.post('/stocks', payload);
    const { stocks } = get();
    const updatedStocks = [...stocks, data];
    setStoredActiveStockId(data.id);
    set({
      stocks: updatedStocks,
      activeStockId: data.id,
      activeStock: data,
      activeRole: data.role,
    });
    return data;
  },

  joinStock: async (shareCode) => {
    const { data } = await api.post('/stocks/join', { shareCode });
    await get().fetchStocks();
    if (data.stock?.id) {
      get().switchStock(data.stock.id);
    }
    return data;
  },

  clearActiveStock: () => {
    setStoredActiveStockId(null);
    set({
      activeStockId: null,
      activeStock: null,
      activeRole: null,
    });
  },

  deleteStock: async (stockId) => {
    const { data } = await api.delete(`/stocks/${stockId}`);
    await get().fetchStocks();
    return data;
  },
}));
