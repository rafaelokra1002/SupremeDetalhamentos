import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Buscar cliente por ID
export async function GET(request, { params }) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        veiculos: true,
        ordensServico: {
          include: {
            veiculo: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error fetching cliente:', error);
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 });
  }
}

// PUT - Atualizar cliente
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { nome, cpfCnpj, telefone, whatsapp, email, observacoes } = body;

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nome,
        cpfCnpj,
        telefone,
        whatsapp,
        email,
        observacoes,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.error('Error updating cliente:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
  }
}

// DELETE - Excluir cliente
export async function DELETE(request, { params }) {
  try {
    await prisma.cliente.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting cliente:', error);
    return NextResponse.json({ error: 'Erro ao excluir cliente' }, { status: 500 });
  }
}
