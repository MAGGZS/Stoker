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
  const { activeStockId, activeRole } = useStockStore();
  const { activeStock, activeStockId, activeRole } = useStockStore();
  const owner = isOwner(activeRole);
  const shell = useAppShell();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ajuste modal
  const [adjustItem, setAdjustItem] = useState(null);

  const loadItems = useCallback(async () => {
    if (!activeStockId) return;
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
    const timer = setTimeout(() => {
      loadItems();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadItems]);

  if (!activeStockId) {
    return (
      <AppShell
        title="Catálogo de produtos"
        subtitle="Selecione um estoque para gerenciar seus produtos"
      >
        <EmptyStockView title="Nenhum estoque selecionado" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Catálogo de Produtos e Itens"
      subtitle="Controle de quantidades, custos, preços e estoque de segurança"
      title="Produtos e materiais"
      subtitle={activeStock ? `${activeStock.name} • Saldo em estoque, custos e valores de venda` : 'Catálogo'}
      onRefresh={loadItems}
    >
      <div className="space-y-4">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, SKU ou localização..."
              placeholder="Buscar por nome, código SKU ou localização..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-[14px] text-xs font-semibold border transition-all cursor-pointer ${
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-[transform,background-color,border-color] active:scale-[0.98] cursor-pointer ${
                lowStockFilter
                  ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-[0_2px_10px_rgba(220,38,38,0.3)]'
                  : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.08)] hover:text-white'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/40'
                  : 'bg-[#14161F] text-zinc-300 border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
              }`}
            >
              <AlertTriangle size={14} />
              <span>Apenas Estoque Baixo</span>
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
                Novo Produto
                Novo produto
              </Button>
            )}
          </div>
        </div>

        {/* Categorias (Chips horizontais) */}
        {/* Categorias */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                !selectedCategory
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] hover:text-white'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#14161F] text-zinc-300 border border-[#232838] hover:border-[#2F364C] hover:text-zinc-100'
              }`}
            >
              Todas
              Todas as categorias
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] hover:text-white'
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
          <div className="py-16 text-center">
            <span className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin inline-block" />
          <div className="py-16 text-center text-xs text-zinc-500">
            Carregando catálogo de produtos...
          </div>
        ) : items.length === 0 ? (
          <Card className="py-12 text-center text-[rgba(255,255,255,0.5)]">
            <p className="text-base font-semibold text-white mb-1">Nenhum produto encontrado</p>
            <p className="text-xs">Tente ajustar a busca ou adicionar um novo item.</p>
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
              <div className="bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[18px] overflow-hidden">
              <div className="bg-[#14161F] border border-[#232838] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#1A1A1E] text-[rgba(255,255,255,0.5)] uppercase tracking-wider text-[11px] border-b border-[rgba(255,255,255,0.06)]">
                  <thead className="bg-[#10121A] text-zinc-400 text-xs border-b border-[#232838]">
                    <tr>
                      <th className="py-3.5 px-4">Item & SKU</th>
                      <th className="py-3.5 px-4">Categoria / Local</th>
                      <th className="py-3.5 px-4">Saldo em Estoque</th>
                      <th className="py-3.5 px-4">Estoque Mínimo</th>
                      <th className="py-3.5 px-4">Preço Custo / Venda</th>
                      <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                      <th className="py-3.5 px-4 font-medium">Produto & SKU</th>
                      <th className="py-3.5 px-4 font-medium">Categoria / Local</th>
                      <th className="py-3.5 px-4 font-medium">Saldo atual</th>
                      <th className="py-3.5 px-4 font-medium">Estoque mínimo</th>
                      <th className="py-3.5 px-4 font-medium">Custo / Venda</th>
                      <th className="py-3.5 px-4 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.85)]">
                  <tbody className="divide-y divide-[#1D2230] text-zinc-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1C1C20] transition-colors">
                      <tr key={item.id} className="hover:bg-[#1A1E29]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{item.name}</p>
                          <span className="text-xs font-mono text-[rgba(255,255,255,0.45)]">
                            SKU: {item.sku}
                          <p className="font-medium text-zinc-100">{item.name}</p>
                          <span className="text-xs font-mono text-zinc-400">
                            {item.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {item.category ? (
                              <span className="inline-flex items-center gap-1 text-xs text-[rgba(255,255,255,0.7)]">
                                <Tag size={12} className="text-[#DC2626]" /> {item.category.name}
                              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                                <Tag size={12} className="text-rose-400" /> {item.category.name}
                              </span>
                            ) : (
                              <span className="text-xs text-[rgba(255,255,255,0.35)]">Geral</span>
                              <span className="text-xs text-zinc-500">Sem categoria</span>
                            )}
                            {item.location && (
                              <p className="text-[11px] text-[rgba(255,255,255,0.45)] flex items-center gap-1">
                                <MapPin size={11} /> {item.location}
                              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                                <MapPin size={11} className="text-zinc-500" /> {item.location}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-base ${
                                item.isLowStock ? 'text-[#EF4444]' : 'text-white'
                              className={`font-semibold text-base ${
                                item.isLowStock ? 'text-rose-400' : 'text-zinc-100'
                              }`}
                            >
                              {item.currentQuantity} {item.unit}
                            </span>
                            {item.isLowStock && (
                              <Badge variant="danger" size="sm">
                                Reposição
                                Repor
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[rgba(255,255,255,0.6)]">
                        <td className="py-3.5 px-4 text-zinc-400">
                          {item.minQuantity} {item.unit}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-white">
                          <p className="font-medium text-zinc-100">
                            R$ {Number(item.salePrice).toFixed(2)}
                          </p>
                          <p className="text-[11px] text-[rgba(255,255,255,0.45)]">
                          <p className="text-[11px] text-zinc-400">
                            Custo: R$ {Number(item.costPrice).toFixed(2)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => shell?.openInbound && shell.openInbound(item.id)}
                              title="Registrar Entrada"
                              className="p-1.5 rounded-[8px] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] cursor-pointer transition-all"
                              title="Registrar entrada"
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 active:scale-[0.96] cursor-pointer transition-[transform,background-color]"
                            >
                              <ArrowDownLeft size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => shell?.openOutbound && shell.openOutbound(item.id)}
                              title="Registrar Saída"
                              className="p-1.5 rounded-[8px] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] cursor-pointer transition-all"
                              title="Registrar saída"
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 active:scale-[0.96] cursor-pointer transition-[transform,background-color]"
                            >
                              <ArrowUpRight size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setAdjustItem(item)}
                              title="Ajuste / Conferência Física"
                              className="p-1.5 rounded-[8px] bg-[#1E1E22] hover:bg-[#282830] text-[rgba(255,255,255,0.7)] hover:text-white cursor-pointer transition-all"
                              title="Ajuste de saldo"
                              className="p-1.5 rounded-lg bg-[#1A1E29] hover:bg-[#232838] text-zinc-300 hover:text-zinc-100 active:scale-[0.96] cursor-pointer transition-[transform,background-color]"
                            >
                              <Sliders size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visão Cartões Touch no Mobile */}
            {/* Visão Mobile */}
            <div className="md:hidden space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-white text-base truncate">
                      <h3 className="font-semibold text-zinc-100 text-base truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs font-mono text-[rgba(255,255,255,0.45)]">
                        SKU: {item.sku}
                      <p className="text-xs font-mono text-zinc-400">
                        {item.sku}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-lg font-extrabold ${
                          item.isLowStock ? 'text-[#EF4444]' : 'text-white'
                        className={`text-lg font-bold ${
                          item.isLowStock ? 'text-rose-400' : 'text-zinc-100'
                        }`}
                      >
                        {item.currentQuantity} {item.unit}
                      </span>
                      {item.isLowStock && (
                        <span className="block text-[10px] font-bold text-[#EF4444]">
                          Abaixo do Mínimo
                        <span className="block text-[11px] font-semibold text-rose-400">
                          Abaixo do mínimo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,0.6)] pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-2.5 border-t border-[#232838]">
                    <div>
                      <span>Custo Médio: </span>
                      <strong className="text-white">R$ {Number(item.costPrice).toFixed(2)}</strong>
                      <span>Custo: </span>
                      <strong className="text-zinc-200">R$ {Number(item.costPrice).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Venda: </span>
                      <strong className="text-white">R$ {Number(item.salePrice).toFixed(2)}</strong>
                      <strong className="text-zinc-200">R$ {Number(item.salePrice).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => shell?.openInbound && shell.openInbound(item.id)}
                      className="py-2 rounded-[10px] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      className="py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-[transform,background-color] cursor-pointer"
                    >
                      <ArrowDownLeft size={14} /> + Entrada
                    </button>

                    <button
                      type="button"
                      onClick={() => shell?.openOutbound && shell.openOutbound(item.id)}
                      className="py-2 rounded-[10px] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      className="py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-[transform,background-color] cursor-pointer"
                    >
                      <ArrowUpRight size={14} /> - Saída
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustItem(item)}
                      className="py-2 rounded-[10px] bg-[#1E1E22] text-[rgba(255,255,255,0.8)] font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      className="py-2 rounded-xl bg-[#1A1E29] hover:bg-[#232838] text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-[transform,background-color] cursor-pointer"
                    >
                      <Sliders size={14} /> Ajustar
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Ajuste Rápido de Saldo */}
      {/* Modal de Ajuste */}
      <AjusteModal
        isOpen={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        onSuccess={loadItems}
        item={adjustItem}
      />
    </AppShell>
  );
}

