'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Warehouse,
  Package,
  ArrowDownUp,
  MessageSquare,
  RefreshCw,
  Search,
  KeyRound,
  Trash2,
  CheckCircle2,
  Clock,
  Archive,
  ArrowLeft,
  Boxes,
  LogOut,
  Star,
  Activity,
  Server,
  Database,
  Lightbulb,
  Bug,
  Heart,
  HelpCircle,
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuthStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'USERS' | 'FEEDBACKS' | 'AUDIT'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dados do Dashboard
  const [dashboardData, setDashboardData] = useState(null);

  // Gestão de Usuários
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL' | 'ADMIN' | 'MEMBER'

  // Central de Feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState('ALL');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState('ALL');

  // Logs de Auditoria
  const [auditLogs, setAuditLogs] = useState([]);

  // Proteção: Apenas administradores podem acessar
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (!user.isAdmin) {
        showToast('Acesso restrito apenas a administradores da plataforma', 'danger');
        router.replace('/estoques');
      }
    }
  }, [authLoading, user, router, showToast]);

  // Carregamento de dados
  const loadAdminData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dashRes, usersRes, feedbacksRes, auditRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'),
        api.get('/admin/feedbacks'),
        api.get('/admin/audit'),
      ]);

      setDashboardData(dashRes.data?.data || null);
      setUsersList(usersRes.data?.data?.users || []);
      setFeedbacks(feedbacksRes.data?.data || []);
      setAuditLogs(auditRes.data?.data || []);
    } catch (err) {
      console.error('Erro ao carregar painel administrativo', err);
      const msg = err.response?.data?.error?.message || 'Falha ao carregar dados do painel do administrador';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user?.isAdmin) {
      loadAdminData();
    }
  }, [user, loadAdminData]);

  // Ações de Usuários
  const handleToggleAdmin = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showToast('Você não pode alterar seu próprio privilégio de administrador', 'warning');
      return;
    }

    const actionText = targetUser.isAdmin ? 'remover o privilégio de Administrador de' : 'promover a Administrador';
    if (!confirm(`Deseja realmente ${actionText} ${targetUser.name}?`)) return;

    try {
      await api.patch(`/admin/users/${targetUser.id}/role`);
      showToast(`Privilégio de ${targetUser.name} atualizado com sucesso`, 'success');
      loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao alterar privilégio do usuário';
      showToast(msg, 'danger');
    }
  };

  const handleResetPassword = async (targetUser) => {
    const newPass = prompt(
      `Redefinir senha para ${targetUser.name} (${targetUser.email}):\n\nDigite a nova senha temporária (mínimo 6 caracteres) ou deixe em branco para "Stoker123!":`
    );
    if (newPass === null) return; // cancelou

    const passToSet = newPass.trim() || 'Stoker123!';
    if (passToSet.length < 6) {
      showToast('A senha temporária deve conter no mínimo 6 caracteres', 'warning');
      return;
    }

    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/reset-password`, {
        newPassword: passToSet,
      });
      alert(`Senha redefinida com sucesso para ${targetUser.name}!\n\nNova senha temporária: ${res.data.temporaryPassword}`);
      showToast('Senha redefinida com sucesso', 'success');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao redefinir senha';
      showToast(msg, 'danger');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showToast('Você não pode excluir sua própria conta', 'warning');
      return;
    }

    if (!confirm(`ATENÇÃO: Deseja excluir permanentemente a conta de ${targetUser.name} (${targetUser.email})?`)) return;

    try {
      await api.delete(`/admin/users/${targetUser.id}`);
      showToast('Usuário removido com sucesso', 'success');
      loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao excluir usuário';
      showToast(msg, 'danger');
    }
  };

  // Ações de Feedbacks
  const handleUpdateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      await api.patch(`/admin/feedbacks/${feedbackId}/status`, { status: newStatus });
      showToast('Status do feedback atualizado', 'success');
      loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao atualizar status';
      showToast(msg, 'danger');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!confirm('Deseja realmente remover este feedback?')) return;
    try {
      await api.delete(`/admin/feedbacks/${feedbackId}`);
      showToast('Feedback removido', 'success');
      loadAdminData();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao remover feedback';
      showToast(msg, 'danger');
    }
  };

  // Filtros de Usuários
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());

      const matchesRole =
        userRoleFilter === 'ALL' ||
        (userRoleFilter === 'ADMIN' && u.isAdmin) ||
        (userRoleFilter === 'MEMBER' && !u.isAdmin);

      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  // Filtros de Feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesStatus = feedbackStatusFilter === 'ALL' || f.status === feedbackStatusFilter;
      const matchesType = feedbackTypeFilter === 'ALL' || f.type === feedbackTypeFilter;
      return matchesStatus && matchesType;
    });
  }, [feedbacks, feedbackStatusFilter, feedbackTypeFilter]);

  const feedbackCounts = useMemo(() => {
    return {
      all: feedbacks.length,
      pending: feedbacks.filter((f) => f.status === 'PENDING').length,
      inReview: feedbacks.filter((f) => f.status === 'IN_REVIEW').length,
      resolved: feedbacks.filter((f) => f.status === 'RESOLVED').length,
      archived: feedbacks.filter((f) => f.status === 'ARCHIVED').length,
    };
  }, [feedbacks]);

  if (authLoading || (!user?.isAdmin && loading)) {
    return (
      <div className="min-h-screen bg-[#0C0D11] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  const metrics = dashboardData?.metrics || {
    totalUsers: 0,
    totalStocks: 0,
    totalItems: 0,
    totalMovements: 0,
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
  };

  const systemInfo = dashboardData?.systemInfo || {};

  const getFeedbackTypeBadge = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30"><Lightbulb size={12} /> Sugestão</span>;
      case 'BUG':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30"><Bug size={12} /> Bug</span>;
      case 'COMPLIMENT':
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><Heart size={12} /> Elogio</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30"><HelpCircle size={12} /> Outro</span>;
    }
  };

  const getFeedbackStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">Pendente</span>;
      case 'IN_REVIEW':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">Em análise</span>;
      case 'RESOLVED':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Resolvido</span>;
      case 'ARCHIVED':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">Arquivado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D11] text-zinc-100 flex flex-col">
      {/* Top Navbar Dedicado do Administrador */}
      <header className="sticky top-0 z-30 bg-[#11131A]/95 backdrop-blur-md border-b border-[#232838] px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14161F] border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-black/40 shrink-0">
              <ShieldAlert size={22} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1.5">
                Stoker Admin
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  CRIADOR
                </span>
              </span>
              <p className="text-[11px] font-medium text-zinc-400">
                Gestão e controle global da plataforma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/estoques')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14161F] hover:bg-[#1A1E29] border border-[#232838] hover:border-zinc-500 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Voltar aos estoques</span>
            </button>

            <button
              type="button"
              onClick={logout}
              title="Sair da conta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161F] hover:bg-rose-500/15 border border-[#232838] hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header do Painel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#232838]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Painel do Administrador
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Controle de usuários, caixa de entrada de feedbacks e métricas de desempenho da plataforma.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadAdminData}
              disabled={refreshing}
              icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
            >
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Abas de Navegação do Painel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#232838]">
          <button
            type="button"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DASHBOARD'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14161F]'
            }`}
          >
            <Activity size={16} />
            <span>Dashboard da Plataforma</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'USERS'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14161F]'
            }`}
          >
            <Users size={16} />
            <span>Controle de Usuários</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#1A1E29] text-zinc-300">
              {usersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FEEDBACKS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'FEEDBACKS'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14161F]'
            }`}
          >
            <MessageSquare size={16} />
            <span>Central de Feedbacks</span>
            {feedbackCounts.pending > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                {feedbackCounts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#14161F]'
            }`}
          >
            <Server size={16} />
            <span>Auditoria Global</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* ABA 1: DASHBOARD DA PLATAFORMA */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6 anim-pop-in">
            {/* Grid de KPIs Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-5 bg-[#14161F] border-[#232838]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Total Usuários</span>
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-100">{metrics.totalUsers}</div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Contas cadastradas</span>
              </Card>

              <Card className="p-5 bg-[#14161F] border-[#232838]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Estoques Ativos</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Warehouse size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-100">{metrics.totalStocks}</div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Unidades no sistema</span>
              </Card>

              <Card className="p-5 bg-[#14161F] border-[#232838]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Total Itens</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Package size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-100">{metrics.totalItems}</div>
                <span className="text-[11px] text-zinc-500 mt-1 block">SKUs cadastrados</span>
              </Card>

              <Card className="p-5 bg-[#14161F] border-[#232838]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Movimentações</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <ArrowDownUp size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-100">{metrics.totalMovements}</div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Entradas, saídas e ajustes</span>
              </Card>

              <Card className="p-5 bg-[#14161F] border-[#232838]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400">Feedbacks</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                  {metrics.totalFeedbacks}
                  {metrics.pendingFeedbacks > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {metrics.pendingFeedbacks} pendente{metrics.pendingFeedbacks > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">Relatos da comunidade</span>
              </Card>
            </div>

            {/* Painel de Saúde da Infraestrutura */}
            <Card className="p-5 bg-[#14161F] border-[#232838]">
              <div className="flex items-center justify-between pb-3 border-b border-[#232838] mb-4">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Status da Infraestrutura & Banco de Dados</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[#11131A] border border-[#232838]">
                  <span className="text-zinc-500 block mb-1">Banco de Dados</span>
                  <span className="font-semibold text-zinc-200">{systemInfo.databaseStatus || 'Conectado'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#11131A] border border-[#232838]">
                  <span className="text-zinc-500 block mb-1">Tempo de Atividade (Uptime)</span>
                  <span className="font-semibold text-zinc-200">{systemInfo.uptimeSeconds ? `${Math.floor(systemInfo.uptimeSeconds / 60)} min (${systemInfo.uptimeSeconds}s)` : 'Ativo'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#11131A] border border-[#232838]">
                  <span className="text-zinc-500 block mb-1">Versão do Node.js</span>
                  <span className="font-semibold text-zinc-200">{systemInfo.nodeVersion || 'v24.x'}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#11131A] border border-[#232838]">
                  <span className="text-zinc-500 block mb-1">Ambiente de Execução</span>
                  <span className="font-semibold text-zinc-200 capitalize">{systemInfo.environment || 'Desenvolvimento'}</span>
                </div>
              </div>
            </Card>

            {/* Duas colunas: Últimos Usuários e Feedbacks Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usuários Recentes */}
              <Card className="p-5 bg-[#14161F] border-[#232838] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#232838]">
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <Users size={16} className="text-sky-400" />
                    Últimos usuários cadastrados
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('USERS')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Ver todos ({metrics.totalUsers}) →
                  </button>
                </div>

                <div className="divide-y divide-[#232838]">
                  {dashboardData?.recentUsers?.map((u) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#1A1E29] border border-[#262C3D] flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                            {u.name}
                            {u.is_admin && (
                              <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                ADM
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">{u.email}</p>
                        </div>
                      </div>

                      <span className="text-[11px] text-zinc-500 shrink-0">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Feedbacks Recentes */}
              <Card className="p-5 bg-[#14161F] border-[#232838] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#232838]">
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <MessageSquare size={16} className="text-amber-400" />
                    Feedbacks recentes recebidos
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('FEEDBACKS')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    Abrir central ({metrics.totalFeedbacks}) →
                  </button>
                </div>

                {dashboardData?.recentFeedbacks?.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6 text-center">Nenhum feedback recebido ainda.</p>
                ) : (
                  <div className="divide-y divide-[#232838]">
                    {dashboardData?.recentFeedbacks?.map((f) => (
                      <div key={f.id} className="py-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getFeedbackTypeBadge(f.type)}
                            {getFeedbackStatusBadge(f.status)}
                          </div>
                          <p className="text-xs font-semibold text-zinc-200 truncate">{f.title}</p>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{f.message}</p>
                        </div>
                        <span className="text-[10px] text-zinc-500 shrink-0 mt-1">
                          {new Date(f.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* ABA 2: CONTROLE DE USUÁRIOS */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'USERS' && (
          <div className="space-y-4 anim-pop-in">
            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar usuário por nome ou e-mail..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14161F] border border-[#232838] focus:border-amber-500/60 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    userRoleFilter === 'ALL'
                      ? 'bg-[#1A1E29] text-zinc-100 border border-[#2F364C]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todos ({usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('ADMIN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    userRoleFilter === 'ADMIN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Administradores ({usersList.filter((u) => u.isAdmin).length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('MEMBER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    userRoleFilter === 'MEMBER'
                      ? 'bg-[#1A1E29] text-zinc-100 border border-[#2F364C]'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Operadores ({usersList.filter((u) => !u.isAdmin).length})
                </button>
              </div>
            </div>

            {/* Tabela de Usuários */}
            <Card className="overflow-hidden bg-[#14161F] border-[#232838]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#11131A] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#232838]">
                    <tr>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Privilégio</th>
                      <th className="px-4 py-3 text-center">Estoques Criados</th>
                      <th className="px-4 py-3 text-center">Membro em</th>
                      <th className="px-4 py-3">Cadastrado em</th>
                      <th className="px-4 py-3 text-right">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                          Nenhum usuário encontrado com os filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = u.id === user?.id;

                        return (
                          <tr key={u.id} className="hover:bg-[#181B26] transition-colors">
                            {/* Nome e E-mail */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#1A1E29] border border-[#262C3D] flex items-center justify-center font-bold text-xs text-zinc-200 shrink-0">
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-semibold text-zinc-100 flex items-center gap-1.5">
                                    {u.name}
                                    {isSelf && (
                                      <span className="text-[9px] font-medium px-1.5 rounded bg-zinc-700 text-zinc-300">
                                        Você
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 block">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Privilégio */}
                            <td className="px-4 py-3.5">
                              {u.isAdmin ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  <ShieldCheck size={12} />
                                  Administrador
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-[#1A1E29] text-zinc-400 border border-[#262C3D]">
                                  Operador
                                </span>
                              )}
                            </td>

                            {/* Estoques Criados */}
                            <td className="px-4 py-3.5 text-center font-semibold text-zinc-200">
                              {u.stocksCreatedCount}
                            </td>

                            {/* Membro em */}
                            <td className="px-4 py-3.5 text-center font-semibold text-zinc-200">
                              {u.stocksParticipatingCount}
                            </td>

                            {/* Data */}
                            <td className="px-4 py-3.5 text-zinc-400">
                              {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Admin */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdmin(u)}
                                    title={u.isAdmin ? 'Remover status de Administrador' : 'Promover a Administrador'}
                                    className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                      u.isAdmin
                                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : 'bg-[#1A1E29] hover:bg-[#202534] text-zinc-400 hover:text-zinc-200 border-[#262C3D]'
                                    }`}
                                  >
                                    <ShieldCheck size={14} />
                                  </button>
                                )}

                                {/* Redefinir Senha */}
                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(u)}
                                  title="Redefinir senha do usuário"
                                  className="p-1.5 rounded-lg bg-[#1A1E29] hover:bg-[#202534] text-zinc-400 hover:text-zinc-200 border border-[#262C3D] text-xs cursor-pointer transition-colors"
                                >
                                  <KeyRound size={14} />
                                </button>

                                {/* Excluir Usuário */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    title="Excluir usuário da plataforma"
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs cursor-pointer transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
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

        {/* ───────────────────────────────────────────────────────── */}
        {/* ABA 3: CENTRAL DE FEEDBACKS */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'FEEDBACKS' && (
          <div className="space-y-4 anim-pop-in">
            {/* Barra de Filtros de Feedback */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Filtro por Status */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { value: 'ALL', label: `Todos (${feedbackCounts.all})` },
                  { value: 'PENDING', label: `Pendentes (${feedbackCounts.pending})` },
                  { value: 'IN_REVIEW', label: `Em Análise (${feedbackCounts.inReview})` },
                  { value: 'RESOLVED', label: `Resolvidos (${feedbackCounts.resolved})` },
                  { value: 'ARCHIVED', label: `Arquivados (${feedbackCounts.archived})` },
                ].map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setFeedbackStatusFilter(st.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      feedbackStatusFilter === st.value
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#14161F] text-zinc-400 hover:text-zinc-200 border border-[#232838]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Tipo */}
              <select
                value={feedbackTypeFilter}
                onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#14161F] border border-[#232838] text-xs text-zinc-200 outline-none"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="SUGGESTION">Sugestões</option>
                <option value="BUG">Problemas / Bugs</option>
                <option value="COMPLIMENT">Elogios</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>

            {/* Lista de Feedbacks */}
            {filteredFeedbacks.length === 0 ? (
              <Card className="p-12 text-center bg-[#14161F] border-[#232838] space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#1A1E29] text-zinc-500 flex items-center justify-center mx-auto">
                  <MessageSquare size={22} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">Nenhum feedback encontrado</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Não há relatos correspondentes aos filtros selecionados no momento.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeedbacks.map((f) => (
                  <Card key={f.id} className="p-5 bg-[#14161F] border-[#232838] flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Top bar do Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getFeedbackTypeBadge(f.type)}
                          {getFeedbackStatusBadge(f.status)}
                        </div>

                        {/* Estrelas */}
                        {f.rating && (
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(f.rating)].map((_, i) => (
                              <Star key={i} size={13} className="fill-amber-400" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Título & Mensagem */}
                      <div>
                        <h4 className="text-sm font-bold text-zinc-100">{f.title}</h4>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed whitespace-pre-line bg-[#11131A] p-3 rounded-xl border border-[#232838]">
                          {f.message}
                        </p>
                      </div>

                      {/* Autor & Data */}
                      <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                        <span>
                          Por: <strong className="text-zinc-200">{f.user?.name || f.user_name || 'Anônimo'}</strong> ({f.user?.email || f.user_email || '—'})
                        </span>
                        <span>{new Date(f.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Ações de Status */}
                    <div className="pt-3 border-t border-[#232838] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {f.status !== 'IN_REVIEW' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateFeedbackStatus(f.id, 'IN_REVIEW')}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-medium cursor-pointer transition-colors"
                          >
                            Em Análise
                          </button>
                        )}

                        {f.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateFeedbackStatus(f.id, 'RESOLVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium cursor-pointer transition-colors"
                          >
                            Resolvido
                          </button>
                        )}

                        {f.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateFeedbackStatus(f.id, 'ARCHIVED')}
                            className="px-2.5 py-1 rounded-lg bg-[#1A1E29] hover:bg-[#202534] text-zinc-400 hover:text-zinc-200 border border-[#262C3D] text-[11px] font-medium cursor-pointer transition-colors"
                          >
                            Arquivar
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(f.id)}
                        title="Excluir feedback"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* ABA 4: AUDITORIA GLOBAL */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-4 anim-pop-in">
            <Card className="overflow-hidden bg-[#14161F] border-[#232838]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#11131A] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#232838]">
                    <tr>
                      <th className="px-4 py-3">Ação</th>
                      <th className="px-4 py-3">Usuário</th>
                      <th className="px-4 py-3">Entidade</th>
                      <th className="px-4 py-3">Estoque Relacionado</th>
                      <th className="px-4 py-3">Data e Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#232838]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                          Nenhum registro de auditoria disponível no momento.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#181B26] transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-amber-400">
                            {log.action}
                          </td>
                          <td className="px-4 py-3 text-zinc-200">
                            {log.user ? `${log.user.name} (${log.user.email})` : 'Sistema'}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {log.entity} {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ''}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">
                            {log.stock?.name || '—'}
                          </td>
                          <td className="px-4 py-3 text-zinc-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
