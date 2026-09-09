'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell, useAppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
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

  return (
    <AppShell
      title="Catálogo de Produtos e Itens"
      subtitle="Controle de quantidades, custos, preços e estoque de segurança"
      onRefresh={loadItems}
    >
      <div className="space-y-4">
        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, SKU ou localização..."
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
                lowStockFilter
                  ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-[0_2px_10px_rgba(220,38,38,0.3)]'
                  : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.08)] hover:text-white'
              }`}
            >
              <AlertTriangle size={14} />
              <span>Apenas Estoque Baixo</span>
            </button>

            {owner && (
              <Button
                variant="primary"
                onClick={() => shell?.openNewItem && shell.openNewItem()}
                icon={<Plus size={16} />}
                className="hidden sm:inline-flex"
              >
                Novo Produto
              </Button>
            )}
          </div>
        </div>

        {/* Categorias (Chips horizontais) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                !selectedCategory
                  ? 'bg-[#DC2626] text-white'
                  : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] hover:text-white'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] border border-[rgba(255,255,255,0.08)] hover:text-white'
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
          </div>
        ) : items.length === 0 ? (
          <Card className="py-12 text-center text-[rgba(255,255,255,0.5)]">
            <p className="text-base font-semibold text-white mb-1">Nenhum produto encontrado</p>
            <p className="text-xs">Tente ajustar a busca ou adicionar um novo item.</p>
          </Card>
        ) : (
          <>
            {/* Visão Tabela no Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <div className="bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[18px] overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#1A1A1E] text-[rgba(255,255,255,0.5)] uppercase tracking-wider text-[11px] border-b border-[rgba(255,255,255,0.06)]">
                    <tr>
                      <th className="py-3.5 px-4">Item & SKU</th>
                      <th className="py-3.5 px-4">Categoria / Local</th>
                      <th className="py-3.5 px-4">Saldo em Estoque</th>
                      <th className="py-3.5 px-4">Estoque Mínimo</th>
                      <th className="py-3.5 px-4">Preço Custo / Venda</th>
                      <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.85)]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#1C1C20] transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-white">{item.name}</p>
                          <span className="text-xs font-mono text-[rgba(255,255,255,0.45)]">
                            SKU: {item.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {item.category ? (
                              <span className="inline-flex items-center gap-1 text-xs text-[rgba(255,255,255,0.7)]">
                                <Tag size={12} className="text-[#DC2626]" /> {item.category.name}
                              </span>
                            ) : (
                              <span className="text-xs text-[rgba(255,255,255,0.35)]">Geral</span>
                            )}
                            {item.location && (
                              <p className="text-[11px] text-[rgba(255,255,255,0.45)] flex items-center gap-1">
                                <MapPin size={11} /> {item.location}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-base ${
                                item.isLowStock ? 'text-[#EF4444]' : 'text-white'
                              }`}
                            >
                              {item.currentQuantity} {item.unit}
                            </span>
                            {item.isLowStock && (
                              <Badge variant="danger" size="sm">
                                Reposição
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[rgba(255,255,255,0.6)]">
                          {item.minQuantity} {item.unit}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-white">
                            R$ {Number(item.salePrice).toFixed(2)}
                          </p>
                          <p className="text-[11px] text-[rgba(255,255,255,0.45)]">
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
                            >
                              <ArrowDownLeft size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => shell?.openOutbound && shell.openOutbound(item.id)}
                              title="Registrar Saída"
                              className="p-1.5 rounded-[8px] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] cursor-pointer transition-all"
                            >
                              <ArrowUpRight size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setAdjustItem(item)}
                              title="Ajuste / Conferência Física"
                              className="p-1.5 rounded-[8px] bg-[#1E1E22] hover:bg-[#282830] text-[rgba(255,255,255,0.7)] hover:text-white cursor-pointer transition-all"
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
            <div className="md:hidden space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <h3 className="font-bold text-white text-base truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs font-mono text-[rgba(255,255,255,0.45)]">
                        SKU: {item.sku}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-lg font-extrabold ${
                          item.isLowStock ? 'text-[#EF4444]' : 'text-white'
                        }`}
                      >
                        {item.currentQuantity} {item.unit}
                      </span>
                      {item.isLowStock && (
                        <span className="block text-[10px] font-bold text-[#EF4444]">
                          Abaixo do Mínimo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[rgba(255,255,255,0.6)] pt-2 border-t border-[rgba(255,255,255,0.06)]">
                    <div>
                      <span>Custo Médio: </span>
                      <strong className="text-white">R$ {Number(item.costPrice).toFixed(2)}</strong>
                    </div>
                    <div>
                      <span>Venda: </span>
                      <strong className="text-white">R$ {Number(item.salePrice).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => shell?.openInbound && shell.openInbound(item.id)}
                      className="py-2 rounded-[10px] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowDownLeft size={14} /> + Entrada
                    </button>

                    <button
                      type="button"
                      onClick={() => shell?.openOutbound && shell.openOutbound(item.id)}
                      className="py-2 rounded-[10px] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowUpRight size={14} /> - Saída
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustItem(item)}
                      className="py-2 rounded-[10px] bg-[#1E1E22] text-[rgba(255,255,255,0.8)] font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
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
      <AjusteModal
        isOpen={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        onSuccess={loadItems}
        item={adjustItem}
      />
    </AppShell>
  );
}

