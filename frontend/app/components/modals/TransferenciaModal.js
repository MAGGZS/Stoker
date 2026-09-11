'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { ArrowRight, ArrowLeftRight, AlertCircle, CheckCircle } from 'lucide-react';

export function TransferenciaModal({ isOpen, onClose, onSuccess, stocks = [], preselectedSourceId = '' }) {
  const { showToast } = useToast();

  const [sourceStockId, setSourceStockId] = useState(preselectedSourceId || (stocks[0]?.id || ''));
  const [targetStockId, setTargetStockId] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Define targetStockId inicial como o primeiro diferente da origem
  useEffect(() => {
    if (stocks.length > 1) {
      const other = stocks.find((s) => s.id !== sourceStockId);
      if (other) setTargetStockId(other.id);
    }
  }, [sourceStockId, stocks]);

  // Carrega itens do estoque de origem
  useEffect(() => {
    if (!isOpen || !sourceStockId) return;

    setLoadingItems(true);
    api.get(`/stocks/${sourceStockId}/items?status=ACTIVE&limit=150`)
      .then((res) => {
        const itemList = res.data.items || [];
        setItems(itemList);
        if (itemList.length > 0) {
          setSelectedItemId(itemList[0].id);
        } else {
          setSelectedItemId('');
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar itens da origem', err);
        setItems([]);
      })
      .finally(() => setLoadingItems(false));
  }, [isOpen, sourceStockId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const availableQty = selectedItem ? Number(selectedItem.currentQuantity) : 0;
  const numQty = parseFloat(quantity) || 0;
  const hasInsufficientStock = numQty > availableQty;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sourceStockId || !targetStockId) {
      showToast('Selecione os estoques de origem e destino', 'warning');
      return;
    }

    if (sourceStockId === targetStockId) {
      showToast('O estoque de origem deve ser diferente do destino', 'warning');
      return;
    }

    if (!selectedItemId) {
      showToast('Selecione o produto a transferir', 'warning');
      return;
    }

    if (numQty <= 0) {
      showToast('Informe uma quantidade maior que zero', 'warning');
      return;
    }

    if (hasInsufficientStock) {
      showToast(`Saldo insuficiente no estoque de origem (disponível: ${availableQty})`, 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/admin/logistica/transfers', {
        sourceStockId,
        targetStockId,
        itemId: selectedItemId,
        quantity: numQty,
        notes: notes.trim() || undefined,
      });

      showToast(
        `Transferência de ${numQty} ${selectedItem?.unit || 'un'} de "${res.data.sourceStockName}" para "${res.data.targetStockName}" concluída com sucesso!`,
        'success'
      );

      onClose();
      if (onSuccess) onSuccess(res.data);

      setQuantity('');
      setNotes('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao realizar transferência entre estoques';
      showToast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const stockOptions = stocks.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (SKU: ${i.sku} | Saldo: ${i.currentQuantity} ${i.unit})`,
  }));

  const sourceStock = stocks.find((s) => s.id === sourceStockId);
  const targetStock = stocks.find((s) => s.id === targetStockId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transferência Inter-Estoques"
      subtitle="Movimente mercadorias entre unidades com recálculo atômico de saldos e custos"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Painel visual de rota de transferência */}
        <div className="p-3.5 rounded-xl bg-[#10121A] border border-[#232838] flex items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Origem (Saída)
            </span>
            <p className="font-bold text-zinc-100 truncate">
              {sourceStock?.name || 'Selecione a origem'}
            </p>
          </div>

          <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <ArrowRight size={16} />
          </div>

          <div className="flex-1 min-w-0 text-right">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
              Destino (Entrada)
            </span>
            <p className="font-bold text-zinc-100 truncate">
              {targetStock?.name || 'Selecione o destino'}
            </p>
          </div>
        </div>

        {/* Seleção de Estoques */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Estoque de Origem *"
            options={stockOptions}
            value={sourceStockId}
            onChange={(e) => setSourceStockId(e.target.value)}
            required
          />

          <Select
            label="Estoque de Destino *"
            options={stockOptions.filter((s) => s.value !== sourceStockId)}
            value={targetStockId}
            onChange={(e) => setTargetStockId(e.target.value)}
            required
          />
        </div>

        {/* Produto da Origem */}
        <Select
          label="Produto a Transferir *"
          options={itemOptions}
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          disabled={loadingItems || items.length === 0}
          required
        />

        {loadingItems && (
          <p className="text-xs text-zinc-400">Carregando catálogo do estoque de origem...</p>
        )}

        {items.length === 0 && !loadingItems && (
          <p className="text-xs text-amber-400">
            Nenhum produto cadastrado no estoque de origem selecionado.
          </p>
        )}

        {/* Quantidade e Saldo */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantidade a Transferir *"
            type="number"
            step="any"
            min="0.001"
            placeholder="Ex: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={hasInsufficientStock ? `Disponível apenas ${availableQty}` : undefined}
            required
          />

          <div className="flex flex-col justify-center pt-5">
            <span className="text-xs text-zinc-400 block">Saldo Atual na Origem:</span>
            <span className="text-sm font-bold text-zinc-100">
              {selectedItem ? `${selectedItem.currentQuantity} ${selectedItem.unit}` : '—'}
            </span>
          </div>
        </div>

        {/* Observações / Guia de Transporte */}
        <Input
          label="Justificativa / Guia de Remessa (Opcional)"
          placeholder="Ex: Abastecimento de obra ou remanejamento de filial..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={hasInsufficientStock || numQty <= 0 || !selectedItemId || sourceStockId === targetStockId}
            icon={<ArrowLeftRight size={16} />}
          >
            Confirmar Transferência
          </Button>
        </div>
      </form>
    </Modal>
  );
}
