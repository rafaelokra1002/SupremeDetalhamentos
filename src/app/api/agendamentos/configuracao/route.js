import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Buscar configuração de agendamento
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let config = await prisma.configuracaoAgendamento.findFirst();

    // Se não existir configuração, criar uma padrão
    if (!config) {
      // Buscar serviços que contêm "lavagem" para definir como padrão
      const servicosLavagem = await prisma.servico.findMany({
        where: {
          active: true,
          nome: { contains: 'lavagem', mode: 'insensitive' }
        },
        select: { id: true }
      });

      config = await prisma.configuracaoAgendamento.create({
        data: {
          servicosDisponiveis: JSON.stringify(servicosLavagem.map(s => s.id)),
          horariosDisponiveis: JSON.stringify(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']),
          maxVagasPorHorario: 2,
          diasSemanaAtivos: JSON.stringify([1, 2, 3, 4, 5, 6]), // Seg a Sáb
          mensagemConfirmacao: 'Seu agendamento foi realizado com sucesso! Aguarde a confirmação.'
        }
      });
    }

    // Buscar todos os serviços ativos para exibir na configuração
    const todosServicos = await prisma.servico.findMany({
      where: { active: true },
      select: {
        id: true,
        nome: true,
        valor: true,
        descricao: true
      },
      orderBy: { nome: 'asc' }
    });

    const servicosDisponiveis = JSON.parse(config.servicosDisponiveis || '[]');
    const horariosDisponiveis = JSON.parse(config.horariosDisponiveis || '[]');
    const regrasPorServicoRaw = config.regrasPorServico
      ? JSON.parse(config.regrasPorServico)
      : [];
    const regrasMap = new Map(regrasPorServicoRaw.map(regra => [regra.servicoId, regra]));

    const servicosParaRegras = new Set(servicosDisponiveis);
    if (config.servicoLavagemTecnicaId) {
      servicosParaRegras.add(config.servicoLavagemTecnicaId);
    }

    const regrasPorServico = [];
    servicosParaRegras.forEach((servicoId) => {
      const regra = regrasMap.get(servicoId);
      const horariosLavagemTecnica = JSON.parse(config.horariosLavagemTecnica || '[]');

      regrasPorServico.push({
        servicoId,
        maxVagas: regra?.maxVagas ?? (servicoId === config.servicoLavagemTecnicaId
          ? (config.maxVagasLavagemTecnica || 1)
          : (config.maxVagasPorHorario || 2)),
        horarios: Array.isArray(regra?.horarios)
          ? regra.horarios
          : (servicoId === config.servicoLavagemTecnicaId && horariosLavagemTecnica.length > 0
            ? horariosLavagemTecnica
            : horariosDisponiveis)
      });
    });

    regrasPorServicoRaw
      .filter(regra => !servicosParaRegras.has(regra.servicoId))
      .forEach(regra => regrasPorServico.push(regra));

    return NextResponse.json({
      config: {
        ...config,
        servicosDisponiveis,
        horariosDisponiveis,
        regrasPorServico,
        diasSemanaAtivos: JSON.parse(config.diasSemanaAtivos || '[1,2,3,4,5,6]'),
        horariosLavagemTecnica: JSON.parse(config.horariosLavagemTecnica || '[]'),
        servicoLavagemTecnicaId: config.servicoLavagemTecnicaId || '',
        maxVagasLavagemTecnica: config.maxVagasLavagemTecnica || 1
      },
      todosServicos
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 });
  }
}

// PUT - Atualizar configuração de agendamento
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      servicosDisponiveis,
      horariosDisponiveis,
      maxVagasPorHorario,
      regrasPorServico,
      diasSemanaAtivos,
      mensagemConfirmacao,
      servicoLavagemTecnicaId,
      horariosLavagemTecnica,
      maxVagasLavagemTecnica
    } = body;

    let config = await prisma.configuracaoAgendamento.findFirst();

    if (config) {
      config = await prisma.configuracaoAgendamento.update({
        where: { id: config.id },
        data: {
          servicosDisponiveis: JSON.stringify(servicosDisponiveis || []),
          horariosDisponiveis: JSON.stringify(horariosDisponiveis || []),
          maxVagasPorHorario: maxVagasPorHorario || 2,
          regrasPorServico: JSON.stringify(regrasPorServico || []),
          diasSemanaAtivos: JSON.stringify(diasSemanaAtivos || [1, 2, 3, 4, 5, 6]),
          mensagemConfirmacao: mensagemConfirmacao || '',
          servicoLavagemTecnicaId: servicoLavagemTecnicaId || null,
          horariosLavagemTecnica: JSON.stringify(horariosLavagemTecnica || []),
          maxVagasLavagemTecnica: maxVagasLavagemTecnica || 1
        }
      });
    } else {
      config = await prisma.configuracaoAgendamento.create({
        data: {
          servicosDisponiveis: JSON.stringify(servicosDisponiveis || []),
          horariosDisponiveis: JSON.stringify(horariosDisponiveis || []),
          maxVagasPorHorario: maxVagasPorHorario || 2,
          regrasPorServico: JSON.stringify(regrasPorServico || []),
          diasSemanaAtivos: JSON.stringify(diasSemanaAtivos || [1, 2, 3, 4, 5, 6]),
          mensagemConfirmacao: mensagemConfirmacao || '',
          servicoLavagemTecnicaId: servicoLavagemTecnicaId || null,
          horariosLavagemTecnica: JSON.stringify(horariosLavagemTecnica || []),
          maxVagasLavagemTecnica: maxVagasLavagemTecnica || 1
        }
      });
    }

    return NextResponse.json({
      ...config,
      servicosDisponiveis: JSON.parse(config.servicosDisponiveis),
      horariosDisponiveis: JSON.parse(config.horariosDisponiveis),
      diasSemanaAtivos: JSON.parse(config.diasSemanaAtivos),
      horariosLavagemTecnica: JSON.parse(config.horariosLavagemTecnica || '[]'),
      servicoLavagemTecnicaId: config.servicoLavagemTecnicaId || '',
      maxVagasLavagemTecnica: config.maxVagasLavagemTecnica || 1
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 });
  }
}
