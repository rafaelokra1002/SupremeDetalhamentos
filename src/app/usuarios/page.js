'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Shield, 
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    telefone: '',
    role: 'funcionario',
    active: true
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
      toast.error('Acesso negado');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsuarios();
    }
  }, [session]);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (error) {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingUsuario && !formData.password) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    try {
      const url = editingUsuario 
        ? `/api/usuarios/${editingUsuario.id}` 
        : '/api/usuarios';
      
      const method = editingUsuario ? 'PUT' : 'POST';
      
      const body = { ...formData };
      if (editingUsuario && !formData.password) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(editingUsuario ? 'Usuário atualizado!' : 'Usuário cadastrado!');
        setModalOpen(false);
        resetForm();
        fetchUsuarios();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao salvar usuário');
      }
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      name: usuario.name,
      email: usuario.email,
      password: '',
      telefone: usuario.telefone || '',
      role: usuario.role,
      active: usuario.active
    });
    setModalOpen(true);
    setMenuOpen(null);
  };

  const handleDelete = async () => {
    if (!usuarioToDelete) return;

    try {
      const res = await fetch(`/api/usuarios/${usuarioToDelete.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Usuário excluído!');
        fetchUsuarios();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    } finally {
      setConfirmOpen(false);
      setUsuarioToDelete(null);
    }
  };

  const handleToggleActive = async (usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...usuario, active: !usuario.active })
      });

      if (res.ok) {
        toast.success(usuario.active ? 'Usuário desativado!' : 'Usuário ativado!');
        fetchUsuarios();
      }
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
    setMenuOpen(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      telefone: '',
      role: 'funcionario',
      active: true
    });
    setEditingUsuario(null);
    setShowPassword(false);
  };

  const openNewModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supreme-gold"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Usuários</h1>
            <p className="text-gray-400">Gerencie os usuários do sistema</p>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-supreme-gold text-black rounded-lg font-semibold hover:bg-supreme-gold-light transition-colors"
          >
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-supreme-dark-card border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsuarios.map((usuario) => (
            <div
              key={usuario.id}
              className={`bg-supreme-dark-card rounded-xl p-5 border ${
                usuario.active ? 'border-gray-700' : 'border-red-900/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                    usuario.role === 'admin' ? 'border-supreme-gold bg-supreme-gold/20' : 'border-gray-600 bg-supreme-dark-lighter'
                  }`}>
                    {usuario.avatar ? (
                      <img src={usuario.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className={`text-lg font-semibold ${
                        usuario.role === 'admin' ? 'text-supreme-gold' : 'text-gray-400'
                      }`}>
                        {usuario.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{usuario.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      usuario.role === 'admin' 
                        ? 'bg-supreme-gold/20 text-supreme-gold' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {usuario.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      {usuario.role === 'admin' ? 'Administrador' : 'Funcionário'}
                    </span>
                  </div>
                </div>
                
                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === usuario.id ? null : usuario.id)}
                    className="p-1 rounded-lg hover:bg-supreme-dark-lighter text-gray-400 hover:text-white"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {menuOpen === usuario.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 mt-1 w-48 bg-supreme-dark-lighter border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-supreme-dark hover:text-white"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleActive(usuario)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-supreme-dark hover:text-white"
                        >
                          {usuario.active ? (
                            <>
                              <XCircle size={16} />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Ativar
                            </>
                          )}
                        </button>
                        {usuario.id !== session?.user?.id && (
                          <button
                            onClick={() => {
                              setUsuarioToDelete(usuario);
                              setConfirmOpen(true);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 size={16} />
                            Excluir
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail size={14} />
                  <span className="truncate">{usuario.email}</span>
                </div>
                {usuario.telefone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone size={14} />
                    <span>{usuario.telefone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between">
                <span className={`flex items-center gap-1 text-xs ${
                  usuario.active ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    usuario.active ? 'bg-green-400' : 'bg-red-400'
                  }`}></span>
                  {usuario.active ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredUsuarios.length === 0 && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Senha {editingUsuario ? '(deixe vazio para manter)' : '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none pr-10"
                required={!editingUsuario}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefone</label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Função *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
            >
              <option value="funcionario">Funcionário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-supreme-gold"></div>
            </label>
            <span className="text-sm text-gray-400">Usuário ativo</span>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-supreme-dark-lighter transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-supreme-gold text-black rounded-lg font-semibold hover:bg-supreme-gold-light transition-colors"
            >
              {editingUsuario ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setUsuarioToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${usuarioToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </DashboardLayout>
  );
}
