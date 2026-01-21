import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Buscar horários disponíveis para uma data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    
    if (!data) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }
    
    const dataAgend = new Date(data);
    const diaSemana = dataAgend.getDay();
    
    // Buscar configuração de agendamento
    const config = await prisma.configuracaoAgendamento.findFirst();
    
    // Dias da semana ativos (padrão: Seg a Sáb)
    const diasAtivos = config?.diasSemanaAtivos 
      ? JSON.parse(config.diasSemanaAtivos) 
      : [1, 2, 3, 4, 5, 6];
    
    // Verificar se o dia da semana está ativo
    if (!diasAtivos.includes(diaSemana)) {
      return NextResponse.json([]);
    }
    
    // Horários disponíveis da configuração
    const horariosBase = config?.horariosDisponiveis 
      ? JSON.parse(config.horariosDisponiveis) 
      : ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
    
    // Máximo de vagas por horário
    const maxVagas = config?.maxVagasPorHorario || 2;
    
    // Verificar bloqueios para esta data
    const dataInicio = new Date(dataAgend);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataAgend);
    dataFim.setHours(23, 59, 59, 999);
    
    const bloqueio = await prisma.bloqueioAgenda.findFirst({
      where: {
        data: {
          gte: dataInicio,
          lte: dataFim
        }
      }
    });
    
    if (bloqueio?.diaInteiro) {
      return NextResponse.json([]);
    }
    
    let horariosBloqueados = [];
    if (bloqueio?.horarios) {
      horariosBloqueados = JSON.parse(bloqueio.horarios);
    }
    
    // Buscar agendamentos existentes para esta data
    // Conta quantos agendamentos existem por horário
    const agendamentosExistentes = await prisma.agendamento.findMany({
      where: {
        dataAgendamento: {
          gte: dataInicio,
          lte: dataFim
        },
        status: {
          in: ['pendente', 'confirmado']
        }
      },
      select: { horario: true }
    });
    
    // Contar agendamentos por horário
    const contagemPorHorario = {};
    agendamentosExistentes.forEach(a => {
      contagemPorHorario[a.horario] = (contagemPorHorario[a.horario] || 0) + 1;
    });
    
    // Filtrar horários disponíveis (que não estão bloqueados e têm vagas)
    const horariosDisponiveis = horariosBase
      .filter(h => !horariosBloqueados.includes(h))
      .filter(h => (contagemPorHorario[h] || 0) < maxVagas)
      .map(h => ({
        horario: h,
        vagasRestantes: maxVagas - (contagemPorHorario[h] || 0)
      }));
    
    return NextResponse.json(horariosDisponiveis);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários disponíveis' },
      { status: 500 }
    );
  }
}
