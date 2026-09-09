'use client';
import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const useToast = create((set) => ({
  toasts: [],
  showToast: (message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isDanger = toast.type === 'danger' || toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-[14px] bg-[#1E1E22] border border-[rgba(255,255,255,0.12)] shadow-[0_10px_30px_rgba(0,0,0,0.5)] anim-pop-in"
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 size={18} className="text-[#10B981]" />}
              {isDanger && <AlertCircle size={18} className="text-[#EF4444]" />}
              {isWarning && <AlertTriangle size={18} className="text-[#F59E0B]" />}
              {!isSuccess && !isDanger && !isWarning && <Info size={18} className="text-[#3B82F6]" />}
            </div>

            <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.92)] leading-relaxed flex-1">
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[rgba(255,255,255,0.4)] hover:text-white shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

