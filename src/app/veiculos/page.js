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
  Car,
  Bike,
  User,
  Palette,
  Calendar,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

const MARCAS_CARRO = [
  'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Jeep', 'Kia', 'Land Rover', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
  'Peugeot', 'Porsche', 'Renault', 'Toyota', 'Volkswagen', 'Volvo', 'Outra'
];

const MARCAS_MOTO = [
  'BMW', 'Ducati', 'Harley-Davidson', 'Honda', 'Kawasaki', 'KTM',
  'Suzuki', 'Triumph', 'Yamaha', 'Outra'
];

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    tipo: 'carro',
    marca: '',
    modelo: '',
    ano: '',
    placa: '',
    cor: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchVeiculos();
    fetchClientes();
  }, [search]);

  const fetchVeiculos = async () => {
    try {
      const res = await fetch(`/api/veiculos?search=${search}`);
      const data = await res.json();
      setVeiculos(data);
    } catch (error) {
      toast.error('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedVeiculo
        ? `/api/veiculos/${selectedVeiculo.id}`
        : '/api/veiculos';
      const method = selectedVeiculo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success(selectedVeiculo ? 'Veículo atualizado!' : 'Veículo criado!');
      setModalOpen(false);
      resetForm();
      fetchVeiculos();
    } catch (error) {
      toast.error('Erro ao salvar veículo');
    }
  };

  const handleEdit = (veiculo) => {
    setSelectedVeiculo(veiculo);
    setFormData({
      clienteId: veiculo.clienteId || '',
      tipo: veiculo.tipo || 'carro',
      marca: veiculo.marca || '',
      modelo: veiculo.modelo || '',
      ano: veiculo.ano || '',
      placa: veiculo.placa || '',
      cor: veiculo.cor || '',
      observacoes: veiculo.observacoes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/veiculos/${selectedVeiculo.id}`, { method: 'DELETE' });
      toast.success('Veículo excluído!');
      fetchVeiculos();
    } catch (error) {
      toast.error('Erro ao excluir veículo');
    }
  };

  const resetForm = () => {
    setSelectedVeiculo(null);
    setFormData({
      clienteId: '',
      tipo: 'carro',
      marca: '',
      modelo: '',
      ano: '',
      placa: '',
      cor: '',
      observacoes: '',
    });
  };

  const marcas = formData.tipo === 'moto' ? MARCAS_MOTO : MARCAS_CARRO;

  return (
    <DashboardLayout>
      <Header title="Veículos" subtitle="Gerencie os veículos cadastrados" />

      <div className="p-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo, placa..."
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
            Novo Veículo
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
                    <th>Veículo</th>
                    <th>Proprietário</th>
                    <th>Placa</th>
                    <th>Cor</th>
                    <th>Ordens</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum veículo encontrado
                      </td>
                    </tr>
                  ) : (
                    veiculos.map((veiculo) => (
                      <tr key={veiculo.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-supreme-gray">
                              {veiculo.tipo === 'moto' ? (
                                <Bike size={20} className="text-supreme-gold" />
                              ) : (
                                <Car size={20} className="text-supreme-gold" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {veiculo.marca} {veiculo.modelo}
                              </p>
                              {veiculo.ano && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Calendar size={12} />
                                  {veiculo.ano}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="flex items-center gap-2 text-gray-400">
                            <User size={14} />
                            {veiculo.cliente?.nome || '-'}
                          </span>
                        </td>
                        <td>
                          {veiculo.placa ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-supreme-gray rounded text-sm">
                              <Hash size={12} />
                              {veiculo.placa}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {veiculo.cor ? (
                            <span className="flex items-center gap-2 text-gray-400">
                              <Palette size={14} />
                              {veiculo.cor}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-gray-400">
                          {veiculo._count?.ordensServico || 0}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(veiculo)}
                              className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-supreme-gold"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVeiculo(veiculo);
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
        title={selectedVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Proprietário *
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value, marca: '' })}
                className="w-full"
              >
                <option value="carro">Carro</option>
                <option value="moto">Moto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Marca *
              </label>
              <select
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                required
                className="w-full"
              >
                <option value="">Selecione a marca</option>
                {marcas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                placeholder="Ex: Civic, Corolla..."
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Ano
              </label>
              <input
                type="text"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                placeholder="2024"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Placa
              </label>
              <input
                type="text"
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Cor
              </label>
              <input
                type="text"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                placeholder="Preto, Branco..."
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
              placeholder="Observações sobre o veículo..."
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
              {selectedVeiculo ? 'Salvar Alterações' : 'Cadastrar Veículo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Veículo"
        message={`Tem certeza que deseja excluir o veículo "${selectedVeiculo?.marca} ${selectedVeiculo?.modelo}"? Esta ação não pode ser desfeita.`}
      />
    </DashboardLayout>
  );
}
