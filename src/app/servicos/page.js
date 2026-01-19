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
  Search,
  Edit,
  Trash2,
  Wrench,
  DollarSign,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServicosPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedServico, setSelectedServico] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      toast.error('Acesso negado');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchServicos();
    }
  }, [search, isAdmin]);

  const fetchServicos = async () => {
    try {
      const res = await fetch('/api/servicos');
      let data = await res.json();
      if (search) {
        data = data.filter((s) =>
          s.nome.toLowerCase().includes(search.toLowerCase())
        );
      }
      setServicos(data);
    } catch (error) {
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedServico
        ? `/api/servicos/${selectedServico.id}`
        : '/api/servicos';
      const method = selectedServico ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success(selectedServico ? 'Serviço atualizado!' : 'Serviço criado!');
      setModalOpen(false);
      resetForm();
      fetchServicos();
    } catch (error) {
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleEdit = (servico) => {
    setSelectedServico(servico);
    setFormData({
      nome: servico.nome || '',
      descricao: servico.descricao || '',
      valor: servico.valor || 0,
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/servicos/${selectedServico.id}`, { method: 'DELETE' });
      toast.success('Serviço excluído!');
      fetchServicos();
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    }
  };

  const resetForm = () => {
    setSelectedServico(null);
    setFormData({
      nome: '',
      descricao: '',
      valor: 0,
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <Header title="Serviços" subtitle="Gerencie os serviços oferecidos" />

      <div className="p-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12"
            />
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Novo Serviço
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <Loading />
        ) : servicos.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            Nenhum serviço encontrado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servicos.map((servico) => (
              <div key={servico.id} className="card hover:border-supreme-gold/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-supreme-gray">
                    <Wrench size={24} className="text-supreme-gold" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(servico)}
                      className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-supreme-gold"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedServico(servico);
                        setConfirmOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-white text-lg mb-2">{servico.nome}</h3>
                
                {servico.descricao && (
                  <p className="text-sm text-gray-500 mb-4 flex items-start gap-2">
                    <FileText size={14} className="mt-0.5 flex-shrink-0" />
                    {servico.descricao}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-supreme-light-gray">
                  <DollarSign size={18} className="text-supreme-gold" />
                  <span className="text-xl font-bold text-supreme-gold">
                    {formatCurrency(servico.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedServico ? 'Editar Serviço' : 'Novo Serviço'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nome do Serviço *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Vitrificação de Pintura"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do serviço..."
              rows={3}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              placeholder="0,00"
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
              {selectedServico ? 'Salvar Alterações' : 'Cadastrar Serviço'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Serviço"
        message={`Tem certeza que deseja excluir o serviço "${selectedServico?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </DashboardLayout>
  );
}
