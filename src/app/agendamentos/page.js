'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  CalendarDays, 
  Plus, 
  Check, 
  X, 
  Clock, 
  MessageCircle,
  Eye,
  Car,
  Bike,
  ChevronLeft,
  ChevronRight,
  Link2,
  Copy,
  Settings,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AgendamentosPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('lista'); // 'lista' ou 'calendario'
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [servicos, setServicos] = useState([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nomeCliente: '',
    telefone: '',
    email: '',
    tipoVeiculo: 'carro',
    marcaVeiculo: '',
    modeloVeiculo: '',
    placaVeiculo: '',
    corVeiculo: '',
    servicoId: '',
    servicoNome: '',
    dataAgendamento: '',
    horario: '',
    observacoes: '',
    status: 'confirmado'
  });

  useEffect(() => {
    fetchAgendamentos();
  }, [filtroStatus, dataSelecionada, viewMode]);

  useEffect(() => {
    fetchServicos();
  }, []);

  useEffect(() => {
    if (formData.dataAgendamento && formData.servicoId) {
      fetchHorarios(formData.dataAgendamento, formData.servicoId);
    }
  }, [formData.dataAgendamento, formData.servicoId]);

  const fetchServicos = async () => {
    try {
      const response = await fetch('/api/servicos');
      const data = await response.json();
      setServicos(data.filter(s => s.active !== false));
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    }
  };

  const fetchHorarios = async (data, servicoId) => {
    try {
      let url = `/api/agendamentos/horarios?data=${data}`;
      if (servicoId) {
        url += `&servicoId=${servicoId}`;
      }
      const response = await fetch(url);
      const horarios = await response.json();
      setHorariosDisponiveis(horarios);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
    }
  };

  const fetchAgendamentos = async () => {
    try {
      let url = '/api/agendamentos?';
      if (filtroStatus) url += `status=${filtroStatus}&`;
      if (viewMode === 'calendario' && dataSelecionada) url += `data=${dataSelecionada}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setAgendamentos(data);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, novoStatus) => {
    try {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });

      if (response.ok) {
        fetchAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCancelar = async () => {
    if (!confirmDialog.id) return;

    try {
      const response = await fetch(`/api/agendamentos/${confirmDialog.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
    } finally {
      setConfirmDialog({ open: false, id: null });
    }
  };

  const handleExcluir = async () => {
    if (!deleteDialog.id) return;

    try {
      const response = await fetch(`/api/agendamentos/${deleteDialog.id}/excluir`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleView = (agendamento) => {
    setSelectedAgendamento(agendamento);
    setViewModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'servicoId') {
      const servico = servicos.find(s => s.id === value);
      if (servico) {
        setFormData(prev => ({ 
          ...prev, 
          servicoId: value,
          servicoNome: servico.nome 
        }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nomeCliente: '',
      telefone: '',
      email: '',
      tipoVeiculo: 'carro',
      marcaVeiculo: '',
      modeloVeiculo: '',
      placaVeiculo: '',
      corVeiculo: '',
      servicoId: '',
      servicoNome: '',
      dataAgendamento: '',
      horario: '',
      observacoes: '',
      status: 'confirmado'
    });
    setHorariosDisponiveis([]);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nomeCliente || !formData.telefone || !formData.servicoNome || !formData.dataAgendamento || !formData.horario) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar agendamento');
      }

      // Atualizar status se for diferente de pendente
      if (formData.status !== 'pendente') {
        await fetch(`/api/agendamentos/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: formData.status })
        });
      }

      toast.success('Agendamento criado com sucesso!');
      setManualModalOpen(false);
      resetForm();
      fetchAgendamentos();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copiarLinkAgendamento = () => {
    const link = `${window.location.origin}/agendar`;
    navigator.clipboard.writeText(link);
    setLinkCopiado(true);
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      confirmado: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      concluido: 'bg-green-500/20 text-green-400 border border-green-500/30',
      cancelado: 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    
    const labels = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      concluido: 'Concluído',
      cancelado: 'Cancelado'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatarData = (data) => {
    if (!data) return '';
    // Se vier como string YYYY-MM-DD, retorna formatado
    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    // Se vier como Date ISO, ajusta para o fuso local
    const dataObj = new Date(data);
    return `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth()+1).padStart(2, '0')}/${dataObj.getFullYear()}`;
  };

  const formatarDataHora = (data, horario) => {
    return `${formatarData(data)} às ${horario}`;
  };

  const enviarWhatsApp = (agendamento) => {
    const mensagem = `Olá ${agendamento.nomeCliente}! Confirmamos seu agendamento para ${formatarDataHora(agendamento.dataAgendamento, agendamento.horario)}. Serviço: ${agendamento.servicoNome}. Aguardamos você!`;
    const telefone = agendamento.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const navegarData = (direcao) => {
    const data = new Date(dataSelecionada);
    data.setDate(data.getDate() + direcao);
    setDataSelecionada(data.toISOString().split('T')[0]);
  };

  // Estatísticas
  const stats = {
    total: agendamentos.length,
    pendentes: agendamentos.filter(a => a.status === 'pendente').length,
    confirmados: agendamentos.filter(a => a.status === 'confirmado').length,
    concluidos: agendamentos.filter(a => a.status === 'concluido').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="text-red-500" />
              Agendamentos Online
            </h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie os agendamentos feitos pelos clientes</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                resetForm();
                setManualModalOpen(true);
              }}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus size={18} />
              Agendar Manual
            </button>
            <button
              onClick={() => router.push('/agendamentos/configuracao')}
              className="flex items-center gap-2 bg-supreme-gray text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Settings size={18} />
              Configurar
            </button>
            <button
              onClick={copiarLinkAgendamento}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              {linkCopiado ? <Check size={18} /> : <Copy size={18} />}
              {linkCopiado ? 'Link Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        {/* Link para compartilhar */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-4">
          <Link2 className="text-blue-400 flex-shrink-0" size={24} />
          <div className="flex-1">
            <p className="text-sm text-blue-400 font-medium">Link público para agendamento:</p>
            <p className="text-blue-300 font-mono text-sm break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/agendar` : '/agendar'}
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-gray-400 text-sm">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-yellow-400 text-sm">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pendentes}</p>
          </div>
          <div className="card p-4">
            <p className="text-blue-400 text-sm">Confirmados</p>
            <p className="text-2xl font-bold text-blue-400">{stats.confirmados}</p>
          </div>
          <div className="card p-4">
            <p className="text-green-400 text-sm">Concluídos</p>
            <p className="text-2xl font-bold text-green-400">{stats.concluidos}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'lista' ? 'bg-red-600 text-white' : 'bg-supreme-gray text-gray-300 hover:bg-supreme-light-gray'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendario' ? 'bg-red-600 text-white' : 'bg-supreme-gray text-gray-300 hover:bg-supreme-light-gray'
              }`}
            >
              Por Data
            </button>
          </div>

          {viewMode === 'calendario' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navegarData(-1)}
                className="p-2 hover:bg-supreme-gray rounded text-gray-400 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="input-field"
              />
              <button
                onClick={() => navegarData(1)}
                className="p-2 hover:bg-supreme-gray rounded text-gray-400 hover:text-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="input-field"
          >
            <option value="">Todos os status</option>
            <option value="pendente">Pendentes</option>
            <option value="confirmado">Confirmados</option>
            <option value="concluido">Concluídos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Lista de Agendamentos */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : agendamentos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <CalendarDays className="mx-auto mb-2 text-gray-600" size={48} />
              <p>Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-supreme-gray border-b border-supreme-light-gray">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Veículo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Serviço</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-supreme-light-gray">
                  {agendamentos.map((agendamento) => (
                    <tr key={agendamento.id} className="hover:bg-supreme-gray/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={16} />
                          <div>
                            <p className="font-medium text-white">{formatarData(agendamento.dataAgendamento)}</p>
                            <p className="text-sm text-gray-400">{agendamento.horario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{agendamento.nomeCliente}</p>
                        <p className="text-sm text-gray-400">{agendamento.telefone}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {agendamento.tipoVeiculo === 'carro' ? (
                            <Car className="text-gray-500" size={16} />
                          ) : (
                            <Bike className="text-gray-500" size={16} />
                          )}
                          <div>
                            <p className="font-medium text-white">{agendamento.marcaVeiculo} {agendamento.modeloVeiculo}</p>
                            {agendamento.placaVeiculo && (
                              <p className="text-sm text-gray-400">{agendamento.placaVeiculo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-white">{agendamento.servicoNome}</p>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(agendamento.status)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(agendamento)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => enviarWhatsApp(agendamento)}
                            className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>
                          {agendamento.status === 'pendente' && (
                            <button
                              onClick={() => handleStatusChange(agendamento.id, 'confirmado')}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                              title="Confirmar"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {agendamento.status === 'confirmado' && (
                            <button
                              onClick={() => handleStatusChange(agendamento.id, 'concluido')}
                              className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                              title="Concluir"
                            >
                              <Check size={18} />
                            </button>
                          )}
                          {(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && (
                            <button
                              onClick={() => setConfirmDialog({ open: true, id: agendamento.id })}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteDialog({ open: true, id: agendamento.id })}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                            title="Excluir permanentemente"
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

      {/* Modal de Visualização */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Detalhes do Agendamento"
      >
        {selectedAgendamento && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">Status</h3>
              {getStatusBadge(selectedAgendamento.status)}
            </div>
            
            <div className="border-t border-supreme-light-gray pt-4">
              <h3 className="font-semibold text-white mb-2">Data e Hora</h3>
              <p className="text-gray-300">{formatarDataHora(selectedAgendamento.dataAgendamento, selectedAgendamento.horario)}</p>
            </div>
            
            <div className="border-t border-supreme-light-gray pt-4">
              <h3 className="font-semibold text-white mb-2">Cliente</h3>
              <p className="text-gray-300"><strong className="text-gray-400">Nome:</strong> {selectedAgendamento.nomeCliente}</p>
              <p className="text-gray-300"><strong className="text-gray-400">Telefone:</strong> {selectedAgendamento.telefone}</p>
              {selectedAgendamento.email && <p className="text-gray-300"><strong className="text-gray-400">E-mail:</strong> {selectedAgendamento.email}</p>}
            </div>
            
            <div className="border-t border-supreme-light-gray pt-4">
              <h3 className="font-semibold text-white mb-2">Veículo</h3>
              <p className="text-gray-300"><strong className="text-gray-400">Tipo:</strong> {selectedAgendamento.tipoVeiculo === 'carro' ? 'Carro' : 'Moto'}</p>
              <p className="text-gray-300"><strong className="text-gray-400">Marca/Modelo:</strong> {selectedAgendamento.marcaVeiculo} {selectedAgendamento.modeloVeiculo}</p>
              {selectedAgendamento.placaVeiculo && <p className="text-gray-300"><strong className="text-gray-400">Placa:</strong> {selectedAgendamento.placaVeiculo}</p>}
              {selectedAgendamento.corVeiculo && <p className="text-gray-300"><strong className="text-gray-400">Cor:</strong> {selectedAgendamento.corVeiculo}</p>}
            </div>
            
            <div className="border-t border-supreme-light-gray pt-4">
              <h3 className="font-semibold text-white mb-2">Serviço</h3>
              <p className="text-gray-300">{selectedAgendamento.servicoNome}</p>
            </div>
            
            {selectedAgendamento.observacoes && (
              <div className="border-t border-supreme-light-gray pt-4">
                <h3 className="font-semibold text-white mb-2">Observações</h3>
                <p className="text-gray-400">{selectedAgendamento.observacoes}</p>
              </div>
            )}
            
            <div className="border-t border-supreme-light-gray pt-4 flex gap-2">
              <button
                onClick={() => enviarWhatsApp(selectedAgendamento)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              {selectedAgendamento.status === 'pendente' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedAgendamento.id, 'confirmado');
                    setViewModalOpen(false);
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Confirmar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Agendamento Manual */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Novo Agendamento Manual"
        size="lg"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {/* Dados do Cliente */}
          <div className="border-b border-supreme-light-gray pb-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <UserPlus size={18} className="text-red-500" />
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
                <label className="block text-gray-400 text-sm mb-1">Telefone *</label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-1">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
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
              Dados do Veículo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tipo *</label>
                <select
                  name="tipoVeiculo"
                  value={formData.tipoVeiculo}
                  onChange={handleFormChange}
                  className="input-field w-full"
                >
                  <option value="carro">Carro</option>
                  <option value="moto">Moto</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Marca *</label>
                <input
                  type="text"
                  name="marcaVeiculo"
                  value={formData.marcaVeiculo}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Ex: Toyota"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Modelo *</label>
                <input
                  type="text"
                  name="modeloVeiculo"
                  value={formData.modeloVeiculo}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Ex: Corolla"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Placa</label>
                <input
                  type="text"
                  name="placaVeiculo"
                  value={formData.placaVeiculo}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Cor</label>
                <input
                  type="text"
                  name="corVeiculo"
                  value={formData.corVeiculo}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  placeholder="Ex: Preto"
                />
              </div>
            </div>
          </div>

          {/* Serviço e Horário */}
          <div className="border-b border-supreme-light-gray pb-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <CalendarDays size={18} className="text-red-500" />
              Serviço e Horário
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-1">Serviço *</label>
                <select
                  name="servicoId"
                  value={formData.servicoId}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map(servico => (
                    <option key={servico.id} value={servico.id}>
                      {servico.nome} - R$ {servico.valor?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Data *</label>
                <input
                  type="date"
                  name="dataAgendamento"
                  value={formData.dataAgendamento}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Horário *</label>
                <select
                  name="horario"
                  value={formData.horario}
                  onChange={handleFormChange}
                  className="input-field w-full"
                  required
                  disabled={!formData.dataAgendamento || !formData.servicoId}
                >
                  <option value="">Selecione um horário</option>
                  {horariosDisponiveis.map((h, idx) => {
                    const horario = h.horario || h;
                    const disponivel = h.disponivel !== false;
                    return (
                      <option key={idx} value={horario} disabled={!disponivel}>
                        {horario} {!disponivel ? '(Indisponível)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="input-field w-full"
                >
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                </select>
              </div>
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
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="flex-1 px-4 py-2 bg-supreme-gray text-white rounded-lg hover:bg-supreme-light-gray transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Criar Agendamento'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, id: null })}
        onConfirm={handleCancelar}
        title="Cancelar Agendamento"
        message="Tem certeza que deseja cancelar este agendamento?"
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleExcluir}
        title="Excluir Agendamento"
        message="Tem certeza que deseja EXCLUIR PERMANENTEMENTE este agendamento? Esta ação não pode ser desfeita."
      />
    </DashboardLayout>
  );
}
