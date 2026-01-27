import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Buscar orçamento por ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    const orcamento = await prisma.orcamento.findUnique({
      where: { id }
    });

    if (!orcamento) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      ...orcamento,
      itens: JSON.parse(orcamento.itens || '[]')
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    return NextResponse.json({ error: 'Erro ao buscar orçamento' }, { status: 500 });
  }
}

// PUT - Atualizar orçamento
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;
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
      validade,
      status
    } = body;

    // Calcular valores se itens foram atualizados
    let updateData = {};
    
    if (itens !== undefined) {
      const itensArray = itens || [];
      const valorTotal = itensArray.reduce((acc, item) => acc + (item.valorTotal || 0), 0);
      const descontoValor = desconto !== undefined ? desconto : 0;
      const valorFinal = valorTotal - descontoValor;
      
      updateData = {
        itens: JSON.stringify(itensArray),
        valorTotal,
        desconto: descontoValor,
        valorFinal
      };
    }

    if (nomeCliente !== undefined) updateData.nomeCliente = nomeCliente;
    if (telefoneCliente !== undefined) updateData.telefoneCliente = telefoneCliente;
    if (emailCliente !== undefined) updateData.emailCliente = emailCliente;
    if (veiculoMarca !== undefined) updateData.veiculoMarca = veiculoMarca;
    if (veiculoModelo !== undefined) updateData.veiculoModelo = veiculoModelo;
    if (veiculoPlaca !== undefined) updateData.veiculoPlaca = veiculoPlaca;
    if (veiculoCor !== undefined) updateData.veiculoCor = veiculoCor;
    if (veiculoAno !== undefined) updateData.veiculoAno = veiculoAno;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    if (validade !== undefined) updateData.validade = validade ? new Date(validade) : null;
    if (status !== undefined) updateData.status = status;

    const orcamento = await prisma.orcamento.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      ...orcamento,
      itens: JSON.parse(orcamento.itens || '[]')
    });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json({ error: 'Erro ao atualizar orçamento' }, { status: 500 });
  }
}

// DELETE - Excluir orçamento
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    await prisma.orcamento.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    return NextResponse.json({ error: 'Erro ao excluir orçamento' }, { status: 500 });
  }
}
