'use client';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useStockStore } from '../../store/stock';

export function EditarItemModal({ isOpen, onClose, item, onSuccess }) {
  const { activeStockId } = useStockStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('UN');
  const [minQuantity, setMinQuantity] = useState('0');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carrega dados do item quando o modal abre
  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || '');
      setSku(item.sku || '');
      setDescription(item.description || '');
      setUnit(item.unit || 'UN');
      setMinQuantity(String(item.minQuantity ?? 0));
      setMaxQuantity(item.maxQuantity ? String(item.maxQuantity) : '');
      setCostPrice(String(item.costPrice ?? 0));
      setSalePrice(String(item.salePrice ?? 0));
      setLocation(item.location || '');
      setCategoryId(item.category?.id || item.categoryId || '');
      setStatus(item.status || 'ACTIVE');

      // Carrega categorias do estoque
      if (activeStockId) {
        api.get(`/stocks/${activeStockId}/categories`)
          .then((res) => {
            setCategories(res.data || []);
          })
          .catch(() => {
            // Fallback caso a rota retorne via getStockById
            api.get(`/stocks/${activeStockId}`)
              .then((r) => setCategories(r.data.categories || []))
              .catch(() => {});
          });
      }
    }
  }, [isOpen, item, activeStockId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nome do produto é obrigatório', 'warning');
      return;
    }

    if (!sku.trim()) {
      showToast('Código SKU é obrigatório', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/stocks/${activeStockId}/items/${item.id}`, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim() || null,
        categoryId: categoryId || null,
        unit: unit.trim().toUpperCase() || 'UN',
        minQuantity: parseFloat(minQuantity) || 0,
        maxQuantity: maxQuantity ? parseFloat(maxQuantity) : null,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        location: location.trim() || null,
        status: status,
      });

      showToast(`Produto "${name}" atualizado com sucesso!`, 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao atualizar dados do produto';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Sem categoria' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const unitOptions = [
    { value: 'UN', label: 'Unidade (UN)' },
    { value: 'KG', label: 'Quilograma (KG)' },
    { value: 'L', label: 'Litro (L)' },
    { value: 'CX', label: 'Caixa (CX)' },
    { value: 'M', label: 'Metro (M)' },
    { value: 'RL', label: 'Rolo (RL)' },
    { value: 'PCT', label: 'Pacote (PCT)' },
    { value: 'PAR', label: 'Par (PAR)' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Ativo no estoque' },
    { value: 'INACTIVE', label: 'Inativo (desativado)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Produto"
      subtitle={item ? `SKU: ${item.sku} • Saldo atual: ${item.currentQuantity} ${item.unit}` : 'Atualizar cadastro'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Nome do produto *"
              placeholder="Ex: Furadeira de Impacto 750W"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Código SKU / Barras *"
              placeholder="Ex: FER-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Select
              label="Categoria"
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="Unidade de medida"
              options={unitOptions}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="Status operacional"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Estoque mínimo (alerta de reposição)"
            type="number"
            min="0"
            step="any"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
          />

          <Input
            label="Estoque máximo (capacidade física)"
            type="number"
            min="0"
            step="any"
            placeholder="Opcional"
            value={maxQuantity}
            onChange={(e) => setMaxQuantity(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Preço de custo (R$)"
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />

          <Input
            label="Preço de venda sugerido (R$)"
            type="number"
            min="0"
            step="0.01"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
        </div>

        <Input
          label="Localização física no armazém"
          placeholder="Ex: Prateleira B3, Gaveta 2, Depósito Principal"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Descrição técnica / Observações
          </label>
          <textarea
            className="w-full bg-[#10121A] border border-[#232838] focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-hidden min-h-[70px]"
            placeholder="Especificações, voltagem, marca ou observações de manuseio..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#232838]">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
