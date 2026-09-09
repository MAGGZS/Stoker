'use client';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { isOwner } from '../lib/stockRoles';
import { ClipboardCheck, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function BalancoPage() {
  const { activeStockId, activeRole } = useStockStore();
  const owner = isOwner(activeRole);
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [reason, setReason] = useState('BALANCO_GERAL_PERIODICO');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    if (!activeStockId) return;
    setLoading(true);
    try {
      const res = await api.get(`/stocks/${activeStockId}/items?status=ACTIVE&limit=150`);
      const itemList = res.data.items || [];
      setItems(itemList);

      // Inicializa a contagem com o saldo atual do sistema
      const initialCounts = {};
      itemList.forEach((item) => {
        initialCounts[item.id] = String(item.currentQuantity);
      });
      setCounts(initialCounts);
    } catch (err) {
      console.error('Erro ao carregar itens para balanço', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCountChange = (itemId, val) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  // Cálculo de divergências em tempo real
  let totalDiscrepancies = 0;
  let totalPositiveDelta = 0;
  let totalNegativeDelta = 0;
  let netFinancialImpact = 0;

  const discrepanciesList = items.map((item) => {
    const systemQty = item.currentQuantity;
    const countedQty = parseFloat(counts[item.id]) || 0;
    const delta = parseFloat((countedQty - systemQty).toFixed(3));
    const cost = item.costPrice || 0;
    const financialImpact = parseFloat((delta * cost).toFixed(2));

    if (delta !== 0) {
      totalDiscrepancies++;
      if (delta > 0) totalPositiveDelta += delta;
      if (delta < 0) totalNegativeDelta += Math.abs(delta);
      netFinancialImpact += financialImpact;
    }

    return {
      item,
      systemQty,
      countedQty,
      delta,
      financialImpact,
      hasDiscrepancy: delta !== 0,
    };
  });

  const handleSubmitReconciliation = async () => {
    if (!owner) {
      showToast('Apenas o Dono do estoque tem permissão para aplicar o balanço geral', 'danger');
      return;
    }

    const payloadCounts = Object.entries(counts).map(([itemId, val]) => ({
      itemId,
      countedQuantity: parseFloat(val) || 0,
    }));

    setSubmitting(true);
    try {
      const { data } = await api.post(`/stocks/${activeStockId}/movements/reconcile-batch`, {
        reason: reason.trim() || 'BALANCO_GERAL',
        notes: notes.trim() || null,
        counts: payloadCounts,
      });

      showToast(
        `Balanço concluído! ${data.adjustedItemsCount || 0} itens foram reconciliados no estoque.`,
        'success',
        5000
      );
      loadItems();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao aplicar balanço geral';
      showToast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Balanço Geral de Estoque"
      subtitle="Conferência física em lote e reconciliação atômica de saldos"
      onRefresh={loadItems}
    >
      <div className="space-y-6">
        {/* Aviso de papel se não for Dono */}
        {!owner && (
          <div className="p-4 rounded-[16px] bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center gap-3 text-xs sm:text-sm text-[rgba(255,255,255,0.9)]">
            <ShieldAlert size={20} className="text-[#EF4444] shrink-0" />
            <div>
              <span className="font-bold text-[#EF4444]">Acesso de Convidado: </span>
              Você pode conferir as contagens físicas, mas apenas o Dono do estoque pode aplicar e efetivar o Balanço Geral em lote.
            </div>
          </div>
        )}

        {/* Resumo do Balanço (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <span className="text-xs text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider">
              Total de Itens
            </span>
            <p className="text-2xl font-bold text-white mt-1">{items.length}</p>
          </Card>

          <Card>
            <span className="text-xs text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider">
              Divergências Apuradas
            </span>
            <p
              className={`text-2xl font-bold mt-1 ${
                totalDiscrepancies > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'
              }`}
            >
              {totalDiscrepancies} {totalDiscrepancies === 1 ? 'item' : 'itens'}
            </p>
          </Card>

          <Card>
            <span className="text-xs text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider">
              Sobras / Faltas Físicas
            </span>
            <p className="text-sm sm:text-base font-bold text-white mt-1">
              <span className="text-[#10B981]">+{totalPositiveDelta.toFixed(1)}</span> /{' '}
              <span className="text-[#EF4444]">-{totalNegativeDelta.toFixed(1)}</span>
            </p>
          </Card>

          <Card>
            <span className="text-xs text-[rgba(255,255,255,0.5)] font-semibold uppercase tracking-wider">
              Impacto Financeiro Líquido
            </span>
            <p
              className={`text-2xl font-bold mt-1 ${
                netFinancialImpact >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              R$ {netFinancialImpact.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Lista de Conferência */}
        {loading ? (
          <div className="py-16 text-center">
            <span className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : (
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-[#DC2626]" />
                  Grade de Contagem Física
                </h3>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">
                  Digite a contagem real apurada nas prateleiras para cada produto
                </p>
              </div>

              {owner && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmitReconciliation}
                  loading={submitting}
                  disabled={totalDiscrepancies === 0}
                >
                  {totalDiscrepancies === 0 ? 'Sem Divergências' : 'Aplicar Balanço Geral'}
                </Button>
              )}
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.06)]">
              {discrepanciesList.map(({ item, systemQty, countedQty, delta, financialImpact, hasDiscrepancy }) => (
                <div
                  key={item.id}
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasDiscrepancy ? 'bg-[#DC2626]/5 -mx-4 px-4 rounded-[12px]' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-sm truncate">{item.name}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">
                      SKU: <span className="font-mono">{item.sku}</span> • Custo Unitário: R$ {Number(item.costPrice).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-[rgba(255,255,255,0.45)] block">Saldo Sistema</span>
                      <span className="text-sm font-semibold text-white">
                        {systemQty} {item.unit}
                      </span>
                    </div>

                    <div className="w-28 sm:w-32">
                      <span className="text-[10px] text-[rgba(255,255,255,0.5)] font-semibold uppercase block mb-1">
                        Contagem Física
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={counts[item.id] ?? ''}
                        onChange={(e) => handleCountChange(item.id, e.target.value)}
                        className={`w-full bg-[#1E1E22] text-white text-sm font-bold text-center rounded-[10px] px-2 py-1.5 border outline-none ${
                          hasDiscrepancy
                            ? 'border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]'
                            : 'border-[rgba(255,255,255,0.1)] focus:border-white'
                        }`}
                      />
                    </div>

                    <div className="w-24 text-right">
                      <span className="text-xs text-[rgba(255,255,255,0.45)] block">Variação</span>
                      <span
                        className={`text-sm font-bold ${
                          delta > 0
                            ? 'text-[#10B981]'
                            : delta < 0
                            ? 'text-[#EF4444]'
                            : 'text-[rgba(255,255,255,0.4)]'
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta} {item.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

