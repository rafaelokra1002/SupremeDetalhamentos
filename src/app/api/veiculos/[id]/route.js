import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Buscar veículo por ID
export async function GET(request, { params }) {
  try {
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        ordensServico: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!veiculo) {
      return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
    }

    return NextResponse.json(veiculo);
  } catch (error) {
    console.error('Error fetching veiculo:', error);
    return NextResponse.json({ error: 'Erro ao buscar veículo' }, { status: 500 });
  }
}

// PUT - Atualizar veículo
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { clienteId, tipo, marca, modelo, ano, placa, cor, observacoes } = body;

    const veiculo = await prisma.veiculo.update({
      where: { id: params.id },
      data: {
        clienteId,
        tipo,
        marca,
        modelo,
        ano,
        placa,
        cor,
        observacoes,
      },
    });

    return NextResponse.json(veiculo);
  } catch (error) {
    console.error('Error updating veiculo:', error);
    return NextResponse.json({ error: 'Erro ao atualizar veículo' }, { status: 500 });
  }
}

// DELETE - Excluir veículo
export async function DELETE(request, { params }) {
  try {
    await prisma.veiculo.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Veículo excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting veiculo:', error);
    return NextResponse.json({ error: 'Erro ao excluir veículo' }, { status: 500 });
  }
}
