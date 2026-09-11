'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/AppShell';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/api';
import { TransferenciaModal } from '../../components/modals/TransferenciaModal';
import {
  Truck,
  Layers,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowLeftRight,
  Download,
  Search,
  RotateCw,
  Warehouse,
  Package,
  BarChart3,
  Clock,
  ArrowUpRight,
  CheckCircle,
  FileText,
  DollarSign,
  AlertCircle,
  ShieldAlert,
  ArrowDownLeft,
} from 'lucide-react';

export default function LogisticaAdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { showToast } = useToast();

  const [overview, setOverview] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const [activeTab, setActiveTab] = useState('rede');
  const [abcFilter, setAbcFilter] = useState('TODAS');
  const [abcSearch, setAbcSearch] = useState('');
  const [ropSearch, setRopSearch] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSourceId, setTransferSourceId] = useState('');

  // Carrega dados da central de logística
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewRes, transfersRes] = await Promise.all([
        api.get('/admin/logistica/overview'),
        api.get('/admin/logistica/transfers').catch(() => ({ data: [] })),
      ]);

      setOverview(overviewRes.data);
      setTransfers(transfersRes.data || []);
      setLastSync(new Date());
      if (isRefresh) showToast('Dados de logística atualizados com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao carregar dados de logística', err);
      if (err.response?.status === 403) {
        showToast('Acesso restrito ao Administrador do Sistema', 'danger');
      } else {
        showToast('Erro ao carregar dados consolidados da rede', 'danger');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!authLoading && user?.isAdmin) {
      loadData();
    } else if (!authLoading && !user?.isAdmin) {
      setLoading(false);
    }
  }, [authLoading, user, loadData]);

  // Se não for administrador, exibe alerta de segurança
  if (!authLoading && !user?.isAdmin) {
    return (
      <AppShell
        title="Painel de Logística"
        subtitle="Módulo restrito de governança e supply chain"
      >
        <Card className="text-center py-16 max-w-xl mx-auto space-y-4 border-rose-500/30 bg-[#14161F]">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Acesso Restrito ao Administrador</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              Este módulo gerencial requer privilégios de Administrador Geral da rede de suprimentos.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={() => router.push('/dashboard')}>
              Voltar ao Meu Estoque
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  // Filtragem da Curva ABC
  const filteredAbcItems = useMemo(() => {
    if (!overview?.abcAnalysis?.items) return [];
    return overview.abcAnalysis.items.filter((item) => {
      const matchesClass = abcFilter === 'TODAS' || item.classification === abcFilter;
      const matchesQuery =
        item.name.toLowerCase().includes(abcSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(abcSearch.toLowerCase()) ||
        item.stockName.toLowerCase().includes(abcSearch.toLowerCase());
      return matchesClass && matchesQuery;
    });
  }, [overview, abcFilter, abcSearch]);

  // Filtragem do Motor ROP
  const filteredRopItems = useMemo(() => {
    if (!overview?.replenishment?.items) return [];
    return overview.replenishment.items.filter((item) => {
      return (
        item.name.toLowerCase().includes(ropSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(ropSearch.toLowerCase()) ||
        item.stockName.toLowerCase().includes(ropSearch.toLowerCase())
      );
    });
  }, [overview, ropSearch]);

  // Exportar Lista de Compras / Reposição em CSV
  const handleExportRopCsv = () => {
    if (!overview?.replenishment?.items) return;

    const itemsToOrder = overview.replenishment.items.filter((i) => i.suggestedOrderQty > 0);
    if (itemsToOrder.length === 0) {
      showToast('Nenhum item com necessidade de compra identificado no momento', 'info');
      return;
    }

    const headers = ['SKU', 'Produto', 'Estoque', 'Saldo_Atual', 'Unidade', 'Consumo_Diario', 'Dias_Cobertura', 'Ponto_Pedido_ROP', 'Sugestao_Compra', 'Custo_Unitario', 'Custo_Estimado_Total', 'Status'];
    const rows = itemsToOrder.map((i) => [
      i.sku,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.stockName}"`,
      i.currentQuantity,
      i.unit,
      i.dailyBurnRate,
      i.daysOfSupply === 999 ? 'Sem_Saidas' : i.daysOfSupply,
      i.reorderPoint,
      i.suggestedOrderQty,
      i.estimatedCost > 0 ? (i.estimatedCost / i.suggestedOrderQty).toFixed(2) : 0,
      i.estimatedCost,
      i.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stoker-sugestao-compras-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Relatório com ${itemsToOrder.length} itens exportado com sucesso!`, 'success');
  };

  const tabs = [
    { id: 'rede', label: 'Visão da Rede', icon: Warehouse, count: overview?.stockBreakdown?.length },
    { id: 'abc', label: 'Curva ABC (Pareto)', icon: BarChart3, count: overview?.abcAnalysis?.items?.length },
    { id: 'reposicao', label: 'Previsão & Reposição (ROP)', icon: TrendingUp, alert: overview?.replenishment?.criticalCount > 0 },
    { id: 'transferencias', label: 'Transferências Inter-Estoques', icon: ArrowLeftRight, count: transfers.length },
    { id: 'perdas', label: 'Capital Encalhado & Perdas', icon: AlertTriangle, alert: overview?.deadStock?.count > 0 },
  ];

  return (
    <AppShell
      title="Painel de Logística e Supply Chain"
      subtitle="Cockpit de governança multi-unidades, matriz de giro ABC, motor ROP e remessas inter-galpões"
      onRefresh={() => loadData(true)}
    >
      <div className="space-y-6">
        {/* Cabeçalho Executivo com Ações Rápidas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#14161F] border border-[#232838]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-950/20">
              <Truck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">Controle Operacional Centralizado</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  ADM EXCLUSIVO
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {lastSync ? `Última sincronização: ${lastSync.toLocaleTimeString('pt-BR')}` : 'Carregando dados da malha logística...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadData(true)}
              loading={refreshing}
              icon={<RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />}
            >
              Atualizar
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportRopCsv}
              icon={<Download size={14} />}
              disabled={!overview}
            >
              Exportar Compras
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setTransferSourceId('');
                setTransferModalOpen(true);
              }}
              icon={<ArrowLeftRight size={14} />}
              disabled={!overview?.stockBreakdown || overview.stockBreakdown.length < 2}
            >
              Nova Transferência
            </Button>
          </div>
        </div>

        {/* 5 KPIs Executivos da Rede de Suprimentos */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Capital em Estoque
            </span>
            <p className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
              R$ {overview?.networkMetrics?.totalInventoryValue ? overview.networkMetrics.totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {overview?.networkMetrics?.totalUnits ? overview.networkMetrics.totalUnits.toLocaleString('pt-BR') : 0} unidades físicas
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Rede Multi-Galpões
            </span>
            <p className="text-xl sm:text-2xl font-bold text-zinc-100 mt-1">
              {overview?.networkMetrics?.totalStocks || 0} Estoques
            </p>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {overview?.networkMetrics?.totalSkus || 0} SKUs cadastrados
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Taxa de Ruptura
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold mt-1 ${
                (overview?.networkMetrics?.stockoutRate || 0) > 10 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {overview?.networkMetrics?.stockoutRate || 0}%
            </p>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {overview?.networkMetrics?.stockoutCount || 0} itens zerados
            </span>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Estoque Encalhado
            </span>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
              R$ {overview?.networkMetrics?.totalDeadStockValue ? overview.networkMetrics.totalDeadStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              {overview?.deadStock?.count || 0} itens parados há 30d+
            </span>
          </Card>

          <Card className="p-4 col-span-2 lg:col-span-1">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Perdas & Avarias (90d)
            </span>
            <p className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">
              R$ {overview?.networkMetrics?.totalLossValue90d ? overview.networkMetrics.totalLossValue90d.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </p>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Desvios apurados
            </span>
          </Card>
        </div>

        {/* Abas de Módulos Logísticos */}
        <div className="flex items-center gap-2 border-b border-[#232838] overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14161F]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-[#1E2230] text-zinc-400'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* CONTEÚDO DA ABA 1: VISÃO DA REDE */}
        {activeTab === 'rede' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Galpões e Centros de Distribuição</h3>
                <p className="text-xs text-zinc-400">Comparativo operacional e financeiro de todas as unidades</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <span className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : overview?.stockBreakdown?.length === 0 ? (
              <Card className="text-center py-16">
                <p className="text-sm text-zinc-400">Nenhum estoque cadastrado no sistema</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {overview?.stockBreakdown?.map((stock) => (
                  <Card key={stock.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Warehouse size={18} className="text-rose-400 shrink-0" />
                          <h4 className="font-bold text-base text-zinc-100">{stock.name}</h4>
                        </div>
                        {stock.description && (
                          <p className="text-xs text-zinc-400 mt-1">{stock.description}</p>
                        )}
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Responsável: <span className="font-medium text-zinc-300">{stock.creatorName}</span>
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setTransferSourceId(stock.id);
                          setTransferModalOpen(true);
                        }}
                        icon={<ArrowLeftRight size={13} />}
                      >
                        Transferir
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#232838] text-center">
                      <div className="bg-[#10121A] p-2.5 rounded-xl border border-[#232838]">
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Capital</span>
                        <span className="text-sm font-bold text-zinc-100 mt-0.5 block">
                          R$ {stock.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="bg-[#10121A] p-2.5 rounded-xl border border-[#232838]">
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold block">SKUs Ativos</span>
                        <span className="text-sm font-bold text-zinc-100 mt-0.5 block">{stock.itemCount}</span>
                      </div>

                      <div className="bg-[#10121A] p-2.5 rounded-xl border border-[#232838]">
                        <span className="text-[10px] uppercase text-zinc-400 font-semibold block">Rupturas</span>
                        <span className={`text-sm font-bold mt-0.5 block ${stock.stockoutCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {stock.stockoutCount}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: CURVA ABC (PARETO) */}
        {activeTab === 'abc' && (
          <div className="space-y-4">
            {/* Cards de resumo das 3 Classes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 border-l-4 border-l-emerald-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Classe A (Críticos)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono font-bold">
                    {overview?.abcAnalysis?.summary?.classA?.percentOfTotal || 0}% do Valor
                  </span>
                </div>
                <p className="text-xl font-bold text-zinc-100">
                  R$ {overview?.abcAnalysis?.summary?.classA?.totalValue ? overview.abcAnalysis.summary.classA.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </p>
                <p className="text-xs text-zinc-400">
                  {overview?.abcAnalysis?.summary?.classA?.count || 0} produtos de altíssimo valor imobilizado. Auditoria semanal prioritária.
                </p>
              </Card>

              <Card className="p-4 border-l-4 border-l-amber-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Classe B (Intermediários)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono font-bold">
                    {overview?.abcAnalysis?.summary?.classB?.percentOfTotal || 0}% do Valor
                  </span>
                </div>
                <p className="text-xl font-bold text-zinc-100">
                  R$ {overview?.abcAnalysis?.summary?.classB?.totalValue ? overview.abcAnalysis.summary.classB.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </p>
                <p className="text-xs text-zinc-400">
                  {overview?.abcAnalysis?.summary?.classB?.count || 0} produtos com relevância moderada. Auditoria quinzenal recomendada.
                </p>
              </Card>

              <Card className="p-4 border-l-4 border-l-sky-500 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Classe C (Operacionais)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 font-mono font-bold">
                    {overview?.abcAnalysis?.summary?.classC?.percentOfTotal || 0}% do Valor
                  </span>
                </div>
                <p className="text-xl font-bold text-zinc-100">
                  R$ {overview?.abcAnalysis?.summary?.classC?.totalValue ? overview.abcAnalysis.summary.classC.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </p>
                <p className="text-xs text-zinc-400">
                  {overview?.abcAnalysis?.summary?.classC?.count || 0} produtos de baixo valor unitário e alto volume de itens.
                </p>
              </Card>
            </div>

            {/* Barra de Distribuição Visual */}
            <div className="p-4 rounded-2xl bg-[#14161F] border border-[#232838] space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Distribuição Percentual de Capital da Rede</span>
                <span className="font-mono text-zinc-300">100% Auditado</span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#1A1E29] flex overflow-hidden">
                <div
                  style={{ width: `${overview?.abcAnalysis?.summary?.classA?.percentOfTotal || 0}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title="Classe A"
                />
                <div
                  style={{ width: `${overview?.abcAnalysis?.summary?.classB?.percentOfTotal || 0}%` }}
                  className="bg-amber-500 transition-all duration-500"
                  title="Classe B"
                />
                <div
                  style={{ width: `${overview?.abcAnalysis?.summary?.classC?.percentOfTotal || 0}%` }}
                  className="bg-sky-500 transition-all duration-500"
                  title="Classe C"
                />
              </div>
            </div>

            {/* Filtros e Busca da Tabela ABC */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5">
                {['TODAS', 'A', 'B', 'C'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAbcFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      abcFilter === cat
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#14161F] text-zinc-400 hover:text-zinc-200 border border-[#232838]'
                    }`}
                  >
                    {cat === 'TODAS' ? 'Todas as Classes' : `Classe ${cat}`}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-64">
                <Input
                  placeholder="Buscar SKU, nome ou estoque..."
                  value={abcSearch}
                  onChange={(e) => setAbcSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Tabela de Produtos da Curva ABC */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#10121A] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#232838]">
                    <tr>
                      <th className="py-3 px-4">Classe</th>
                      <th className="py-3 px-4">SKU / Produto</th>
                      <th className="py-3 px-4">Galpão</th>
                      <th className="py-3 px-4 text-right">Saldo</th>
                      <th className="py-3 px-4 text-right">Custo Unit.</th>
                      <th className="py-3 px-4 text-right">Valor Total</th>
                      <th className="py-3 px-4 text-right">% Rede</th>
                      <th className="py-3 px-4 text-right">% Acum.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {filteredAbcItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-zinc-400 text-xs">
                          Nenhum produto corresponde aos critérios de filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredAbcItems.map((item) => {
                        const badgeColor =
                          item.classification === 'A'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : item.classification === 'B'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30';

                        return (
                          <tr key={item.id} className="hover:bg-[#1A1E29]/60 transition-colors">
                            <td className="py-3 px-4">
                              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                Classe {item.classification}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-zinc-100 block">{item.name}</span>
                              <span className="text-xs text-zinc-400 font-mono">{item.sku}</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-300">{item.stockName}</td>
                            <td className="py-3 px-4 text-right font-semibold text-zinc-100">
                              {item.currentQuantity} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-400">
                              R$ {item.costPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-zinc-100">
                              R$ {item.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-400 font-mono">
                              {item.sharePercent}%
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-400 font-mono font-semibold">
                              {item.cumulativePercent}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* CONTEÚDO DA ABA 3: PREVISÃO & REPOSIÇÃO (ROP) */}
        {activeTab === 'reposicao' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Motor de Previsão de Demanda e Reposição</h3>
                <p className="text-xs text-zinc-400">
                  Cálculo de consumo diário (*burn rate* 30d), cobertura em dias e sugestão automatizada de compras
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportRopCsv}
                icon={<Download size={14} />}
              >
                Exportar Pedido de Compras (CSV)
              </Button>
            </div>

            {/* Cards de Status ROP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] uppercase font-semibold text-rose-300 block">Ruptura Crítica</span>
                <span className="text-xl font-bold text-rose-400 block mt-0.5">
                  {overview?.replenishment?.criticalCount || 0} SKUs
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Saldo zerado ou &lt; 7 dias</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] uppercase font-semibold text-amber-300 block">Ponto de Pedido (ROP)</span>
                <span className="text-xl font-bold text-amber-400 block mt-0.5">
                  {overview?.replenishment?.reorderCount || 0} SKUs
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Comprar para repor margem</span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[10px] uppercase font-semibold text-purple-300 block">Superestocado</span>
                <span className="text-xl font-bold text-purple-400 block mt-0.5">
                  {overview?.replenishment?.excessCount || 0} SKUs
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Mais de 60 dias de cobertura</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] uppercase font-semibold text-emerald-300 block">Equilibrado</span>
                <span className="text-xl font-bold text-emerald-400 block mt-0.5">
                  {(overview?.replenishment?.items?.length || 0) - (overview?.replenishment?.criticalCount || 0) - (overview?.replenishment?.reorderCount || 0)} SKUs
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Nível de serviço ideal</span>
              </div>
            </div>

            {/* Tabela do Motor ROP */}
            <Card className="p-0 overflow-hidden">
              <div className="p-3.5 border-b border-[#232838] flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Grade de Reposição e Nível de Serviço</span>
                <div className="w-64">
                  <Input
                    placeholder="Filtrar produtos..."
                    value={ropSearch}
                    onChange={(e) => setRopSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#10121A] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#232838]">
                    <tr>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">SKU / Produto</th>
                      <th className="py-3 px-4">Galpão</th>
                      <th className="py-3 px-4 text-right">Saldo Atual</th>
                      <th className="py-3 px-4 text-right">Giro Diário (30d)</th>
                      <th className="py-3 px-4 text-right">Cobertura</th>
                      <th className="py-3 px-4 text-right">Ponto Pedido (ROP)</th>
                      <th className="py-3 px-4 text-right">Sugestão Compra</th>
                      <th className="py-3 px-4 text-right">Investimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {filteredRopItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-zinc-400 text-xs">
                          Nenhum produto cadastrado no catálogo.
                        </td>
                      </tr>
                    ) : (
                      filteredRopItems.map((item) => {
                        const statusConfig = {
                          CRITICO: { label: 'Ruptura', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
                          REPOSICAO: { label: 'Comprar', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
                          EQUILIBRADO: { label: 'Normal', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
                          EXCESSO: { label: 'Excesso', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
                        }[item.status];

                        return (
                          <tr key={item.id} className="hover:bg-[#1A1E29]/60 transition-colors">
                            <td className="py-3 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-zinc-100 block">{item.name}</span>
                              <span className="text-xs text-zinc-400 font-mono">{item.sku}</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-300">{item.stockName}</td>
                            <td className="py-3 px-4 text-right font-semibold text-zinc-100">
                              {item.currentQuantity} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-400 font-mono">
                              {item.dailyBurnRate} {item.unit}/dia
                            </td>
                            <td className="py-3 px-4 text-right font-bold">
                              <span className={item.daysOfSupply < 7 ? 'text-rose-400' : item.daysOfSupply < 15 ? 'text-amber-400' : 'text-zinc-300'}>
                                {item.daysOfSupply === 999 ? 'Sem saídas' : `${item.daysOfSupply} dias`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-400 font-mono">
                              {item.reorderPoint} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-300">
                              {item.suggestedOrderQty > 0 ? `+${item.suggestedOrderQty} ${item.unit}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-200">
                              {item.estimatedCost > 0 ? `R$ ${item.estimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* CONTEÚDO DA ABA 4: TRANSFERÊNCIAS INTER-ESTOQUES */}
        {activeTab === 'transferencias' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Transferências Inter-Galpões</h3>
                <p className="text-xs text-zinc-400">Rastreabilidade completa de remessas e movimentações entre filiais</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setTransferSourceId('');
                  setTransferModalOpen(true);
                }}
                icon={<ArrowLeftRight size={14} />}
                disabled={!overview?.stockBreakdown || overview.stockBreakdown.length < 2}
              >
                Disparar Nova Transferência
              </Button>
            </div>

            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#10121A] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#232838]">
                    <tr>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Tipo</th>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">Quantidade</th>
                      <th className="py-3 px-4">Galpão</th>
                      <th className="py-3 px-4">Referência / Rota</th>
                      <th className="py-3 px-4">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-zinc-400 text-xs">
                          Nenhuma transferência inter-estoques registrada até o momento.
                        </td>
                      </tr>
                    ) : (
                      transfers.map((t) => (
                        <tr key={t.id} className="hover:bg-[#1A1E29]/60 transition-colors">
                          <td className="py-3 px-4 text-xs text-zinc-400 font-mono">
                            {new Date(t.created_at).toLocaleDateString('pt-BR')} {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              t.type === 'ENTRADA' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              {t.type === 'ENTRADA' ? 'Recebida' : 'Expedida'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-zinc-100 block">{t.item?.name}</span>
                            <span className="text-xs text-zinc-400 font-mono">{t.item?.sku}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-100">
                            {t.quantity} {t.item?.unit}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">{t.stock?.name}</td>
                          <td className="py-3 px-4 text-xs text-zinc-400">{t.document_ref || t.partner || '—'}</td>
                          <td className="py-3 px-4 text-xs text-zinc-300">{t.user?.name || 'Sistema'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* CONTEÚDO DA ABA 5: CAPITAL ENCALHADO & PERDAS */}
        {activeTab === 'perdas' && (
          <div className="space-y-6">
            {/* Seção 1: Estoque Encalhado (Dead Stock) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Capital Imobilizado Sem Giro (Dead Stock)</h3>
                  <p className="text-xs text-zinc-400">
                    Produtos com saldo positivo em prateleira sem nenhuma saída registrada nos últimos 30 dias
                  </p>
                </div>
                <span className="text-sm font-bold text-amber-400">
                  Total Parado: R$ {overview?.deadStock?.totalValue ? overview.deadStock.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>

              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#10121A] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#232838]">
                      <tr>
                        <th className="py-3 px-4">SKU / Produto</th>
                        <th className="py-3 px-4">Galpão</th>
                        <th className="py-3 px-4 text-right">Saldo Parado</th>
                        <th className="py-3 px-4 text-right">Custo Unitário</th>
                        <th className="py-3 px-4 text-right">Capital Imobilizado</th>
                        <th className="py-3 px-4">Ação Logística Recomendada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232838]">
                      {overview?.deadStock?.items?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-zinc-400 text-xs">
                            Excelente! Nenhum item com estoque sem giro identificado.
                          </td>
                        </tr>
                      ) : (
                        overview?.deadStock?.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-[#1A1E29]/60 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-zinc-100 block">{item.name}</span>
                              <span className="text-xs text-zinc-400 font-mono">{item.sku}</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-300">{item.stockName}</td>
                            <td className="py-3 px-4 text-right font-semibold text-zinc-100">
                              {item.currentQuantity} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right text-zinc-400 font-mono">
                              R$ {item.costPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-amber-400 font-mono">
                              R$ {item.tiedUpCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs text-zinc-300 bg-[#10121A] px-2 py-1 rounded-lg border border-[#232838] inline-block">
                                Remanejar para outro galpão ou ação de liquidação
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Seção 2: Perdas Operacionais e Avarias */}
            <div className="space-y-3 pt-4 border-t border-[#232838]">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Perdas, Quebras e Avarias (Últimos 90 Dias)</h3>
                <p className="text-xs text-zinc-400">
                  Total de prejuízos apurados por quebra física, avaria de manuseio ou divergência de contagem
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(overview?.losses?.byReason || {}).map(([reason, stats]) => (
                  <Card key={reason} className="p-4 border border-rose-500/20 bg-rose-500/5">
                    <span className="text-xs uppercase font-bold text-rose-400 block tracking-wider">
                      {reason.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xl font-bold text-zinc-100 mt-1">
                      R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-xs text-zinc-400 mt-1 block">
                      {stats.count} {stats.count === 1 ? 'ocorrência registrada' : 'ocorrências registradas'}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Transferência Inter-Estoques */}
      <TransferenciaModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={() => loadData(true)}
        stocks={overview?.stockBreakdown || []}
        preselectedSourceId={transferSourceId}
      />
    </AppShell>
  );
}
