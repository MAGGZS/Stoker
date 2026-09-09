'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { History, Shield, Clock, FileCode } from 'lucide-react';

export default function HistoricoPage() {
  const { activeStockId } = useStockStore();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = useCallback(async () => {
    if (!activeStockId) return;
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

  const actionLabels = {
    USER_REGISTER: 'Novo Usuário',
    STOCK_CREATE: 'Criação de Estoque',
    STOCK_UPDATE: 'Configurações de Estoque',
    STOCK_DELETE: 'Exclusão de Estoque',
    MEMBER_INVITE: 'Convite de Membro',
    MEMBER_REMOVE: 'Remoção de Membro',
    MEMBER_UPDATE_ROLE: 'Alteração de Nível de Acesso',
    ITEM_CREATE: 'Cadastro de Produto',
    ITEM_UPDATE: 'Edição de Produto',
    ITEM_DELETE: 'Exclusão de Produto',
    STOCK_IN: 'Entrada de Estoque',
    STOCK_OUT: 'Saída de Estoque',
    STOCK_ADJUST: 'Ajuste de Conferência',
    BATCH_RECONCILIATION: 'Balanço Geral em Lote',
  };

  return (
    <AppShell
      title="Trilha de Auditoria e Histórico"
      subtitle="Registro indelével de todas as alterações, acessos e movimentações"
      onRefresh={loadAuditLogs}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <span className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : logs.length === 0 ? (
          <Card className="py-12 text-center text-[rgba(255,255,255,0.5)]">
            <p className="text-base font-semibold text-white mb-1">Nenhum registro de auditoria</p>
            <p className="text-xs">As ações executadas no estoque serão gravadas aqui automaticamente.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => {
              const label = actionLabels[log.action] || log.action;
              const isStockIn = log.action === 'STOCK_IN';
              const isStockOut = log.action === 'STOCK_OUT';
              const isBatch = log.action === 'BATCH_RECONCILIATION';

              return (
                <Card key={log.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-2.5">
                      <Badge
                        variant={isStockIn ? 'success' : isStockOut ? 'danger' : isBatch ? 'purple' : 'default'}
                        size="sm"
                      >
                        {label}
                      </Badge>
                      <span className="text-xs font-semibold text-white">
                        {log.entity} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[rgba(255,255,255,0.5)]">
                      <span>Autor: <strong className="text-white">{log.user?.name || 'Sistema'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
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
                    <div className="mt-2 text-xs text-[rgba(255,255,255,0.7)] font-mono bg-[#1E1E22] p-2.5 rounded-[10px] overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
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

