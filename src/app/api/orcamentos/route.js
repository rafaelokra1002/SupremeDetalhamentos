import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Listar orçamentos
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const busca = searchParams.get('busca');

    const where = {};

    if (status) {
      where.status = status;
    }

    if (busca) {
      where.OR = [
        { nomeCliente: { contains: busca, mode: 'insensitive' } },
        { telefoneCliente: { contains: busca, mode: 'insensitive' } },
        { veiculoPlaca: { contains: busca, mode: 'insensitive' } }
      ];
    }

    const orcamentos = await prisma.orcamento.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Parse dos itens JSON
    const orcamentosFormatados = orcamentos.map(orc => ({
      ...orc,
      itens: JSON.parse(orc.itens || '[]')
    }));

    return NextResponse.json(orcamentosFormatados);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 });
  }
}

// POST - Criar orçamento
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      nomeCliente,
      telefoneCliente,
      emailCliente,
      veiculoMarca,
      veiculoModelo,
      veiculoPlaca,
      veiculoCor,
      veiculoAno,
      itens,
      desconto,
      observacoes,
      validade
    } = body;

    if (!nomeCliente) {
      return NextResponse.json({ error: 'Nome do cliente é obrigatório' }, { status: 400 });
    }

    // Calcular valores
    const itensArray = itens || [];
    const valorTotal = itensArray.reduce((acc, item) => acc + (item.valorTotal || 0), 0);
    const descontoValor = desconto || 0;
    const valorFinal = valorTotal - descontoValor;

    const orcamento = await prisma.orcamento.create({
      data: {
        nomeCliente,
        telefoneCliente,
        emailCliente,
        veiculoMarca,
        veiculoModelo,
        veiculoPlaca,
        veiculoCor,
        veiculoAno,
        itens: JSON.stringify(itensArray),
        valorTotal,
        desconto: descontoValor,
        valorFinal,
        observacoes,
        validade: validade ? new Date(validade) : null,
        status: 'pendente',
        responsavel: session.user.name || session.user.email
      }
    });

    return NextResponse.json({
      ...orcamento,
      itens: itensArray
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json({ error: 'Erro ao criar orçamento' }, { status: 500 });
  }
}
