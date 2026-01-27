'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Package,
  Wallet,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Crown,
  Settings,
  UserCog,
  TrendingUp,
  CalendarDays,
  FileText,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'funcionario'] },
  { href: '/agendamentos', label: 'Agendamentos', icon: CalendarDays, roles: ['admin', 'funcionario'] },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText, roles: ['admin', 'funcionario'] },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: ['admin', 'funcionario'] },
  { href: '/veiculos', label: 'Veículos', icon: Car, roles: ['admin', 'funcionario'] },
  { href: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList, roles: ['admin', 'funcionario'] },
  { href: '/produtos', label: 'Produtos', icon: Package, roles: ['admin'] },
  { href: '/servicos', label: 'Serviços', icon: Crown, roles: ['admin'] },
  { href: '/financeiro', label: 'Financeiro', icon: TrendingUp, roles: ['admin'] },
  { href: '/contas-pagar', label: 'Contas a Pagar', icon: Wallet, roles: ['admin'] },
  { href: '/contas-receber', label: 'Contas a Receber', icon: CreditCard, roles: ['admin'] },
  { href: '/usuarios', label: 'Usuários', icon: UserCog, roles: ['admin'] },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin', 'funcionario'] },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const filteredMenuItems = menuItems.filter((item) => {
    if (isAdmin) return true;
    return item.roles.includes('funcionario');
  });

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-supreme-dark border-b border-supreme-light-gray z-30 flex items-center px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-supreme-gray border border-supreme-light-gray text-white"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src="/file.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-semibold">Supreme</span>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-supreme-dark border-r border-supreme-light-gray z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-supreme-light-gray">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img src="/file.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Supreme</h1>
              <p className="text-xs text-red-500">Detalhamento</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-supreme-gold/20 to-transparent text-supreme-gold border-l-2 border-supreme-gold'
                      : 'text-gray-400 hover:text-white hover:bg-supreme-gray'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-supreme-light-gray">
          <Link 
            href="/configuracoes"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 mb-4 hover:bg-supreme-gray rounded-lg p-2 -m-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-supreme-gray flex items-center justify-center overflow-hidden border-2 border-supreme-gold/30">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-supreme-gold font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-supreme-gray text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
