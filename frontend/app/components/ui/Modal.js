'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs anim-fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} bg-[#14161F] border border-[#232838] rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/80 anim-pop-in z-10 max-h-[90vh] overflow-y-auto`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-[#232838]">
            <div>
              {title && (
                <h3 className="text-lg sm:text-xl font-bold text-zinc-100 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-[#1A1E29] hover:bg-[#232838] text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer border border-[#262C3D] active:scale-95 shrink-0"
                aria-label="Fechar modal"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
}

