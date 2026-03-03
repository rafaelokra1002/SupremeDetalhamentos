import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Buscar ordem por ID
export async function GET(request, { params }) {
  try {
    const ordem = await prisma.ordemServico.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        veiculo: true,
        funcionario: true,
        itens: {
          include: {
            produto: true,
            servico: true,
          },
        },
      },
    });

    if (!ordem) {
      return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 });
    }

    return NextResponse.json(ordem);
  } catch (error) {
    console.error('Error fetching ordem:', error);
    return NextResponse.json({ error: 'Erro ao buscar ordem' }, { status: 500 });
  }
}

// PUT - Atualizar ordem
export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const {
      clienteId,
      veiculoId,
      funcionarioId,
      status,
      itens,
      observacoes,
    } = body;

    // Buscar ordem atual para verificar status anterior
    const ordemAtual = await prisma.ordemServico.findUnique({
      where: { id: params.id },
      select: { status: true, dataSaida: true }
    });

    // Calcular valor total
    const valorTotal = itens ? itens.reduce((acc, item) => acc + (item.valorTotal || 0), 0) : undefined;

    // Se status mudou para finalizada ou entregue E ainda não tem dataSaida, definir agora
    let dataSaida = undefined;
    if ((status === 'finalizada' || status === 'entregue') && !ordemAtual?.dataSaida) {
      dataSaida = new Date();
    }

    // Atualizar ordem
    const ordem = await prisma.ordemServico.update({
      where: { id: params.id },
      data: {
        clienteId,
        veiculoId,
        funcionarioId,
        status,
        valorTotal,
        ...(dataSaida && { dataSaida }), // Só inclui se tiver valor
        observacoes,
      },
    });

    // Se itens foram atualizados, recriar
    if (itens) {
      // Deletar itens antigos
      await prisma.itemOrdem.deleteMany({
        where: { ordemServicoId: params.id },
      });

      // Criar novos itens
      await prisma.itemOrdem.createMany({
        data: itens.map((item) => ({
          ordemServicoId: params.id,
          tipo: item.tipo,
          produtoId: item.produtoId || null,
          servicoId: item.servicoId || null,
          descricao: item.descricao,
          quantidade: item.quantidade || 1,
          valorUnitario: item.valorUnitario || 0,
          valorTotal: item.valorTotal || 0,
        })),
      });
    }

    return NextResponse.json(ordem);
  } catch (error) {
    console.error('Error updating ordem:', error);
    return NextResponse.json({ error: 'Erro ao atualizar ordem' }, { status: 500 });
  }
}

// DELETE - Excluir ordem
export async function DELETE(request, { params }) {
  try {
    await prisma.ordemServico.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Ordem excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting ordem:', error);
    return NextResponse.json({ error: 'Erro ao excluir ordem' }, { status: 500 });
  }
}
