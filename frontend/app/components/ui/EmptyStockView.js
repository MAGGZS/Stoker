'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Boxes, Plus, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { useStockStore } from '../../store/stock';
import { NovoEstoqueModal } from '../modals/NovoEstoqueModal';

export function EmptyStockView({ title = 'Nenhum estoque selecionado' }) {
  const { stocks, fetchStocks } = useStockStore();
  const [modalOpen, setModalOpen] = useState(false);
  const hasStocks = stocks && stocks.length > 0;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card className="text-center p-8 sm:p-10 border border-[#232838] bg-[#14161F]">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1A1E29] border border-[#262C3D] flex items-center justify-center text-rose-500 mb-5">
          <Boxes size={28} />
        </div>

        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          {hasStocks ? title : 'Comece criando seu primeiro estoque'}
        </h2>

        <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8 leading-relaxed">
          {hasStocks
            ? 'Você tem estoques cadastrados na sua conta, mas nenhum está ativo neste momento. Escolha qual deseja acessar para ver os dados.'
            : 'Para começar a cadastrar produtos, registrar movimentações e acompanhar seus alertas, crie um novo estoque ou entre com um código de convite.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/estoques" className="w-full sm:w-auto">
            <Button
              variant={hasStocks ? 'primary' : 'secondary'}
              className="w-full justify-center"
              icon={<ArrowRight size={16} />}
            >
              {hasStocks ? 'Escolher estoque' : 'Ver tela de estoques'}
            </Button>
          </Link>

          <Button
            variant={hasStocks ? 'secondary' : 'primary'}
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto justify-center"
            icon={<Plus size={16} />}
          >
            Novo estoque
          </Button>
        </div>
      </Card>

      <NovoEstoqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          fetchStocks();
          setModalOpen(false);
        }}
      />
    </div>
  );
}

