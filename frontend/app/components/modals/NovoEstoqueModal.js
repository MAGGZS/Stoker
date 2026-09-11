'use client';

import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useStockStore } from '../../store/stock';

export function NovoEstoqueModal({ isOpen, onClose, onSuccess }) {
  const { createStock } = useStockStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowNegative, setAllowNegative] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome do estoque é obrigatório', 'warning');
      return;
    }

    setLoading(true);
    try {
      const created = await createStock({
        name: name.trim(),
        description: description.trim() || undefined,
        allowNegativeStock: allowNegative,
      });

      showToast(`Estoque "${created.name}" criado com sucesso!`, 'success');
      onClose();
      if (onSuccess) onSuccess(created);
      setName('');
      setDescription('');
      setAllowNegative(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao criar estoque';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar novo estoque"
      subtitle="Defina o nome e as regras de operação para este estoque"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do estoque *"
          placeholder="Ex: Almoxarifado Central"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Descrição (opcional)"
          placeholder="Finalidade, localização ou setor..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="p-3.5 rounded-xl bg-[#10121A] border border-[#232838] flex items-start gap-3">
          <input
            id="allowNegative"
            type="checkbox"
            checked={allowNegative}
            onChange={(e) => setAllowNegative(e.target.checked)}
            className="mt-1 w-4 h-4 accent-rose-600 rounded cursor-pointer"
          />
          <label htmlFor="allowNegative" className="text-xs text-zinc-300 cursor-pointer select-none">
            <span className="font-semibold text-zinc-100 block mb-0.5">Permitir saldo negativo</span>
            Quando desmarcado (recomendado), o sistema impede baixas que superem a quantidade em estoque.
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Criar estoque
          </Button>
        </div>
      </form>
    </Modal>
  );
}
