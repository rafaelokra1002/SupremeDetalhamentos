import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Buscar configuração da empresa (público)
export async function GET() {
  try {
    const config = await prisma.configuracao.findFirst({
      select: {
        nomeEmpresa: true,
        telefoneEmpresa: true,
        emailEmpresa: true,
        enderecoEmpresa: true,
        whatsappEmpresa: true,
        logoEmpresa: true
      }
    });
    
    return NextResponse.json(config || {
      nomeEmpresa: 'Supreme Detalhamento'
    });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
}
