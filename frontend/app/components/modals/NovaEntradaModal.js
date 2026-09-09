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
  }, [isOpen, activeStockId]);

  useEffect(() => {
    if (initialItemId) {
      setSelectedItemId(initialItemId);
    }
  }, [initialItemId]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // Quando o item muda, pré-preenche com o custo médio atual dele
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

  // Simulação de novo CMP
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
      // Limpa campos
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
    { value: 'COMPRA', label: 'Compra de Fornecedor' },
    { value: 'DEVOLUCAO_CLIENTE', label: 'Devolução de Cliente' },
    { value: 'TRANSFERENCIA', label: 'Transferência entre Estoques' },
    { value: 'BONIFICACAO', label: 'Bonificação / Doação' },
    { value: 'AJUSTE_POSITIVO', label: 'Ajuste / Sobra de Inventário' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Entrada de Estoque"
      subtitle="Adicione mercadorias e atualize o custo médio automaticamente"
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
            label="Custo Unitário (R$) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 45.90"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            required
          />
        </div>

        {/* Card informativo de Custo Total e CMP */}
        {numQty > 0 && selectedItem && (
          <div className="bg-[#1E1E22] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3 text-xs space-y-1">
            <div className="flex justify-between text-[rgba(255,255,255,0.7)]">
              <span>Valor Total da Entrada:</span>
              <span className="font-bold text-white">R$ {totalCost}</span>
            </div>
            <div className="flex justify-between text-[rgba(255,255,255,0.7)]">
              <span>Saldo Atual ➔ Novo Saldo:</span>
              <span className="font-semibold text-[#10B981]">
                {selectedItem.currentQuantity} ➔ {(selectedItem.currentQuantity + numQty).toFixed(2)} {selectedItem.unit}
              </span>
            </div>
            {estimatedNewCmp !== null && (
              <div className="flex justify-between text-[rgba(255,255,255,0.7)] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                <span>Novo Custo Médio Ponderado (CMP):</span>
                <span className="font-bold text-[#F87171]">R$ {estimatedNewCmp.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Motivo da Entrada"
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
            label="Nota Fiscal / Doc."
            placeholder="Ex: NF-5842"
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
          />

          <Input
            label="Número do Lote"
            placeholder="Ex: LOT-2026-A"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
          />
        </div>

        <Input
          label="Observações Adicionais"
          placeholder="Detalhes ou condições da entrega..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Confirmar Entrada
          </Button>
        </div>
      </form>
    </Modal>
  );
}

