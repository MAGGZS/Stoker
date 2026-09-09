'use client';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import { useStockStore } from '../../store/stock';

export function NovoItemModal({ isOpen, onClose, onSuccess }) {
  const { activeStockId } = useStockStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('UN');
  const [minQuantity, setMinQuantity] = useState('0');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [costPrice, setCostPrice] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeStockId) {
      api.get(`/stocks/${activeStockId}`)
        .then((res) => {
          setCategories(res.data.categories || []);
          if (res.data.categories?.length > 0) {
            setCategoryId(res.data.categories[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, activeStockId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Nome e SKU são obrigatórios', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/stocks/${activeStockId}/items`, {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        description: description.trim() || undefined,
        categoryId: categoryId || null,
        unit: unit.trim().toUpperCase() || 'UN',
        initialQuantity: parseFloat(initialQuantity) || 0,
        minQuantity: parseFloat(minQuantity) || 0,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        location: location.trim() || null,
      });

      showToast(`Produto "${name}" cadastrado com sucesso!`, 'success');
      onClose();
      if (onSuccess) onSuccess();

      // Limpar campos
      setName('');
      setSku('');
      setDescription('');
      setMinQuantity('0');
      setInitialQuantity('0');
      setCostPrice('0');
      setSalePrice('0');
      setLocation('');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao cadastrar produto';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Sem Categoria' },
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Produto"
      subtitle="Defina identificação, estoque de segurança e precificação"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="Nome do Produto *"
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

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Categoria"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />

          <Select
            label="Unidade de Medida"
            options={unitOptions}
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input
            label="Saldo Inicial"
            type="number"
            step="any"
            min="0"
            value={initialQuantity}
            onChange={(e) => setInitialQuantity(e.target.value)}
          />

          <Input
            label="Estoque Mínimo"
            type="number"
            step="any"
            min="0"
            value={minQuantity}
            onChange={(e) => setMinQuantity(e.target.value)}
            helperText="Alerta de reposição"
          />

          <Input
            label="Preço de Custo (R$)"
            type="number"
            step="0.01"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
          />

          <Input
            label="Preço de Venda (R$)"
            type="number"
            step="0.01"
            min="0"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
        </div>

        <Input
          label="Localização no Estoque (Prateleira / Corredor / Gaveta)"
          placeholder="Ex: Corredor B, Prateleira 3"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <Input
          label="Descrição do Produto (Opcional)"
          placeholder="Especificações técnicas, dimensões..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Salvar Produto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

