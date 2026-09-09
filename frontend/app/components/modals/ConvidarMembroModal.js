'use client';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useStockStore } from '../../store/stock';
import { Copy, Check, ShieldCheck, Users } from 'lucide-react';

export function ConvidarMembroModal({ isOpen, onClose }) {
  const { activeStock } = useStockStore();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const shareCode = activeStock?.shareCode || '';

  const handleCopy = () => {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    showToast('Código copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convidar para este Estoque"
      subtitle={`Estoque: ${activeStock?.name || ''}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
          Compartilhe o código exclusivo abaixo com outros membros da sua equipe.
          Ao entrarem pelo código, eles receberão acesso como <strong className="text-white font-semibold">Convidado</strong>.
        </p>

        {/* Box com o código em destaque */}
        <div className="p-4 rounded-[16px] bg-[#1E1E22] border border-[rgba(255,255,255,0.1)] text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
            Código de Acesso
          </p>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-[#DC2626]">
            {shareCode}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            icon={copied ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
            className="w-full mt-2"
          >
            {copied ? 'Código Copiado!' : 'Copiar Código de Convite'}
          </Button>
        </div>

        {/* Informações sobre os 2 níveis de acesso */}
        <div className="p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.06)] text-xs space-y-2 text-[rgba(255,255,255,0.7)]">
          <div className="flex items-start gap-2">
            <Users size={15} className="text-[#3B82F6] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Nível Convidado: </span>
              Pode consultar produtos, registrar entradas, registrar saídas e realizar conferências.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Nível Dono: </span>
              Apenas o Dono pode cadastrar/editar produtos, alterar configurações do estoque ou remover membros.
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

