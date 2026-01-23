import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Função auxiliar para calcular datas de período
function getDateRange(periodo) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (periodo) {
    case 'hoje':
      return {
        gte: startOfDay,
        lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
      };
    case 'semana':
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return {
        gte: startOfWeek,
        lt: endOfWeek,
      };
    case 'mes':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        gte: startOfMonth,
        lt: endOfMonth,
      };
    case 'ano':
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
      return {
        gte: startOfYear,
        lt: endOfYear,
      };
    default:
      return null;
  }
}

// GET - Listar todas as ordens
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const periodo = searchParams.get('periodo');

    const dateRange = getDateRange(periodo);

    const where = {
      AND: [
        status ? { status } : {},
        dateRange ? { dataEntrada: dateRange } : {},
        {
          OR: [
            { cliente: { nome: { contains: search } } },
            { veiculo: { modelo: { contains: search } } },
            { veiculo: { placa: { contains: search } } },
          ],
        },
      ],
    };

    const ordens = await prisma.ordemServico.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true, whatsapp: true, telefone: true, cpfCnpj: true, email: true },
        },
        veiculo: {
          select: { id: true, marca: true, modelo: true, placa: true, cor: true, ano: true },
        },
        funcionario: {
          select: { id: true, name: true },
        },
        itens: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(ordens);
  } catch (error) {
    console.error('Error fetching ordens:', error);
    return NextResponse.json({ error: 'Erro ao buscar ordens' }, { status: 500 });
  }
}

// POST - Criar nova ordem
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      clienteId,
      veiculoId,
      funcionarioId,
      status = 'aberta',
      itens = [],
      observacoes,
    } = body;

    if (!clienteId || !veiculoId || !funcionarioId) {
      return NextResponse.json(
        { error: 'Cliente, veículo e funcionário são obrigatórios' },
        { status: 400 }
      );
    }

    // Calcular valor total
    const valorTotal = itens.reduce((acc, item) => acc + (item.valorTotal || 0), 0);

    const ordem = await prisma.ordemServico.create({
      data: {
        clienteId,
        veiculoId,
        funcionarioId,
        status,
        valorTotal,
        observacoes,
        itens: {
          create: itens.map((item) => ({
            tipo: item.tipo,
            produtoId: item.produtoId || null,
            servicoId: item.servicoId || null,
            descricao: item.descricao,
            quantidade: item.quantidade || 1,
            valorUnitario: item.valorUnitario || 0,
            valorTotal: item.valorTotal || 0,
          })),
        },
      },
      include: {
        cliente: true,
        veiculo: true,
        funcionario: true,
        itens: true,
      },
    });

    // Atualizar estoque dos produtos
    for (const item of itens) {
      if (item.tipo === 'produto' && item.produtoId) {
        await prisma.produto.update({
          where: { id: item.produtoId },
          data: {
            quantidade: {
              decrement: item.quantidade || 1,
            },
          },
        });
      }
    }

    return NextResponse.json(ordem, { status: 201 });
  } catch (error) {
    console.error('Error creating ordem:', error);
    return NextResponse.json({ error: 'Erro ao criar ordem' }, { status: 500 });
  }
}
