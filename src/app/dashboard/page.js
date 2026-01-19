'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Car,
  ClipboardList,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#22c55e', '#a855f7'];

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Header title="Dashboard" subtitle="Visão geral do sistema" />
        <div className="p-6">
          <Loading />
        </div>
      </DashboardLayout>
    );
  }

  const cards = [
    {
      title: 'Total de Clientes',
      value: data?.totalClientes || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/20',
    },
    {
      title: 'Veículos Cadastrados',
      value: data?.totalVeiculos || 0,
      icon: Car,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/20',
    },
    {
      title: 'Ordens em Aberto',
      value: data?.ordensAbertas || 0,
      icon: ClipboardList,
      color: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-500/20',
    },
    {
      title: 'Ordens Finalizadas',
      value: data?.ordensFinalizadas || 0,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-500/20',
    },
  ];

  return (
    <DashboardLayout>
      <Header title="Dashboard" subtitle="Visão geral do sistema" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <div key={index} className="card hover:border-supreme-gold/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.title}</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${card.iconBg}`}>
                  <card.icon size={24} className="text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-4 text-green-400 text-sm">
                <ArrowUpRight size={16} />
                <span>Atualizado agora</span>
              </div>
            </div>
          ))}
        </div>

        {/* Faturamento Card (Admin only) */}
        {isAdmin && (
          <div className="card card-gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-supreme-gold text-sm font-medium">Faturamento do Mês</p>
                <h3 className="text-4xl font-bold text-white mt-2">
                  {formatCurrency(data?.faturamentoMes || 0)}
                </h3>
                <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                  <Calendar size={14} />
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="p-4 rounded-full bg-supreme-gold/20">
                <DollarSign size={40} className="text-supreme-gold" />
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ordens por Status */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ClipboardList size={20} className="text-supreme-gold" />
              Ordens por Status
            </h3>
            <div className="h-64">
              {data?.ordensChart?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.ordensChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="quantidade"
                      nameKey="status"
                      label={({ status, quantidade }) => `${status}: ${quantidade}`}
                    >
                      {data.ordensChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Nenhuma ordem registrada
                </div>
              )}
            </div>
          </div>

          {/* Faturamento Mensal (Admin only) */}
          {isAdmin && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-supreme-gold" />
                Faturamento Mensal
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.faturamentoChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="mes" stroke="#666" />
                    <YAxis stroke="#666" tickFormatter={(v) => `R$ ${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [formatCurrency(value), 'Faturamento']}
                    />
                    <Bar dataKey="valor" fill="#d4af37" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
