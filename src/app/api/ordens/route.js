import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar todas as ordens
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const where = {
      AND: [
        status ? { status } : {},
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
          select: { id: true, nome: true },
        },
        veiculo: {
          select: { id: true, marca: true, modelo: true, placa: true },
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
