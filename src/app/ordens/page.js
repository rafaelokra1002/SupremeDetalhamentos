'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Loading from '@/components/Loading';
import SearchSelect from '@/components/SearchSelect';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Car,
  User,
  Calendar,
  DollarSign,
  Filter,
  X,
  Package,
  Wrench,
  CheckCircle,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS = [
  { value: 'aberta', label: 'Aberta', color: 'badge-aberta' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'badge-em_andamento' },
  { value: 'finalizada', label: 'Finalizada', color: 'badge-finalizada' },
  { value: 'entregue', label: 'Entregue', color: 'badge-entregue' },
];

export default function OrdensPage() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: '',
    veiculoId: '',
    funcionarioId: '',
    status: 'aberta',
    observacoes: '',
    itens: [],
  });

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const fetchData = async () => {
    try {
      const [ordensRes, clientesRes, servicosRes, produtosRes, usersRes] = await Promise.all([
        fetch(`/api/ordens?search=${search}&status=${statusFilter}`),
        fetch('/api/clientes'),
        fetch('/api/servicos'),
        fetch('/api/produtos'),
        fetch('/api/users'),
      ]);

      setOrdens(await ordensRes.json());
      setClientes(await clientesRes.json());
      setServicos(await servicosRes.json());
      setProdutos(await produtosRes.json());
      setUsers(await usersRes.json());
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchVeiculosByCliente = async (clienteId) => {
    try {
      const res = await fetch(`/api/veiculos?clienteId=${clienteId}`);
      const data = await res.json();
      setVeiculos(data);
    } catch (error) {
      console.error('Erro ao carregar veículos');
    }
  };

  const handleClienteChange = (clienteId) => {
    setFormData({ ...formData, clienteId, veiculoId: '' });
    if (clienteId) {
      fetchVeiculosByCliente(clienteId);
    } else {
      setVeiculos([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedOrdem
        ? `/api/ordens/${selectedOrdem.id}`
        : '/api/ordens';
      const method = selectedOrdem ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        funcionarioId: formData.funcionarioId || user?.id,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast.success(selectedOrdem ? 'Ordem atualizada!' : 'Ordem criada!');
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar ordem');
    }
  };

  const handleEdit = async (ordem) => {
    setSelectedOrdem(ordem);
    await fetchVeiculosByCliente(ordem.clienteId);
    setFormData({
      clienteId: ordem.clienteId || '',
      veiculoId: ordem.veiculoId || '',
      funcionarioId: ordem.funcionarioId || '',
      status: ordem.status || 'aberta',
      observacoes: ordem.observacoes || '',
      itens: ordem.itens || [],
    });
    setModalOpen(true);
  };

  const handleView = async (ordem) => {
    try {
      const res = await fetch(`/api/ordens/${ordem.id}`);
      const data = await res.json();
      setSelectedOrdem(data);
      setViewModalOpen(true);
    } catch (error) {
      toast.error('Erro ao carregar ordem');
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/ordens/${selectedOrdem.id}`, { method: 'DELETE' });
      toast.success('Ordem excluída!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir ordem');
    }
  };

  const handleEntregarClick = (ordem) => {
    setSelectedOrdem(ordem);
    setFormaPagamento('');
    setPagamentoModalOpen(true);
  };

  const handleConfirmarPagamento = async () => {
    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento');
      return;
    }

    setLoadingPagamento(true);

    try {
      // 1. Atualizar status da OS para "entregue"
      const resOrdem = await fetch(`/api/ordens/${selectedOrdem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'entregue',
          dataSaida: new Date().toISOString(),
        }),
      });

      if (!resOrdem.ok) throw new Error('Erro ao atualizar ordem');

      // 2. Criar conta a receber como "recebido"
      const resContaReceber = await fetch('/api/contas-receber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: selectedOrdem.clienteId,
          ordemServicoId: selectedOrdem.id,
          descricao: `OS - ${selectedOrdem.veiculo?.marca} ${selectedOrdem.veiculo?.modelo}`,
          valor: selectedOrdem.valorTotal,
          formaPagamento: formaPagamento,
          status: 'recebido',
          dataRecebido: new Date().toISOString(),
        }),
      });

      if (!resContaReceber.ok) throw new Error('Erro ao registrar pagamento');

      toast.success('Veículo entregue e pagamento registrado!');
      setPagamentoModalOpen(false);
      setSelectedOrdem(null);
      setFormaPagamento('');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar entrega');
    } finally {
      setLoadingPagamento(false);
    }
  };

  const addItem = (tipo) => {
    const newItem = {
      tipo,
      servicoId: '',
      produtoId: '',
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
      searchOpen: false,
    };
    setFormData({ ...formData, itens: [...formData.itens, newItem] });
  };

  const selectItemFromSearch = (index, item, tipo) => {
    const newItens = [...formData.itens];
    if (tipo === 'servico') {
      newItens[index].servicoId = item.id;
      newItens[index].descricao = item.nome;
      newItens[index].valorUnitario = item.valor;
      newItens[index].valorTotal = item.valor * newItens[index].quantidade;
    } else {
      newItens[index].produtoId = item.id;
      newItens[index].descricao = item.nome;
      newItens[index].valorUnitario = item.valorUnitario;
      newItens[index].valorTotal = item.valorUnitario * newItens[index].quantidade;
    }
    setFormData({ ...formData, itens: newItens });
  };

  const updateItem = (index, field, value) => {
    const newItens = [...formData.itens];
    newItens[index][field] = value;

    // Auto-fill description and value when selecting service/product
    if (field === 'servicoId' && value) {
      const servico = servicos.find((s) => s.id === value);
      if (servico) {
        newItens[index].descricao = servico.nome;
        newItens[index].valorUnitario = servico.valor;
        newItens[index].valorTotal = servico.valor * newItens[index].quantidade;
      }
    }
    if (field === 'produtoId' && value) {
      const produto = produtos.find((p) => p.id === value);
      if (produto) {
        newItens[index].descricao = produto.nome;
        newItens[index].valorUnitario = produto.valorUnitario;
        newItens[index].valorTotal = produto.valorUnitario * newItens[index].quantidade;
      }
    }

    // Recalculate total when quantity or unit value changes
    if (field === 'quantidade' || field === 'valorUnitario') {
      newItens[index].valorTotal = newItens[index].valorUnitario * newItens[index].quantidade;
    }

    setFormData({ ...formData, itens: newItens });
  };

  const removeItem = (index) => {
    const newItens = formData.itens.filter((_, i) => i !== index);
    setFormData({ ...formData, itens: newItens });
  };

  const resetForm = () => {
    setSelectedOrdem(null);
    setVeiculos([]);
    setFormData({
      clienteId: '',
      veiculoId: '',
      funcionarioId: '',
      status: 'aberta',
      observacoes: '',
      itens: [],
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const getTotal = () => {
    return formData.itens.reduce((acc, item) => acc + (item.valorTotal || 0), 0);
  };

  return (
    <DashboardLayout>
      <Header title="Ordens de Serviço" subtitle="Gerencie as ordens de serviço" />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, veículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-8 min-w-[180px]"
              >
                <option value="">Todos os status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Ordem
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
                    <th>Cliente / Veículo</th>
                    <th>Data</th>
                    <th>Responsável</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ordens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhuma ordem encontrada
                      </td>
                    </tr>
                  ) : (
                    ordens.map((ordem) => (
                      <tr key={ordem.id}>
                        <td>
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              <User size={14} className="text-gray-500" />
                              {ordem.cliente?.nome}
                            </p>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Car size={14} />
                              {ordem.veiculo?.marca} {ordem.veiculo?.modelo}
                              {ordem.veiculo?.placa && ` - ${ordem.veiculo.placa}`}
                            </p>
                          </div>
                        </td>
                        <td>
                          <span className="flex items-center gap-2 text-gray-400">
                            <Calendar size={14} />
                            {format(new Date(ordem.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </td>
                        <td className="text-gray-400">{ordem.funcionario?.name}</td>
                        <td>
                          <span className={`badge ${STATUS_OPTIONS.find((s) => s.value === ordem.status)?.color}`}>
                            {STATUS_OPTIONS.find((s) => s.value === ordem.status)?.label}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1 text-supreme-gold font-medium">
                            <DollarSign size={14} />
                            {formatCurrency(ordem.valorTotal)}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {(ordem.status === 'finalizada') && (
                              <button
                                onClick={() => handleEntregarClick(ordem)}
                                className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                title="Entregar e Receber"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleView(ordem)}
                              className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-blue-400"
                              title="Visualizar"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(ordem)}
                              className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-supreme-gold"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrdem(ordem);
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedOrdem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clienteId}
                onChange={(e) => handleClienteChange(e.target.value)}
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
                Veículo *
              </label>
              <select
                value={formData.veiculoId}
                onChange={(e) => setFormData({ ...formData, veiculoId: e.target.value })}
                required
                disabled={!formData.clienteId}
                className="w-full"
              >
                <option value="">Selecione o veículo</option>
                {veiculos.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.marca} {veiculo.modelo} {veiculo.placa && `- ${veiculo.placa}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Funcionário Responsável
              </label>
              <select
                value={formData.funcionarioId}
                onChange={(e) => setFormData({ ...formData, funcionarioId: e.target.value })}
                className="w-full"
              >
                <option value="">Selecione (ou será você)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
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
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">
                Serviços e Produtos
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => addItem('servico')}
                  className="text-xs btn-secondary flex items-center gap-1 py-1 px-2"
                >
                  <Wrench size={14} />
                  Serviço
                </button>
                <button
                  type="button"
                  onClick={() => addItem('produto')}
                  className="text-xs btn-secondary flex items-center gap-1 py-1 px-2"
                >
                  <Package size={14} />
                  Produto
                </button>
              </div>
            </div>

            {formData.itens.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm bg-supreme-gray rounded-lg">
                Adicione serviços ou produtos à ordem
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {formData.itens.map((item, index) => (
                  <div key={index} className="p-4 bg-supreme-gray rounded-lg border border-supreme-light-gray">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        item.tipo === 'servico' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {item.tipo === 'servico' ? 'Serviço' : 'Produto'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Busca de serviço/produto */}
                      <div>
                        {item.tipo === 'servico' ? (
                          <SearchSelect
                            items={servicos}
                            value={item.servicoId}
                            onChange={(servico) => {
                              if (servico) {
                                selectItemFromSearch(index, servico, 'servico');
                              } else {
                                updateItem(index, 'servicoId', '');
                                updateItem(index, 'descricao', '');
                                updateItem(index, 'valorUnitario', 0);
                                updateItem(index, 'valorTotal', 0);
                              }
                            }}
                            placeholder="Buscar serviço..."
                            displayField={(s) => `${s.nome} - ${formatCurrency(s.valor)}`}
                            renderItem={(s) => (
                              <div className="flex justify-between items-center">
                                <span className="text-white">{s.nome}</span>
                                <span className="text-red-400 font-medium">{formatCurrency(s.valor)}</span>
                              </div>
                            )}
                          />
                        ) : (
                          <SearchSelect
                            items={produtos}
                            value={item.produtoId}
                            onChange={(produto) => {
                              if (produto) {
                                selectItemFromSearch(index, produto, 'produto');
                              } else {
                                updateItem(index, 'produtoId', '');
                                updateItem(index, 'descricao', '');
                                updateItem(index, 'valorUnitario', 0);
                                updateItem(index, 'valorTotal', 0);
                              }
                            }}
                            placeholder="Buscar produto..."
                            displayField={(p) => `${p.nome} - ${formatCurrency(p.valorUnitario)}`}
                            renderItem={(p) => (
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="text-white">{p.nome}</span>
                                  <span className="text-gray-500 text-xs ml-2">({p.quantidade} em estoque)</span>
                                </div>
                                <span className="text-red-400 font-medium">{formatCurrency(p.valorUnitario)}</span>
                              </div>
                            )}
                          />
                        )}
                      </div>

                      {/* Quantidade e Valores */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                            className="text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Valor Unit.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.valorUnitario}
                            onChange={(e) => updateItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            className="text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Total</label>
                          <div className="h-[42px] flex items-center justify-center bg-supreme-dark rounded-lg border border-supreme-light-gray">
                            <span className="text-red-400 font-bold">
                              {formatCurrency(item.valorTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-3 pt-3 border-t border-supreme-light-gray">
              <span className="text-lg font-bold text-supreme-gold">
                Total: {formatCurrency(getTotal())}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações internas..."
              rows={2}
              className="w-full"
            />
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
              {selectedOrdem ? 'Salvar Alterações' : 'Criar Ordem'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Detalhes da Ordem de Serviço"
        size="lg"
      >
        {selectedOrdem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium text-white">{selectedOrdem.cliente?.nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Veículo</p>
                <p className="font-medium text-white">
                  {selectedOrdem.veiculo?.marca} {selectedOrdem.veiculo?.modelo}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`badge ${STATUS_OPTIONS.find((s) => s.value === selectedOrdem.status)?.color}`}>
                  {STATUS_OPTIONS.find((s) => s.value === selectedOrdem.status)?.label}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Responsável</p>
                <p className="font-medium text-white">{selectedOrdem.funcionario?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Entrada</p>
                <p className="text-gray-400">
                  {format(new Date(selectedOrdem.dataEntrada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {selectedOrdem.dataSaida && (
                <div>
                  <p className="text-sm text-gray-500">Data de Saída</p>
                  <p className="text-gray-400">
                    {format(new Date(selectedOrdem.dataSaida), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-supreme-light-gray pt-4">
              <p className="text-sm text-gray-500 mb-2">Serviços e Produtos</p>
              <div className="space-y-2">
                {selectedOrdem.itens?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-supreme-gray rounded">
                    <div className="flex items-center gap-2">
                      {item.tipo === 'servico' ? (
                        <Wrench size={14} className="text-blue-400" />
                      ) : (
                        <Package size={14} className="text-green-400" />
                      )}
                      <span>{item.descricao}</span>
                      <span className="text-gray-500">x{item.quantidade}</span>
                    </div>
                    <span className="text-supreme-gold">{formatCurrency(item.valorTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-supreme-light-gray">
              <div className="text-right">
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-2xl font-bold text-supreme-gold">
                  {formatCurrency(selectedOrdem.valorTotal)}
                </p>
              </div>
            </div>

            {selectedOrdem.observacoes && (
              <div className="border-t border-supreme-light-gray pt-4">
                <p className="text-sm text-gray-500 mb-1">Observações</p>
                <p className="text-gray-400">{selectedOrdem.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Ordem"
        message="Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita."
      />

      {/* Modal de Pagamento */}
      <Modal
        isOpen={pagamentoModalOpen}
        onClose={() => setPagamentoModalOpen(false)}
        title="Entregar Veículo e Receber Pagamento"
        size="md"
      >
        {selectedOrdem && (
          <div className="space-y-6">
            {/* Resumo da OS */}
            <div className="bg-supreme-gray rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Car size={20} className="text-gray-400" />
                <div>
                  <p className="text-white font-medium">
                    {selectedOrdem.veiculo?.marca} {selectedOrdem.veiculo?.modelo}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedOrdem.veiculo?.placa || 'Sem placa'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User size={20} className="text-gray-400" />
                <p className="text-gray-300">{selectedOrdem.cliente?.nome}</p>
              </div>
            </div>

            {/* Valor Total */}
            <div className="text-center py-4 border-y border-supreme-light-gray">
              <p className="text-sm text-gray-500 mb-1">Valor Total</p>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(selectedOrdem.valorTotal)}
              </p>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Forma de Pagamento *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['PIX', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Transferência', 'Boleto'].map((forma) => (
                  <button
                    key={forma}
                    type="button"
                    onClick={() => setFormaPagamento(forma)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      formaPagamento === forma
                        ? 'border-green-500 bg-green-500/20 text-green-400'
                        : 'border-supreme-light-gray bg-supreme-gray text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <CreditCard size={18} />
                    {forma}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPagamentoModalOpen(false)}
                className="flex-1 btn-secondary"
                disabled={loadingPagamento}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarPagamento}
                disabled={!formaPagamento || loadingPagamento}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPagamento ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Confirmar Entrega
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
