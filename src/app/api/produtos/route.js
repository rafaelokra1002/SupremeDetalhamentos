import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar todos os produtos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const produtos = await prisma.produto.findMany({
      where: {
        OR: [
          { nome: { contains: search } },
          { categoria: { contains: search } },
          { marca: { contains: search } },
        ],
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Error fetching produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

// POST - Criar novo produto
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, categoria, marca, quantidade, valorUnitario, estoqueMinimo } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        categoria,
        marca,
        quantidade: parseInt(quantidade) || 0,
        valorUnitario: parseFloat(valorUnitario) || 0,
        estoqueMinimo: parseInt(estoqueMinimo) || 5,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error('Error creating produto:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
