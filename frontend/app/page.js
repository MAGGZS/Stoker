'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './store/auth';
import { Boxes } from 'lucide-react';

export default function RootPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
    } else {
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center p-4">
      <div className="anim-pop-in flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[18px] bg-gradient-to-tr from-[#B91C1C] to-[#EF4444] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(220,38,38,0.4)] animate-pulse">
          <Boxes size={32} strokeWidth={2.2} />
        </div>
        <div className="text-center">
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            STOKER
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          </span>
          <p className="text-xs text-[rgba(255,255,255,0.45)] mt-1">Carregando sistema de estoque...</p>
        </div>
      </div>
    </div>
  );
}

