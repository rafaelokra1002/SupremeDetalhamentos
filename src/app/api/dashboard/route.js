import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Calcular o primeiro dia do mês atual
    const now = new Date();
    const primeiroDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const anoAtual = now.getFullYear();

    const [
      totalClientes,
      totalVeiculos,
      ordensAbertas,
      ordensFinalizadas,
      faturamentoMes,
      ordensPorStatus,
      faturamentoMensal,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.veiculo.count(),
      prisma.ordemServico.count({
        where: { status: { in: ['aberta', 'em_andamento'] } },
      }),
      prisma.ordemServico.count({
        where: { status: { in: ['finalizada', 'entregue'] } },
      }),
      // Faturamento do mês - considera ordens finalizadas OU entregues
      prisma.ordemServico.aggregate({
        _sum: { valorTotal: true },
        where: {
          status: { in: ['finalizada', 'entregue'] },
          OR: [
            {
              dataSaida: {
                gte: primeiroDiaMes,
              },
            },
            {
              AND: [
                { dataSaida: null },
                { updatedAt: { gte: primeiroDiaMes } },
              ],
            },
          ],
        },
      }),
      prisma.ordemServico.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Query PostgreSQL para faturamento mensal
      prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "dataSaida")::integer as mes,
          SUM("valorTotal") as total
        FROM "OrdemServico" 
        WHERE status IN ('finalizada', 'entregue')
          AND "dataSaida" IS NOT NULL
          AND EXTRACT(YEAR FROM "dataSaida") = ${anoAtual}
        GROUP BY EXTRACT(MONTH FROM "dataSaida")
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

    const ordensChart = ordensPorStatus.map((o) => ({
      status: statusLabels[o.status] || o.status,
      quantidade: o._count.status,
    }));

    return NextResponse.json({
      totalClientes,
      totalVeiculos,
      ordensAbertas,
      ordensFinalizadas,
      faturamentoMes: faturamentoMes._sum.valorTotal || 0,
      ordensChart,
      faturamentoChart,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
