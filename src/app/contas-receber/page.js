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
  CreditCard,
  CheckCircle,
  Clock,
  Filter,
  User,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência',
  'Boleto',
  'Cheque',
];

export default function ContasReceberPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [contas, setContas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    ordemServicoId: '',
    descricao: '',
    valor: '',
    formaPagamento: '',
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
      fetchData();
    }
  }, [statusFilter, isAdmin]);

  const fetchData = async () => {
    try {
      const [contasRes, clientesRes, ordensRes] = await Promise.all([
        fetch(`/api/contas-receber?status=${statusFilter}`),
        fetch('/api/clientes'),
        fetch('/api/ordens'),
      ]);

      setContas(await contasRes.json());
      setClientes(await clientesRes.json());
      setOrdens(await ordensRes.json());
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedConta
        ? `/api/contas-receber/${selectedConta.id}`
        : '/api/contas-receber';
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
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar conta');
    }
  };

  const handleEdit = (conta) => {
    setSelectedConta(conta);
    setFormData({
      clienteId: conta.clienteId || '',
      ordemServicoId: conta.ordemServicoId || '',
      descricao: conta.descricao || '',
      valor: conta.valor || '',
      formaPagamento: conta.formaPagamento || '',
      status: conta.status || 'pendente',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/contas-receber/${selectedConta.id}`, { method: 'DELETE' });
      toast.success('Conta excluída!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir conta');
    }
  };

  const handleMarkAsReceived = async (conta) => {
    try {
      await fetch(`/api/contas-receber/${conta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...conta, status: 'recebido' }),
      });
      toast.success('Conta marcada como recebida!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar conta');
    }
  };

  const resetForm = () => {
    setSelectedConta(null);
    setFormData({
      clienteId: '',
      ordemServicoId: '',
      descricao: '',
      valor: '',
      formaPagamento: '',
      status: 'pendente',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const totalPendente = contas
    .filter((c) => c.status === 'pendente')
    .reduce((acc, c) => acc + c.valor, 0);

  const totalRecebido = contas
    .filter((c) => c.status === 'recebido')
    .reduce((acc, c) => acc + c.valor, 0);

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <Header title="Contas a Receber" subtitle="Gerencie os recebimentos da empresa" />

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card bg-orange-500/10 border-orange-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Clock size={24} className="text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Pendente</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalPendente)}</p>
              </div>
            </div>
          </div>
          <div className="card bg-green-500/10 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Recebido</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRecebido)}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-supreme-gold/20">
                <CreditCard size={24} className="text-supreme-gold" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Geral</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalPendente + totalRecebido)}</p>
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
              <option value="recebido">Recebidos</option>
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
                    <th>Cliente</th>
                    <th>Descrição</th>
                    <th>Forma Pagamento</th>
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
                    contas.map((conta) => (
                      <tr key={conta.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-supreme-gray">
                              <User size={18} className="text-green-400" />
                            </div>
                            <div>
                              <span className="font-medium text-white">{conta.cliente?.nome}</span>
                              {conta.ordemServico && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <ClipboardList size={12} />
                                  OS vinculada
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-400">{conta.descricao || '-'}</td>
                        <td className="text-gray-400">{conta.formaPagamento || '-'}</td>
                        <td className="text-supreme-gold font-medium">{formatCurrency(conta.valor)}</td>
                        <td>
                          <span className={`badge badge-${conta.status}`}>
                            {conta.status === 'recebido' ? 'Recebido' : 'Pendente'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {conta.status === 'pendente' && (
                              <button
                                onClick={() => handleMarkAsReceived(conta)}
                                className="p-2 rounded-lg hover:bg-green-500/20 text-gray-400 hover:text-green-400"
                                title="Marcar como recebido"
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
                    ))
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
        title={selectedConta ? 'Editar Conta' : 'Nova Conta a Receber'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Cliente *
            </label>
            <select
              value={formData.clienteId}
              onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
              required
              className="w-full"
            >
              <option value="">Selecione o cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Ordem de Serviço (opcional)
            </label>
            <select
              value={formData.ordemServicoId}
              onChange={(e) => {
                const ordemId = e.target.value;
                const ordem = ordens.find((o) => o.id === ordemId);
                setFormData({
                  ...formData,
                  ordemServicoId: ordemId,
                  valor: ordem ? ordem.valorTotal : formData.valor,
                });
              }}
              className="w-full"
            >
              <option value="">Nenhuma</option>
              {ordens
                .filter((o) => o.clienteId === formData.clienteId)
                .map((ordem) => (
                  <option key={ordem.id} value={ordem.id}>
                    {ordem.veiculo?.marca} {ordem.veiculo?.modelo} - {formatCurrency(ordem.valorTotal)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do recebimento"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Forma de Pagamento
              </label>
              <select
                value={formData.formaPagamento}
                onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value })}
                className="w-full"
              >
                <option value="">Selecione</option>
                {FORMAS_PAGAMENTO.map((forma) => (
                  <option key={forma} value={forma}>
                    {forma}
                  </option>
                ))}
              </select>
            </div>
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
              <option value="recebido">Recebido</option>
            </select>
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
        message="Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita."
      />
    </DashboardLayout>
  );
}
