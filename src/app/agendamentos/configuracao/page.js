'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Clock, 
  Calendar, 
  Save,
  Plus,
  Trash2,
  Check,
  Link2,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

const DIAS_SEMANA = [
  { valor: 0, nome: 'Domingo' },
  { valor: 1, nome: 'Segunda-feira' },
  { valor: 2, nome: 'Terça-feira' },
  { valor: 3, nome: 'Quarta-feira' },
  { valor: 4, nome: 'Quinta-feira' },
  { valor: 5, nome: 'Sexta-feira' },
  { valor: 6, nome: 'Sábado' },
];

export default function ConfiguracaoAgendamentoPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todosServicos, setTodosServicos] = useState([]);
  const [linkCopiado, setLinkCopiado] = useState(false);
  
  const [config, setConfig] = useState({
    servicosDisponiveis: [],
    horariosDisponiveis: [],
    maxVagasPorHorario: 2,
    regrasPorServico: [],
    diasSemanaAtivos: [1, 2, 3, 4, 5, 6],
    mensagemConfirmacao: '',
    // Configuração de Lavagem Técnica
    servicoLavagemTecnicaId: '',
    horariosLavagemTecnica: [],
    maxVagasLavagemTecnica: 1
  });
  
  const [novoHorario, setNovoHorario] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchConfig();
  }, [isAdmin]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/agendamentos/configuracao');
      if (!response.ok) throw new Error('Erro ao buscar configuração');
      
      const data = await response.json();
      setConfig(data.config);
      setTodosServicos(data.todosServicos || []);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      toast.error('Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/agendamentos/configuracao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const toggleServico = (servicoId) => {
    setConfig(prev => {
      const servicosAtuais = prev.servicosDisponiveis || [];
      if (servicosAtuais.includes(servicoId)) {
        return {
          ...prev,
          servicosDisponiveis: servicosAtuais.filter(id => id !== servicoId),
          regrasPorServico: (prev.regrasPorServico || []).filter(regra => regra.servicoId !== servicoId)
        };
      } else {
        return {
          ...prev,
          servicosDisponiveis: [...servicosAtuais, servicoId]
        };
      }
    });
  };

  const atualizarRegraServico = (servicoId, updates) => {
    setConfig(prev => {
      const regras = prev.regrasPorServico || [];
      const regraExistente = regras.find(regra => regra.servicoId === servicoId);
      const regraBase = regraExistente || {
        servicoId,
        maxVagas: prev.maxVagasPorHorario || 2,
        horarios: prev.horariosDisponiveis || []
      };
      const regraAtualizada = { ...regraBase, ...updates };

      const regrasAtualizadas = regraExistente
        ? regras.map(regra => regra.servicoId === servicoId ? regraAtualizada : regra)
        : [...regras, regraAtualizada];

      return {
        ...prev,
        regrasPorServico: regrasAtualizadas
      };
    });
  };

  const toggleDiaSemana = (dia) => {
    setConfig(prev => {
      const diasAtuais = prev.diasSemanaAtivos || [];
      if (diasAtuais.includes(dia)) {
        return {
          ...prev,
          diasSemanaAtivos: diasAtuais.filter(d => d !== dia)
        };
      } else {
        return {
          ...prev,
          diasSemanaAtivos: [...diasAtuais, dia].sort((a, b) => a - b)
        };
      }
    });
  };

  const adicionarHorario = () => {
    if (!novoHorario) return;
    
    // Validar formato do horário
    if (!/^\d{2}:\d{2}$/.test(novoHorario)) {
      toast.error('Formato inválido. Use HH:MM');
      return;
    }

    if (config.horariosDisponiveis.includes(novoHorario)) {
      toast.error('Este horário já existe');
      return;
    }

    setConfig(prev => ({
      ...prev,
      horariosDisponiveis: [...prev.horariosDisponiveis, novoHorario].sort()
    }));
    setNovoHorario('');
  };

  const removerHorario = (horario) => {
    setConfig(prev => ({
      ...prev,
      horariosDisponiveis: prev.horariosDisponiveis.filter(h => h !== horario)
    }));
  };

  const copiarLinkAgendamento = () => {
    const link = `${window.location.origin}/agendar`;
    navigator.clipboard.writeText(link);
    setLinkCopiado(true);
    toast.success('Link copiado!');
    setTimeout(() => setLinkCopiado(false), 2000);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header 
        title="Configuração de Agendamento" 
        subtitle="Configure os serviços e horários disponíveis para agendamento online"
      />

      <div className="p-6 space-y-6">
        {/* Link de Agendamento */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-supreme-gold/20">
                <Link2 size={24} className="text-supreme-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Link de Agendamento</h3>
                <p className="text-gray-400 text-sm">Compartilhe este link com seus clientes</p>
              </div>
            </div>
            <button
              onClick={copiarLinkAgendamento}
              className="btn-primary flex items-center gap-2"
            >
              {linkCopiado ? <Check size={18} /> : <Copy size={18} />}
              {linkCopiado ? 'Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        {/* Serviços Disponíveis */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Settings size={20} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-white text-lg">Serviços Disponíveis para Agendamento</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Selecione quais serviços os clientes poderão escolher ao fazer um agendamento online.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todosServicos.map(servico => {
              const isSelected = config.servicosDisponiveis?.includes(servico.id);
              return (
                <div
                  key={servico.id}
                  onClick={() => toggleServico(servico.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-supreme-gold bg-supreme-gold/10' 
                      : 'border-gray-700 bg-supreme-dark hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium ${isSelected ? 'text-supreme-gold' : 'text-white'}`}>
                        {servico.nome}
                      </h4>
                      {servico.descricao && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{servico.descricao}</p>
                      )}
                      <p className="text-green-400 font-semibold mt-2">
                        {formatCurrency(servico.valor)}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-supreme-gold bg-supreme-gold' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check size={14} className="text-black" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {todosServicos.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Nenhum serviço cadastrado. Cadastre serviços na página de Serviços.
            </p>
          )}
        </div>

        {/* Configuração por Serviço */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Settings size={20} className="text-amber-400" />
            </div>
            <h3 className="font-semibold text-white text-lg">Configuração por Serviço</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Defina quantas vagas por horário e, se desejar, horários específicos para cada serviço.
          </p>

          {todosServicos.filter(servico => config.servicosDisponiveis?.includes(servico.id)).length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Selecione serviços acima para configurar vagas e horários por serviço.
            </p>
          )}

          <div className="space-y-4">
            {todosServicos
              .filter(servico => config.servicosDisponiveis?.includes(servico.id))
              .map(servico => {
                const regra = (config.regrasPorServico || []).find(r => r.servicoId === servico.id);
                const horariosTexto = (regra?.horarios?.length
                  ? regra.horarios
                  : (config.horariosDisponiveis || [])
                ).join(', ');

                return (
                  <div key={servico.id} className="border border-gray-700 rounded-lg p-4 bg-supreme-dark">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <h4 className="text-white font-medium">{servico.nome}</h4>
                        <p className="text-gray-400 text-sm">
                          {servico.descricao || 'Sem descrição'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-gray-400 text-sm">Vagas por horário</label>
                        <input
                          type="number"
                          min={1}
                          value={regra?.maxVagas ?? config.maxVagasPorHorario ?? 2}
                          onChange={(e) => atualizarRegraServico(servico.id, {
                            maxVagas: Math.max(1, Number(e.target.value || 1))
                          })}
                          className="input-field w-24"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm text-gray-400 mb-1">
                        Horários específicos (separados por vírgula) — deixe vazio para usar os horários gerais
                      </label>
                      <input
                        type="text"
                        value={horariosTexto}
                        onChange={(e) => {
                          const horarios = e.target.value
                            .split(',')
                            .map(h => h.trim())
                            .filter(Boolean);
                          atualizarRegraServico(servico.id, { horarios });
                        }}
                        placeholder="08:00, 08:30, 09:00"
                        className="input-field"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Horários Disponíveis */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Clock size={20} className="text-purple-400" />
            </div>
            <h3 className="font-semibold text-white text-lg">Horários Disponíveis</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Configure os horários em que os clientes podem agendar.
          </p>

          {/* Adicionar novo horário */}
          <div className="flex gap-2 mb-4">
            <input
              type="time"
              value={novoHorario}
              onChange={(e) => setNovoHorario(e.target.value)}
              className="input-field flex-1 max-w-xs"
            />
            <button
              onClick={adicionarHorario}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Adicionar
            </button>
          </div>

          {/* Lista de horários */}
          <div className="flex flex-wrap gap-2">
            {config.horariosDisponiveis?.sort().map(horario => (
              <div
                key={horario}
                className="flex items-center gap-2 bg-supreme-dark border border-gray-700 rounded-lg px-3 py-2"
              >
                <Clock size={14} className="text-purple-400" />
                <span className="text-white">{horario}</span>
                <button
                  onClick={() => removerHorario(horario)}
                  className="text-red-400 hover:text-red-300 ml-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {config.horariosDisponiveis?.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              Nenhum horário configurado. Adicione horários acima.
            </p>
          )}
        </div>

        {/* Dias da Semana */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Calendar size={20} className="text-green-400" />
            </div>
            <h3 className="font-semibold text-white text-lg">Dias da Semana Ativos</h3>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Selecione os dias da semana em que você atende.
          </p>

          <div className="flex flex-wrap gap-2">
            {DIAS_SEMANA.map(dia => {
              const isSelected = config.diasSemanaAtivos?.includes(dia.valor);
              return (
                <button
                  key={dia.valor}
                  onClick={() => toggleDiaSemana(dia.valor)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-500/20 text-green-400' 
                      : 'border-gray-700 bg-supreme-dark text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {dia.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
