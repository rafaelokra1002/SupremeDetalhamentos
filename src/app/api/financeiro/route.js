import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const now = new Date();
    
    // Início do dia
    const inicioDia = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Início da semana (domingo)
    const inicioSemana = new Date(now);
    inicioSemana.setDate(now.getDate() - now.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    
    // Início do mês
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Início do ano
    const inicioAno = new Date(now.getFullYear(), 0, 1);

    // Faturamento diário (contas recebidas hoje)
    const faturamentoDiario = await prisma.contaReceber.aggregate({
      where: {
        status: 'recebido',
        dataRecebido: {
          gte: inicioDia,
        },
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Faturamento semanal
    const faturamentoSemanal = await prisma.contaReceber.aggregate({
      where: {
        status: 'recebido',
        dataRecebido: {
          gte: inicioSemana,
        },
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Faturamento mensal
    const faturamentoMensal = await prisma.contaReceber.aggregate({
      where: {
        status: 'recebido',
        dataRecebido: {
          gte: inicioMes,
        },
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Faturamento anual
    const faturamentoAnual = await prisma.contaReceber.aggregate({
      where: {
        status: 'recebido',
        dataRecebido: {
          gte: inicioAno,
        },
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Pendente a receber
    const pendenteReceber = await prisma.contaReceber.aggregate({
      where: {
        status: 'pendente',
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Pendente a pagar
    const pendentePagar = await prisma.contaPagar.aggregate({
      where: {
        status: 'pendente',
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Despesas do mês (contas pagas)
    const despesasMensal = await prisma.contaPagar.aggregate({
      where: {
        status: 'pago',
        dataPago: {
          gte: inicioMes,
        },
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Faturamento por dia da semana atual
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + i);
      const proximoDia = new Date(data);
      proximoDia.setDate(data.getDate() + 1);

      const faturamento = await prisma.contaReceber.aggregate({
        where: {
          status: 'recebido',
          dataRecebido: {
            gte: data,
            lt: proximoDia,
          },
        },
        _sum: {
          valor: true,
        },
      });

      const nomeDia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i];
      diasSemana.push({
        dia: nomeDia,
        valor: faturamento._sum.valor || 0,
      });
    }

    // Faturamento por mês do ano
    const mesesAno = [];
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 0; i <= now.getMonth(); i++) {
      const inicioMesLoop = new Date(now.getFullYear(), i, 1);
      const fimMesLoop = new Date(now.getFullYear(), i + 1, 1);

      const faturamento = await prisma.contaReceber.aggregate({
        where: {
          status: 'recebido',
          dataRecebido: {
            gte: inicioMesLoop,
            lt: fimMesLoop,
          },
        },
        _sum: {
          valor: true,
        },
      });

      mesesAno.push({
        mes: nomesMeses[i],
        valor: faturamento._sum.valor || 0,
      });
    }

    // Últimas transações recebidas
    const ultimasReceitas = await prisma.contaReceber.findMany({
      where: {
        status: 'recebido',
      },
      orderBy: {
        dataRecebido: 'desc',
      },
      take: 10,
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        ordemServico: {
          select: {
            id: true,
          },
        },
      },
    });

    // Ordens finalizadas no mês
    const ordensFinalizadasMes = await prisma.ordemServico.count({
      where: {
        status: 'entregue',
        dataSaida: {
          gte: inicioMes,
        },
      },
    });

    // Ticket médio do mês
    const ticketMedio = faturamentoMensal._count > 0 
      ? (faturamentoMensal._sum.valor || 0) / faturamentoMensal._count 
      : 0;

    return NextResponse.json({
      faturamento: {
        diario: {
          valor: faturamentoDiario._sum.valor || 0,
          quantidade: faturamentoDiario._count,
        },
        semanal: {
          valor: faturamentoSemanal._sum.valor || 0,
          quantidade: faturamentoSemanal._count,
        },
        mensal: {
          valor: faturamentoMensal._sum.valor || 0,
          quantidade: faturamentoMensal._count,
        },
        anual: {
          valor: faturamentoAnual._sum.valor || 0,
          quantidade: faturamentoAnual._count,
        },
      },
      pendentes: {
        receber: {
          valor: pendenteReceber._sum.valor || 0,
          quantidade: pendenteReceber._count,
        },
        pagar: {
          valor: pendentePagar._sum.valor || 0,
          quantidade: pendentePagar._count,
        },
      },
      despesas: {
        mensal: {
          valor: despesasMensal._sum.valor || 0,
          quantidade: despesasMensal._count,
        },
      },
      graficos: {
        semana: diasSemana,
        ano: mesesAno,
      },
      ultimasReceitas,
      ordensFinalizadasMes,
      ticketMedio,
      lucroMensal: (faturamentoMensal._sum.valor || 0) - (despesasMensal._sum.valor || 0),
    });
  } catch (error) {
    console.error('Erro ao buscar financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
