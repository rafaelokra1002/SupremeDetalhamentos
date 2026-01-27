'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  MessageCircle,
  Car,
  User,
  DollarSign,
  Calendar,
  Printer,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  const [selectedOrcamento, setSelectedOrcamento] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [config, setConfig] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    nomeCliente: '',
    telefoneCliente: '',
    emailCliente: '',
    veiculoMarca: '',
    veiculoModelo: '',
    veiculoPlaca: '',
    veiculoCor: '',
    veiculoAno: '',
    itens: [],
    desconto: 0,
    observacoes: '',
    validade: ''
  });

  const [novoItem, setNovoItem] = useState({
    descricao: '',
    quantidade: 1,
    valorUnitario: 0
  });

  useEffect(() => {
    fetchOrcamentos();
    fetchConfig();
  }, [filtroStatus]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/configuracao');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  const fetchOrcamentos = async () => {
    try {
      let url = '/api/orcamentos?';
      if (filtroStatus) url += `status=${filtroStatus}&`;
      if (busca) url += `busca=${busca}`;

      const response = await fetch(url);
      const data = await response.json();
      setOrcamentos(data);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrcamentos();
  };

  const resetForm = () => {
    setFormData({
      nomeCliente: '',
      telefoneCliente: '',
      emailCliente: '',
      veiculoMarca: '',
      veiculoModelo: '',
      veiculoPlaca: '',
      veiculoCor: '',
      veiculoAno: '',
      itens: [],
      desconto: 0,
      observacoes: '',
      validade: ''
    });
    setNovoItem({ descricao: '', quantidade: 1, valorUnitario: 0 });
    setEditMode(false);
    setSelectedOrcamento(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNovoItem(prev => ({ ...prev, [name]: name === 'descricao' ? value : Number(value) }));
  };

  const adicionarItem = () => {
    if (!novoItem.descricao) {
      toast.error('Informe a descrição do item');
      return;
    }
    if (novoItem.valorUnitario <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    const item = {
      ...novoItem,
      valorTotal: novoItem.quantidade * novoItem.valorUnitario
    };

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, item]
    }));

    setNovoItem({ descricao: '', quantidade: 1, valorUnitario: 0 });
  };

  const removerItem = (index) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const calcularTotal = () => {
    const subtotal = formData.itens.reduce((acc, item) => acc + item.valorTotal, 0);
    return subtotal - (formData.desconto || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nomeCliente) {
      toast.error('Informe o nome do cliente');
      return;
    }

    if (formData.itens.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento');
      return;
    }

    try {
      const url = editMode ? `/api/orcamentos/${selectedOrcamento.id}` : '/api/orcamentos';
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar orçamento');
      }

      toast.success(editMode ? 'Orçamento atualizado!' : 'Orçamento criado!');
      setModalOpen(false);
      resetForm();
      fetchOrcamentos();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (orcamento) => {
    setSelectedOrcamento(orcamento);
    setFormData({
      nomeCliente: orcamento.nomeCliente || '',
      telefoneCliente: orcamento.telefoneCliente || '',
      emailCliente: orcamento.emailCliente || '',
      veiculoMarca: orcamento.veiculoMarca || '',
      veiculoModelo: orcamento.veiculoModelo || '',
      veiculoPlaca: orcamento.veiculoPlaca || '',
      veiculoCor: orcamento.veiculoCor || '',
      veiculoAno: orcamento.veiculoAno || '',
      itens: orcamento.itens || [],
      desconto: orcamento.desconto || 0,
      observacoes: orcamento.observacoes || '',
      validade: orcamento.validade ? orcamento.validade.split('T')[0] : ''
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleView = (orcamento) => {
    setSelectedOrcamento(orcamento);
    setViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDialog.id) return;

    try {
      const response = await fetch(`/api/orcamentos/${confirmDialog.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Orçamento excluído!');
        fetchOrcamentos();
      } else {
        toast.error('Erro ao excluir orçamento');
      }
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    } finally {
      setConfirmDialog({ open: false, id: null });
    }
  };

  const handleStatusChange = async (id, novoStatus) => {
    try {
      const response = await fetch(`/api/orcamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });

      if (response.ok) {
        toast.success(`Status alterado para ${novoStatus}`);
        fetchOrcamentos();
      }
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const gerarPDF = async (orcamento) => {
    // Importar função de geração de PDF
    const { gerarPdfOrcamento } = await import('@/lib/gerarPdfOrcamento');
    
    const html = gerarPdfOrcamento(orcamento, config);
    
    // Abrir em nova janela para impressão/PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar carregar e imprimir
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const enviarWhatsApp = (orcamento) => {
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(orcamento.valorFinal);

    const itensTexto = orcamento.itens.map(item => 
      `• ${item.descricao}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotal)}`
    ).join('%0A');

    const mensagem = `Olá ${orcamento.nomeCliente}!%0A%0ASegue seu orçamento:%0A%0A${itensTexto}%0A%0A*TOTAL: ${valorFormatado}*%0A%0A${orcamento.validade ? `Válido até: ${new Date(orcamento.validade).toLocaleDateString('pt-BR')}%0A%0A` : ''}Aguardamos seu retorno!`;
    
    const telefone = orcamento.telefoneCliente?.replace(/\D/g, '');
    if (telefone) {
      window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
    } else {
      toast.error('Cliente sem telefone cadastrado');
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      aprovado: 'bg-green-500/20 text-green-400 border border-green-500/30',
      recusado: 'bg-red-500/20 text-red-400 border border-red-500/30',
      expirado: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    };
    
    const labels = {
      pendente: 'Pendente',
      aprovado: 'Aprovado',
      recusado: 'Recusado',
      expirado: 'Expirado'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.pendente}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <DashboardLayout title="Orçamentos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="text-red-500" />
              Orçamentos
            </h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie orçamentos para clientes</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={18} />
            Novo Orçamento
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-supreme-dark-card rounded-lg p-4 border border-supreme-light-gray">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por cliente, telefone ou placa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
              <button type="submit" className="btn-secondary">
                Buscar
              </button>
            </form>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="input-field"
            >
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="recusado">Recusado</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>
        </div>

        {/* Lista de Orçamentos */}
        <div className="bg-supreme-dark-card rounded-lg border border-supreme-light-gray overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : orcamentos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum orçamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-supreme-gray">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">#</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Cliente</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Veículo</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Valor</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Data</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Status</th>
                    <th className="text-right p-4 text-gray-400 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentos.map((orcamento) => (
                    <tr key={orcamento.id} className="border-t border-supreme-light-gray hover:bg-supreme-gray/50">
                      <td className="p-4 text-gray-300">
                        #{orcamento.numero || orcamento.id?.slice(-6)}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{orcamento.nomeCliente}</p>
                          <p className="text-gray-400 text-sm">{orcamento.telefoneCliente || '-'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">
                        {orcamento.veiculoMarca || orcamento.veiculoModelo ? (
                          <>
                            {orcamento.veiculoMarca} {orcamento.veiculoModelo}
                            {orcamento.veiculoPlaca && (
                              <span className="text-gray-500 text-sm block">{orcamento.veiculoPlaca}</span>
                            )}
                          </>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-bold">{formatarMoeda(orcamento.valorFinal)}</span>
                      </td>
                      <td className="p-4 text-gray-300">{formatarData(orcamento.createdAt)}</td>
                      <td className="p-4">{getStatusBadge(orcamento.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(orcamento)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-supreme-light-gray rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(orcamento)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => gerarPDF(orcamento)}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Gerar PDF"
                          >
                            <Printer size={18} />
                          </button>
                          <button
                            onClick={() => enviarWhatsApp(orcamento)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          <button
                            onClick={() => setConfirmDialog({ open: true, id: orcamento.id })}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editMode ? 'Editar Orçamento' : 'Novo Orçamento'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados do Cliente */}
          <div className="border-b border-supreme-light-gray pb-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <User size={18} className="text-red-500" />
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Nome *</label>
                <input
                  type="text"
                  name="nomeCliente"
                  value={formData.nomeCliente}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Nome do cliente"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Telefone</label>
                <input
                  type="tel"
                  name="telefoneCliente"
                  value={formData.telefoneCliente}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-1">E-mail</label>
                <input
                  type="email"
                  name="emailCliente"
                  value={formData.emailCliente}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Dados do Veículo */}
          <div className="border-b border-supreme-light-gray pb-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Car size={18} className="text-red-500" />
              Dados do Veículo (opcional)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Marca</label>
                <input
                  type="text"
                  name="veiculoMarca"
                  value={formData.veiculoMarca}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Ex: Toyota"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Modelo</label>
                <input
                  type="text"
                  name="veiculoModelo"
                  value={formData.veiculoModelo}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Ex: Corolla"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Placa</label>
                <input
                  type="text"
                  name="veiculoPlaca"
                  value={formData.veiculoPlaca}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Ano</label>
                <input
                  type="text"
                  name="veiculoAno"
                  value={formData.veiculoAno}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="2024"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-400 text-sm mb-1">Cor</label>
                <input
                  type="text"
                  name="veiculoCor"
                  value={formData.veiculoCor}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Ex: Preto"
                />
              </div>
            </div>
          </div>

          {/* Itens do Orçamento */}
          <div className="border-b border-supreme-light-gray pb-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <DollarSign size={18} className="text-red-500" />
              Itens do Orçamento
            </h3>
            
            {/* Adicionar Item */}
            <div className="bg-supreme-gray rounded-lg p-3 mb-4">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-5">
                  <input
                    type="text"
                    name="descricao"
                    value={novoItem.descricao}
                    onChange={handleItemChange}
                    className="input-field w-full"
                    placeholder="Descrição do serviço/produto"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    name="quantidade"
                    value={novoItem.quantidade}
                    onChange={handleItemChange}
                    className="input-field w-full"
                    placeholder="Qtd"
                    min="1"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input
                    type="number"
                    name="valorUnitario"
                    value={novoItem.valorUnitario}
                    onChange={handleItemChange}
                    className="input-field w-full"
                    placeholder="Valor"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={adicionarItem}
                    className="w-full h-full bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Adicionar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            {formData.itens.length > 0 ? (
              <div className="space-y-2">
                {formData.itens.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-supreme-dark rounded-lg p-3 border border-supreme-light-gray">
                    <div className="flex-1">
                      <p className="text-white">{item.descricao}</p>
                      <p className="text-gray-400 text-sm">
                        {item.quantidade}x {formatarMoeda(item.valorUnitario)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-bold">{formatarMoeda(item.valorTotal)}</span>
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum item adicionado</p>
            )}
          </div>

          {/* Desconto e Validade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Desconto (R$)</label>
              <input
                type="number"
                name="desconto"
                value={formData.desconto}
                onChange={handleFormChange}
                className="input-field w-full"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Validade do Orçamento</label>
              <input
                type="date"
                name="validade"
                value={formData.validade}
                onChange={handleFormChange}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-gray-400 text-sm mb-1">Observações</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleFormChange}
              className="input-field w-full"
              rows="3"
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Total */}
          <div className="bg-supreme-gray rounded-lg p-4 flex justify-between items-center">
            <span className="text-gray-400 font-medium">TOTAL:</span>
            <span className="text-2xl font-bold text-green-400">{formatarMoeda(calcularTotal())}</span>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editMode ? 'Salvar Alterações' : 'Criar Orçamento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Visualização */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Orçamento #${selectedOrcamento?.numero || selectedOrcamento?.id?.slice(-6)}`}
        size="lg"
      >
        {selectedOrcamento && (
          <div className="space-y-4">
            {/* Status e Ações */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {getStatusBadge(selectedOrcamento.status)}
              <div className="flex gap-2">
                {selectedOrcamento.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedOrcamento.id, 'aprovado');
                        setViewModalOpen(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <CheckCircle size={16} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => {
                        handleStatusChange(selectedOrcamento.id, 'recusado');
                        setViewModalOpen(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      <XCircle size={16} />
                      Recusar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-supreme-gray rounded-lg p-4">
              <h4 className="text-gray-400 text-sm mb-2">Cliente</h4>
              <p className="text-white font-medium">{selectedOrcamento.nomeCliente}</p>
              {selectedOrcamento.telefoneCliente && (
                <p className="text-gray-300 text-sm">{selectedOrcamento.telefoneCliente}</p>
              )}
              {selectedOrcamento.emailCliente && (
                <p className="text-gray-300 text-sm">{selectedOrcamento.emailCliente}</p>
              )}
            </div>

            {/* Veículo */}
            {(selectedOrcamento.veiculoMarca || selectedOrcamento.veiculoModelo) && (
              <div className="bg-supreme-gray rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-2">Veículo</h4>
                <p className="text-white font-medium">
                  {selectedOrcamento.veiculoMarca} {selectedOrcamento.veiculoModelo}
                </p>
                <div className="flex gap-4 text-gray-300 text-sm">
                  {selectedOrcamento.veiculoPlaca && <span>Placa: {selectedOrcamento.veiculoPlaca}</span>}
                  {selectedOrcamento.veiculoCor && <span>Cor: {selectedOrcamento.veiculoCor}</span>}
                  {selectedOrcamento.veiculoAno && <span>Ano: {selectedOrcamento.veiculoAno}</span>}
                </div>
              </div>
            )}

            {/* Itens */}
            <div className="bg-supreme-gray rounded-lg p-4">
              <h4 className="text-gray-400 text-sm mb-3">Itens</h4>
              <div className="space-y-2">
                {selectedOrcamento.itens?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-supreme-light-gray last:border-0">
                    <div>
                      <p className="text-white">{item.descricao}</p>
                      <p className="text-gray-400 text-sm">{item.quantidade}x {formatarMoeda(item.valorUnitario)}</p>
                    </div>
                    <span className="text-green-400 font-medium">{formatarMoeda(item.valorTotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totais */}
            <div className="bg-supreme-dark border border-supreme-light-gray rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>{formatarMoeda(selectedOrcamento.valorTotal)}</span>
              </div>
              {selectedOrcamento.desconto > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Desconto:</span>
                  <span>- {formatarMoeda(selectedOrcamento.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-supreme-light-gray">
                <span>TOTAL:</span>
                <span className="text-green-400">{formatarMoeda(selectedOrcamento.valorFinal)}</span>
              </div>
            </div>

            {/* Validade e Observações */}
            {selectedOrcamento.validade && (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/10 rounded-lg p-3">
                <Calendar size={18} />
                <span>Válido até: {formatarData(selectedOrcamento.validade)}</span>
              </div>
            )}

            {selectedOrcamento.observacoes && (
              <div className="bg-supreme-gray rounded-lg p-4">
                <h4 className="text-gray-400 text-sm mb-2">Observações</h4>
                <p className="text-gray-300">{selectedOrcamento.observacoes}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => gerarPDF(selectedOrcamento)}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Gerar PDF
              </button>
              <button
                onClick={() => enviarWhatsApp(selectedOrcamento)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Enviar WhatsApp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Excluir Orçamento"
        message="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
      />
    </DashboardLayout>
  );
}
