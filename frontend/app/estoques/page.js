'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConvidarMembroModal } from '../components/modals/ConvidarMembroModal';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { isOwner, roleLabel } from '../lib/stockRoles';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Copy,
  Check,
  Building,
  ArrowRightLeft,
  Trash2,
  QrCode,
} from 'lucide-react';

export function EstoquesPage() {
  const { activeStock, activeStockId, activeRole, stocks, switchStock, deleteStock } = useStockStore();
  const owner = isOwner(activeRole);
  const { showToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!activeStockId) return;
    setLoading(true);
    try {
      const res = await api.get(`/stocks/${activeStockId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar membros', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleDeleteStock = async () => {
    if (!activeStockId || !owner) return;
    const confirmName = prompt(
      `ATENÇÃO: A exclusão de um estoque é permanente.\n\nPara confirmar a exclusão do estoque "${activeStock?.name}", digite o nome exato dele:`
    );
    if (!confirmName) return;

    if (confirmName.trim().toLowerCase() !== activeStock?.name.trim().toLowerCase()) {
      showToast('O nome digitado não confere. Exclusão cancelada.', 'warning');
      return;
    }

    try {
      await deleteStock(activeStockId);
      showToast('Estoque excluído com sucesso!', 'success');
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
      showToast(`Papel do membro alterado para ${roleLabel(newRole)}`, 'success');
      loadMembers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao alterar papel';
      showToast(msg, 'danger');
    }
  };

  const handleRemoveMember = async (targetUserId, name) => {
    if (!confirm(`Deseja realmente remover ${name} deste estoque?`)) return;

    try {
      await api.delete(`/stocks/${activeStockId}/members/${targetUserId}`);
      showToast('Membro removido com sucesso', 'success');
      loadMembers();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao remover membro';
      showToast(msg, 'danger');
    }
  };

  return (
    <AppShell
      title="Gestão de Estoque e Membros"
      subtitle="Controle de acesso por estoque: Proprietário e Convidado"
      onRefresh={loadMembers}
    >
      <div className="space-y-6">
        {/* Card do Estoque Ativo & Ações */}
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-[#141417] to-[#1C1C21] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
                  Estoque Selecionado
                </span>
                <Badge variant={owner ? 'accent' : 'default'} size="sm">
                  Seu Papel: {roleLabel(activeRole)}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {activeStock?.name || 'Carregando...'}
              </h2>
              {activeStock?.description && (
                <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.55)] mt-1">
                  {activeStock.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {owner ? (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setInviteModalOpen(true)}
                    icon={<QrCode size={16} />}
                  >
                    Compartilhar Estoque
                  </Button>

                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleDeleteStock}
                    icon={<Trash2 size={16} />}
                    title="Excluir este estoque definitivamente"
                  >
                    Excluir Estoque
                  </Button>
                </>
              ) : (
                <div className="p-3 rounded-[14px] bg-[#1E1E22] border border-[rgba(255,255,255,0.06)] text-xs text-[rgba(255,255,255,0.65)]">
                  Você possui acesso como <strong className="text-white">Convidado</strong>. Apenas o Proprietário pode compartilhar ou excluir este estoque.
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Membros do Estoque */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#DC2626]" />
              <h3 className="text-base font-bold text-white">
                Membros com Vínculo ({members.length})
              </h3>
            </div>

            {owner && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInviteModalOpen(true)}
                icon={<UserPlus size={15} />}
              >
                Convidar Membro
              </Button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <span className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.06)]">
              {members.map((m) => {
                const isMemberOwner = m.role === 'OWNER';

                return (
                  <div
                    key={m.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#1E1E22] border border-[rgba(255,255,255,0.1)] text-white font-bold flex items-center justify-center shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{m.name}</p>
                        <p className="text-xs text-[rgba(255,255,255,0.45)] truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={isMemberOwner ? 'accent' : 'default'} size="md">
                        {roleLabel(m.role)}
                      </Badge>

                      {owner && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleRole(m.userId, m.role)}
                            title={isMemberOwner ? 'Rebaixar para Convidado' : 'Promover para Dono'}
                            className="p-1.5 rounded-[8px] bg-[#1E1E22] hover:bg-[#282830] text-[rgba(255,255,255,0.7)] hover:text-white cursor-pointer transition-all"
                          >
                            <ShieldCheck size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.userId, m.name)}
                            title="Remover do estoque"
                            className="p-1.5 rounded-[8px] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] cursor-pointer transition-all"
                          >
                            <Trash2 size={16} />
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

        {/* Todos os estoques vinculados a este usuário */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
            <Building size={18} className="text-[#3B82F6]" />
            <h3 className="text-base font-bold text-white">
              Seus Outros Estoques Vinculados
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stocks.map((s) => {
              const isCurrent = s.id === activeStockId;
              const isOwnerStock = isOwner(s.role);

              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-[14px] border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#DC2626]/10 border-[#DC2626]/30'
                      : 'bg-[#1E1E22] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{s.name}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)] mt-0.5">
                      Papel: <span className="font-medium text-white">{roleLabel(s.role)}</span>
                    </p>
                  </div>

                  {isCurrent ? (
                    <Badge variant="accent" size="sm">
                      Ativo
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => switchStock(s.id)}
                      icon={<ArrowRightLeft size={13} />}
                    >
                      Alternar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <ConvidarMembroModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </AppShell>
  );
}

export default EstoquesPage;

