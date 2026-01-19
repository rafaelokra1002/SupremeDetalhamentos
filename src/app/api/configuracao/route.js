import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Buscar configurações da empresa
export async function GET() {
  try {
    let config = await prisma.configuracao.findFirst();
    
    if (!config) {
      // Cria configuração padrão se não existir
      config = await prisma.configuracao.create({
        data: {
          nomeEmpresa: 'Supreme Detalhamento'
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar configurações da empresa
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admin pode alterar configurações da empresa
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await request.json();
    const {
      nomeEmpresa,
      logoEmpresa,
      telefoneEmpresa,
      emailEmpresa,
      enderecoEmpresa,
      instagramEmpresa,
      facebookEmpresa,
      whatsappEmpresa
    } = data;

    let config = await prisma.configuracao.findFirst();

    if (config) {
      config = await prisma.configuracao.update({
        where: { id: config.id },
        data: {
          nomeEmpresa,
          logoEmpresa,
          telefoneEmpresa,
          emailEmpresa,
          enderecoEmpresa,
          instagramEmpresa,
          facebookEmpresa,
          whatsappEmpresa
        }
      });
    } else {
      config = await prisma.configuracao.create({
        data: {
          nomeEmpresa,
          logoEmpresa,
          telefoneEmpresa,
          emailEmpresa,
          enderecoEmpresa,
          instagramEmpresa,
          facebookEmpresa,
          whatsappEmpresa
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
