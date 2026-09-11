'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Boxes, Lock, Mail, User } from 'lucide-react';
import { Boxes, Lock, Mail, User, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {

    if (!name.trim() || !email.trim() || !password) {
      showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('As senhas digitadas não coincidem', 'warning');
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      showToast('Conta criada com sucesso! Seu estoque inicial foi configurado.', 'success');
      router.push('/dashboard');
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      showToast('Conta criada com sucesso! Bem-vindo ao Stoker.', 'success');
      router.replace('/estoques');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao criar conta';
      const msg = err.response?.data?.error?.message || 'Falha ao realizar cadastro. Tente outro e-mail.';
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
    <div className="min-h-screen bg-[#0C0D11] text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#14161F] border border-[#232838] text-rose-500 flex items-center justify-center shadow-2xl shadow-black/60">
            <Boxes size={26} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            STOKER
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
          </h1>
          <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.55)] max-w-xs">
            Crie sua conta e comece a gerenciar estoques com precisão
          </p>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Criar sua conta
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Cadastre seus dados para começar a gerenciar estoques
        </p>
      </div>

        {/* Register Form Card */}
        <div className="bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[22px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleRegister} className="space-y-4">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#14161F] border border-[#232838] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              label="Nome Completo"
              label="Seu nome"
              type="text"
              placeholder="Ex: Carlos Eduardo"
              icon={<User size={16} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="E-mail"
              label="E-mail profissional"
              type="email"
              placeholder="seu.email@exemplo.com"
              autoComplete="email"
              placeholder="carlos@empresa.com"
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

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={16} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              icon={<ArrowRight size={16} />}
            >
              Criar Conta e Estoque
              Criar conta e começar
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#232838] text-center text-sm text-zinc-400">
            Já possui uma conta?{' '}
            <Link
              href="/login"
              className="font-medium text-rose-400 hover:text-rose-300 transition-colors"
            >
              Fazer login
            </Link>
          </div>
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

