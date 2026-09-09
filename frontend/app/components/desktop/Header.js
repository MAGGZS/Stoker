'use client';
import { Button } from '../ui/Button';
import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { isOwner } from '../../lib/stockRoles';
import { useStockStore } from '../../store/stock';

export function Header({
  title,
  subtitle,
  onOpenInbound,
  onOpenOutbound,
  onOpenNewItem,
}) {
  const { activeRole } = useStockStore();
  const owner = isOwner(activeRole);

  return (
    <header className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-[rgba(255,255,255,0.06)]">
      <div>
        {title && (
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm text-[rgba(255,255,255,0.55)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onOpenInbound && (
          <Button
            variant="secondary"
            size="md"
            onClick={onOpenInbound}
            icon={<ArrowDownLeft size={16} className="text-[#10B981]" />}
          >
            Nova Entrada
          </Button>
        )}

        {onOpenOutbound && (
          <Button
            variant="secondary"
            size="md"
            onClick={onOpenOutbound}
            icon={<ArrowUpRight size={16} className="text-[#EF4444]" />}
          >
            Nova Saída
          </Button>
        )}

        {owner && onOpenNewItem && (
          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewItem}
            icon={<Plus size={16} />}
          >
            Novo Produto
          </Button>
        )}
      </div>
    </header>
  );
}

