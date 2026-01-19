import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar todos os clientes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nome: { contains: search } },
          { cpfCnpj: { contains: search } },
          { email: { contains: search } },
          { telefone: { contains: search } },
        ],
      },
      include: {
        veiculos: true,
        _count: {
          select: { ordensServico: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(clientes);
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
  }
}

// POST - Criar novo cliente
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, cpfCnpj, telefone, whatsapp, email, observacoes } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        cpfCnpj,
        telefone,
        whatsapp,
        email,
        observacoes,
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
  }
}
