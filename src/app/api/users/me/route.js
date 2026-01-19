import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Buscar dados do usuário logado
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefone: true,
        avatar: true,
        active: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar dados do usuário logado
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { name, telefone, avatar, senhaAtual, novaSenha } = data;

    // Se está alterando senha, verificar senha atual
    if (novaSenha) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      const senhaValida = await bcrypt.compare(senhaAtual, user.password);
      if (!senhaValida) {
        return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
      }
    }

    const updateData = {
      name,
      telefone,
      avatar
    };

    if (novaSenha) {
      updateData.password = await bcrypt.hash(novaSenha, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefone: true,
        avatar: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
