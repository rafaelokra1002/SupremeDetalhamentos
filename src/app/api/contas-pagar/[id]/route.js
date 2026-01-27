import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

const parseVencimento = (vencimento) => {
  if (typeof vencimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    const [ano, mes, dia] = vencimento.split('-').map(Number);
    return new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  }
  return new Date(vencimento);
};

// PUT - Atualizar conta
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { descricao, categoria, valor, vencimento, status } = body;

    const conta = await prisma.contaPagar.update({
      where: { id: params.id },
      data: {
        descricao,
        categoria,
        valor: parseFloat(valor),
        vencimento: parseVencimento(vencimento),
        status,
        dataPago: status === 'pago' ? new Date() : null,
      },
    });

    return NextResponse.json(conta);
  } catch (error) {
    console.error('Error updating conta:', error);
    return NextResponse.json({ error: 'Erro ao atualizar conta' }, { status: 500 });
  }
}

// DELETE - Excluir conta
export async function DELETE(request, { params }) {
  try {
    await prisma.contaPagar.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Conta excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting conta:', error);
    return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 });
  }
}
