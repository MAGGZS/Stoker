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
import { Boxes, Lock, Mail } from 'lucide-react';
import { Boxes, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Preencha seu e-mail e senha', 'warning');
    if (!email.trim() || !password) {
      showToast('Preencha seu e-mail e sua senha para entrar', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      showToast('Autenticado com sucesso!', 'success');
      router.push('/dashboard');
      showToast('Login realizado com sucesso!', 'success');
      router.replace('/estoques');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'E-mail ou senha incorretos';
      const msg = err.response?.data?.error?.message || 'Falha ao entrar. Verifique seu e-mail e senha.';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
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
            Sistema Inteligente de Gerenciamento e Controle de Estoques
          </p>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Acessar o Stoker
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Entre com seu e-mail e senha para gerenciar seus estoques
        </p>
      </div>

        {/* Login Form Card */}
        <div className="bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[22px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleLogin} className="space-y-4">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#14161F] border border-[#232838] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu.email@exemplo.com"
              autoComplete="email"
              placeholder="voce@empresa.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Senha de Acesso"
              label="Senha"
              type="password"
              autoComplete="current-password"
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
              icon={<ArrowRight size={16} />}
            >
              Entrar no Sistema
              Entrar na conta
            </Button>
          </form>

          {/* Atalhos para Contas de Demonstração */}
          <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.4)] text-center">
              Acesso Rápido de Teste
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('dono@stoker.com')}
                className="p-2 rounded-[10px] bg-[#1E1E22] hover:bg-[#25252B] border border-[rgba(255,255,255,0.06)] text-left cursor-pointer transition-all"
              >
                <span className="text-xs font-bold text-white block">Conta Dono</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.45)]">dono@stoker.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('convidado@stoker.com')}
                className="p-2 rounded-[10px] bg-[#1E1E22] hover:bg-[#25252B] border border-[rgba(255,255,255,0.06)] text-left cursor-pointer transition-all"
              >
                <span className="text-xs font-bold text-white block">Conta Convidado</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.45)]">convidado@stoker.com</span>
              </button>
            </div>
          <div className="mt-6 pt-5 border-t border-[#232838] text-center text-sm text-zinc-400">
            Ainda não tem uma conta?{' '}
            <Link
              href="/register"
              className="font-medium text-rose-400 hover:text-rose-300 transition-colors"
            >
              Cadastre-se gratuitamente
            </Link>
          </div>
        </div>

        {/* Link para Cadastro */}
        <p className="text-center text-xs sm:text-sm text-[rgba(255,255,255,0.5)]">
          Ainda não tem uma conta?{' '}
          <Link
            href="/register"
            className="text-[#DC2626] hover:text-[#EF4444] font-semibold underline underline-offset-4"
          >
            Cadastre-se gratuitamente
          </Link>
        </p>
      </div>
    </div>
  );
}

