import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { Noto_Sans } from 'next/font/google';

const font = Noto_Sans({ 
  subsets: ['latin', 'cyrillic'], 
  variable: '--font-main',
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <main className={font.className}>
        <Navbar />
        <Component {...pageProps} />
      </main>
    </AuthProvider>
  );
}