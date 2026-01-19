import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Buscar usuário por ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefone: true,
        avatar: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Atualizar usuário
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const data = await request.json();
    const { name, email, password, telefone, role, active } = data;

    // Verifica se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verifica se email já está em uso por outro usuário
    if (email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Este email já está em uso' }, 
          { status: 400 }
        );
      }
    }

    const updateData = {
      name,
      email,
      telefone,
      role,
      active
    };

    // Se uma nova senha foi fornecida, hash ela
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefone: true,
        active: true,
        updatedAt: true
      }
    });

    return NextResponse.json(usuario);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE - Excluir usuário
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Não permite excluir o próprio usuário
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Você não pode excluir seu próprio usuário' }, 
        { status: 400 }
      );
    }

    // Verifica se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verifica se tem ordens associadas
    const ordensCount = await prisma.ordemServico.count({
      where: { funcionarioId: params.id }
    });

    if (ordensCount > 0) {
      return NextResponse.json(
        { error: `Este usuário possui ${ordensCount} ordem(s) de serviço associada(s). Desative-o em vez de excluir.` }, 
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
