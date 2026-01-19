import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar contas a receber
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const contas = await prisma.contaReceber.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true },
        },
        ordemServico: {
          select: { id: true, valorTotal: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(contas);
  } catch (error) {
    console.error('Error fetching contas a receber:', error);
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}

// POST - Criar nova conta
export async function POST(request) {
  try {
    const body = await request.json();
    const { clienteId, ordemServicoId, descricao, valor, formaPagamento, status = 'pendente' } = body;

    if (!clienteId || !valor) {
      return NextResponse.json(
        { error: 'Cliente e valor são obrigatórios' },
        { status: 400 }
      );
    }

    const conta = await prisma.contaReceber.create({
      data: {
        clienteId,
        ordemServicoId,
        descricao,
        valor: parseFloat(valor),
        formaPagamento,
        status,
        dataRecebido: status === 'recebido' ? new Date() : null,
      },
    });

    return NextResponse.json(conta, { status: 201 });
  } catch (error) {
    console.error('Error creating conta:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
