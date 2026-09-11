'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './store/auth';
import { Boxes } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
    } else {
      router.replace('/estoques');
    }
  }, [isLoading, user, router]);

  return (
    <div className="min-h-screen bg-[#0C0D11] text-zinc-100 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#14161F] border border-[#232838] text-rose-500 flex items-center justify-center shadow-2xl shadow-black/60 anim-pop-in">
          <Boxes size={24} />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-zinc-100 block">
            Stoker
          </span>
          <p className="text-xs text-zinc-400 mt-1">Carregando sistema de estoque...</p>
        </div>
      </div>
    </div>
  );
}

