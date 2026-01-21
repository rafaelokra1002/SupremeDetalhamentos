import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Buscar agendamento por ID ou Token
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Pode buscar por ID ou por Token
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        OR: [
          { id },
          { token: id }
        ]
      },
      include: {
        servico: true
      }
    });
    
    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar agendamento' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar agendamento (admin)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const agendamento = await prisma.agendamento.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar agendamento' },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar agendamento
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Permitir cancelamento por token também (para cliente)
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        OR: [
          { id },
          { token: id }
        ]
      }
    });
    
    if (!agendamento) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Atualizar status para cancelado ao invés de deletar
    await prisma.agendamento.update({
      where: { id: agendamento.id },
      data: { status: 'cancelado' }
    });
    
    return NextResponse.json({ message: 'Agendamento cancelado com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar agendamento' },
      { status: 500 }
    );
  }
}
