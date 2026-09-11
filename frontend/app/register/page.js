'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
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

  const handleRegister = async (e) => {
    e.preventDefault();

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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      showToast('Conta criada com sucesso! Bem-vindo ao Stoker.', 'success');
      router.replace('/estoques');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Falha ao realizar cadastro. Tente outro e-mail.';
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
          Criar sua conta
        </h1>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Cadastre seus dados para começar a gerenciar estoques
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#14161F] border border-[#232838] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              label="Seu nome"
              type="text"
              placeholder="Ex: Carlos Eduardo"
              icon={<User size={16} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="E-mail profissional"
              type="email"
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
      </div>
    </div>
  );
}

