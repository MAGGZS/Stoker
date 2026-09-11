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
  const { activeRole, activeStockId } = useStockStore();
  const owner = isOwner(activeRole);

  return (
    <header className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-[rgba(255,255,255,0.06)]">
    <header className="hidden lg:flex items-center justify-between pb-6 mb-6 border-b border-[#232838]">
      <div>
        {title && (
          <h1 className="text-2xl font-bold tracking-tight text-white">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm text-[rgba(255,255,255,0.55)] mt-0.5">
          <p className="text-sm text-zinc-400 mt-1">
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
      {activeStockId && (
        <div className="flex items-center gap-2.5">
          {onOpenInbound && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenInbound}
              icon={<ArrowDownLeft size={16} className="text-emerald-400" />}
            >
              Nova entrada
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
          {onOpenOutbound && (
            <Button
              variant="secondary"
              size="md"
              onClick={onOpenOutbound}
              icon={<ArrowUpRight size={16} className="text-rose-400" />}
            >
              Nova saída
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
          {owner && onOpenNewItem && (
            <Button
              variant="primary"
              size="md"
              onClick={onOpenNewItem}
              icon={<Plus size={16} />}
            >
              Novo produto
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

