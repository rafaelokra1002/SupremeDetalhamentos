'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import Loading from '@/components/Loading';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Car,
  ClipboardList,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    whatsapp: '',
    email: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchClientes();
  }, [search]);

  const fetchClientes = async () => {
    try {
      const res = await fetch(`/api/clientes?search=${search}`);
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedCliente
        ? `/api/clientes/${selectedCliente.id}`
        : '/api/clientes';
      const method = selectedCliente ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success(selectedCliente ? 'Cliente atualizado!' : 'Cliente criado!');
      setModalOpen(false);
      resetForm();
      fetchClientes();
    } catch (error) {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nome: cliente.nome || '',
      cpfCnpj: cliente.cpfCnpj || '',
      telefone: cliente.telefone || '',
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',
      observacoes: cliente.observacoes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/clientes/${selectedCliente.id}`, { method: 'DELETE' });
      toast.success('Cliente excluído!');
      fetchClientes();
    } catch (error) {
      toast.error('Erro ao excluir cliente');
    }
  };

  const resetForm = () => {
    setSelectedCliente(null);
    setFormData({
      nome: '',
      cpfCnpj: '',
      telefone: '',
      whatsapp: '',
      email: '',
      observacoes: '',
    });
  };

  const openWhatsApp = (numero) => {
    const phone = numero.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  return (
    <DashboardLayout>
      <Header title="Clientes" subtitle="Gerencie os clientes da empresa" />

      <div className="p-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF/CNPJ, e-mail..."
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
            Novo Cliente
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
                    <th>Nome</th>
                    <th>Contato</th>
                    <th>CPF/CNPJ</th>
                    <th>Veículos</th>
                    <th>Ordens</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum cliente encontrado
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <td>
                          <div>
                            <p className="font-medium text-white">{cliente.nome}</p>
                            {cliente.email && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail size={12} />
                                {cliente.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {cliente.telefone && (
                              <span className="text-sm text-gray-400 flex items-center gap-1">
                                <Phone size={14} />
                                {cliente.telefone}
                              </span>
                            )}
                            {cliente.whatsapp && (
                              <button
                                onClick={() => openWhatsApp(cliente.whatsapp)}
                                className="p-1 rounded hover:bg-green-500/20 text-green-400"
                                title="Abrir WhatsApp"
                              >
                                <MessageCircle size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-400">{cliente.cpfCnpj || '-'}</td>
                        <td>
                          <span className="flex items-center gap-1 text-gray-400">
                            <Car size={16} />
                            {cliente.veiculos?.length || 0}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1 text-gray-400">
                            <ClipboardList size={16} />
                            {cliente._count?.ordensServico || 0}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(cliente)}
                              className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-supreme-gold"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCliente(cliente);
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
        title={selectedCliente ? 'Editar Cliente' : 'Novo Cliente'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do cliente"
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                CPF/CNPJ
              </label>
              <input
                type="text"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações sobre o cliente..."
              rows={3}
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
              {selectedCliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${selectedCliente?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </DashboardLayout>
  );
}
