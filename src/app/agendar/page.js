
'use client';

// Função para exibir a data corretamente (igual admin)
function formatarData(data) {
  if (!data) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  const dataObj = new Date(data);
  return `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth()+1).padStart(2, '0')}/${dataObj.getFullYear()}`;
}

import { useState, useEffect } from 'react';
import { CalendarDays, Car, Bike, User, Phone, Mail, Clock, Check, MessageCircle, MapPin, Copy, AlertTriangle, CreditCard } from 'lucide-react';

export default function AgendamentoPublico() {
  const [config, setConfig] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agendamentoCriado, setAgendamentoCriado] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Dados, 2: Veículo, 3: Serviço/Data, 4: Confirmação
  
  const [formData, setFormData] = useState({
    nomeCliente: '',
    telefone: '',
    email: '',
    tipoVeiculo: 'carro',
    marcaVeiculo: '',
    modeloVeiculo: '',
    placaVeiculo: '',
    corVeiculo: '',
    servicosSelecionados: [], // Array de {id, nome, valor}
    dataAgendamento: '',
    horario: '',
    observacoes: ''
  });
  
  const [pixCopiado, setPixCopiado] = useState(false);
  const TAXA_PERCENTUAL = 50; // 50% do valor do serviço
  const TOLERANCIA_MINUTOS = 15;
  const CHAVE_PIX = '71981183766';
  const WHATSAPP_COMPROVANTE = '5571981183766';
  const STORAGE_DADOS_CLIENTE = 'agendamentoPublicoDadosCliente';
  const DADOS_BANCARIOS = {
    nome: 'Victor Britto fontes Melo de Jesus',
    banco: 'Banco de Brasília'
  };

  // Calcular valor total dos serviços selecionados
  const getValorTotalServicos = () => {
    return formData.servicosSelecionados.reduce((total, s) => total + (s.valor || 0), 0);
  };

  // Calcular taxa baseada nos serviços selecionados
  const getValorTaxa = () => {
    const valorTotal = getValorTotalServicos();
    if (valorTotal > 0) {
      return (valorTotal * TAXA_PERCENTUAL) / 100;
    }
    return 0;
  };

  useEffect(() => {
    fetchConfig();
    fetchServicos();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const dadosSalvos = localStorage.getItem(STORAGE_DADOS_CLIENTE);
      if (!dadosSalvos) return;
      const dadosCliente = JSON.parse(dadosSalvos);
      if (!dadosCliente || typeof dadosCliente !== 'object') return;
      setFormData(prev => ({
        ...prev,
        nomeCliente: dadosCliente.nomeCliente || prev.nomeCliente,
        telefone: dadosCliente.telefone || prev.telefone,
        email: dadosCliente.email || prev.email
      }));
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    }
  }, []);

  useEffect(() => {
    if (formData.dataAgendamento && formData.servicosSelecionados.length > 0) {
      fetchHorarios(formData.dataAgendamento);
    }
  }, [formData.dataAgendamento, formData.servicosSelecionados]);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/agendamentos/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  const fetchServicos = async () => {
    try {
      const response = await fetch('/api/agendamentos/servicos-publicos');
      const data = await response.json();
      setServicos(data);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHorarios = async (data, servicoId = null) => {
    try {
      const servicoSelecionadoId = servicoId || formData.servicosSelecionados[0]?.id || null;
      let url = `/api/agendamentos/horarios?data=${data}`;
      if (servicoSelecionadoId) {
        url += `&servicoId=${servicoSelecionadoId}`;
      }
      const response = await fetch(url);
      const horarios = await response.json();
      setHorariosDisponiveis(horarios);
      // Limpar horário selecionado se não estiver mais disponível
      const horariosValidos = horarios.map(h => h.horario || h);
      if (!horariosValidos.includes(formData.horario)) {
        setFormData(prev => ({ ...prev, horario: '' }));
      }
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Se selecionou uma data, buscar horários com os serviços atuais
    if (name === 'dataAgendamento' && value && formData.servicosSelecionados.length > 0) {
      fetchHorarios(value);
    }
  };

  // Função para toggle de serviço (adicionar/remover)
  const toggleServico = (servico) => {
    setFormData(prev => {
      const jaExiste = prev.servicosSelecionados.find(s => s.id === servico.id);
      let novosServicos;
      if (jaExiste) {
        novosServicos = prev.servicosSelecionados.filter(s => s.id !== servico.id);
      } else {
        novosServicos = [...prev.servicosSelecionados, { id: servico.id, nome: servico.nome, valor: servico.valor || 0 }];
      }
      return { ...prev, servicosSelecionados: novosServicos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Preparar dados para envio - converter serviços selecionados para formato da API
      const dadosEnvio = {
        ...formData,
        servicoId: formData.servicosSelecionados[0]?.id || null,
        servicoNome: formData.servicosSelecionados.map(s => s.nome).join(', '),
        servicosSelecionados: formData.servicosSelecionados,
        valorTotal: getValorTotalServicos()
      };

      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEnvio)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar agendamento');
      }

      if (typeof window !== 'undefined') {
        try {
          const dadosCliente = {
            nomeCliente: formData.nomeCliente,
            telefone: formData.telefone,
            email: formData.email
          };
          localStorage.setItem(STORAGE_DADOS_CLIENTE, JSON.stringify(dadosCliente));
        } catch (error) {
          console.error('Erro ao salvar dados do cliente:', error);
        }
      }

      setAgendamentoCriado(data);
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = (e) => {
    if (e) e.preventDefault();
    if (step < 4) setStep(step + 1);
  };

  const prevStep = (e) => {
    if (e) e.preventDefault();
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.nomeCliente && formData.telefone;
      case 2:
        return formData.tipoVeiculo && formData.marcaVeiculo && formData.modeloVeiculo;
      case 3:
        return formData.servicosSelecionados.length > 0 && formData.dataAgendamento && formData.horario;
      default:
        return true;
    }
  };

  // Formatar data mínima (hoje)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Formatar data máxima (30 dias)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-supreme-black flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(220,38,38,0.15)_0%,_transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(220,38,38,0.1)_0%,_transparent_50%)]" />
        </div>
        <div className="text-white text-xl relative z-10">Carregando...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-supreme-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(34,197,94,0.15)_0%,_transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.1)_0%,_transparent_50%)]" />
        </div>
        {/* Decorative shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        
        <div className="bg-supreme-dark-card border border-supreme-light-gray rounded-2xl shadow-2xl p-8 max-w-lg w-full relative z-10 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
              <Check className="text-white" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Agendamento Realizado!</h2>
            <p className="text-gray-400">
              Seu agendamento foi registrado. Envie o comprovante para confirmar.
            </p>
          </div>

          <div className="bg-supreme-gray rounded-lg p-4 text-left mb-6 border border-supreme-light-gray">
            <p className="text-sm text-gray-300"><strong className="text-gray-400">Data:</strong> {formatarData(agendamentoCriado?.dataAgendamento)}</p>
            <p className="text-sm text-gray-300"><strong className="text-gray-400">Horário:</strong> {agendamentoCriado?.horario}</p>
            <p className="text-sm text-gray-300"><strong className="text-gray-400">Serviço:</strong> {agendamentoCriado?.servicoNome}</p>
            <p className="text-sm text-gray-300"><strong className="text-gray-400">Veículo:</strong> {agendamentoCriado?.marcaVeiculo} {agendamentoCriado?.modeloVeiculo}</p>
          </div>

          {/* Taxa de Agendamento */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={20} className="text-yellow-400" />
              <span className="text-yellow-400 font-bold">Taxa de Agendamento ({TAXA_PERCENTUAL}%): R$ {getValorTaxa().toFixed(2).replace('.', ',')}</span>
            </div>
            
            <div className="bg-supreme-dark rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400">Chave PIX (Telefone)</p>
              <div className="flex items-center justify-between">
                <p className="text-white font-mono font-bold">{CHAVE_PIX}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(CHAVE_PIX);
                    setPixCopiado(true);
                    setTimeout(() => setPixCopiado(false), 2000);
                  }}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  {pixCopiado ? <Check size={12} /> : <Copy size={12} />}
                  {pixCopiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{DADOS_BANCARIOS.nome} - {DADOS_BANCARIOS.banco}</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded p-2 mb-3">
              <p className="text-red-300 text-xs flex items-start gap-1">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Em caso de não comparecimento, o valor NÃO será devolvido. Tolerância: {TOLERANCIA_MINUTOS} minutos.</span>
              </p>
            </div>
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_COMPROVANTE}?text=Olá! Segue o comprovante de pagamento da taxa de agendamento.%0A%0ANome: ${encodeURIComponent(agendamentoCriado?.nomeCliente || '')}%0AData: ${formatarData(agendamentoCriado?.dataAgendamento)}%0AHorário: ${agendamentoCriado?.horario}%0AServiço: ${encodeURIComponent(agendamentoCriado?.servicoNome || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <MessageCircle size={20} />
            Enviar Comprovante no WhatsApp
          </a>
          
          <p className="text-center text-gray-500 text-xs mt-4">
            Seu agendamento será confirmado após o recebimento do comprovante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-supreme-black py-8 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(220,38,38,0.15)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(220,38,38,0.1)_0%,_transparent_50%)]" />
        
        {/* Decorative blurred shapes */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Shine effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      </div>

      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-8 relative z-10">
        {config?.logoEmpresa && (
          <img 
            src={config.logoEmpresa} 
            alt={config.nomeEmpresa} 
            className="h-20 mx-auto mb-4 drop-shadow-lg"
          />
        )}
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
          {config?.nomeEmpresa || 'Supreme Detalhamento'}
        </h1>
        <p className="text-gray-400">Agende seu serviço online</p>
        
        {/* Info da empresa */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-400">
          {config?.telefoneEmpresa && (
            <span className="flex items-center gap-1">
              <Phone className="text-red-500" size={14} /> {config.telefoneEmpresa}
            </span>
          )}
          {config?.enderecoEmpresa && (
            <span className="flex items-center gap-1">
              <MapPin className="text-red-500" size={14} /> {config.enderecoEmpresa}
            </span>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto mb-8 relative z-10">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-red-600 text-white' : 'bg-supreme-gray text-gray-500 border border-supreme-light-gray'
              }`}>
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 4 && (
                <div className={`w-16 sm:w-24 h-1 ${step > s ? 'bg-red-600' : 'bg-supreme-light-gray'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Seus Dados</span>
          <span>Veículo</span>
          <span>Serviço</span>
          <span>Confirmar</span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto relative z-10">
        <form onSubmit={handleSubmit} className="bg-supreme-dark-card/80 backdrop-blur-sm border border-supreme-light-gray/50 rounded-2xl shadow-2xl shadow-red-500/5 p-6 sm:p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="text-red-500" size={24} /> Seus Dados
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nomeCliente"
                  value={formData.nomeCliente}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Seu nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Telefone/WhatsApp *
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
          )}

          {/* Step 2: Veículo */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Car className="text-red-500" size={24} /> Dados do Veículo
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tipo de Veículo *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoVeiculo: 'carro' }))}
                    className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      formData.tipoVeiculo === 'carro' 
                        ? 'border-red-500 bg-red-500/10 text-red-400' 
                        : 'border-supreme-light-gray bg-supreme-gray text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Car size={32} />
                    <span className="font-medium">Carro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoVeiculo: 'moto' }))}
                    className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      formData.tipoVeiculo === 'moto' 
                        ? 'border-red-500 bg-red-500/10 text-red-400' 
                        : 'border-supreme-light-gray bg-supreme-gray text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <Bike size={32} />
                    <span className="font-medium">Moto</span>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    name="marcaVeiculo"
                    value={formData.marcaVeiculo}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Ex: Honda, Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    name="modeloVeiculo"
                    value={formData.modeloVeiculo}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Ex: Civic, Corolla"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Placa (opcional)
                  </label>
                  <input
                    type="text"
                    name="placaVeiculo"
                    value={formData.placaVeiculo}
                    onChange={handleChange}
                    className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Cor (opcional)
                  </label>
                  <input
                    type="text"
                    name="corVeiculo"
                    value={formData.corVeiculo}
                    onChange={handleChange}
                    className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Ex: Preto, Branco"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Serviço e Data */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarDays className="text-red-500" size={24} /> Serviço e Data
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Selecione os Serviços * <span className="text-xs text-gray-500">(você pode selecionar mais de um)</span>
                </label>
                <div className="grid gap-3">
                  {servicos.map((servico) => {
                    const selecionado = formData.servicosSelecionados.find(s => s.id === servico.id);
                    return (
                      <div
                        key={servico.id}
                        onClick={() => toggleServico(servico)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selecionado
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-supreme-light-gray bg-supreme-gray hover:border-gray-500'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selecionado ? 'bg-red-500 border-red-500' : 'border-gray-500'
                            }`}>
                              {selecionado && <Check size={14} className="text-white" />}
                            </div>
                            <div>
                              <p className="font-medium text-white">{servico.nome}</p>
                              {servico.descricao && (
                                <p className="text-sm text-gray-400">{servico.descricao}</p>
                              )}
                            </div>
                          </div>
                          {servico.valor > 0 && (
                            <span className="font-bold text-green-400">
                              R$ {servico.valor.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {formData.servicosSelecionados.length > 0 && (
                  <div className="mt-3 p-3 bg-supreme-dark rounded-lg border border-supreme-light-gray">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        {formData.servicosSelecionados.length} serviço(s) selecionado(s)
                      </span>
                      <span className="font-bold text-green-400">
                        Total: R$ {getValorTotalServicos().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Data do Agendamento *
                </label>
                <input
                  type="date"
                  name="dataAgendamento"
                  value={formData.dataAgendamento}
                  onChange={handleChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  required
                  disabled={formData.servicosSelecionados.length === 0}
                  className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {formData.servicosSelecionados.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Selecione pelo menos um serviço primeiro</p>
                )}
              </div>
              
              {formData.dataAgendamento && formData.servicosSelecionados.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Horário Disponível * 
                    <span className="text-xs text-gray-500 ml-2">
                      (máx. 2 veículos por horário)
                    </span>
                  </label>
                  {horariosDisponiveis.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {horariosDisponiveis.map((item) => {
                        const horario = item.horario || item;
                        const vagasRestantes = item.vagasRestantes || 0;
                        return (
                          <button
                            key={horario}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, horario: horario }))}
                            className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                              formData.horario === horario
                                ? 'border-red-500 bg-red-600 text-white'
                                : 'border-supreme-light-gray bg-supreme-gray text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {horario}
                              </span>
                              <span className={`text-xs ${formData.horario === horario ? 'text-red-200' : 'text-gray-500'}`}>
                                {vagasRestantes === 1 ? '1 vaga' : `${vagasRestantes} vagas`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum horário disponível para esta data.
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 bg-supreme-gray border border-supreme-light-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Alguma informação adicional..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmação */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Check className="text-red-500" size={24} /> Confirme seus Dados
              </h2>
              
              <div className="bg-supreme-gray rounded-lg p-4 space-y-3 border border-supreme-light-gray">
                <div className="border-b border-supreme-light-gray pb-3">
                  <h3 className="font-semibold text-white mb-2">Dados Pessoais</h3>
                  <p className="text-gray-300"><strong className="text-gray-400">Nome:</strong> {formData.nomeCliente}</p>
                  <p className="text-gray-300"><strong className="text-gray-400">Telefone:</strong> {formData.telefone}</p>
                  {formData.email && <p className="text-gray-300"><strong className="text-gray-400">E-mail:</strong> {formData.email}</p>}
                </div>
                
                <div className="border-b border-supreme-light-gray pb-3">
                  <h3 className="font-semibold text-white mb-2">Veículo</h3>
                  <p className="text-gray-300"><strong className="text-gray-400">Tipo:</strong> {formData.tipoVeiculo === 'carro' ? 'Carro' : 'Moto'}</p>
                  <p className="text-gray-300"><strong className="text-gray-400">Marca/Modelo:</strong> {formData.marcaVeiculo} {formData.modeloVeiculo}</p>
                  {formData.placaVeiculo && <p className="text-gray-300"><strong className="text-gray-400">Placa:</strong> {formData.placaVeiculo}</p>}
                  {formData.corVeiculo && <p className="text-gray-300"><strong className="text-gray-400">Cor:</strong> {formData.corVeiculo}</p>}
                </div>
                
                <div>
                  <h3 className="font-semibold text-white mb-2">Agendamento</h3>
                  <div className="text-gray-300">
                    <strong className="text-gray-400">Serviço(s):</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {formData.servicosSelecionados.map(s => (
                        <li key={s.id}>{s.nome} - R$ {s.valor.toFixed(2)}</li>
                      ))}
                    </ul>
                    <p className="mt-1 text-green-400 font-bold">Total: R$ {getValorTotalServicos().toFixed(2)}</p>
                  </div>
                  <p className="text-gray-300 mt-2">
                    <strong className="text-gray-400">Data:</strong> {new Date(formData.dataAgendamento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-gray-300"><strong className="text-gray-400">Horário:</strong> {formData.horario}</p>
                  {formData.observacoes && <p className="text-gray-300"><strong className="text-gray-400">Obs:</strong> {formData.observacoes}</p>}
                </div>
              </div>

              {/* Taxa de Agendamento */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <CreditCard size={24} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Taxa de Agendamento ({TAXA_PERCENTUAL}%)</h3>
                    <p className="text-yellow-400 font-bold text-2xl">R$ {getValorTaxa().toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>

                {/* Aviso importante */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-red-300 text-sm">
                      <p className="mb-1"><strong>ATENÇÃO:</strong> Em caso de não comparecimento, o valor da taxa <strong>NÃO será devolvido</strong>.</p>
                      <p><strong>⏱️ Tolerância:</strong> {TOLERANCIA_MINUTOS} minutos de atraso.</p>
                    </div>
                  </div>
                </div>

                {/* Dados do PIX */}
                <div className="bg-supreme-dark rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-green-400">PIX</span> - Dados para pagamento
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-supreme-gray rounded-lg p-3">
                      <div>
                        <p className="text-xs text-gray-400">Chave PIX (Telefone)</p>
                        <p className="text-white font-mono font-bold">{CHAVE_PIX}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(CHAVE_PIX);
                          setPixCopiado(true);
                          setTimeout(() => setPixCopiado(false), 2000);
                        }}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                      >
                        {pixCopiado ? <Check size={16} /> : <Copy size={16} />}
                        {pixCopiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>

                    <div className="bg-supreme-gray rounded-lg p-3">
                      <p className="text-xs text-gray-400">Favorecido</p>
                      <p className="text-white font-medium">{DADOS_BANCARIOS.nome}</p>
                      <p className="text-gray-400 text-sm">{DADOS_BANCARIOS.banco}</p>
                    </div>
                  </div>
                </div>

                {/* Instrução para enviar comprovante */}
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-sm mb-3">
                    <strong>📲 Após o pagamento:</strong> Envie o comprovante via WhatsApp para confirmar seu agendamento.
                  </p>
                  <a
                    href={`https://wa.me/${WHATSAPP_COMPROVANTE}?text=Olá! Segue o comprovante de pagamento da taxa de agendamento.%0A%0ANome: ${encodeURIComponent(formData.nomeCliente)}%0AData: ${formData.dataAgendamento ? new Date(formData.dataAgendamento + 'T12:00:00').toLocaleDateString('pt-BR') : ''}%0AHorário: ${formData.horario}%0AServiço: ${encodeURIComponent(formData.servicoNome)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <MessageCircle size={18} />
                    Enviar Comprovante no WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={(e) => prevStep(e)}
                className="px-6 py-3 border border-supreme-light-gray rounded-lg text-gray-300 hover:bg-supreme-gray transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={(e) => nextStep(e)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Agendando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Após o agendamento, você receberá uma confirmação.</p>
          <p>Dúvidas? Entre em contato conosco.</p>
        </div>
      </div>
    </div>
  );
}
