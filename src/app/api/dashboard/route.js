import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
      prisma.ordemServico.aggregate({
        _sum: { valorTotal: true },
        where: {
          status: 'entregue',
          dataSaida: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.ordemServico.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.$queryRaw`
        SELECT 
          strftime('%m', dataSaida) as mes,
          SUM(valorTotal) as total
        FROM OrdemServico 
        WHERE status = 'entregue' 
          AND dataSaida IS NOT NULL
          AND strftime('%Y', dataSaida) = strftime('%Y', 'now')
        GROUP BY strftime('%m', dataSaida)
        ORDER BY mes
      `,
    ]);

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const faturamentoChart = meses.map((mes, index) => {
      const mesData = faturamentoMensal.find((f) => parseInt(f.mes) === index + 1);
      return {
        mes,
        valor: mesData?.total || 0,
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
