'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useStockStore } from '../../store/stock';
import { Plus, Tag, Trash2, Edit2, Check, X, FolderTree } from 'lucide-react';

const PRESET_COLORS = [
  '#E11D48', // Rose (Padrão)
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export function GerenciarCategoriasModal({ isOpen, onClose, onSuccess }) {
  const { activeStockId, activeStock } = useStockStore();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulário de Nova Categoria
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState('#E11D48');
  const [creating, setCreating] = useState(false);

  // Estado de Edição Inline
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#E11D48');
  const [updating, setUpdating] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!activeStockId) return;
    setLoading(true);
    try {
      const res = await api.get('/stocks/' + activeStockId + '/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar categorias', err);
    } finally {
      setLoading(false);
    }
  }, [activeStockId]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      setNewName('');
      setNewDesc('');
      setNewColor('#E11D48');
      setEditingId(null);
    }
  }, [isOpen, loadCategories]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Nome da categoria é obrigatório', 'warning');
      return;
    }

    setCreating(true);
    try {
      await api.post('/stocks/' + activeStockId + '/categories', {
        name: newName.trim(),
        description: newDesc.trim() || null,
        color: newColor,
      });

      showToast('Categoria "' + newName + '" criada com sucesso!', 'success');
      setNewName('');
      setNewDesc('');
      setNewColor('#E11D48');
      loadCategories();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao criar categoria';
      showToast(msg, 'danger');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditColor(cat.color || '#E11D48');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  };

  const handleUpdate = async (categoryId) => {
    if (!editName.trim()) {
      showToast('O nome não pode ficar em branco', 'warning');
      return;
    }

    setUpdating(true);
    try {
      await api.patch('/stocks/' + activeStockId + '/categories/' + categoryId, {
        name: editName.trim(),
        description: editDesc.trim() || null,
        color: editColor,
      });

      showToast('Categoria atualizada com sucesso!', 'success');
      setEditingId(null);
      loadCategories();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao atualizar categoria';
      showToast(msg, 'danger');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (cat) => {
    const confirmDelete = window.confirm(
      'Deseja realmente excluir a categoria "' + cat.name + '"?\n\nOs ' + (cat.itemCount || 0) + ' produtos associados NÃO serão apagados, eles ficarão como "Sem categoria".'
    );
    if (!confirmDelete) return;

    try {
      await api.delete('/stocks/' + activeStockId + '/categories/' + cat.id);
      showToast('Categoria "' + cat.name + '" excluída com sucesso', 'success');
      loadCategories();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao excluir categoria';
      showToast(msg, 'danger');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Categorias de produtos"
      subtitle={activeStock ? activeStock.name + ' • Organize seu catálogo' : 'Gestão de categorias'}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Formulário de Adicionar Nova Categoria */}
        <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-[#10121A] border border-[#232838] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Plus size={14} className="text-rose-500" />
            <span>Nova categoria</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Nome da categoria (ex: Elétrica, Ferragens)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <Input
              placeholder="Descrição breve (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          {/* Seletor de Cores Presets */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-zinc-400 mr-1">Cor:</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  className={'w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ' + (newColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-105')}
                  title={c}
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={creating}
              icon={<Plus size={14} />}
            >
              Adicionar
            </Button>
          </div>
        </form>

        {/* Lista de Categorias Cadastradas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>Categorias no estoque ({categories.length})</span>
            <span>Produtos vinculados</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Carregando categorias...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-[#10121A] border border-[#232838] text-xs text-zinc-400">
              Nenhuma categoria cadastrada ainda neste estoque.
            </div>
          ) : (
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                if (isEditing) {
                  return (
                    <div
                      key={cat.id}
                      className="p-3 rounded-xl bg-[#181B26] border border-rose-500/40 space-y-2.5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-[#10121A] border border-[#232838] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-hidden focus:border-rose-500"
                          placeholder="Nome da categoria"
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="bg-[#10121A] border border-[#232838] rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-hidden focus:border-rose-500"
                          placeholder="Descrição breve"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditColor(c)}
                              style={{ backgroundColor: c }}
                              className={'w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ' + (editColor === c ? 'border-white scale-110' : 'border-transparent')}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={cancelEdit}
                            icon={<X size={13} />}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            onClick={() => handleUpdate(cat.id)}
                            loading={updating}
                            icon={<Check size={13} />}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-[#14161F] border border-[#232838] flex items-center justify-between gap-3 hover:border-[#2F364C] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#E11D48' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">
                          {cat.name}
                        </p>
                        {cat.description && (
                          <p className="text-xs text-zinc-400 truncate">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#10121A] text-zinc-300 border border-[#232838] font-mono">
                        {cat.itemCount ?? 0} {cat.itemCount === 1 ? 'item' : 'itens'}
                      </span>

                      <button
                        type="button"
                        onClick={() => startEdit(cat)}
                        title="Editar categoria"
                        className="w-7 h-7 rounded-lg bg-[#1A1E29] hover:bg-[#232838] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D]"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        title="Excluir categoria"
                        className="w-7 h-7 rounded-lg bg-[#1A1E29] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose}>
            Concluir
          </Button>
        </div>
      </div>
    </Modal>
  );
}
