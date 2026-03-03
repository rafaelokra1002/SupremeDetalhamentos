import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const parseDateOnly = (dateStr) => {
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [ano, mes, dia] = dateStr.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
  return new Date(dateStr);
};

// GET - Listar agendamentos (requer autenticação - admin)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const data = searchParams.get('data');
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (data) {
      const dataInicio = parseDateOnly(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = parseDateOnly(data);
      dataFim.setHours(23, 59, 59, 999);
      
      where.dataAgendamento = {
        gte: dataInicio,
        lte: dataFim
      };
    }
    
    const agendamentos = await prisma.agendamento.findMany({
      where,
      include: {
        servico: true
      },
      orderBy: [
        { dataAgendamento: 'asc' },
        { horario: 'asc' }
      ]
    });
    
    return NextResponse.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    );
  }
}

// POST - Criar novo agendamento (público - cliente)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nomeCliente,
      telefone,
      email,
      tipoVeiculo,
      marcaVeiculo,
      modeloVeiculo,
      placaVeiculo,
      corVeiculo,
      servicoId,
      servicoNome,
      dataAgendamento,
      horario,
      observacoes
    } = body;
    
    // Validações básicas
    if (!nomeCliente || !telefone || !tipoVeiculo || !marcaVeiculo || !modeloVeiculo || !servicoNome || !dataAgendamento || !horario) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios' },
        { status: 400 }
      );
    }
    
    // Parse da data selecionada (formato YYYY-MM-DD) - consistente com a API de horários
    let dataInicio, dataFim;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataAgendamento)) {
      const [ano, mes, dia] = dataAgendamento.split('-').map(Number);
      dataInicio = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
      dataFim = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    } else {
      const dataAgend = new Date(dataAgendamento);
      dataInicio = new Date(dataAgend);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date(dataAgend);
      dataFim.setHours(23, 59, 59, 999);
    }
    
    // Buscar configuração para obter o máximo de vagas
    const config = await prisma.configuracaoAgendamento.findFirst();

    // Limite global de vagas por horário (independente do serviço)
    const maxVagasGlobal = config?.maxVagasPorHorario || 2;

    // Verificar se o serviço selecionado é Lavagem Técnica (compatibilidade)
    const ehLavagemTecnica = servicoId && config?.servicoLavagemTecnicaId === servicoId;

    // Regras por serviço
    const regrasPorServico = config?.regrasPorServico
      ? JSON.parse(config.regrasPorServico)
      : [];
    const regraServico = servicoId
      ? regrasPorServico.find(regra => regra.servicoId === servicoId)
      : null;

    // Usar limite específico por serviço (ou compatibilidade)
    const maxVagasRegra = regraServico?.maxVagas;
    const maxVagasServico = Number.isFinite(Number(maxVagasRegra))
      ? Number(maxVagasRegra)
      : (ehLavagemTecnica ? (config?.maxVagasLavagemTecnica || 1) : maxVagasGlobal);
    
    // ========== VERIFICAÇÃO 1: Limite GLOBAL por horário ==========
    // Conta TODOS os agendamentos no horário, independente do serviço
    const totalAgendamentosNoHorario = await prisma.agendamento.count({
      where: {
        dataAgendamento: {
          gte: dataInicio,
          lte: dataFim
        },
        horario,
        status: {
          in: ['pendente', 'confirmado']
        }
      }
    });
    
    // Verificar limite global primeiro
    if (totalAgendamentosNoHorario >= maxVagasGlobal) {
      return NextResponse.json(
        { error: 'Este horário já está lotado. Por favor, escolha outro horário.' },
        { status: 400 }
      );
    }
    
    // ========== VERIFICAÇÃO 2: Limite por SERVIÇO específico ==========
    // Se tem servicoId, também verifica o limite específico do serviço
    if (servicoId) {
      const agendamentosDoServicoNoHorario = await prisma.agendamento.count({
        where: {
          dataAgendamento: {
            gte: dataInicio,
            lte: dataFim
          },
          horario,
          servicoId,
          status: {
            in: ['pendente', 'confirmado']
          }
        }
      });
      
      if (agendamentosDoServicoNoHorario >= maxVagasServico) {
        return NextResponse.json(
          { error: 'Este horário já está lotado para este serviço. Por favor, escolha outro horário.' },
          { status: 400 }
        );
      }
    }
    
    // Verificar bloqueio de agenda
    const bloqueio = await prisma.bloqueioAgenda.findFirst({
      where: {
        data: {
          gte: dataInicio,
          lte: dataFim
        }
      }
    });
    
    if (bloqueio) {
      if (bloqueio.diaInteiro) {
        return NextResponse.json(
          { error: 'Este dia não está disponível para agendamentos.' },
          { status: 400 }
        );
      }
      // Verificar se o horário específico está bloqueado
      if (bloqueio.horarios) {
        const horariosBloqueados = JSON.parse(bloqueio.horarios);
        if (horariosBloqueados.includes(horario)) {
          return NextResponse.json(
            { error: 'Este horário não está disponível.' },
            { status: 400 }
          );
        }
      }
    }
    

    // Garantir data local correta (ano, mês, dia)
    let dataAgendamentoObj;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataAgendamento)) {
      const [ano, mes, dia] = dataAgendamento.split('-');
      dataAgendamentoObj = new Date(Number(ano), Number(mes) - 1, Number(dia), 12, 0, 0, 0); // meio-dia local
    } else {
      dataAgendamentoObj = new Date(dataAgendamento);
      dataAgendamentoObj.setHours(12, 0, 0, 0);
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        nomeCliente,
        telefone,
        email,
        tipoVeiculo,
        marcaVeiculo,
        modeloVeiculo,
        placaVeiculo,
        corVeiculo,
        servicoId,
        servicoNome,
        dataAgendamento: dataAgendamentoObj,
        horario,
        observacoes,
        status: 'pendente'
      }
    });
    
    return NextResponse.json(agendamento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar agendamento' },
      { status: 500 }
    );
  }
}
