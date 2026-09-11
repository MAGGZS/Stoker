'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useStockStore } from '../../store/stock';

export function EntrarEstoqueModal({ isOpen, onClose, onSuccess }) {
  const { joinStock } = useStockStore();
  const { showToast } = useToast();

  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shareCode.trim()) {
      showToast('Digite o código de compartilhamento', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await joinStock(shareCode.trim());
      showToast(res.message || 'Acesso ao estoque autorizado!', 'success');
      onClose();
      if (onSuccess) onSuccess();
      setShareCode('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Código inválido ou estoque não encontrado';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acessar com código de convite"
      subtitle="Insira o código de 6 caracteres fornecido pelo criador do estoque"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Código de convite (6 caracteres) *"
          placeholder="Ex: K8P2M5"
          value={shareCode}
          maxLength={6}
          onChange={(e) => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          required
          autoFocus
          className="font-mono uppercase tracking-[0.25em] text-center text-xl font-bold"
        />

        <p className="text-xs text-zinc-400 leading-relaxed">
          Os códigos expiram após <span className="text-rose-400 font-medium">15 minutos</span> da emissão. Você terá permissão para visualizar itens e registrar movimentações neste estoque.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Acessar estoque
          </Button>
        </div>
      </form>
    </Modal>
  );
}
