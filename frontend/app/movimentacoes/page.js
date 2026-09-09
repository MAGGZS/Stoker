'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Calendar,
  FileText,
  User,
  Building,
} from 'lucide-react';

export function MovimentacoesPage() {
  const { activeStockId } = useStockStore();
  const [movements, setMovements] = useState([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadMovements = useCallback(async () => {
    if (!activeStockId) return;
    setLoading(true);
    try {
      let url = `/stocks/${activeStockId}/movements?limit=100`;
      if (typeFilter !== 'ALL') url += `&type=${typeFilter}`;

      const res = await api.get(url);
      setMovements(res.data.movements || []);
    } catch (err) {
      console.error('Erro ao carregar movimentações', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId, typeFilter]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const tabs = [
    { value: 'ALL', label: 'Todas as Operações' },
    { value: 'ENTRADA', label: 'Entradas (+)' },
    { value: 'SAIDA', label: 'Saídas (-)' },
    { value: 'AJUSTE', label: 'Ajustes & Contagens' },
  ];

  return (
    <AppShell
      title="Livro de Movimentações"
      subtitle="Extrato detalhado e imutável de todas as entradas, saídas e ajustes"
      onRefresh={loadMovements}
    >
      <div className="space-y-4">
        {/* Seletor de Tipo de Movimentação */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={`px-4 py-2 rounded-[12px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                typeFilter === tab.value
                  ? 'bg-[#DC2626] text-white shadow-[0_2px_10px_rgba(220,38,38,0.25)]'
                  : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] hover:text-white border border-[rgba(255,255,255,0.06)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lista de Movimentações */}
        {loading ? (
          <div className="py-16 text-center">
            <span className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : movements.length === 0 ? (
          <Card className="py-12 text-center text-[rgba(255,255,255,0.5)]">
            <p className="text-base font-semibold text-white mb-1">Nenhuma movimentação encontrada</p>
            <p className="text-xs">Registre novas entradas ou saídas para visualizar o histórico.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {movements.map((m) => {
              const isInbound = m.type === 'ENTRADA';
              const isOutbound = m.type === 'SAIDA';
              const isAdjustment = m.type === 'AJUSTE';

              return (
                <Card key={m.id} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isInbound
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : isOutbound
                            ? 'bg-[#EF4444]/15 text-[#EF4444]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {isInbound && <ArrowDownLeft size={20} />}
                        {isOutbound && <ArrowUpRight size={20} />}
                        {isAdjustment && <Sliders size={20} />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white truncate">
                            {m.item?.name}
                          </h3>
                          <Badge
                            variant={isInbound ? 'success' : isOutbound ? 'danger' : 'warning'}
                            size="sm"
                          >
                            {m.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-[rgba(255,255,255,0.5)] mt-0.5">
                          SKU: <span className="font-mono">{m.item?.sku}</span> • Motivo: <strong className="text-[rgba(255,255,255,0.8)]">{m.reason}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span
                        className={`text-base sm:text-lg font-extrabold ${
                          isInbound
                            ? 'text-[#10B981]'
                            : isOutbound
                            ? 'text-[#EF4444]'
                            : 'text-[#F59E0B]'
                        }`}
                      >
                        {isInbound ? '+' : isOutbound ? '-' : ''}
                        {m.quantity} {m.item?.unit}
                      </span>
                      <p className="text-xs text-[rgba(255,255,255,0.5)]">
                        Saldo: {m.previousQuantity} ➔ <strong className="text-white">{m.newQuantity} {m.item?.unit}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Detalhes de Apoio */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs text-[rgba(255,255,255,0.6)]">
                    <div className="flex items-center gap-1.5 truncate">
                      <User size={13} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                      <span className="truncate">Por: {m.user?.name || 'Sistema'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar size={13} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                      <span>
                        {new Date(m.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {m.partner && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building size={13} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                        <span className="truncate">{m.partner}</span>
                      </div>
                    )}

                    {m.documentRef && (
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText size={13} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                        <span className="truncate">Doc: {m.documentRef}</span>
                      </div>
                    )}

                    {m.totalValue && (
                      <div className="col-span-2 sm:col-span-1 text-white font-medium">
                        Total: R$ {Number(m.totalValue).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {m.notes && (
                    <p className="text-[11px] text-[rgba(255,255,255,0.45)] italic mt-2 pt-2 border-t border-[rgba(255,255,255,0.04)]">
                      Observação: {m.notes}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default MovimentacoesPage;

