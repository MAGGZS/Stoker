'use client';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { api } from '../../lib/api';
import {
  MessageSquarePlus,
  Lightbulb,
  Bug,
  Heart,
  HelpCircle,
  Star,
  X,
} from 'lucide-react';

export function FeedbackModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [type, setType] = useState('SUGGESTION');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      showToast('O título deve ter pelo menos 3 caracteres', 'warning');
      return;
    }
    if (!message.trim() || message.trim().length < 5) {
      showToast('A mensagem deve ter pelo menos 5 caracteres', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post('/feedback', {
        type,
        title: title.trim(),
        message: message.trim(),
        rating,
      });

      showToast('Feedback enviado com sucesso! Agradecemos sua contribuição.', 'success');
      setTitle('');
      setMessage('');
      setRating(5);
      setType('SUGGESTION');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao enviar feedback. Tente novamente.';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: 'SUGGESTION', label: 'Sugestão', icon: Lightbulb, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { value: 'BUG', label: 'Problema / Bug', icon: Bug, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    { value: 'COMPLIMENT', label: 'Elogio', icon: Heart, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    { value: 'OTHER', label: 'Outro', icon: HelpCircle, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-[#14161F] border border-[#232838] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden anim-pop-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#232838]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Enviar feedback para o criador
              </h2>
              <p className="text-xs text-zinc-400">
                Sugestões, melhorias ou relatos de erros para evoluir a plataforma
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1A1E29] hover:bg-[#222736] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo de Feedback */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Tipo de relato
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? opt.color + ' ring-1 ring-white/20 font-semibold'
                        : 'bg-[#1A1E29] border-[#262C3D] text-zinc-400 hover:text-zinc-200 hover:bg-[#202534]'
                    }`}
                  >
                    <Icon size={16} className="mb-1" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avaliação por Estrelas */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Sua avaliação geral da plataforma
            </label>
            <div className="flex items-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-zinc-600 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <Star
                    size={22}
                    className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}
                  />
                </button>
              ))}
              <span className="text-xs text-zinc-400 ml-2">
                {rating === 5 ? 'Excelente' : rating === 4 ? 'Muito bom' : rating === 3 ? 'Regular' : 'Precisa melhorar'}
              </span>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Título resumido
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sugestão para agilizar a contagem no mobile"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#11131A] border border-[#232838] focus:border-rose-500/60 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
              required
            />
          </div>

          {/* Mensagem Detalhada */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Descrição detalhada
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte o que aconteceu ou descreva como podemos melhorar sua experiência no Stoker..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#11131A] border border-[#232838] focus:border-rose-500/60 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#232838]">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              icon={<MessageSquarePlus size={16} />}
            >
              {loading ? 'Enviando...' : 'Enviar feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
