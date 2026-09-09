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
  }, [isOpen, activeStockId]);

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
        showToast(`Atenção: "${selectedItem?.name}" atingiu o estoque mínimo de segurança!`, 'warning', 6000);
      }

      onClose();
      if (onSuccess) onSuccess();
      // Limpa campos
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
    { value: 'VENDA', label: 'Venda a Cliente' },
    { value: 'CONSUMO_INTERNO', label: 'Consumo Interno / Uso Operacional' },
    { value: 'PERDA_AVARIA', label: 'Perda / Quebra / Avaria' },
    { value: 'DEVOLUCAO_FORNECEDOR', label: 'Devolução ao Fornecedor' },
    { value: 'TRANSFERENCIA', label: 'Transferência para Outro Estoque' },
    { value: 'AJUSTE_NEGATIVO', label: 'Ajuste Negativo de Inventário' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Saída de Estoque"
      subtitle="Baixe quantidades com controle estrito de saldo disponível"
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
            label="Quantidade de Saída *"
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
            label="Valor Unitário (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 89.90"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        {/* Card informativo de Saldo e Validação */}
        {selectedItem && (
          <div className="bg-[#1E1E22] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-[rgba(255,255,255,0.7)]">
              <span>Saldo Atual Disponível:</span>
              <span className="font-bold text-white">
                {currentAvailable} {selectedItem.unit}
              </span>
            </div>

            {numQty > 0 && (
              <div className="flex justify-between text-[rgba(255,255,255,0.7)] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                <span>Saldo Após a Saída:</span>
                <span
                  className={`font-bold ${
                    newBalance < 0
                      ? 'text-[#EF4444]'
                      : newBalance <= selectedItem.minQuantity
                      ? 'text-[#F59E0B]'
                      : 'text-white'
                  }`}
                >
                  {newBalance.toFixed(2)} {selectedItem.unit}
                  {newBalance <= selectedItem.minQuantity && newBalance >= 0 && ' (Alerta: Estoque Baixo)'}
                </span>
              </div>
            )}

            {hasInsufficientStock && (
              <div className="flex items-center gap-1.5 text-[#EF4444] pt-1">
                <AlertCircle size={14} />
                <span>O estoque configurado não permite saldo negativo. Reduza a quantidade.</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Motivo da Saída"
            options={reasonOptions}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Input
            label="Destino / Cliente / Depto."
            placeholder="Ex: Obra Alpha / Cliente João"
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
          label="Observações"
          placeholder="Motivo detalhado ou autorização..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={loading}
            disabled={hasInsufficientStock || numQty <= 0}
          >
            Confirmar Saída
          </Button>
        </div>
      </form>
    </Modal>
  );
}

