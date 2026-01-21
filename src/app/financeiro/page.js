'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  CalendarRange,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PiggyBank,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import toast from 'react-hot-toast';

const CATEGORIAS_GASTOS = [
  'Fornecedores',
  'Produtos',
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Salários',
  'Impostos',
  'Manutenção',
  'Marketing',
  'Outros',
];

export default function FinanceiroPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [loadingGasto, setLoadingGasto] = useState(false);
  const [formGasto, setFormGasto] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    vencimento: '',
    status: 'pendente',
  });

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchFinanceiro();
  }, [isAdmin]);

  const fetchFinanceiro = async () => {
    try {
      const res = await fetch('/api/financeiro');
      if (!res.ok) {
        throw new Error('Erro ao carregar dados');
      }
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const handleSubmitGasto = async (e) => {
    e.preventDefault();
    
    if (!formGasto.descricao || !formGasto.valor || !formGasto.vencimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoadingGasto(true);
    
    try {
      const res = await fetch('/api/contas-pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formGasto,
          valor: parseFloat(formGasto.valor),
          vencimento: new Date(formGasto.vencimento).toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      toast.success('Gasto adicionado com sucesso!');
      setModalGastoOpen(false);
      setFormGasto({
        descricao: '',
        categoria: '',
        valor: '',
        vencimento: '',
        status: 'pendente',
      });
      fetchFinanceiro();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao adicionar gasto');
    } finally {
      setLoadingGasto(false);
    }
  };

  const resetFormGasto = () => {
    setFormGasto({
      descricao: '',
      categoria: '',
      valor: '',
      vencimento: new Date().toISOString().split('T')[0],
      status: 'pendente',
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  const cards = [
    {
      title: 'Faturamento Diário',
      value: data?.faturamento?.diario?.valor || 0,
      count: data?.faturamento?.diario?.quantidade || 0,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
    },
    {
      title: 'Faturamento Semanal',
      value: data?.faturamento?.semanal?.valor || 0,
      count: data?.faturamento?.semanal?.quantidade || 0,
      icon: CalendarDays,
      color: 'bg-purple-500',
      textColor: 'text-purple-400',
    },
    {
      title: 'Faturamento Mensal',
      value: data?.faturamento?.mensal?.valor || 0,
      count: data?.faturamento?.mensal?.quantidade || 0,
      icon: CalendarRange,
      color: 'bg-green-500',
      textColor: 'text-green-400',
    },
    {
      title: 'Faturamento Anual',
      value: data?.faturamento?.anual?.valor || 0,
      count: data?.faturamento?.anual?.quantidade || 0,
      icon: TrendingUp,
      color: 'bg-red-500',
      textColor: 'text-red-400',
    },
  ];

  const cardsSecundarios = [
    {
      title: 'Pendente a Receber',
      value: data?.pendentes?.receber?.valor || 0,
      count: data?.pendentes?.receber?.quantidade || 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      trend: 'up',
    },
    {
      title: 'Pendente a Pagar',
      value: data?.pendentes?.pagar?.valor || 0,
      count: data?.pendentes?.pagar?.quantidade || 0,
      icon: Wallet,
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      trend: 'down',
    },
    {
      title: 'Despesas do Mês',
      value: data?.despesas?.mensal?.valor || 0,
      count: data?.despesas?.mensal?.quantidade || 0,
      icon: TrendingDown,
      color: 'bg-red-600',
      textColor: 'text-red-400',
      trend: 'down',
    },
    {
      title: 'Lucro Mensal',
      value: data?.lucroMensal || 0,
      count: data?.ordensFinalizadasMes || 0,
      icon: PiggyBank,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      trend: 'up',
      subtitle: 'ordens entregues',
    },
  ];

  return (
    <DashboardLayout>
      <Header 
        title="Financeiro" 
        subtitle="Acompanhe o faturamento e despesas"
      />

      {/* Botão Adicionar Gasto */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            resetFormGasto();
            setModalGastoOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Adicionar Gasto
        </button>
      </div>

      {/* Cards principais de faturamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-xs text-gray-500 bg-supreme-gray px-2 py-1 rounded">
                  {card.count} recebimentos
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-1">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {formatCurrency(card.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cardsSecundarios.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon size={24} className="text-white" />
                </div>
                {card.trend === 'up' ? (
                  <ArrowUpRight size={20} className="text-green-400" />
                ) : (
                  <ArrowDownRight size={20} className="text-red-400" />
                )}
              </div>
              <p className="text-gray-400 text-sm mb-1">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {formatCurrency(card.value)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {card.subtitle || `${card.count} registros`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Ticket médio */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Ticket Médio (Mensal)</p>
            <p className="text-3xl font-bold text-white mt-1">
              {formatCurrency(data?.ticketMedio || 0)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-red-700">
            <Receipt size={32} className="text-white" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Faturamento da Semana */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Faturamento da Semana
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.graficos?.semana || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="dia" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(value), 'Faturamento']}
              />
              <Bar dataKey="valor" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Faturamento do Ano */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">
            Faturamento Mensal ({new Date().getFullYear()})
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data?.graficos?.ano || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="mes" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                formatter={(value) => [formatCurrency(value), 'Faturamento']}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Últimas receitas */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">
          Últimos Recebimentos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-supreme-light-gray">
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Descrição</th>
                <th className="pb-3 font-medium">Forma Pagamento</th>
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-supreme-light-gray">
              {data?.ultimasReceitas?.length > 0 ? (
                data.ultimasReceitas.map((receita) => (
                  <tr key={receita.id} className="text-sm">
                    <td className="py-3 text-white">
                      {receita.cliente?.nome || 'N/A'}
                    </td>
                    <td className="py-3 text-gray-400">
                      {receita.descricao || `OS #${receita.ordemServico?.id?.slice(0, 8) || 'N/A'}`}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-supreme-gray text-gray-300">
                        {receita.formaPagamento || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {receita.dataRecebido ? formatDate(receita.dataRecebido) : 'N/A'}
                    </td>
                    <td className="py-3 text-green-400 font-semibold text-right">
                      {formatCurrency(receita.valor)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    Nenhum recebimento registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Gasto */}
      <Modal
        isOpen={modalGastoOpen}
        onClose={() => setModalGastoOpen(false)}
        title="Adicionar Gasto"
        size="md"
      >
        <form onSubmit={handleSubmitGasto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formGasto.descricao}
              onChange={(e) => setFormGasto({ ...formGasto, descricao: e.target.value })}
              placeholder="Ex: Conta de luz, Compra de produtos..."
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Categoria
              </label>
              <select
                value={formGasto.categoria}
                onChange={(e) => setFormGasto({ ...formGasto, categoria: e.target.value })}
                className="w-full"
              >
                <option value="">Selecione...</option>
                {CATEGORIAS_GASTOS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formGasto.valor}
                onChange={(e) => setFormGasto({ ...formGasto, valor: e.target.value })}
                placeholder="0,00"
                className="w-full"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={formGasto.vencimento}
                onChange={(e) => setFormGasto({ ...formGasto, vencimento: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <select
                value={formGasto.status}
                onChange={(e) => setFormGasto({ ...formGasto, status: e.target.value })}
                className="w-full"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalGastoOpen(false)}
              className="flex-1 btn-secondary"
              disabled={loadingGasto}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingGasto}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loadingGasto ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Adicionar Gasto
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
