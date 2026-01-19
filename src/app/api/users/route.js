import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Listar todos os usuários
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}
