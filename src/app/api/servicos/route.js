import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar todos os serviços
export async function GET() {
  try {
    const servicos = await prisma.servico.findMany({
      where: { active: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(servicos);
  } catch (error) {
    console.error('Error fetching servicos:', error);
    return NextResponse.json({ error: 'Erro ao buscar serviços' }, { status: 500 });
  }
}

// POST - Criar novo serviço
export async function POST(request) {
  try {
    const body = await request.json();
    const { nome, descricao, valor } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const servico = await prisma.servico.create({
      data: {
        nome,
        descricao,
        valor: parseFloat(valor) || 0,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch (error) {
    console.error('Error creating servico:', error);
    return NextResponse.json({ error: 'Erro ao criar serviço' }, { status: 500 });
  }
}
