'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useStockStore } from '../../store/stock';

export function NovaEntradaModal({ isOpen, onClose, onSuccess, initialItemId }) {
  const { activeStockId } = useStockStore();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(initialItemId || '');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('COMPRA');
  const [partner, setPartner] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeStockId) {
      api.get(`/stocks/${activeStockId}/items?status=ACTIVE&limit=100`)
        .then((res) => {
          setItems(res.data.items || []);
          if (!selectedItemId && res.data.items?.length > 0) {
            setSelectedItemId(res.data.items[0].id);
            setUnitCost(String(res.data.items[0].costPrice || ''));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, activeStockId, selectedItemId]);

  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleItemChange = (e) => {
    const id = e.target.value;
    setSelectedItemId(id);
    const found = items.find((i) => i.id === id);
    if (found) {
      setUnitCost(String(found.costPrice || ''));
    }
  };

  const numQty = parseFloat(quantity) || 0;
  const numCost = parseFloat(unitCost) || 0;
  const totalCost = (numQty * numCost).toFixed(2);

  let estimatedNewCmp = null;
  if (selectedItem && numQty > 0) {
    const curQ = selectedItem.currentQuantity;
    const curC = selectedItem.costPrice;
    if (curQ <= 0) {
      estimatedNewCmp = numCost;
    } else {
      estimatedNewCmp = ((curQ * curC) + (numQty * numCost)) / (curQ + numQty);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      showToast('Selecione um produto', 'warning');
      return;
    }
    if (numQty <= 0) {
      showToast('Informe uma quantidade maior que zero', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/stocks/${activeStockId}/movements/inbound`, {
        itemId: selectedItemId,
        quantity: numQty,
        unitCost: numCost,
        reason,
        partner: partner.trim() || null,
        documentRef: documentRef.trim() || null,
        batchNumber: batchNumber.trim() || null,
        notes: notes.trim() || null,
      });

      showToast(`Entrada de ${numQty} ${selectedItem?.unit || 'un'} registrada com sucesso!`, 'success');
      onClose();
      if (onSuccess) onSuccess();

      setQuantity('');
      setPartner('');
      setDocumentRef('');
      setBatchNumber('');
      setNotes('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao registrar entrada';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (SKU: ${i.sku} | Saldo: ${i.currentQuantity} ${i.unit})`,
  }));

  const reasonOptions = [
    { value: 'COMPRA', label: 'Compra de fornecedor' },
    { value: 'DEVOLUCAO_CLIENTE', label: 'Devolução de cliente' },
    { value: 'TRANSFERENCIA', label: 'Transferência entre estoques' },
    { value: 'BONIFICACAO', label: 'Bonificação ou brinde' },
    { value: 'AJUSTE_POSITIVO', label: 'Sobra de conferência' },
    { value: 'OUTRO', label: 'Outro motivo' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar entrada de mercadoria"
      subtitle="Adicione itens ao saldo com recálculo automático de custo médio"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Produto *"
          options={itemOptions}
          value={selectedItemId}
          onChange={handleItemChange}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantidade *"
            type="number"
            step="any"
            min="0.001"
            placeholder="Ex: 10"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />

          <Input
            label="Custo unitário (R$) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 45.90"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            required
          />
        </div>

        {numQty > 0 && selectedItem && (
          <div className="bg-[#10121A] border border-[#232838] rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-zinc-400">
              <span>Valor total da compra:</span>
              <span className="font-semibold text-zinc-100">R$ {totalCost}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Saldo projetado:</span>
              <span className="font-semibold text-emerald-400">
                {selectedItem.currentQuantity} ➔ {(selectedItem.currentQuantity + numQty).toFixed(2)} {selectedItem.unit}
              </span>
            </div>
            {estimatedNewCmp !== null && (
              <div className="flex justify-between text-zinc-400 pt-1 border-t border-[#232838]">
                <span>Novo custo médio (CMP):</span>
                <span className="font-semibold text-rose-400">R$ {estimatedNewCmp.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Motivo da entrada"
            options={reasonOptions}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Input
            label="Fornecedor / Origem"
            placeholder="Ex: Distribuidora Silva"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nota Fiscal / Pedido"
            placeholder="Ex: NF-5842"
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
          />

          <Input
            label="Número do lote"
            placeholder="Ex: LOT-2026-A"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
          />
        </div>

        <Input
          label="Observações (opcional)"
          placeholder="Condições do lote, detalhes da entrega..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Salvar entrada
          </Button>
        </div>
      </form>
    </Modal>
  );
}
