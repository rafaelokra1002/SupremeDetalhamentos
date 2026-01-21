import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
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
    
    // Verificar se o horário está disponível (máximo 2 carros por horário)
    const dataAgend = new Date(dataAgendamento);
    const dataInicio = new Date(dataAgend);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataAgend);
    dataFim.setHours(23, 59, 59, 999);
    
    // Buscar configuração para obter o máximo de vagas
    const config = await prisma.configuracaoAgendamento.findFirst();
    const maxVagas = config?.maxVagasPorHorario || 2;
    
    const agendamentosNoHorario = await prisma.agendamento.count({
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
    
    // Verificar máximo de vagas por horário
    if (agendamentosNoHorario >= maxVagas) {
      return NextResponse.json(
        { error: 'Este horário já está lotado. Por favor, escolha outro horário.' },
        { status: 400 }
      );
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
