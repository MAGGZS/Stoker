'use client';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useStockStore } from '../../store/stock';

export function AjusteModal({ isOpen, onClose, onSuccess, item }) {
  const { activeStockId } = useStockStore();
  const { showToast } = useToast();

  const [countedQuantity, setCountedQuantity] = useState('');
  const [reason, setReason] = useState('INVENTARIO_PERIODICO');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
    if (item && isOpen) {
      setCountedQuantity(String(item.currentQuantity));
    }
  }, [item]);
  }, [item, isOpen]);

  if (!item) return null;

  const currentQty = item.currentQuantity;
  const numCounted = parseFloat(countedQuantity) || 0;
  const delta = (numCounted - currentQty).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numCounted < 0) {
      showToast('A contagem física não pode ser negativa', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/stocks/${activeStockId}/movements/adjust`, {
        itemId: item.id,
        countedQuantity: numCounted,
        reason,
        notes: notes.trim() || null,
      });

      showToast(data.message || `Ajuste de "${item.name}" registrado com sucesso!`, 'success');
      showToast(data.message || `Ajuste de "${item.name}" aplicado com sucesso!`, 'success');
      onClose();
      if (onSuccess) onSuccess();

      setNotes('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao registrar ajuste';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const reasonOptions = [
    { value: 'INVENTARIO_PERIODICO', label: 'Conferência / Inventário Periódico' },
    { value: 'CORRECAO_CONTAGEM', label: 'Correção de Erro de Digitação' },
    { value: 'AVARIA_IDENTIFICADA', label: 'Avaria Identificada em Prateleira' },
    { value: 'BALANCO_GERAL', label: 'Balanço Geral' },
    { value: 'OUTRO', label: 'Outro' },
    { value: 'INVENTARIO_PERIODICO', label: 'Conferência física / Inventário' },
    { value: 'CORRECAO_CONTAGEM', label: 'Correção de contagem' },
    { value: 'AVARIA_IDENTIFICADA', label: 'Avaria ou dano identificado' },
    { value: 'BALANCO_GERAL', label: 'Balanço pontual' },
    { value: 'OUTRO', label: 'Outro motivo' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuste / Conferência Física"
      subtitle={`Item: ${item.name} (${item.sku})`}
      title="Ajuste de saldo físico"
      subtitle={`Produto: ${item.name} (${item.sku})`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Painel comparativo de contagem */}
        <div className="bg-[#1E1E22] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[rgba(255,255,255,0.65)]">Saldo no Sistema:</span>
            <span className="font-bold text-white text-base">
        <div className="bg-[#10121A] border border-[#232838] rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-zinc-400">Saldo registrado:</span>
            <span className="font-semibold text-zinc-100">
              {currentQty} {item.unit}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-[rgba(255,255,255,0.65)]">Diferença Apurada:</span>
          <div className="flex justify-between items-center text-xs sm:text-sm pt-2 border-t border-[#232838]">
            <span className="text-zinc-400">Variação calculada:</span>
            <span
              className={`font-bold text-base ${
              className={`font-semibold ${
                Number(delta) > 0
                  ? 'text-[#10B981]'
                  ? 'text-emerald-400'
                  : Number(delta) < 0
                  ? 'text-[#EF4444]'
                  : 'text-[rgba(255,255,255,0.7)]'
                  ? 'text-rose-400'
                  : 'text-zinc-400'
              }`}
            >
              {Number(delta) > 0 ? `+${delta}` : delta} {item.unit}
            </span>
          </div>
        </div>

        <Input
          label="Quantidade Real Contada Fisicamente *"
          label="Quantidade real apurada *"
          type="number"
          step="any"
          min="0"
          value={countedQuantity}
          onChange={(e) => setCountedQuantity(e.target.value)}
          required
        />

        <Select
          label="Motivo do Ajuste"
          label="Motivo do ajuste"
          options={reasonOptions}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Input
          label="Justificativa / Observações"
          placeholder="Ex: Localizado lote extra na prateleira superior..."
          label="Observações / Justificativa"
          placeholder="Ex: Identificado lote extra ou avaria..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Confirmar Ajuste
            Aplicar ajuste
          </Button>
        </div>
      </form>
    </Modal>
  );
}

