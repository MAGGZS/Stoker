'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell, useAppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyStockView } from '../components/ui/EmptyStockView';
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
    if (!activeStockId) {
      setLoading(false);
      return;
    }
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

  if (!activeStockId) {
    return (
      <AppShell
        title="Painel de controle"
        subtitle="Selecione um estoque para visualizar suas operações"
      >
        <EmptyStockView title="Nenhum estoque selecionado" />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Visão Geral do Estoque"
      subtitle={activeStock ? `${activeStock.name} • ${activeRole === 'OWNER' ? 'Dono' : 'Convidado'}` : 'Carregando...'}
      title="Visão geral"
      subtitle={activeStock ? `${activeStock.name} • ${activeRole === 'OWNER' ? 'Administrador' : 'Colaborador'}` : 'Carregando...'}
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
      title: 'Itens cadastrados',
      value: stats ? stats.totalItems : '—',
      subtitle: stats ? `${stats.totalUnits} unidades totais` : '',
      subtitle: stats ? `${stats.totalUnits} unidades em estoque` : '',
      icon: Package,
      color: '#3B82F6',
      iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Avaliação do Estoque',
      title: 'Avaliação total',
      value: stats ? `R$ ${stats.totalCostValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—',
      subtitle: stats ? `Potencial de venda: R$ ${stats.totalSaleValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      subtitle: stats ? `Venda prevista: R$ ${stats.totalSaleValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      icon: DollarSign,
      color: '#10B981',
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Estoque Baixo / Reposição',
      title: 'Reposição necessária',
      value: stats ? stats.lowStockCount : '—',
      subtitle: stats?.lowStockCount > 0 ? 'Exigem reposição imediata' : 'Nenhum item em falta',
      subtitle: stats?.lowStockCount > 0 ? 'Abaixo da margem de segurança' : 'Estoque regular',
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? '#DC2626' : '#F59E0B',
      iconColor: stats?.lowStockCount > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      alert: stats?.lowStockCount > 0,
    },
    {
      title: 'Movimentações (30 dias)',
      title: 'Movimentações (30d)',
      value: stats ? stats.last30Days.totalMovements : '—',
      subtitle: stats ? `+${stats.last30Days.inboundUnits} entr. / -${stats.last30Days.outboundUnits} saídas` : '',
      subtitle: stats ? `+${stats.last30Days.inboundUnits} entradas • -${stats.last30Days.outboundUnits} saídas` : '',
      icon: TrendingUp,
      color: '#8B5CF6',
      iconColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
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
                kpi.alert ? 'border-rose-500/40 bg-rose-950/15' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[rgba(255,255,255,0.55)] uppercase tracking-wider truncate">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400 truncate">
                  {kpi.title}
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${kpi.iconColor}`}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              <div className="text-2xl font-bold text-zinc-100 tracking-tight">
                {kpi.value}
              </div>

              {kpi.subtitle && (
                <p className="text-[11px] text-[rgba(255,255,255,0.45)] mt-1 truncate">
                <p className="text-xs text-zinc-400 mt-1 truncate">
                  {kpi.subtitle}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Atalhos Rápidos no Mobile */}
      {/* Ações Rápidas no Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => openInbound && openInbound()}
          className="flex items-center gap-2.5 p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.08)] active:scale-98 transition-all text-left"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#14161F] border border-[#232838] hover:border-[#2F364C] active:scale-[0.98] transition-[transform,background-color,border-color] text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Nova Entrada</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.45)]">Repor estoque</span>
            <span className="text-xs font-semibold text-zinc-100 block">Entrada</span>
            <span className="text-[11px] text-zinc-400">Repor estoque</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openOutbound && openOutbound()}
          className="flex items-center gap-2.5 p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.08)] active:scale-98 transition-all text-left"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-[#14161F] border border-[#232838] hover:border-[#2F364C] active:scale-[0.98] transition-[transform,background-color,border-color] text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center shrink-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Nova Saída</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.45)]">Baixar produto</span>
            <span className="text-xs font-semibold text-zinc-100 block">Saída</span>
            <span className="text-[11px] text-zinc-400">Baixar produtos</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => openNewItem && openNewItem()}
          className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.08)] active:scale-98 transition-all text-left"
          className="col-span-2 sm:col-span-1 flex items-center gap-3 p-3.5 rounded-xl bg-[#14161F] border border-[#232838] hover:border-[#2F364C] active:scale-[0.98] transition-[transform,background-color,border-color] text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center shrink-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
            <Plus size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Novo Item</span>
            <span className="text-[10px] text-[rgba(255,255,255,0.45)]">Cadastrar produto</span>
            <span className="text-xs font-semibold text-zinc-100 block">Novo item</span>
            <span className="text-[11px] text-zinc-400">Cadastrar</span>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel: Alertas de Reposição Imediata */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#232838]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#DC2626]" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Alertas de Estoque Mínimo
              <AlertTriangle size={17} className="text-rose-400" />
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                Itens abaixo do mínimo
              </h2>
            </div>
            <Link
              href="/itens?lowStockOnly=true"
              className="text-xs text-[#DC2626] hover:text-[#EF4444] font-medium flex items-center gap-1"
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-[rgba(255,255,255,0.45)]">
              Todos os itens estão com saldo acima do estoque mínimo de segurança.
          {loading ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              Carregando alertas...
            </div>
          ) : lowStockItems.length === 0 ? (
            <div className="py-10 text-center text-xs sm:text-sm text-zinc-400">
              Todos os itens cadastrados estão acima da margem de segurança.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-[12px] bg-[#1E1E22] border border-[rgba(255,255,255,0.06)]"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1A1E29] border border-[#262C3D] hover:border-[#353D52] transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs sm:text-sm font-semibold text-white truncate">
                    <p className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[rgba(255,255,255,0.5)]">
                      <span className="font-mono">{item.sku}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                      <span className="font-mono text-zinc-400">{item.sku}</span>
                      <span>•</span>
                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-bold text-[#EF4444] block">
                      <span className="text-xs sm:text-sm font-semibold text-rose-400 block">
                        {item.currentQuantity} {item.unit}
                      </span>
                      <span className="text-[10px] text-[rgba(255,255,255,0.4)]">em estoque</span>
                      <span className="text-[11px] text-zinc-500">saldo atual</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openInbound && openInbound(item.id)}
                      className="px-2.5 py-1.5 rounded-[8px] bg-[#DC2626]/20 hover:bg-[#DC2626]/30 text-[#F87171] text-xs font-semibold border border-[#DC2626]/30 active:scale-95 transition-all cursor-pointer"
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold border border-rose-500/30 active:scale-[0.96] transition-[transform,background-color] cursor-pointer"
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
          <div className="flex items-center justify-between pb-3 border-b border-[#232838]">
            <div className="flex items-center gap-2">
              <Boxes size={18} className="text-[#3B82F6]" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Movimentações Recentes
              <Boxes size={17} className="text-sky-400" />
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">
                Movimentações recentes
              </h2>
            </div>
            <Link
              href="/movimentacoes"
              className="text-xs text-[#DC2626] hover:text-[#EF4444] font-medium flex items-center gap-1"
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-[rgba(255,255,255,0.45)]">
          {loading ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              Carregando histórico...
            </div>
          ) : recentMovements.length === 0 ? (
            <div className="py-10 text-center text-xs sm:text-sm text-zinc-400">
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
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1A1E29] border border-[#262C3D] hover:border-[#353D52] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isInbound
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : isOutbound
                            ? 'bg-[#EF4444]/15 text-[#EF4444]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {isInbound ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                        <p className="text-xs sm:text-sm font-medium text-zinc-100 truncate">
                          {mov.item?.name}
                        </p>
                        <p className="text-[11px] text-[rgba(255,255,255,0.45)] truncate">
                        <p className="text-xs text-zinc-400 truncate">
                          {mov.reason} {mov.partner ? `• ${mov.partner}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isInbound ? 'text-[#10B981]' : isOutbound ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                        className={`text-xs sm:text-sm font-semibold ${
                          isInbound ? 'text-emerald-400' : isOutbound ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {isInbound ? '+' : isOutbound ? '-' : ''}
                        {mov.quantity} {mov.item?.unit}
                      </span>
                      <p className="text-[10px] text-[rgba(255,255,255,0.4)]">
                      <p className="text-[11px] text-zinc-500">
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

