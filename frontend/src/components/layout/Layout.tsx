import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Ticker from '../shared/Ticker';

const tickerItems = [
  'Acompanhe seus representantes',
  'Vote e avalie políticos do Tocantins',
  'Monitore promessas de campanha',
  'Analise o Diário Oficial com IA',
  'Transparência é um direito do cidadão',
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Ticker items={tickerItems} />
      <Header />
      <main className="flex-1 w-full">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
