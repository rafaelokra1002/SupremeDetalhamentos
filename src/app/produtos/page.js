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
  Package,
  AlertTriangle,
  Tag,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProdutosPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    marca: '',
    quantidade: 0,
    valorUnitario: 0,
    estoqueMinimo: 5,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
      toast.error('Acesso negado');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchProdutos();
    }
  }, [search, isAdmin]);

  const fetchProdutos = async () => {
    try {
      const res = await fetch(`/api/produtos?search=${search}`);
      const data = await res.json();
      setProdutos(data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = selectedProduto
        ? `/api/produtos/${selectedProduto.id}`
        : '/api/produtos';
      const method = selectedProduto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      toast.success(selectedProduto ? 'Produto atualizado!' : 'Produto criado!');
      setModalOpen(false);
      resetForm();
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const handleEdit = (produto) => {
    setSelectedProduto(produto);
    setFormData({
      nome: produto.nome || '',
      categoria: produto.categoria || '',
      marca: produto.marca || '',
      quantidade: produto.quantidade || 0,
      valorUnitario: produto.valorUnitario || 0,
      estoqueMinimo: produto.estoqueMinimo || 5,
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/produtos/${selectedProduto.id}`, { method: 'DELETE' });
      toast.success('Produto excluído!');
      fetchProdutos();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const resetForm = () => {
    setSelectedProduto(null);
    setFormData({
      nome: '',
      categoria: '',
      marca: '',
      quantidade: 0,
      valorUnitario: 0,
      estoqueMinimo: 5,
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
      <Header title="Produtos" subtitle="Gerencie o estoque de produtos" />

      <div className="p-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, categoria, marca..."
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
            Novo Produto
          </button>
        </div>

        {/* Low Stock Alert */}
        {produtos.filter((p) => p.quantidade <= p.estoqueMinimo).length > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="text-orange-400" size={24} />
            <div>
              <p className="font-medium text-orange-400">Alerta de Estoque Baixo</p>
              <p className="text-sm text-gray-400">
                {produtos.filter((p) => p.quantidade <= p.estoqueMinimo).length} produto(s) com estoque baixo ou zerado
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <Loading />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Marca</th>
                    <th>Estoque</th>
                    <th>Valor Unit.</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  ) : (
                    produtos.map((produto) => (
                      <tr key={produto.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-supreme-gray">
                              <Package size={20} className="text-supreme-gold" />
                            </div>
                            <span className="font-medium text-white">{produto.nome}</span>
                          </div>
                        </td>
                        <td>
                          {produto.categoria ? (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Tag size={14} />
                              {produto.categoria}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-gray-400">{produto.marca || '-'}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Layers size={14} className="text-gray-500" />
                            <span
                              className={
                                produto.quantidade <= produto.estoqueMinimo
                                  ? 'text-red-400 font-medium'
                                  : 'text-gray-400'
                              }
                            >
                              {produto.quantidade}
                            </span>
                            {produto.quantidade <= produto.estoqueMinimo && (
                              <AlertTriangle size={14} className="text-orange-400" />
                            )}
                          </div>
                        </td>
                        <td className="text-supreme-gold font-medium">
                          {formatCurrency(produto.valorUnitario)}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(produto)}
                              className="p-2 rounded-lg hover:bg-supreme-gray text-gray-400 hover:text-supreme-gold"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduto(produto);
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
        title={selectedProduto ? 'Editar Produto' : 'Novo Produto'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do produto"
              required
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Categoria
              </label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Vitrificação"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Marca
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ex: Ceramic Pro"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Valor Unitário
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valorUnitario}
                onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Estoque Mín.
              </label>
              <input
                type="number"
                min="0"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                className="w-full"
              />
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
              {selectedProduto ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir o produto "${selectedProduto?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </DashboardLayout>
  );
}
