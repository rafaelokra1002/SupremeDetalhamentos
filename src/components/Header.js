'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search } from 'lucide-react';

export default function Header({ title, subtitle }) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="bg-supreme-dark border-b border-supreme-light-gray px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 bg-supreme-gray rounded-lg px-4 py-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm w-48"
            />
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 rounded-lg bg-supreme-gray hover:bg-supreme-light-gray transition-colors">
            <Bell size={20} className="text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-supreme-gold rounded-full"></span>
          </button>
          
          {/* User badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-supreme-gray">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-supreme-gold' : 'bg-green-500'}`}></span>
            <span className="text-sm text-gray-300 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
