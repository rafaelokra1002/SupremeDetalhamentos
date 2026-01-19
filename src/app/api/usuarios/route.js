import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Listar todos os usuários
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const usuarios = await prisma.user.findMany({
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
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo usuário
export async function POST(request) {
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

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' }, 
        { status: 400 }
      );
    }

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' }, 
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        telefone,
        role: role || 'funcionario',
        active: active !== undefined ? active : true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefone: true,
        active: true,
        createdAt: true
      }
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
