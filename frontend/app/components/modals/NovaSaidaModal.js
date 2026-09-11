'use client';

import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useStockStore } from '../../store/stock';
import { AlertCircle } from 'lucide-react';

export function NovaSaidaModal({ isOpen, onClose, onSuccess, initialItemId }) {
  const { activeStock, activeStockId } = useStockStore();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(initialItemId || '');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [reason, setReason] = useState('VENDA');
  const [partner, setPartner] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeStockId) {
      api.get(`/stocks/${activeStockId}/items?status=ACTIVE&limit=100`)
        .then((res) => {
          setItems(res.data.items || []);
          if (!selectedItemId && res.data.items?.length > 0) {
            setSelectedItemId(res.data.items[0].id);
            setUnitPrice(String(res.data.items[0].salePrice || ''));
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
      setUnitPrice(String(found.salePrice || ''));
    }
  };

  const numQty = parseFloat(quantity) || 0;
  const numPrice = parseFloat(unitPrice) || 0;
  const currentAvailable = selectedItem ? selectedItem.currentQuantity : 0;
  const hasInsufficientStock = !activeStock?.allowNegativeStock && numQty > currentAvailable;
  const newBalance = currentAvailable - numQty;

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
    if (hasInsufficientStock) {
      showToast('Saldo insuficiente em estoque para esta saída', 'danger');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/stocks/${activeStockId}/movements/outbound`, {
        itemId: selectedItemId,
        quantity: numQty,
        unitPrice: numPrice > 0 ? numPrice : null,
        reason,
        partner: partner.trim() || null,
        documentRef: documentRef.trim() || null,
        notes: notes.trim() || null,
      });

      showToast(`Saída de ${numQty} ${selectedItem?.unit || 'un'} registrada com sucesso!`, 'success');
      if (data.isLowStockAlert) {
        showToast(`Atenção: "${selectedItem?.name}" atingiu o estoque de segurança!`, 'warning');
      }

      onClose();
      if (onSuccess) onSuccess();

      setQuantity('');
      setPartner('');
      setDocumentRef('');
      setNotes('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao registrar saída';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const itemOptions = items.map((i) => ({
    value: i.id,
    label: `${i.name} (SKU: ${i.sku} | Disponível: ${i.currentQuantity} ${i.unit})`,
  }));

  const reasonOptions = [
    { value: 'VENDA', label: 'Venda a cliente' },
    { value: 'CONSUMO_INTERNO', label: 'Consumo interno / Uso operacional' },
    { value: 'PERDA_AVARIA', label: 'Perda, quebra ou avaria' },
    { value: 'DEVOLUCAO_FORNECEDOR', label: 'Devolução ao fornecedor' },
    { value: 'TRANSFERENCIA', label: 'Transferência para outro estoque' },
    { value: 'AJUSTE_NEGATIVO', label: 'Ajuste de conferência' },
    { value: 'OUTRO', label: 'Outro motivo' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar saída de estoque"
      subtitle="Baixe mercadorias com validação de saldo e estoque de segurança"
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
            label="Quantidade a retirar *"
            type="number"
            step="any"
            min="0.001"
            placeholder="Ex: 5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            error={hasInsufficientStock ? `Disponível apenas ${currentAvailable}` : undefined}
          />

          <Input
            label="Preço de venda (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 89.90"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        {selectedItem && (
          <div className="bg-[#10121A] border border-[#232838] rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-zinc-400">
              <span>Saldo disponível agora:</span>
              <span className="font-semibold text-zinc-100">
                {currentAvailable} {selectedItem.unit}
              </span>
            </div>

            {numQty > 0 && (
              <div className="flex justify-between text-zinc-400 pt-1 border-t border-[#232838]">
                <span>Saldo após esta baixa:</span>
                <span
                  className={`font-semibold ${
                    newBalance < 0
                      ? 'text-rose-400'
                      : newBalance <= selectedItem.minQuantity
                      ? 'text-amber-400'
                      : 'text-zinc-100'
                  }`}
                >
                  {newBalance.toFixed(2)} {selectedItem.unit}
                  {newBalance <= selectedItem.minQuantity && newBalance >= 0 && ' (Abaixo do estoque mínimo)'}
                </span>
              </div>
            )}

            {hasInsufficientStock && (
              <div className="flex items-center gap-1.5 text-rose-400 pt-1">
                <AlertCircle size={14} className="shrink-0" />
                <span>Este estoque não permite saldo negativo. Reduza a quantidade.</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Motivo da saída"
            options={reasonOptions}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Input
            label="Destino / Cliente / Obra"
            placeholder="Ex: Obra Centro / Cliente João"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
          />
        </div>

        <Input
          label="Nº Pedido / Ordem de Serviço"
          placeholder="Ex: OS-9021"
          value={documentRef}
          onChange={(e) => setDocumentRef(e.target.value)}
        />

        <Input
          label="Observações (opcional)"
          placeholder="Motivo ou autorização da saída..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            disabled={hasInsufficientStock || numQty <= 0}
          >
            Confirmar saída
          </Button>
        </div>
      </form>
    </Modal>
  );
}
