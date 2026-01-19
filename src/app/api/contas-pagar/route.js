import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar contas a pagar
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where = status ? { status } : {};

    const contas = await prisma.contaPagar.findMany({
      where,
      orderBy: { vencimento: 'asc' },
    });

    return NextResponse.json(contas);
  } catch (error) {
    console.error('Error fetching contas a pagar:', error);
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}

// POST - Criar nova conta
export async function POST(request) {
  try {
    const body = await request.json();
    const { descricao, categoria, valor, vencimento, status = 'pendente' } = body;

    if (!descricao || !valor || !vencimento) {
      return NextResponse.json(
        { error: 'Descrição, valor e vencimento são obrigatórios' },
        { status: 400 }
      );
    }

    const conta = await prisma.contaPagar.create({
      data: {
        descricao,
        categoria,
        valor: parseFloat(valor),
        vencimento: new Date(vencimento),
        status,
        dataPago: status === 'pago' ? new Date() : null,
      },
    });

    return NextResponse.json(conta, { status: 201 });
  } catch (error) {
    console.error('Error creating conta:', error);
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
