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

    // Usar fuso horário de Brasília (UTC-3)
    const now = new Date();
    const offsetBrasilia = -3 * 60; // -3 horas em minutos
    const offsetLocal = now.getTimezoneOffset(); // offset local em minutos
    const diffMinutos = offsetBrasilia - (-offsetLocal); // diferença para ajustar
    
    // Ajustar para horário de Brasília
    const nowBrasilia = new Date(now.getTime() + diffMinutos * 60 * 1000);
    
    // Início do dia em Brasília (meia-noite)
    const inicioDia = new Date(nowBrasilia);
    inicioDia.setHours(0, 0, 0, 0);
    // Converter de volta para UTC para comparar com o banco
    const inicioDiaUTC = new Date(inicioDia.getTime() - diffMinutos * 60 * 1000);
    
    const fimDia = new Date(nowBrasilia);
    fimDia.setHours(23, 59, 59, 999);
    const fimDiaUTC = new Date(fimDia.getTime() - diffMinutos * 60 * 1000);
    
    // Início da semana (domingo) em Brasília
    const inicioSemana = new Date(nowBrasilia);
    inicioSemana.setDate(nowBrasilia.getDate() - nowBrasilia.getDay());
    inicioSemana.setHours(0, 0, 0, 0);
    const inicioSemanaUTC = new Date(inicioSemana.getTime() - diffMinutos * 60 * 1000);
    
    // Início do mês em Brasília
    const inicioMes = new Date(nowBrasilia.getFullYear(), nowBrasilia.getMonth(), 1, 0, 0, 0, 0);
    const inicioMesUTC = new Date(inicioMes.getTime() - diffMinutos * 60 * 1000);
    
    // Início do ano em Brasília
    const inicioAno = new Date(nowBrasilia.getFullYear(), 0, 1, 0, 0, 0, 0);
    const inicioAnoUTC = new Date(inicioAno.getTime() - diffMinutos * 60 * 1000);

    // ========== BUSCAR TODAS AS ORDENS ENTREGUES ==========
    // Buscar todas as ordens entregues para filtrar por data
    // Usa dataSaida se disponível, senão usa updatedAt
    const ordensEntregues = await prisma.ordemServico.findMany({
      where: {
        status: 'entregue',
      },
      select: {
        id: true,
        valorTotal: true,
        dataSaida: true,
        updatedAt: true,
      },
    });

    // Função auxiliar para obter a data efetiva da ordem
    const getDataEfetiva = (ordem) => {
      const data = ordem.dataSaida || ordem.updatedAt;
      return new Date(data);
    };

    // Filtrar ordens por período - comparando apenas datas (ignorando horários)
    const filtrarPorPeriodo = (ordens, dataInicio, dataFim = null) => {
      return ordens.filter((o) => {
        const dataEfetiva = getDataEfetiva(o);
        
        // Para debug - descomentar se precisar
        // console.log('Ordem:', o.id, 'Data efetiva:', dataEfetiva, 'Inicio:', dataInicio, 'Fim:', dataFim);
        
        if (dataFim) {
          return dataEfetiva >= dataInicio && dataEfetiva <= dataFim;
        }
        return dataEfetiva >= dataInicio;
      });
    };

    // Calcular soma e contagem
    const calcularAgregado = (ordens) => ({
      _sum: { valorTotal: ordens.reduce((acc, o) => acc + (o.valorTotal || 0), 0) },
      _count: ordens.length,
    });

    // ========== FATURAMENTO BASEADO EM ORDENS ENTREGUES ==========
    // Diário (usando intervalo do dia inteiro em UTC ajustado para Brasília)
    const ordensDiarias = filtrarPorPeriodo(ordensEntregues, inicioDiaUTC, fimDiaUTC);
    const faturamentoDiario = calcularAgregado(ordensDiarias);

    // Semanal
    const ordensSemanais = filtrarPorPeriodo(ordensEntregues, inicioSemanaUTC);
    const faturamentoSemanal = calcularAgregado(ordensSemanais);

    // Mensal
    const ordensMensais = filtrarPorPeriodo(ordensEntregues, inicioMesUTC);
    const faturamentoMensal = calcularAgregado(ordensMensais);

    // Anual
    const ordensAnuais = filtrarPorPeriodo(ordensEntregues, inicioAnoUTC);
    const faturamentoAnual = calcularAgregado(ordensAnuais);

    // Pendente a receber (ordens finalizadas mas não entregues)
    const pendenteReceber = await prisma.ordemServico.aggregate({
      where: {
        status: 'finalizada',
      },
      _sum: { valorTotal: true },
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
          gte: inicioMesUTC,
        },
      },
      _sum: {
        valor: true,
      },
      _count: true,
    });

    // Faturamento por dia da semana atual (baseado em ordens entregues)
    const diasSemana = [];
    for (let i = 0; i < 7; i++) {
      const data = new Date(inicioSemanaUTC);
      data.setDate(inicioSemanaUTC.getDate() + i);
      const proximoDia = new Date(data);
      proximoDia.setDate(data.getDate() + 1);

      // Filtrar ordens do dia usando data efetiva (dataSaida ou updatedAt)
      const ordensDoDia = ordensEntregues.filter((o) => {
        const dataEfetiva = getDataEfetiva(o);
        return dataEfetiva >= data && dataEfetiva < proximoDia;
      });
      
      const valor = ordensDoDia.reduce((acc, o) => acc + (o.valorTotal || 0), 0);

      const nomeDia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i];
      diasSemana.push({
        dia: nomeDia,
        valor: valor,
      });
    }

    // Faturamento por mês do ano (baseado em ordens entregues)
    const mesesAno = [];
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 0; i <= nowBrasilia.getMonth(); i++) {
      const inicioMesLoop = new Date(Date.UTC(nowBrasilia.getFullYear(), i, 1, 3, 0, 0)); // 3h UTC = 0h Brasília
      const fimMesLoop = new Date(Date.UTC(nowBrasilia.getFullYear(), i + 1, 1, 3, 0, 0));

      // Filtrar ordens do mês usando data efetiva (dataSaida ou updatedAt)
      const ordensDoMes = ordensEntregues.filter((o) => {
        const dataEfetiva = getDataEfetiva(o);
        return dataEfetiva >= inicioMesLoop && dataEfetiva < fimMesLoop;
      });
      
      const valor = ordensDoMes.reduce((acc, o) => acc + (o.valorTotal || 0), 0);

      mesesAno.push({
        mes: nomesMeses[i],
        valor: valor,
      });
    }

    // Últimas ordens entregues
    const ultimasReceitas = await prisma.ordemServico.findMany({
      where: {
        status: 'entregue',
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        veiculo: {
          select: {
            marca: true,
            modelo: true,
          },
        },
      },
    });

    // Ordens finalizadas no mês (usando data efetiva)
    const ordensFinalizadasMes = ordensMensais.length;

    // Ticket médio do mês
    const ticketMedio = faturamentoMensal._count > 0 
      ? (faturamentoMensal._sum.valorTotal || 0) / faturamentoMensal._count 
      : 0;

    return NextResponse.json({
      faturamento: {
        diario: {
          valor: faturamentoDiario._sum.valorTotal || 0,
          quantidade: faturamentoDiario._count,
        },
        semanal: {
          valor: faturamentoSemanal._sum.valorTotal || 0,
          quantidade: faturamentoSemanal._count,
        },
        mensal: {
          valor: faturamentoMensal._sum.valorTotal || 0,
          quantidade: faturamentoMensal._count,
        },
        anual: {
          valor: faturamentoAnual._sum.valorTotal || 0,
          quantidade: faturamentoAnual._count,
        },
      },
      pendentes: {
        receber: {
          valor: pendenteReceber._sum.valorTotal || 0,
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
      ultimasReceitas: ultimasReceitas.map(ordem => ({
        id: ordem.id,
        cliente: ordem.cliente,
        descricao: `${ordem.veiculo?.marca || ''} ${ordem.veiculo?.modelo || ''}`.trim(),
        formaPagamento: 'Entrega',
        dataRecebido: ordem.dataSaida,
        valor: ordem.valorTotal,
      })),
      ordensFinalizadasMes,
      ticketMedio,
      lucroMensal: (faturamentoMensal._sum.valorTotal || 0) - (despesasMensal._sum.valor || 0),
    });
  } catch (error) {
    console.error('Erro ao buscar financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
