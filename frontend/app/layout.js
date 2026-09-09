import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Stoker — Gestão Inteligente de Estoques',
  description: 'Sistema completo de controle de estoques com suporte mobile, entradas, saídas, recálculo de custo médio e balanço geral.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0B0C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="dark" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#0B0B0C] text-[rgba(255,255,255,0.95)] antialiased selection:bg-[#DC2626]/30 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

