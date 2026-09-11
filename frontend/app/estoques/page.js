'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConvidarMembroModal } from '../components/modals/ConvidarMembroModal';
import { NovoEstoqueModal } from '../components/modals/NovoEstoqueModal';
import { EntrarEstoqueModal } from '../components/modals/EntrarEstoqueModal';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { useAuthStore } from '../store/auth';
import { isOwner, roleLabel } from '../lib/stockRoles';
import {
  Boxes,
  Plus,
  KeyRound,
  Users,
  ShieldCheck,
  Copy,
  Check,
  Trash2,
  QrCode,
  ArrowRight,
  Warehouse,
  LogOut,
  Truck,
} from 'lucide-react';

export default function EstoquesPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuthStore();
  const {
    activeStock,
    activeStockId,
    activeRole,
    stocks,
    fetchStocks,
    switchStock,
    deleteStock,
  } = useStockStore();
  const owner = isOwner(activeRole);
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'MINE' | 'SHARED'
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [showMembersSection, setShowMembersSection] = useState(false);

  // Recarrega lista de estoques
  const refreshAll = useCallback(async () => {
    try {
      await fetchStocks();
    } catch {
      // Ignora se for primeiro carregamento
    }
  }, [fetchStocks]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Carrega membros do estoque ativo para gestão
  const loadMembers = useCallback(async () => {
    if (!activeStockId) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    try {
      const res = await api.get(`/stocks/${activeStockId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar membros', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [activeStockId]);

  useEffect(() => {
    if (activeStockId && showMembersSection) {
      loadMembers();
    }
  }, [activeStockId, showMembersSection, loadMembers]);

  // Filtragem dos estoques
  const filteredStocks = useMemo(() => {
    if (filterTab === 'MINE') {
      return stocks.filter((s) => s.isCreator || isOwner(s.role));
    }
    if (filterTab === 'SHARED') {
      return stocks.filter((s) => !s.isCreator && !isOwner(s.role));
    }
    return stocks;
  }, [stocks, filterTab]);

  const createdCount = useMemo(
    () => stocks.filter((s) => s.isCreator || isOwner(s.role)).length,
    [stocks]
  );
  const sharedCount = useMemo(
    () => stocks.filter((s) => !s.isCreator && !isOwner(s.role)).length,
    [stocks]
  );

  const handleSelectAndOpen = (stockId) => {
    switchStock(stockId);
    router.push('/dashboard');
  };

  const handleCopyCode = (stock) => {
    if (!stock.shareCode) return;
    navigator.clipboard.writeText(stock.shareCode);
    setCopiedCodeId(stock.id);
    showToast(`Código ${stock.shareCode} copiado`, 'success');
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleDeleteStock = async (stockToDelete) => {
    const targetId = stockToDelete?.id || activeStockId;
    const targetName = stockToDelete?.name || activeStock?.name;
    if (!targetId) return;

    const confirmName = prompt(
      `Atenção: A exclusão de um estoque apaga permanentemente itens e movimentações vinculadas.\n\nPara confirmar, digite o nome exato do estoque ("${targetName}"):`
    );
    if (!confirmName) return;

    if (confirmName.trim().toLowerCase() !== targetName.trim().toLowerCase()) {
      showToast('O nome digitado não confere. Exclusão cancelada.', 'warning');
      return;
    }

    try {
      await deleteStock(targetId);
      showToast('Estoque excluído com sucesso', 'success');
      refreshAll();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao excluir estoque';
      showToast(msg, 'danger');
    }
  };

  const handleToggleRole = async (targetUserId, currentRole) => {
    const newRole = currentRole === 'OWNER' ? 'GUEST' : 'OWNER';
    try {
      await api.patch(`/stocks/${activeStockId}/members/${targetUserId}/role`, {
        role: newRole,
      });
      showToast(`Papel atualizado para ${roleLabel(newRole)}`, 'success');
      loadMembers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao alterar papel';
      showToast(msg, 'danger');
    }
  };

  const handleRemoveMember = async (targetUserId, name) => {
    if (!confirm(`Remover o acesso de ${name} a este estoque?`)) return;

    try {
      await api.delete(`/stocks/${activeStockId}/members/${targetUserId}`);
      showToast('Acesso removido com sucesso', 'success');
      loadMembers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao remover membro';
      showToast(msg, 'danger');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0C0D11] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0C0D11] text-zinc-100 flex flex-col">
      {/* Top Navigation Bar do Hub Standalone (SEM sidebar) */}
      <header className="sticky top-0 z-30 bg-[#11131A]/95 backdrop-blur-md border-b border-[#232838] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14161F] border border-[#232838] text-rose-500 flex items-center justify-center shadow-lg shadow-black/40 shrink-0">
              <Boxes size={22} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-1">
                Stoker
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              </span>
              <p className="text-[11px] font-medium text-zinc-400">
                Gestão e controle de estoques
              </p>
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {user?.isAdmin && (
              <button
                type="button"
                onClick={() => router.push('/admin/logistica')}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Truck size={15} />
                <span>Painel de Logística</span>
              </button>
            )}

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-zinc-100 flex items-center justify-end gap-1.5">
                {user?.name || 'Operador'}
                {user?.isAdmin && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    ADM
                  </span>
                )}
              </span>
              <span className="text-[11px] text-zinc-400">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sair da conta"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161F] hover:bg-rose-500/15 border border-[#232838] hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Hub de Estoques */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header Hub */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <span className="text-xs text-[rgba(244,244,245,0.5)] block mb-1">
              Olá, {user?.name || 'Operador'}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5]">
              Seus estoques
            </h1>
            <p className="text-xs sm:text-sm text-[rgba(244,244,245,0.55)] mt-0.5">
              Escolha um estoque para operar, conferir itens ou registrar movimentações.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setJoinModalOpen(true)}
              icon={<KeyRound size={15} className="text-[rgba(244,244,245,0.7)]" />}
            >
              Entrar com código
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Criar estoque
            </Button>
          </div>
        </div>

        {/* Filtros por vínculo */}
        {stocks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-[background-color,color] cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-[#1A1E29] text-[#F4F4F5] border border-[rgba(255,255,255,0.12)]'
                  : 'text-[rgba(244,244,245,0.5)] hover:text-[#F4F4F5] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              Todos ({stocks.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('MINE')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-[background-color,color] cursor-pointer ${
                filterTab === 'MINE'
                  ? 'bg-[#1A1E29] text-[#F4F4F5] border border-[rgba(255,255,255,0.12)]'
                  : 'text-[rgba(244,244,245,0.5)] hover:text-[#F4F4F5] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              Criados por você ({createdCount})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('SHARED')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-[background-color,color] cursor-pointer ${
                filterTab === 'SHARED'
                  ? 'bg-[#1A1E29] text-[#F4F4F5] border border-[rgba(255,255,255,0.12)]'
                  : 'text-[rgba(244,244,245,0.5)] hover:text-[#F4F4F5] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              Compartilhados ({sharedCount})
            </button>
          </div>
        )}

        {/* Estado Vazio (Zero Estoques) */}
        {stocks.length === 0 && (
          <div className="py-12 px-6 rounded-[16px] bg-[#14161F] border border-[rgba(255,255,255,0.07)] text-center max-w-xl mx-auto space-y-5 anim-pop-in">
            <div className="w-14 h-14 rounded-[16px] bg-[#1A1E29] border border-[rgba(255,255,255,0.08)] text-[#E11D48] flex items-center justify-center mx-auto shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
              <Warehouse size={28} strokeWidth={1.8} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#F4F4F5]">
                Nenhum estoque vinculado
              </h2>
              <p className="text-xs text-[rgba(244,244,245,0.55)] max-w-md mx-auto leading-relaxed">
                Você ainda não tem estoques na sua conta. Crie o primeiro estoque para controlar itens ou entre em um existente com o código de acesso fornecido por sua equipe.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div
                onClick={() => setCreateModalOpen(true)}
                className="p-4 rounded-[12px] bg-[#1A1E29] hover:bg-[#222736] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] text-left cursor-pointer transition-[background-color,border-color] group active:scale-[0.98]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F4F5] mb-1">
                  <Plus size={16} className="text-[#E11D48]" />
                  <span>Criar estoque</span>
                </div>
                <p className="text-xs text-[rgba(244,244,245,0.45)]">
                  Cadastre uma unidade de armazenamento e defina as regras de saldo.
                </p>
              </div>

              <div
                onClick={() => setJoinModalOpen(true)}
                className="p-4 rounded-[12px] bg-[#1A1E29] hover:bg-[#222736] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] text-left cursor-pointer transition-[background-color,border-color] group active:scale-[0.98]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#F4F4F5] mb-1">
                  <KeyRound size={16} className="text-[#38BDF8]" />
                  <span>Entrar com código</span>
                </div>
                <p className="text-xs text-[rgba(244,244,245,0.45)]">
                  Insira o código de 6 caracteres enviado pelo responsável.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Cards Sólidos de Estoque */}
        {filteredStocks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStocks.map((stock) => {
              const isSelected = stock.id === activeStockId;
              const isStockOwner = isOwner(stock.role);

              return (
                <Card
                  key={stock.id}
                  className={`flex flex-col justify-between p-5 relative overflow-hidden transition-[border-color,background-color,transform] ${
                    isSelected
                      ? 'border-[#E11D48]/40 bg-[#161924] shadow-lg shadow-rose-950/20'
                      : 'hover:border-[rgba(255,255,255,0.16)] bg-[#14161F]'
                  }`}
                >
                  <div>
                    {/* Top Row: Nome e Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant={isStockOwner ? 'accent' : 'default'} size="sm">
                            {roleLabel(stock.role)}
                          </Badge>
                          {isSelected && (
                            <span className="text-[11px] font-medium text-[#FB7185] bg-[#E11D48]/15 px-2 py-0.5 rounded-full border border-rose-500/20">
                              Ativo
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-[#F4F4F5] truncate">
                          {stock.name}
                        </h2>
                      </div>
                    </div>

                    {/* Descrição */}
                    <p className="text-xs text-[rgba(244,244,245,0.55)] line-clamp-2 min-h-[32px] mb-4">
                      {stock.description || 'Sem descrição cadastrada'}
                    </p>

                    {/* Strip de métricas */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-[10px] bg-[#11131A] border border-[rgba(255,255,255,0.05)] text-center mb-4">
                      <div>
                        <span className="text-xs font-semibold text-[#F4F4F5] block">
                          {stock.counts?.items ?? 0}
                        </span>
                        <span className="text-[10px] text-[rgba(244,244,245,0.4)]">itens</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#F4F4F5] block">
                          {stock.counts?.movements ?? 0}
                        </span>
                        <span className="text-[10px] text-[rgba(244,244,245,0.4)]">movim.</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#F4F4F5] block">
                          {stock.counts?.members ?? 1}
                        </span>
                        <span className="text-[10px] text-[rgba(244,244,245,0.4)]">membros</span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-2">
                    {/* Código de convite rápido */}
                    {stock.shareCode && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(stock)}
                        title="Copiar código de compartilhamento"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#1A1E29] hover:bg-[#222736] text-[11px] font-mono text-[rgba(244,244,245,0.7)] hover:text-[#F4F4F5] border border-[rgba(255,255,255,0.06)] cursor-pointer transition-colors"
                      >
                        {copiedCodeId === stock.id ? (
                          <>
                            <Check size={12} className="text-[#10B981]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>{stock.shareCode}</span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      {isStockOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            switchStock(stock.id);
                            setShowMembersSection(true);
                          }}
                          title="Gerenciar membros e convites"
                          className="p-2 rounded-[8px] bg-[#1A1E29] hover:bg-[#222736] text-[rgba(244,244,245,0.65)] hover:text-white border border-[rgba(255,255,255,0.06)] cursor-pointer transition-colors"
                        >
                          <Users size={14} />
                        </button>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelectAndOpen(stock.id)}
                        icon={<ArrowRight size={13} />}
                      >
                        Acessar estoque
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Seção de Gestão de Membros do Estoque Ativo */}
        {activeStock && showMembersSection && (
          <div className="pt-6 border-t border-[rgba(255,255,255,0.08)] anim-pop-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#F4F4F5] flex items-center gap-2">
                  <Users size={18} className="text-[#E11D48]" />
                  Acessos ao estoque: {activeStock.name}
                </h2>
                <p className="text-xs text-[rgba(244,244,245,0.5)]">
                  Membros com permissão para operar ou consultar este estoque.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {owner && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setInviteModalOpen(true)}
                      icon={<QrCode size={14} />}
                    >
                      Compartilhar
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteStock(activeStock)}
                      icon={<Trash2 size={14} />}
                    >
                      Excluir estoque
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Card className="p-4 sm:p-5 space-y-3">
              {loadingMembers ? (
                <div className="py-8 text-center">
                  <span className="w-6 h-6 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin inline-block" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-xs text-[rgba(244,244,245,0.5)] text-center py-4">
                  Nenhum outro membro vinculado além de você.
                </p>
              ) : (
                <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {members.map((m) => {
                    const isMemberOwner = m.role === 'OWNER';

                    return (
                      <div
                        key={m.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-[8px] bg-[#1A1E29] border border-[rgba(255,255,255,0.08)] text-[#F4F4F5] font-semibold text-xs flex items-center justify-center shrink-0">
                            {m.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F4F4F5] truncate">
                              {m.name}
                            </p>
                            <p className="text-[11px] text-[rgba(244,244,245,0.45)] truncate">
                              {m.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={isMemberOwner ? 'accent' : 'default'} size="sm">
                            {roleLabel(m.role)}
                          </Badge>

                          {owner && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleRole(m.userId, m.role)}
                                title={
                                  isMemberOwner
                                    ? 'Mudar para Convidado'
                                    : 'Promover a Proprietário'
                                }
                                className="p-1.5 rounded-[6px] bg-[#1A1E29] hover:bg-[#222736] text-[rgba(244,244,245,0.7)] hover:text-white cursor-pointer transition-colors"
                              >
                                <ShieldCheck size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m.userId, m.name)}
                                title="Remover acesso"
                                className="p-1.5 rounded-[6px] bg-[#F43F5E]/15 hover:bg-[#F43F5E]/25 text-[#FDA4AF] cursor-pointer transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Modais de Estoque */}
      <NovoEstoqueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          refreshAll();
        }}
      />

      <EntrarEstoqueModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          refreshAll();
        }}
      />

      <ConvidarMembroModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
}
