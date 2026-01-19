import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// PUT - Atualizar serviço
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { nome, descricao, valor, active } = body;

    const servico = await prisma.servico.update({
      where: { id: params.id },
      data: {
        nome,
        descricao,
        valor: parseFloat(valor) || 0,
        active,
      },
    });

    return NextResponse.json(servico);
  } catch (error) {
    console.error('Error updating servico:', error);
    return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}

// DELETE - Excluir serviço (soft delete)
export async function DELETE(request, { params }) {
  try {
    await prisma.servico.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Serviço excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting servico:', error);
    return NextResponse.json({ error: 'Erro ao excluir serviço' }, { status: 500 });
  }
}
