'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Boxes, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      showToast('Conta criada com sucesso! Seu estoque inicial foi configurado.', 'success');
      router.push('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao criar conta';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md anim-pop-in space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-tr from-[#B91C1C] to-[#EF4444] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(220,38,38,0.4)] mb-2">
            <Boxes size={30} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            STOKER
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
          </h1>
          <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.55)] max-w-xs">
            Crie sua conta e comece a gerenciar estoques com precisão
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[22px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nome Completo"
              placeholder="Ex: Carlos Eduardo"
              icon={<User size={16} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="E-mail"
              type="email"
              placeholder="seu.email@exemplo.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Senha (mínimo 6 caracteres)"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Criar Conta e Estoque
            </Button>
          </form>
        </div>

        {/* Link para Login */}
        <p className="text-center text-xs sm:text-sm text-[rgba(255,255,255,0.5)]">
          Já possui uma conta?{' '}
          <Link
            href="/login"
            className="text-[#DC2626] hover:text-[#EF4444] font-semibold underline underline-offset-4"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}

