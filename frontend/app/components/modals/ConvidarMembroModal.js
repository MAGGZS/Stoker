'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useStockStore } from '../../store/stock';
import { QRCodeDisplay } from '../ui/QRCode';
import { api } from '../../lib/api';
import {
  Copy,
  Check,
  RotateCw,
  Clock,
  ShieldCheck,
  Users,
  QrCode as QrIcon,
} from 'lucide-react';

export function ConvidarMembroModal({ isOpen, onClose }) {
  const { activeStock, activeStockId } = useStockStore();
  const { showToast } = useToast();

  const [shareCode, setShareCode] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carrega código de compartilhamento ativo e tempo de expiração
  const fetchCode = useCallback(async () => {
    if (!activeStockId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/stocks/${activeStockId}/share-code`);
      setShareCode(data.shareCode);
      setRemainingSeconds(data.remainingSeconds || 0);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao carregar código de convite';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [activeStockId, showToast]);

  // Força renovação de código sob demanda
  const handleRefresh = async () => {
    if (!activeStockId) return;
    setRefreshing(true);
    try {
      const { data } = await api.post(`/stocks/${activeStockId}/share-code/refresh`);
      setShareCode(data.shareCode);
      setRemainingSeconds(data.remainingSeconds || 15 * 60);
      showToast('Novo código de 6 caracteres gerado com sucesso!', 'success');
      showToast('Novo código gerado com sucesso!', 'success');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao renovar código';
      showToast(msg, 'danger');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCode();
    }
  }, [isOpen, fetchCode]);

  // Cronômetro regressivo
  useEffect(() => {
    if (!isOpen || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, remainingSeconds]);

  // Formata MM:SS
  const formatTime = (secs) => {
    if (secs <= 0) return 'Expirado';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode);
    setCopied(true);
    showToast('Código de 6 caracteres copiado!', 'success');
    showToast('Código copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const isExpired = remainingSeconds <= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartilhar Estoque"
      title="Compartilhar acesso ao estoque"
      subtitle={`Estoque: ${activeStock?.name || ''}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.7)] leading-relaxed">
          Como <strong className="text-white font-semibold">Proprietário</strong>, você pode convidar membros para este estoque. O código de 6 caracteres e o QR Code expiram a cada <strong className="text-[#DC2626] font-semibold">15 minutos</strong> por segurança.
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          Compartilhe este código ou o QR code com membros da sua equipe. Por segurança, o código expira a cada <strong className="text-rose-400 font-medium">15 minutos</strong>.
        </p>

        {loading ? (
          <div className="py-10 text-center">
            <span className="w-7 h-7 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin inline-block" />
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">Carregando código dinâmico...</p>
            <span className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
            <p className="text-xs text-zinc-400 mt-2">Gerando código de acesso...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Box Principal com QR Code e Código de 6 Dígitos */}
            <div className="p-4 rounded-[18px] bg-[#1E1E22] border border-[rgba(255,255,255,0.1)] text-center flex flex-col items-center space-y-3">
            {/* Box Principal com QR Code e Código */}
            <div className="p-4 rounded-2xl bg-[#10121A] border border-[#232838] text-center flex flex-col items-center space-y-3">
              {/* QR Code */}
              <div className="relative">
                <QRCodeDisplay text={shareCode} size={160} />
                {isExpired && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-[16px] flex flex-col items-center justify-center p-3 text-center">
                    <Clock size={24} className="text-[#EF4444] mb-1" />
                    <span className="text-xs font-bold text-white">Código Expirado</span>
                    <span className="text-[10px] text-[rgba(255,255,255,0.7)] mt-0.5">
                      Clique abaixo para gerar um novo
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-3 text-center">
                    <Clock size={24} className="text-rose-400 mb-1" />
                    <span className="text-xs font-bold text-zinc-100">Código expirado</span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">
                      Gere um novo código abaixo
                    </span>
                  </div>
                )}
              </div>

              {/* Código de 6 Caracteres */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.45)]">
                  Código de 6 Caracteres
                <p className="text-[11px] font-medium text-zinc-400">
                  Código de 6 dígitos
                </p>
                <div className="text-3xl sm:text-4xl font-mono font-extrabold tracking-[0.25em] text-[#DC2626] mt-0.5">
                <div className="text-3xl sm:text-4xl font-mono font-bold tracking-[0.25em] text-rose-500 mt-1">
                  {shareCode || '------'}
                </div>
              </div>

              {/* Timer de Validade */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  isExpired
                    ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : remainingSeconds < 120
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                    : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Clock size={13} />
                <span>
                  {isExpired ? 'Código Expirado' : `Válido por mais: ${formatTime(remainingSeconds)}`}
                  {isExpired ? 'Código expirado' : `Válido por mais ${formatTime(remainingSeconds)}`}
                </span>
              </div>

              {/* Botões de Ação */}
              <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={isExpired}
                  icon={copied ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                  icon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  className="flex-1"
                >
                  {copied ? 'Copiado!' : 'Copiar Código'}
                  {copied ? 'Copiado!' : 'Copiar código'}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRefresh}
                  loading={refreshing}
                  icon={<RotateCw size={14} className={refreshing ? 'animate-spin' : ''} />}
                  className="flex-1"
                >
                  Gerar Novo Código
                  Gerar novo código
                </Button>
              </div>
            </div>

            {/* Explicação dos Níveis */}
            <div className="p-3.5 rounded-[14px] bg-[#141417] border border-[rgba(255,255,255,0.06)] text-xs space-y-2 text-[rgba(255,255,255,0.7)]">
            {/* Informações sobre os níveis de acesso */}
            <div className="p-3.5 rounded-xl bg-[#10121A] border border-[#232838] text-xs space-y-2 text-zinc-300">
              <div className="flex items-start gap-2">
                <Users size={15} className="text-[#3B82F6] shrink-0 mt-0.5" />
                <Users size={15} className="text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Nível Convidado: </span>
                  Quem entrar por este código poderá ver itens e fazer movimentações, mas <strong className="text-white">não</strong> poderá excluir o estoque nem convidar outros usuários.
                  <span className="font-semibold text-zinc-100">Membros convidados: </span>
                  Podem consultar produtos, visualizar saldos e lançar entradas ou saídas de estoque.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck size={15} className="text-[#DC2626] shrink-0 mt-0.5" />
                <ShieldCheck size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Nível Proprietário: </span>
                  Apenas você que criou o estoque pode gerenciá-lo, excluí-lo e gerar códigos temporários de acesso.
                  <span className="font-semibold text-zinc-100">Proprietário: </span>
                  Apenas você pode gerenciar membros, gerar códigos de convite e excluir o estoque.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <div className="flex justify-end pt-2 border-t border-[#232838]">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
