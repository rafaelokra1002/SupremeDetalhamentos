import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Buscar produto por ID
export async function GET(request, { params }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json(produto);
  } catch (error) {
    console.error('Error fetching produto:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

// PUT - Atualizar produto
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { nome, categoria, marca, quantidade, valorUnitario, estoqueMinimo } = body;

    const produto = await prisma.produto.update({
      where: { id: params.id },
      data: {
        nome,
        categoria,
        marca,
        quantidade: parseInt(quantidade) || 0,
        valorUnitario: parseFloat(valorUnitario) || 0,
        estoqueMinimo: parseInt(estoqueMinimo) || 5,
      },
    });

    return NextResponse.json(produto);
  } catch (error) {
    console.error('Error updating produto:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

// DELETE - Excluir produto
export async function DELETE(request, { params }) {
  try {
    await prisma.produto.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting produto:', error);
    return NextResponse.json({ error: 'Erro ao excluir produto' }, { status: 500 });
  }
}
