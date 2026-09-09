'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell, useAppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Plus,
  ArrowRight,
  Boxes,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { activeStock, activeStockId, activeRole } = useStockStore();
  const [stats, setStats] = useState(null);
  const [recentMovements, setRecentMovements] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!activeStockId) return;
    setLoading(true);
    try {
      const [statsRes, movementsRes, itemsRes] = await Promise.all([
        api.get(`/stocks/${activeStockId}/stats`),
        api.get(`/stocks/${activeStockId}/movements?limit=6`),
        api.get(`/stocks/${activeStockId}/items?lowStockOnly=true&limit=5`),
      ]);

      setStats(statsRes.data);
      setRecentMovements(movementsRes.data.movements || []);
      setLowStockItems(itemsRes.data.items || []);
    } catch (err) {
      console.error('Erro ao carregar dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <AppShell
      title="Visão Geral do Estoque"
      subtitle={activeStock ? `${activeStock.name} • ${activeRole === 'OWNER' ? 'Dono' : 'Convidado'}` : 'Carregando...'}
      onRefresh={loadDashboardData}
    >
      <DashboardContent
        stats={stats}
        recentMovements={recentMovements}
        lowStockItems={lowStockItems}
        loading={loading}
      />
    </AppShell>
  );
}

function DashboardContent({ stats, recentMovements, lowStockItems, loading }) {
  const { openInbound, openOutbound, openNewItem } = useAppShell() || {};

  const kpis = [
    {
      title: 'Itens Cadastrados',
      value: stats ? stats.totalItems : '—',
      subtitle: stats ? `${stats.totalUnits} unidades totais` : '',
      icon: Package,
      color: '#3B82F6',
    },
    {
      title: 'Avaliação do Estoque',
      value: stats ? `R$ ${stats.totalCostValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—',
      subtitle: stats ? `Potencial de venda: R$ ${stats.totalSaleValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      icon: DollarSign,
      color: '#10B981',
    },
    {
      title: 'Estoque Baixo / Reposição',
      value: stats ? stats.lowStockCount : '—',
      subtitle: stats?.lowStockCount > 0 ? 'Exigem reposição imediata' : 'Nenhum item em falta',
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? '#DC2626' : '#F59E0B',
      alert: stats?.lowStockCount > 0,
    },
    {
      title: 'Movimentações (30 dias)',
      value: stats ? stats.last30Days.totalMovements : '—',
      subtitle: stats ? `+${stats.last30Days.inboundUnits} entr. / -${stats.last30Days.outboundUnits} saídas` : '',
      icon: TrendingUp,
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Grade de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.title}
              className={`relative overflow-hidden ${
                kpi.alert ? 'border-[#DC2626]/40 bg-[#DC2626]/5' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[rgba(255,255,255,0.55)] uppercase tracking-wider truncate">
                  {kpi.title}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {kpi.value}
              </div>

              {kpi.subtitle && (
                <p className="text-[11px] text-[rgba(255,255,255,0.45)] mt-1 truncate">
                  {kpi.subtitle}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Atalhos Rápidos no Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => openInbound && openInbound()}
          className="flex items-center gap-2.5 p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.08)] active:scale-98 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Nova Entrada</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.45)]">Repor estoque</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openOutbound && openOutbound()}
          className="flex items-center gap-2.5 p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.08)] active:scale-98 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center shrink-0">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Nova Saída</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.45)]">Baixar produto</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openNewItem && openNewItem()}
          className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.08)] active:scale-98 transition-all text-left"
        >
          <div className="w-9 h-9 rounded-full bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center shrink-0">
            <Plus size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Novo Item</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.45)]">Cadastrar produto</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel: Alertas de Reposição Imediata */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#DC2626]" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Alertas de Estoque Mínimo
              </h2>
            </div>
            <Link
              href="/itens?lowStockOnly=true"
              className="text-xs text-[#DC2626] hover:text-[#EF4444] font-medium flex items-center gap-1"
            >
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-[rgba(255,255,255,0.45)]">
              Todos os itens estão com saldo acima do estoque mínimo de segurança.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-[12px] bg-[#1E1E22] border border-[rgba(255,255,255,0.06)]"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[rgba(255,255,255,0.5)]">
                      <span className="font-mono">{item.sku}</span>
                      <span>•</span>
                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-[#EF4444] block">
                        {item.currentQuantity} {item.unit}
                      </span>
                      <span className="text-[10px] text-[rgba(255,255,255,0.4)]">em estoque</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openInbound && openInbound(item.id)}
                      className="px-2.5 py-1.5 rounded-[8px] bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-[#F87171] text-xs font-semibold border border-[#DC2626]/30 active:scale-95 transition-all cursor-pointer"
                    >
                      + Repor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Painel: Últimas Movimentações */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <Boxes size={18} className="text-[#3B82F6]" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Movimentações Recentes
              </h2>
            </div>
            <Link
              href="/movimentacoes"
              className="text-xs text-[#DC2626] hover:text-[#EF4444] font-medium flex items-center gap-1"
            >
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-[rgba(255,255,255,0.45)]">
              Nenhuma movimentação registrada recentemente neste estoque.
            </div>
          ) : (
            <div className="space-y-2">
              {recentMovements.map((mov) => {
                const isInbound = mov.type === 'ENTRADA';
                const isOutbound = mov.type === 'SAIDA';

                return (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-3 rounded-[12px] bg-[#1E1E22] border border-[rgba(255,255,255,0.06)]"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isInbound
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : isOutbound
                            ? 'bg-[#EF4444]/15 text-[#EF4444]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {isInbound ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {mov.item?.name}
                        </p>
                        <p className="text-[11px] text-[rgba(255,255,255,0.45)] truncate">
                          {mov.reason} {mov.partner ? `• ${mov.partner}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isInbound ? 'text-[#10B981]' : isOutbound ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                        }`}
                      >
                        {isInbound ? '+' : isOutbound ? '-' : ''}
                        {mov.quantity} {mov.item?.unit}
                      </span>
                      <p className="text-[10px] text-[rgba(255,255,255,0.4)]">
                        {new Date(mov.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

