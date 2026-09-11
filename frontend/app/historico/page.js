'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyStockView } from '../components/ui/EmptyStockView';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { Clock } from 'lucide-react';

export default function HistoricoPage() {
  const { activeStock, activeStockId } = useStockStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async () => {
    if (!activeStockId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/stocks/${activeStockId}/audit?limit=100`);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Erro ao carregar auditoria', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  if (!activeStockId) {
    return (
      <AppShell
        title="Histórico e auditoria"
        subtitle="Selecione um estoque para visualizar o registro de operações"
      >
        <EmptyStockView title="Nenhum estoque selecionado" />
      </AppShell>
    );
  }

  const actionLabels = {
    USER_REGISTER: 'Cadastro de usuário',
    STOCK_CREATE: 'Criação de estoque',
    STOCK_UPDATE: 'Configurações de estoque',
    STOCK_DELETE: 'Exclusão de estoque',
    MEMBER_INVITE: 'Convite de membro',
    MEMBER_REMOVE: 'Remoção de membro',
    MEMBER_UPDATE_ROLE: 'Alteração de permissão',
    ITEM_CREATE: 'Cadastro de produto',
    ITEM_UPDATE: 'Edição de produto',
    ITEM_DELETE: 'Exclusão de produto',
    STOCK_IN: 'Entrada de estoque',
    STOCK_OUT: 'Saída de estoque',
    STOCK_ADJUST: 'Ajuste pontual de saldo',
    BATCH_RECONCILIATION: 'Reconciliação em lote',
  };

  return (
    <AppShell
      title="Histórico e auditoria"
      subtitle={activeStock ? `${activeStock.name} • Registro cronológico de operações e alterações` : 'Auditoria'}
      onRefresh={loadAuditLogs}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            Carregando registros de auditoria...
          </div>
        ) : logs.length === 0 ? (
          <Card className="py-12 text-center text-zinc-400 border border-[#232838] bg-[#14161F]">
            <p className="text-base font-semibold text-zinc-100 mb-1">Nenhum registro encontrado</p>
            <p className="text-xs text-zinc-400">As atividades realizadas neste estoque aparecerão aqui em ordem cronológica.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => {
              const label = actionLabels[log.action] || log.action;
              const isStockIn = log.action === 'STOCK_IN';
              const isStockOut = log.action === 'STOCK_OUT';
              const isBatch = log.action === 'BATCH_RECONCILIATION';

              return (
                <Card key={log.id} className="p-4 border border-[#232838] bg-[#14161F]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#232838]">
                    <div className="flex items-center gap-2.5">
                      <Badge
                        variant={isStockIn ? 'success' : isStockOut ? 'danger' : isBatch ? 'purple' : 'default'}
                        size="sm"
                      >
                        {label}
                      </Badge>
                      <span className="text-xs font-semibold text-zinc-200">
                        {log.entity} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>Autor: <strong className="text-zinc-200">{log.user?.name || 'Sistema'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-zinc-500" />
                        {new Date(log.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {log.details && (
                    <div className="mt-2.5 text-xs text-zinc-400 font-mono bg-[#10121A] p-3 rounded-xl border border-[#232838] overflow-x-auto">
                      <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                        {typeof log.details === 'object'
                          ? JSON.stringify(log.details, null, 2)
                          : log.details}
                      </pre>
                    </div>
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

