import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar todos os veículos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const clienteId = searchParams.get('clienteId');

    const where = {
      AND: [
        clienteId ? { clienteId } : {},
        {
          OR: [
            { marca: { contains: search } },
            { modelo: { contains: search } },
            { placa: { contains: search } },
            { cliente: { nome: { contains: search } } },
          ],
        },
      ],
    };

    const veiculos = await prisma.veiculo.findMany({
      where,
      include: {
        cliente: {
          select: { id: true, nome: true },
        },
        _count: {
          select: { ordensServico: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(veiculos);
  } catch (error) {
    console.error('Error fetching veiculos:', error);
    return NextResponse.json({ error: 'Erro ao buscar veículos' }, { status: 500 });
  }
}

// POST - Criar novo veículo
export async function POST(request) {
  try {
    const body = await request.json();
    const { clienteId, tipo, marca, modelo, ano, placa, cor, observacoes } = body;

    if (!clienteId || !marca || !modelo) {
      return NextResponse.json(
        { error: 'Cliente, marca e modelo são obrigatórios' },
        { status: 400 }
      );
    }

    const veiculo = await prisma.veiculo.create({
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
      include: {
        cliente: {
          select: { id: true, nome: true },
        },
      },
    });

    return NextResponse.json(veiculo, { status: 201 });
  } catch (error) {
    console.error('Error creating veiculo:', error);
    return NextResponse.json({ error: 'Erro ao criar veículo' }, { status: 500 });
  }
}
