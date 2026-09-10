'use client';
import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

export function QRCodeDisplay({ text, size = 180, className = '' }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!text) {
      setDataUrl('');
      return;
    }
    QRCodeLib.toDataURL(text, {
      width: size,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR code', err));
  }, [text, size]);

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-white/10 rounded-[14px] animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-white/40">Gerando QR Code...</span>
      </div>
    );
  }

  return (
    <div className={`p-2.5 bg-white rounded-[16px] shadow-lg inline-block ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`QR Code de acesso: ${text}`}
        width={size}
        height={size}
        className="rounded-[8px]"
      />
    </div>
  );
}

