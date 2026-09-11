'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { Boxes, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Preencha seu e-mail e sua senha para entrar', 'warning');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      showToast('Login realizado com sucesso!', 'success');
      router.replace('/estoques');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Falha ao entrar. Verifique seu e-mail e senha.';
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0D11] text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#14161F] border border-[#232838] text-rose-500 flex items-center justify-center shadow-2xl shadow-black/60">
            <Boxes size={26} strokeWidth={2.2} />
          </div>
        </div>
        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Acessar o Stoker
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Entre com seu e-mail e senha para gerenciar seus estoques
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#14161F] border border-[#232838] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
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
              Entrar na conta
            </Button>
          </form>

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
      </div>
    </div>
  );
}

