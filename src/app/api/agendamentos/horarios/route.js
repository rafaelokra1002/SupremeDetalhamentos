import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Buscar horários disponíveis para uma data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    const servicoId = searchParams.get('servicoId');
    const manual = searchParams.get('manual') === 'true'; // Se é agendamento manual (admin)
    
    if (!data) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }
    
    // Parse da data selecionada (formato YYYY-MM-DD)
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataAgend = new Date(ano, mes - 1, dia);
    const diaSemana = dataAgend.getDay();
    
    // Obter data e hora atual em Brasília (UTC-3)
    const agora = new Date();
    // Ajustar para horário de Brasília
    const offsetBrasilia = -3 * 60; // -3 horas em minutos
    const offsetLocal = agora.getTimezoneOffset(); // offset local em minutos (positivo para oeste de UTC)
    const diffMinutos = offsetBrasilia + offsetLocal; // diferença para ajustar
    const agoraBrasilia = new Date(agora.getTime() + diffMinutos * 60 * 1000);
    
    const hojeAno = agoraBrasilia.getFullYear();
    const hojeMes = agoraBrasilia.getMonth();
    const hojeDia = agoraBrasilia.getDate();
    const horaAtual = agoraBrasilia.getHours();
    const minutoAtual = agoraBrasilia.getMinutes();
    
    // Verificar se a data selecionada é hoje
    const ehHoje = (ano === hojeAno && (mes - 1) === hojeMes && dia === hojeDia);
    
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
    
    // Verificar se o serviço selecionado é Lavagem Técnica (compatibilidade)
    const ehLavagemTecnica = servicoId && config?.servicoLavagemTecnicaId === servicoId;

    // Regras por serviço
    const regrasPorServico = config?.regrasPorServico
      ? JSON.parse(config.regrasPorServico)
      : [];
    const regraServico = servicoId
      ? regrasPorServico.find(regra => regra.servicoId === servicoId)
      : null;

    // Horários disponíveis da configuração (ou específicos por serviço)
    const horariosDisponiveisPadrao = config?.horariosDisponiveis 
      ? JSON.parse(config.horariosDisponiveis) 
      : ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
    const horariosLavagemTecnica = config?.horariosLavagemTecnica 
      ? JSON.parse(config.horariosLavagemTecnica) 
      : [];

    let horariosBase = Array.isArray(regraServico?.horarios) && regraServico.horarios.length > 0
      ? regraServico.horarios
      : (ehLavagemTecnica && horariosLavagemTecnica.length > 0)
        ? horariosLavagemTecnica
        : horariosDisponiveisPadrao;

    // Limite global de vagas por horário (independente do serviço)
    const maxVagasGlobal = config?.maxVagasPorHorario || 2;

    // Limite específico por serviço
    const maxVagasRegra = regraServico?.maxVagas;
    const maxVagasServico = Number.isFinite(Number(maxVagasRegra))
      ? Number(maxVagasRegra)
      : (ehLavagemTecnica ? (config?.maxVagasLavagemTecnica || 1) : maxVagasGlobal);
    
    // Se não há horários configurados, retornar vazio
    if (!horariosBase || horariosBase.length === 0) {
      return NextResponse.json([]);
    }
    
    // Verificar bloqueios para esta data - usar data local
    const dataInicio = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    const dataFim = new Date(ano, mes - 1, dia, 23, 59, 59, 999);
    
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
    
    // ========== BUSCAR TODOS OS AGENDAMENTOS (para limite global) ==========
    const todosAgendamentos = await prisma.agendamento.findMany({
      where: {
        dataAgendamento: {
          gte: dataInicio,
          lte: dataFim
        },
        status: {
          in: ['pendente', 'confirmado']
        }
      },
      select: { horario: true, servicoId: true }
    });
    
    // Contar TODOS os agendamentos por horário (limite global)
    const contagemGlobalPorHorario = {};
    todosAgendamentos.forEach(a => {
      contagemGlobalPorHorario[a.horario] = (contagemGlobalPorHorario[a.horario] || 0) + 1;
    });
    
    // Contar agendamentos por horário para o serviço específico
    const contagemServicoPorHorario = {};
    if (servicoId) {
      todosAgendamentos
        .filter(a => a.servicoId === servicoId)
        .forEach(a => {
          contagemServicoPorHorario[a.horario] = (contagemServicoPorHorario[a.horario] || 0) + 1;
        });
    }
    
    // Filtrar horários disponíveis considerando AMBOS os limites
    let horariosDisponiveis = horariosBase
      .filter(h => !horariosBloqueados.includes(h))
      .filter(h => {
        // Verificar limite GLOBAL primeiro
        const totalNoHorario = contagemGlobalPorHorario[h] || 0;
        if (totalNoHorario >= maxVagasGlobal) {
          return false;
        }
        
        // Se tem servicoId, verificar também limite do serviço específico
        if (servicoId) {
          const totalServicoNoHorario = contagemServicoPorHorario[h] || 0;
          if (totalServicoNoHorario >= maxVagasServico) {
            return false;
          }
        }
        
        return true;
      });
    
    // Se for hoje e NÃO for agendamento manual, filtrar horários que já passaram
    if (ehHoje && !manual) {
      horariosDisponiveis = horariosDisponiveis.filter(h => {
        const [hora, minuto] = h.split(':').map(Number);
        // Horário já passou se a hora atual é maior, ou se é a mesma hora mas os minutos já passaram
        if (hora < horaAtual) {
          return false;
        }
        if (hora === horaAtual && minuto <= minutoAtual) {
          return false;
        }
        return true;
      });
    }
    
    // Mapear para formato com vagas restantes (considerando o limite mais restritivo)
    const resultado = horariosDisponiveis.map(h => {
      const vagasGlobais = maxVagasGlobal - (contagemGlobalPorHorario[h] || 0);
      const vagasServico = servicoId 
        ? maxVagasServico - (contagemServicoPorHorario[h] || 0)
        : vagasGlobais;
      
      return {
        horario: h,
        vagasRestantes: Math.min(vagasGlobais, vagasServico)
      };
    });
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar horários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários disponíveis' },
      { status: 500 }
    );
  }
}
