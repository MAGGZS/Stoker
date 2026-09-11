'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyStockView } from '../components/ui/EmptyStockView';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';
import { useStockStore } from '../store/stock';
import { isOwner } from '../lib/stockRoles';
import { ClipboardCheck, ShieldAlert } from 'lucide-react';

export default function BalancoPage() {
  const { activeStock, activeStockId, activeRole } = useStockStore();
  const owner = isOwner(activeRole);
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [reason, setReason] = useState('BALANCO_GERAL_PERIODICO');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = useCallback(async () => {
    if (!activeStockId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/stocks/${activeStockId}/items?status=ACTIVE&limit=150`);
      const itemList = res.data.items || [];
      setItems(itemList);

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

  if (!activeStockId) {
    return (
      <AppShell
        title="Balanço de estoque"
        subtitle="Selecione um estoque para realizar a conferência física"
      >
        <EmptyStockView title="Nenhum estoque selecionado" />
      </AppShell>
    );
  }

  const handleCountChange = (itemId, val) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  let totalDiscrepancies = 0;
  let totalPositiveDelta = 0;
  let totalNegativeDelta = 0;
  let netFinancialImpact = 0;

  const discrepanciesList = items.map((item) => {
    const systemQty = item.currentQuantity;
    const countedQty = parseFloat(counts[item.id]) || 0;
    const delta = countedQty - systemQty;
    const cost = Number(item.costPrice || 0);
    const financialImpact = delta * cost;

    if (delta !== 0) {
      totalDiscrepancies += 1;
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
      showToast('Apenas o responsável pelo estoque pode efetivar o balanço em lote', 'danger');
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
        `Balanço aplicado com sucesso! ${data.adjustedItemsCount || 0} itens reconciliados.`,
        'success'
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
      title="Balanço de estoque"
      subtitle={activeStock ? `${activeStock.name} • Conferência física e reconciliação` : 'Balanço de estoque'}
      onRefresh={loadItems}
    >
      <div className="space-y-6">
        {!owner && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs sm:text-sm text-zinc-200">
            <ShieldAlert size={20} className="text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-amber-300">Acesso de convidado: </span>
              Você pode conferir as contagens físicas, mas apenas o criador do estoque pode efetivar o balanço geral em lote.
            </div>
          </div>
        )}

        {/* Resumo do Balanço (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <span className="text-xs text-zinc-400 font-medium">
              Itens no catálogo
            </span>
            <p className="text-2xl font-bold text-zinc-100 mt-1">{items.length}</p>
          </Card>

          <Card>
            <span className="text-xs text-zinc-400 font-medium">
              Divergências
            </span>
            <p
              className={`text-2xl font-bold mt-1 ${
                totalDiscrepancies > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {totalDiscrepancies} {totalDiscrepancies === 1 ? 'item' : 'itens'}
            </p>
          </Card>

          <Card>
            <span className="text-xs text-zinc-400 font-medium">
              Sobras / Faltas
            </span>
            <p className="text-sm sm:text-base font-bold text-zinc-100 mt-1">
              <span className="text-emerald-400">+{totalPositiveDelta.toFixed(1)}</span> /{' '}
              <span className="text-rose-400">-{totalNegativeDelta.toFixed(1)}</span>
            </p>
          </Card>

          <Card>
            <span className="text-xs text-zinc-400 font-medium">
              Impacto financeiro
            </span>
            <p
              className={`text-2xl font-bold mt-1 ${
                netFinancialImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              R$ {netFinancialImpact.toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Grade de Conferência */}
        {loading ? (
          <div className="py-16 text-center">
            <span className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center py-16">
            <p className="text-sm text-zinc-400">
              Nenhum produto cadastrado para conferência neste estoque
            </p>
          </Card>
        ) : (
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232838]">
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-rose-500" />
                  Contagem física dos produtos
                </h3>
                <p className="text-xs text-zinc-400">
                  Insira a contagem real observada para atualizar os saldos
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
                  {totalDiscrepancies === 0 ? 'Sem divergências' : 'Aplicar balanço'}
                </Button>
              )}
            </div>

            <div className="divide-y divide-[#232838]">
              {discrepanciesList.map(({ item, systemQty, delta, hasDiscrepancy }) => (
                <div
                  key={item.id}
                  className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasDiscrepancy ? 'bg-rose-500/5 -mx-4 px-4 rounded-xl' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      SKU: <span className="font-mono">{item.sku}</span> • Custo: R$ {Number(item.costPrice).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-zinc-400 block">Saldo sistema</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {systemQty} {item.unit}
                      </span>
                    </div>

                    <div className="w-28 sm:w-32">
                      <span className="text-[10px] text-zinc-400 font-medium block mb-1">
                        Contagem real
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={counts[item.id] ?? ''}
                        onChange={(e) => handleCountChange(item.id, e.target.value)}
                        className={`w-full bg-[#1A1E29] text-zinc-100 text-sm font-semibold text-center rounded-xl px-2 py-1.5 border outline-none transition-colors ${
                          hasDiscrepancy
                            ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                            : 'border-[#262C3D] focus:border-zinc-400'
                        }`}
                      />
                    </div>

                    <div className="w-24 text-right">
                      <span className="text-xs text-zinc-400 block">Variação</span>
                      <span
                        className={`text-sm font-semibold ${
                          delta > 0
                            ? 'text-emerald-400'
                            : delta < 0
                            ? 'text-rose-400'
                            : 'text-zinc-500'
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
