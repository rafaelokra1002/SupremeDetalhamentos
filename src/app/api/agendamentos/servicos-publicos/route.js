import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Listar serviços disponíveis para agendamento (público)
export async function GET() {
  try {
    // Buscar configuração de agendamento
    const config = await prisma.configuracaoAgendamento.findFirst();
    
    let servicosIds = [];
    
    if (config?.servicosDisponiveis) {
      servicosIds = JSON.parse(config.servicosDisponiveis);
    }
    
    // Se não houver configuração ou nenhum serviço selecionado, buscar serviços de lavagem
    if (servicosIds.length === 0) {
      const servicosLavagem = await prisma.servico.findMany({
        where: {
          active: true,
          nome: { contains: 'lavagem', mode: 'insensitive' }
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          valor: true
        },
        orderBy: { nome: 'asc' }
      });
      
      return NextResponse.json(servicosLavagem);
    }
    
    // Buscar serviços configurados
    const servicos = await prisma.servico.findMany({
      where: {
        active: true,
        id: { in: servicosIds }
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        valor: true
      },
      orderBy: { nome: 'asc' }
    });
    
    return NextResponse.json(servicos);
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    );
  }
}
