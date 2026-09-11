'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyStockView } from '../components/ui/EmptyStockView';
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
export default function MovimentacoesPage() {
  const { activeStock, activeStockId } = useStockStore();
  const [movements, setMovements] = useState([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadMovements = useCallback(async () => {
    if (!activeStockId) return;
    if (!activeStockId) {
      setLoading(false);
      return;
    }
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

  if (!activeStockId) {
    return (
      <AppShell
        title="Movimentações"
        subtitle="Selecione um estoque para visualizar o registro de entradas e saídas"
      >
        <EmptyStockView title="Nenhum estoque selecionado" />
      </AppShell>
    );
  }

  const tabs = [
    { value: 'ALL', label: 'Todas as Operações' },
    { value: 'ENTRADA', label: 'Entradas (+)' },
    { value: 'SAIDA', label: 'Saídas (-)' },
    { value: 'AJUSTE', label: 'Ajustes & Contagens' },
    { value: 'ALL', label: 'Todas as operações' },
    { value: 'ENTRADA', label: 'Entradas' },
    { value: 'SAIDA', label: 'Saídas' },
    { value: 'AJUSTE', label: 'Ajustes de saldo' },
  ];

  return (
    <AppShell
      title="Livro de Movimentações"
      subtitle="Extrato detalhado e imutável de todas as entradas, saídas e ajustes"
      title="Movimentações"
      subtitle={activeStock ? `${activeStock.name} • Histórico de lançamentos` : 'Lançamentos de estoque'}
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
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === tab.value
                  ? 'bg-[#DC2626] text-white shadow-[0_2px_10px_rgba(220,38,38,0.25)]'
                  : 'bg-[#1E1E22] text-[rgba(255,255,255,0.7)] hover:text-white border border-[rgba(255,255,255,0.06)]'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                  : 'bg-[#14161F] text-zinc-300 hover:text-zinc-100 border border-[#232838] hover:border-[#2F364C]'
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
            <span className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : movements.length === 0 ? (
          <Card className="py-12 text-center text-[rgba(255,255,255,0.5)]">
            <p className="text-base font-semibold text-white mb-1">Nenhuma movimentação encontrada</p>
            <p className="text-xs">Registre novas entradas ou saídas para visualizar o histórico.</p>
          <Card className="text-center py-16">
            <p className="text-sm text-zinc-400">
              Nenhuma movimentação encontrada com o filtro selecionado
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {movements.map((m) => {
              const isInbound = m.type === 'ENTRADA';
              const isOutbound = m.type === 'SAIDA';
              const isAdjustment = m.type === 'AJUSTE';
            {movements.map((mov) => {
              const isEntrada = mov.type === 'ENTRADA';
              const isSaida = mov.type === 'SAIDA';
              const isAjuste = mov.type === 'AJUSTE';

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
                <Card
                  key={mov.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isEntrada
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : isSaida
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {isEntrada && <ArrowDownLeft size={18} />}
                      {isSaida && <ArrowUpRight size={18} />}
                      {isAjuste && <Sliders size={18} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-100 text-sm">
                          {mov.item?.name || 'Produto removido'}
                        </span>
                        <Badge
                          variant={isEntrada ? 'success' : isSaida ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {mov.reason?.replace(/_/g, ' ') || mov.type}
                        </Badge>
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
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                        {mov.item?.sku && (
                          <span>SKU: {mov.item.sku}</span>
                        )}
                        {mov.partner && (
                          <span className="flex items-center gap-1">
                            <Building size={12} />
                            {mov.partner}
                          </span>
                        )}
                        {mov.documentRef && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {mov.documentRef}
                          </span>
                        )}
                        {mov.user?.name && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {mov.user.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(mov.createdAt).toLocaleString('pt-BR')}
                        </span>
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
                      {mov.notes && (
                        <p className="text-xs text-zinc-400 mt-1.5 italic bg-[#1A1E29] px-2 py-1 rounded-md inline-block">
                          Nota: {mov.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detalhes de Apoio */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs text-[rgba(255,255,255,0.6)]">
                    <div className="flex items-center gap-1.5 truncate">
                      <User size={13} className="text-[rgba(255,255,255,0.4)] shrink-0" />
                      <span className="truncate">Por: {m.user?.name || 'Sistema'}</span>
                    </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#232838] shrink-0">
                    <span
                      className={`text-base font-bold ${
                        isEntrada
                          ? 'text-emerald-400'
                          : isSaida
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {isEntrada ? '+' : isSaida ? '-' : ''}
                      {mov.quantity} {mov.item?.unit || 'un'}
                    </span>

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
                    {(mov.unitPrice || mov.unitCost) && (
                      <span className="text-xs text-zinc-400">
                        {isSaida && mov.unitPrice
                          ? `R$ ${Number(mov.unitPrice).toFixed(2)} / un`
                          : mov.unitCost
                          ? `Custo: R$ ${Number(mov.unitCost).toFixed(2)}`
                          : ''}
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

