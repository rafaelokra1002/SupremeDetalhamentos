import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE - Excluir agendamento permanentemente
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Verificar se o agendamento existe
    const agendamento = await prisma.agendamento.findUnique({
      where: { id }
    });
    
    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir permanentemente o agendamento
    await prisma.agendamento.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Agendamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir agendamento' },
      { status: 500 }
    );
  }
}
