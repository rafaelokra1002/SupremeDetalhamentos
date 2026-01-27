'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  User, 
  Building2, 
  Camera, 
  Save, 
  Upload,
  Instagram,
  Facebook,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfiguracoesPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Dados do perfil do usuário
  const [perfil, setPerfil] = useState({
    name: '',
    email: '',
    telefone: '',
    avatar: '',
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  
  // Dados da empresa
  const [empresa, setEmpresa] = useState({
    nomeEmpresa: 'Supreme Detalhamento',
    logoEmpresa: '',
    cnpjEmpresa: '',
    telefoneEmpresa: '',
    emailEmpresa: '',
    enderecoEmpresa: '',
    instagramEmpresa: '',
    facebookEmpresa: '',
    whatsappEmpresa: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPerfil();
      fetchConfiguracao();
    }
  }, [session]);

  const fetchPerfil = async () => {
    try {
      const res = await fetch('/api/users/me');
      if (res.ok) {
        const data = await res.json();
        setPerfil(prev => ({
          ...prev,
          name: data.name || '',
          email: data.email || '',
          telefone: data.telefone || '',
          avatar: data.avatar || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const fetchConfiguracao = async () => {
    try {
      const res = await fetch('/api/configuracao');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setEmpresa({
            nomeEmpresa: data.nomeEmpresa || 'Supreme Detalhamento',
            logoEmpresa: data.logoEmpresa || '',
            cnpjEmpresa: data.cnpjEmpresa || '',
            telefoneEmpresa: data.telefoneEmpresa || '',
            emailEmpresa: data.emailEmpresa || '',
            enderecoEmpresa: data.enderecoEmpresa || '',
            instagramEmpresa: data.instagramEmpresa || '',
            facebookEmpresa: data.facebookEmpresa || '',
            whatsappEmpresa: data.whatsappEmpresa || ''
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'avatar') {
        setPerfil(prev => ({ ...prev, avatar: reader.result }));
      } else {
        setEmpresa(prev => ({ ...prev, logoEmpresa: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePerfil = async (e) => {
    e.preventDefault();
    
    if (perfil.novaSenha && perfil.novaSenha !== perfil.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (perfil.novaSenha && !perfil.senhaAtual) {
      toast.error('Digite a senha atual para alterar a senha');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: perfil.name,
          telefone: perfil.telefone,
          avatar: perfil.avatar,
          senhaAtual: perfil.senhaAtual || undefined,
          novaSenha: perfil.novaSenha || undefined
        })
      });

      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!');
        setPerfil(prev => ({ ...prev, senhaAtual: '', novaSenha: '', confirmarSenha: '' }));
        await update();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmpresa = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/configuracao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empresa)
      });

      if (res.ok) {
        toast.success('Configurações da empresa salvas!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-supreme-gold"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Configurações</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'perfil'
                ? 'bg-supreme-gold text-black'
                : 'bg-supreme-dark-card text-gray-400 hover:text-white'
            }`}
          >
            <User size={20} />
            Meu Perfil
          </button>
          {session?.user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('empresa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'empresa'
                  ? 'bg-supreme-gold text-black'
                  : 'bg-supreme-dark-card text-gray-400 hover:text-white'
              }`}
            >
              <Building2 size={20} />
              Empresa
            </button>
          )}
        </div>

        {/* Tab Perfil */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleSavePerfil} className="max-w-2xl">
            <div className="bg-supreme-dark-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Foto de Perfil</h2>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-supreme-dark-lighter flex items-center justify-center overflow-hidden border-4 border-supreme-gold/30">
                    {perfil.avatar ? (
                      <img 
                        src={perfil.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-supreme-gold rounded-full text-black hover:bg-supreme-gold-light transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'avatar')}
                    className="hidden"
                  />
                </div>
                
                <div className="text-gray-400 text-sm">
                  <p>Clique no ícone da câmera para alterar</p>
                  <p>Formatos: JPG, PNG, GIF (máx. 5MB)</p>
                </div>
              </div>
            </div>

            <div className="bg-supreme-dark-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Dados Pessoais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={perfil.name}
                    onChange={(e) => setPerfil(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={perfil.email}
                    disabled
                    className="w-full px-4 py-2 bg-supreme-dark border border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={perfil.telefone}
                    onChange={(e) => setPerfil(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-supreme-dark-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lock size={20} />
                Alterar Senha
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Senha Atual</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={perfil.senhaAtual}
                      onChange={(e) => setPerfil(prev => ({ ...prev, senhaAtual: e.target.value }))}
                      className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none pr-10"
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
                  <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={perfil.novaSenha}
                    onChange={(e) => setPerfil(prev => ({ ...prev, novaSenha: e.target.value }))}
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={perfil.confirmarSenha}
                    onChange={(e) => setPerfil(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-supreme-gold text-black rounded-lg font-semibold hover:bg-supreme-gold-light transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        )}

        {/* Tab Empresa */}
        {activeTab === 'empresa' && session?.user?.role === 'admin' && (
          <form onSubmit={handleSaveEmpresa} className="max-w-2xl">
            <div className="bg-supreme-dark-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Logo da Empresa</h2>
              
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-40 h-40 rounded-xl bg-supreme-dark-lighter flex items-center justify-center overflow-hidden border-2 border-supreme-gold/30">
                    {empresa.logoEmpresa ? (
                      <img 
                        src={empresa.logoEmpresa} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Building2 size={48} className="text-gray-500" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute bottom-2 right-2 p-2 bg-supreme-gold rounded-full text-black hover:bg-supreme-gold-light transition-colors"
                  >
                    <Upload size={20} />
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                </div>
                
                <div className="text-gray-400 text-sm">
                  <p>Clique no ícone para fazer upload do logo</p>
                  <p>Formatos: JPG, PNG, GIF (máx. 5MB)</p>
                  <p>Recomendado: imagem quadrada ou horizontal</p>
                </div>
              </div>
            </div>

            <div className="bg-supreme-dark-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Dados da Empresa</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    value={empresa.nomeEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={empresa.cnpjEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, cnpjEmpresa: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Phone size={14} />
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={empresa.telefoneEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, telefoneEmpresa: e.target.value }))}
                    placeholder="(00) 0000-0000"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <MessageCircle size={14} />
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={empresa.whatsappEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, whatsappEmpresa: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Mail size={14} />
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={empresa.emailEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, emailEmpresa: e.target.value }))}
                    placeholder="contato@empresa.com"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <MapPin size={14} />
                    Endereço
                  </label>
                  <textarea
                    value={empresa.enderecoEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, enderecoEmpresa: e.target.value }))}
                    placeholder="Rua, número, bairro, cidade - UF"
                    rows={2}
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-supreme-dark-card rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Redes Sociais</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Instagram size={14} />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={empresa.instagramEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, instagramEmpresa: e.target.value }))}
                    placeholder="@supremedetalhamento"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Facebook size={14} />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={empresa.facebookEmpresa}
                    onChange={(e) => setEmpresa(prev => ({ ...prev, facebookEmpresa: e.target.value }))}
                    placeholder="facebook.com/supremedetalhamento"
                    className="w-full px-4 py-2 bg-supreme-dark-lighter border border-gray-700 rounded-lg text-white focus:border-supreme-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-supreme-gold text-black rounded-lg font-semibold hover:bg-supreme-gold-light transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
