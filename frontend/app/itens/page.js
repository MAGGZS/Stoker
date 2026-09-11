'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell, useAppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyStockView } from '../components/ui/EmptyStockView';
import { AjusteModal } from '../components/modals/AjusteModal';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { isOwner } from '../lib/stockRoles';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  AlertTriangle,
  MapPin,
  Tag,
} from 'lucide-react';

export default function ItensPage() {
  const { activeStock, activeStockId, activeRole } = useStockStore();
  const owner = isOwner(activeRole);
  const shell = useAppShell();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  const [adjustItem, setAdjustItem] = useState(null);

  const loadItems = useCallback(async () => {
    if (!activeStockId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = `/stocks/${activeStockId}/items?status=ACTIVE&limit=100`;
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;
      if (selectedCategory) query += `&categoryId=${selectedCategory}`;
      if (lowStockFilter) query += `&lowStockOnly=true`;

      const [itemsRes, stockRes] = await Promise.all([
        api.get(query),
        api.get(`/stocks/${activeStockId}`),
      ]);

      setItems(itemsRes.data.items || []);
      setCategories(stockRes.data.categories || []);
    } catch (err) {
      console.error('Erro ao carregar itens', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId, search, selectedCategory, lowStockFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  if (!activeStockId) {
    return (
      <AppShell
        title="Catálogo de produtos"
        subtitle="Selecione um estoque para gerenciar os itens cadastrados"
      >
        <EmptyStockView title="Nenhum estoque selecionado" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Catálogo de produtos"
      subtitle={activeStock ? `${activeStock.name} • ${items.length} itens listados` : 'Produtos'}
      onRefresh={loadItems}
    >
      <div className="space-y-4">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por nome, SKU ou localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-[transform,background-color,border-color] active:scale-[0.98] cursor-pointer ${
                lowStockFilter
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                  : 'bg-[#14161F] text-zinc-300 border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
              }`}
            >
              <AlertTriangle size={14} className={lowStockFilter ? 'text-white' : 'text-rose-400'} />
              <span>Abaixo do mínimo</span>
            </button>

            {owner && (
              <Button
                variant="primary"
                onClick={() => shell?.openNewItem && shell.openNewItem()}
                icon={<Plus size={16} />}
                className="hidden sm:inline-flex"
              >
                Novo produto
              </Button>
            )}
          </div>
        </div>

        {/* Categorias */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                !selectedCategory
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#14161F] text-zinc-300 border border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
              }`}
            >
              Todas as categorias
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#14161F] text-zinc-300 border border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Lista de Itens */}
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            Carregando catálogo de produtos...
          </div>
        ) : items.length === 0 ? (
          <Card className="py-12 text-center text-zinc-400 border border-[#232838] bg-[#14161F]">
            <p className="text-base font-semibold text-zinc-100 mb-1">Nenhum produto encontrado</p>
            <p className="text-xs text-zinc-400">
              {search || selectedCategory || lowStockFilter
                ? 'Nenhum resultado corresponde aos filtros aplicados.'
                : 'Cadastre seu primeiro produto para começar a controlar o estoque.'}
            </p>
          </Card>
        ) : (
          <>
            {/* Visão Tabela no Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-[#14161F] border border-[#232838] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#11131A] text-zinc-400 text-xs font-medium uppercase border-b border-[#232838]">
                    <tr>
                      <th className="px-5 py-3.5">Produto / SKU</th>
                      <th className="px-4 py-3.5">Categoria</th>
                      <th className="px-4 py-3.5">Local</th>
                      <th className="px-4 py-3.5 text-right">Saldo Atual</th>
                      <th className="px-4 py-3.5 text-right">Custo / Venda</th>
                      <th className="px-5 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {items.map((item) => {
                      const isLow = item.currentQuantity <= item.minQuantity;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#181B26] transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-semibold text-zinc-100 flex items-center gap-2">
                              {item.name}
                              {isLow && (
                                <span title="Estoque baixo">
                                  <AlertTriangle size={14} className="text-rose-400" />
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400 font-mono">
                              {item.sku}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            {item.category ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1E29] text-zinc-300 border border-[#262C3D]">
                                {item.category.name}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-500">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-xs text-zinc-400">
                            {item.location || '—'}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <span
                              className={`font-bold ${
                                isLow ? 'text-rose-400' : 'text-zinc-100'
                              }`}
                            >
                              {item.currentQuantity} {item.unit}
                            </span>
                            <span className="text-[11px] text-zinc-500 block">
                              Mín: {item.minQuantity}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right text-xs">
                            <span className="text-zinc-300 block">
                              R$ {Number(item.costPrice).toFixed(2)}
                            </span>
                            <span className="text-zinc-500 block">
                              Venda: R$ {Number(item.salePrice).toFixed(2)}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => shell?.openInbound && shell.openInbound(item.id)}
                                title="Lançar entrada"
                                className="w-8 h-8 rounded-lg bg-[#1A1E29] hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D]"
                              >
                                <ArrowDownLeft size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => shell?.openOutbound && shell.openOutbound(item.id)}
                                title="Lançar saída"
                                className="w-8 h-8 rounded-lg bg-[#1A1E29] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D]"
                              >
                                <ArrowUpRight size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setAdjustItem(item)}
                                title="Ajuste de saldo físico"
                                className="w-8 h-8 rounded-lg bg-[#1A1E29] hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D]"
                              >
                                <Sliders size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visão Cards no Mobile */}
            <div className="space-y-3 md:hidden">
              {items.map((item) => {
                const isLow = item.currentQuantity <= item.minQuantity;

                return (
                  <Card key={item.id} className="p-4 space-y-3 border border-[#232838] bg-[#14161F]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
                          {item.name}
                          {isLow && <AlertTriangle size={14} className="text-rose-400" />}
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                      </div>

                      <span
                        className={`text-base font-bold ${
                          isLow ? 'text-rose-400' : 'text-zinc-100'
                        }`}
                      >
                        {item.currentQuantity} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-[#232838]">
                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                      <span>Custo: R$ {Number(item.costPrice).toFixed(2)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => shell?.openInbound && shell.openInbound(item.id)}
                        className="justify-center text-emerald-400 hover:text-emerald-300"
                        icon={<ArrowDownLeft size={14} />}
                      >
                        Entrada
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => shell?.openOutbound && shell.openOutbound(item.id)}
                        className="justify-center text-rose-400 hover:text-rose-300"
                        icon={<ArrowUpRight size={14} />}
                      >
                        Saída
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAdjustItem(item)}
                        className="justify-center text-amber-400 hover:text-amber-300"
                        icon={<Sliders size={14} />}
                      >
                        Ajuste
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Ajuste de Saldo Físico */}
      {adjustItem && (
        <AjusteModal
          isOpen={Boolean(adjustItem)}
          onClose={() => setAdjustItem(null)}
          item={adjustItem}
          onSuccess={() => {
            setAdjustItem(null);
            loadItems();
          }}
        />
      )}
    </AppShell>
  );
}

