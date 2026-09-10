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
      showToast(res.message || 'Vínculo com o estoque estabelecido com sucesso!', 'success');
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
      title="Entrar em um Estoque"
      subtitle="Insira o código temporário de 6 caracteres gerado pelo Proprietário"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Código de Acesso (6 caracteres) *"
          placeholder="Ex: K8P2M5"
          value={shareCode}
          maxLength={6}
          onChange={(e) => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          required
          autoFocus
          className="font-mono uppercase tracking-[0.2em] text-center text-xl font-bold"
        />

        <p className="text-xs text-[rgba(255,255,255,0.55)] leading-relaxed">
          Os códigos possuem validade de <span className="text-[#DC2626] font-semibold">15 minutos</span>. Você será adicionado com permissão de <span className="text-white font-semibold">Convidado</span> para consultar e movimentar o estoque.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Acessar Estoque
          </Button>
        </div>
      </form>
    </Modal>
  );
}

