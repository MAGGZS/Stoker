'use client';
import { useEffect } from 'react';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  maxWidth = 'max-w-lg',
  showCloseButton = true,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs anim-fade-in">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-[#141417] border border-[rgba(255,255,255,0.08)] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-5 sm:p-6 anim-pop-in z-10`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} bg-[#14161F] border border-[#232838] rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/80 anim-pop-in z-10 max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            {title && (
              <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                {title}
              </h3>
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
            {subtitle && (
              <p className="text-xs sm:text-sm text-[rgba(255,255,255,0.55)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1E1E22] hover:bg-[#2A2A30] text-[rgba(255,255,255,0.6)] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[rgba(255,255,255,0.06)]"
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </div>
        )}

        {/* Content */}
        <div className="mt-4">{children}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

