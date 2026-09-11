'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell, useAppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
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

  const shell = useAppShell();

  const kpis = [
    {
      title: 'Itens cadastrados',
      value: stats?.totalItems ?? (loading ? '—' : 0),
      subtitle: `${stats?.totalCategories ?? 0} categorias`,
      icon: Package,
      iconColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Valor total em estoque',
      value: `R$ ${Number(stats?.totalCostValue ?? 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      subtitle: 'Custo médio ponderado',
      icon: DollarSign,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Abaixo do estoque mínimo',
      value: stats?.lowStockCount ?? (loading ? '—' : 0),
      subtitle: stats?.lowStockCount > 0 ? 'Exigem reposição' : 'Estoque regular',
      icon: AlertTriangle,
      iconColor:
        stats?.lowStockCount > 0
          ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
          : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      alert: stats?.lowStockCount > 0,
    },
    {
      title: 'Movimentações no mês',
      value: stats?.monthlyMovementsCount ?? (loading ? '—' : 0),
      subtitle: 'Entradas, saídas e contagens',
      icon: TrendingUp,
      iconColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    },
  ];

  return (
    <AppShell
      title={activeStock ? activeStock.name : 'Visão geral'}
      subtitle={
        activeStock
          ? `${activeRole === 'OWNER' ? 'Proprietário' : 'Convidado'} • Resumo de operações e alertas`
          : 'Resumo operacional'
      }
      onRefresh={loadDashboardData}
    >
      <div className="space-y-6">
        {/* Grade de KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card
                key={kpi.title}
                className={`relative overflow-hidden ${
                  kpi.alert ? 'border-rose-500/40 bg-rose-950/15' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400 truncate">
                    {kpi.title}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${kpi.iconColor}`}
                  >
                    <Icon size={16} />
                  </div>
                </div>

                <div className="text-2xl font-bold text-zinc-100 tracking-tight">
                  {kpi.value}
                </div>

                {kpi.subtitle && (
                  <p className="text-xs text-zinc-400 mt-1 truncate">
                    {kpi.subtitle}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* Atalhos Rápidos no Mobile */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => shell?.openInbound && shell.openInbound()}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#14161F] border border-[#232838] active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5 border border-emerald-500/20">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-xs font-medium text-zinc-200">Entrada</span>
          </button>

          <button
            type="button"
            onClick={() => shell?.openOutbound && shell.openOutbound()}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#14161F] border border-[#232838] active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-1.5 border border-rose-500/20">
              <ArrowUpRight size={16} />
            </div>
            <span className="text-xs font-medium text-zinc-200">Saída</span>
          </button>

          <button
            type="button"
            onClick={() => shell?.openNewItem && shell.openNewItem()}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#14161F] border border-[#232838] active:scale-95 transition-transform cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1A1E29] text-zinc-300 flex items-center justify-center mb-1.5 border border-[#262C3D]">
              <Plus size={16} />
            </div>
            <span className="text-xs font-medium text-zinc-200">Produto</span>
          </button>
        </div>

        {/* Painéis Principais: Alertas e Movimentações Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Card Alerta de Reposição */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232838]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" />
                <h2 className="text-sm font-semibold text-zinc-100">
                  Itens em alerta de reposição
                </h2>
              </div>
              <Link
                href="/itens?lowStockOnly=true"
                className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                Ver catálogo
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <span className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1A1E29] border border-[#262C3D] text-emerald-400 flex items-center justify-center mb-2">
                  <Boxes size={20} />
                </div>
                <p className="text-sm font-medium text-zinc-200">Estoque em dia</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Nenhum produto atingiu o saldo mínimo de segurança
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#232838] flex-1">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        SKU: {item.sku} • Mínimo: {item.minQuantity} {item.unit}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-rose-400">
                        {item.currentQuantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => shell?.openInbound && shell.openInbound(item.id)}
                        className="block text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer mt-0.5"
                      >
                        Repor item +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Card Movimentações Recentes */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#232838]">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-sky-400" />
                <h2 className="text-sm font-semibold text-zinc-100">
                  Lançamentos recentes
                </h2>
              </div>
              <Link
                href="/movimentacoes"
                className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                Extrato completo
                <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <span className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentMovements.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm font-medium text-zinc-200">
                  Nenhuma movimentação registrada
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Lance entradas e saídas para acompanhar o histórico
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#232838] flex-1">
                {recentMovements.map((mov) => {
                  const isEntrada = mov.type === 'ENTRADA';
                  const isSaida = mov.type === 'SAIDA';

                  return (
                    <div
                      key={mov.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isEntrada
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isSaida
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {isEntrada && <ArrowDownLeft size={14} />}
                          {isSaida && <ArrowUpRight size={14} />}
                          {!isEntrada && !isSaida && <Boxes size={14} />}
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-zinc-100 truncate">
                            {mov.item?.name || 'Produto'}
                          </p>
                          <p className="text-xs text-zinc-400 truncate">
                            {new Date(mov.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • {mov.reason?.replace(/_/g, ' ') || mov.type}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-semibold ${
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

