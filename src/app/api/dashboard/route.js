import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Usar fuso horário de Brasília (UTC-3)
    const now = new Date();
    const offsetBrasilia = -3 * 60; // -3 horas em minutos
    const offsetLocal = now.getTimezoneOffset(); // offset local em minutos
    const diffMinutos = offsetBrasilia - (-offsetLocal); // diferença para ajustar
    
    // Ajustar para horário de Brasília
    const nowBrasilia = new Date(now.getTime() + diffMinutos * 60 * 1000);
    
    // Calcular o primeiro e último dia do mês atual
    const primeiroDiaMes = new Date(nowBrasilia.getFullYear(), nowBrasilia.getMonth(), 1, 0, 0, 0, 0);
    const primeiroDiaMesUTC = new Date(primeiroDiaMes.getTime() - diffMinutos * 60 * 1000);
    const ultimoDiaMes = new Date(nowBrasilia.getFullYear(), nowBrasilia.getMonth() + 1, 0, 23, 59, 59, 999);
    const ultimoDiaMesUTC = new Date(ultimoDiaMes.getTime() - diffMinutos * 60 * 1000);
    const anoAtual = nowBrasilia.getFullYear();

    // Buscar todas as ordens com status para garantir consistência
    const todasOrdens = await prisma.ordemServico.findMany({
      select: { status: true, valorTotal: true, dataSaida: true, updatedAt: true }
    });

    // Contar ordens por status manualmente para garantir consistência
    const contagemPorStatus = {};
    todasOrdens.forEach(o => {
      contagemPorStatus[o.status] = (contagemPorStatus[o.status] || 0) + 1;
    });

    const ordensAbertas = (contagemPorStatus['aberta'] || 0) + (contagemPorStatus['em_andamento'] || 0);
    const ordensFinalizadas = (contagemPorStatus['finalizada'] || 0) + (contagemPorStatus['entregue'] || 0);

    // Função auxiliar para obter a data efetiva da ordem (mesmo padrão do financeiro)
    const getDataEfetiva = (ordem) => {
      const data = ordem.dataSaida || ordem.updatedAt;
      return new Date(data);
    };

    // Calcular faturamento do mês baseado em ordens entregues
    // Usando mesma lógica da API de financeiro: dataSaida ou updatedAt como data efetiva
    const ordensEntregues = todasOrdens.filter(o => o.status === 'entregue');
    const ordensMes = ordensEntregues.filter(o => {
      const dataEfetiva = getDataEfetiva(o);
      return dataEfetiva >= primeiroDiaMesUTC && dataEfetiva <= ultimoDiaMesUTC;
    });
    const faturamentoMesValor = ordensMes.reduce((acc, o) => acc + (o.valorTotal || 0), 0);

    const [
      totalClientes,
      totalVeiculos,
      faturamentoMensal,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.veiculo.count(),
      // Query PostgreSQL para faturamento mensal (gráfico)
      // Considera dataSaida primeiro, senão updatedAt
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM COALESCE("dataSaida", "updatedAt"))::integer as mes,
          SUM("valorTotal") as total
        FROM "OrdemServico" 
        WHERE status = 'entregue'
          AND EXTRACT(YEAR FROM COALESCE("dataSaida", "updatedAt")) = ${anoAtual}
        GROUP BY EXTRACT(MONTH FROM COALESCE("dataSaida", "updatedAt"))
        ORDER BY mes
      `,
    ]);

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const faturamentoChart = meses.map((mes, index) => {
      const mesData = faturamentoMensal.find((f) => Number(f.mes) === index + 1);
      return {
        mes,
        valor: mesData ? Number(mesData.total) : 0,
      };
    });

    const statusLabels = {
      aberta: 'Abertas',
      em_andamento: 'Em Andamento',
      finalizada: 'Finalizadas',
      entregue: 'Entregues',
    };

    // Montar gráfico de ordens por status a partir da contagem manual
    const ordensChart = Object.entries(contagemPorStatus)
      .filter(([status, quantidade]) => quantidade > 0)
      .map(([status, quantidade]) => ({
        status: statusLabels[status] || status,
        quantidade: quantidade,
      }));

    return NextResponse.json({
      totalClientes,
      totalVeiculos,
      ordensAbertas,
      ordensFinalizadas,
      faturamentoMes: faturamentoMesValor,
      ordensChart,
      faturamentoChart,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
