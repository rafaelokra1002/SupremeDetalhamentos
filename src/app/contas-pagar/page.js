'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Loading from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  Wallet,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CATEGORIAS = [
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Fornecedores',
  'Funcionários',
  'Impostos',
  'Equipamentos',
  'Marketing',
  'Outros',
];

export default function ContasPagarPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    valor: '',
    vencimento: '',
    status: 'pendente',
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      toast.error('Acesso negado');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchContas();
    }
  }, [statusFilter, isAdmin]);

  const fetchContas = async () => {
    try {
      const res = await fetch(`/api/contas-pagar?status=${statusFilter}`);
      const data = await res.json();
      setContas(data);
    } catch (error) {
      toast.error('Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedConta
        ? `/api/contas-pagar/${selectedConta.id}`
        : '/api/contas-pagar';
      const method = selectedConta ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success(selectedConta ? 'Conta atualizada!' : 'Conta criada!');
      setModalOpen(false);
      resetForm();
      fetchContas();
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleEdit = (conta) => {
    setSelectedConta(conta);
    setFormData({
      descricao: conta.descricao || '',
      categoria: conta.categoria || '',
      valor: conta.valor || '',
      vencimento: conta.vencimento ? format(new Date(conta.vencimento), 'yyyy-MM-dd') : '',
      status: conta.status || 'pendente',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/contas-pagar/${selectedConta.id}`, { method: 'DELETE' });
      toast.success('Conta excluída!');
      fetchContas();
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  const handleMarkAsPaid = async (conta) => {
    try {
      await fetch(`/api/contas-pagar/${conta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...conta, status: 'pago' }),
      });
      toast.success('Conta marcada como paga!');
      fetchContas();
    } catch (error) {
      toast.error('Erro ao atualizar conta');
    }
  };

  const resetForm = () => {
    setSelectedConta(null);
    setFormData({
      descricao: '',
      categoria: '',
      valor: '',
      vencimento: '',
      status: 'pendente',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const getVencimentoStatus = (vencimento) => {
    const date = new Date(vencimento);
    if (isToday(date)) return 'hoje';
    if (isPast(date)) return 'vencida';
    return 'futura';
  };

  const totalPendente = contas
    .filter((c) => c.status === 'pendente')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalPago = contas
    .filter((c) => c.status === 'pago')
    .reduce((acc, c) => acc + c.valor, 0);

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <Header title="Contas a Pagar" subtitle="Gerencie as despesas da empresa" />

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card bg-red-500/10 border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/20">
                <Clock size={24} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Pendente</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totalPendente)}</p>
              </div>
            </div>
          </div>
          <div className="card bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Pago</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPago)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-supreme-gold/20">
                <Wallet size={24} className="text-supreme-gold" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Geral</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPendente + totalPago)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative">
            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-8 min-w-[180px]"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
            </select>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Conta
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <Loading />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhuma conta encontrada
                      </td>
                    </tr>
                  ) : (
                    contas.map((conta) => {
                      const vencStatus = getVencimentoStatus(conta.vencimento);
                      return (
                        <tr key={conta.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-supreme-gray">
                                <Wallet size={18} className="text-red-400" />
                              </div>
                              <span className="font-medium text-white">{conta.descricao}</span>
                            </div>
                          </td>
                          <td className="text-gray-400">{conta.categoria || '-'}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-500" />
                              <span
                                className={
                                  conta.status === 'pendente' && vencStatus === 'vencida'
                                    ? 'text-red-400'
                                    : conta.status === 'pendente' && vencStatus === 'hoje'
                                    ? 'text-orange-400'
                                    : 'text-gray-400'
                                }
                              >
                                {format(new Date(conta.vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {conta.status === 'pendente' && vencStatus === 'vencida' && (
                                <AlertCircle size={14} className="text-red-400" />
                              )}
                            </div>
                          </td>
                          <td className="text-white font-medium">{formatCurrency(conta.valor)}</td>
                          <td>
                            <span className={`badge badge-${conta.status}`}>
                              {conta.status === 'pago' ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              {conta.status === 'pendente' && (
                                <button
                                  onClick={() => handleMarkAsPaid(conta)}
                                  className="p-2 rounded-lg hover:bg-green-500/20 text-gray-400 hover:text-green-400"
                                  title="Marcar como pago"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(conta)}
                                className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-supreme-gold"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedConta(conta);
                                  setConfirmOpen(true);
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedConta ? 'Editar Conta' : 'Nova Conta a Pagar'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da conta"
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Categoria
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full"
              >
                <option value="">Selecione</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
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
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Vencimento *
              </label>
              <input
                type="date"
                value={formData.vencimento}
                onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              onClick={() => setModalOpen(false)}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {selectedConta ? 'Salvar Alterações' : 'Cadastrar Conta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Conta"
        message={`Tem certeza que deseja excluir a conta "${selectedConta?.descricao}"? Esta ação não pode ser desfeita.`}
      />
    </DashboardLayout>
  );
}
