import { Providers } from '@/components/Providers';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
  title: 'Supreme Detalhamento - Sistema de Gestão',
  description: 'Sistema de gestão para estética automotiva',
  icons: {
    icon: '/file.png',
    apple: '/file.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/file.png" type="image/png" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #2a2a2a',
              },
              success: {
                iconTheme: {
                  primary: '#d4af37',
                  secondary: '#000',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
