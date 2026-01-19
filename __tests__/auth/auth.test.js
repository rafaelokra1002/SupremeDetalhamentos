/**
 * Testes de Autenticação
 * Testa login e controle de acesso
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Sistema de Autenticação', () => {
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve existir usuário admin no sistema', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@supreme.com' }
    });

    expect(admin).toBeDefined();
    expect(admin.role).toBe('admin');
  });

  test('deve existir usuário funcionário no sistema', async () => {
    const funcionario = await prisma.user.findUnique({
      where: { email: 'funcionario@supreme.com' }
    });

    expect(funcionario).toBeDefined();
    expect(funcionario.role).toBe('funcionario');
  });

  test('deve validar senha do admin corretamente', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@supreme.com' }
    });

    const senhaValida = await bcrypt.compare('admin123', admin.password);
    expect(senhaValida).toBe(true);
  });

  test('deve rejeitar senha incorreta', async () => {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@supreme.com' }
    });

    const senhaInvalida = await bcrypt.compare('senhaerrada', admin.password);
    expect(senhaInvalida).toBe(false);
  });

  test('deve retornar null para usuário inexistente', async () => {
    const usuario = await prisma.user.findUnique({
      where: { email: 'naoexiste@supreme.com' }
    });

    expect(usuario).toBeNull();
  });

  test('roles devem ser válidas', async () => {
    const usuarios = await prisma.user.findMany();
    const rolesValidas = ['admin', 'funcionario'];

    usuarios.forEach(user => {
      expect(rolesValidas).toContain(user.role);
    });
  });

  test('todos os usuários devem ter campos obrigatórios', async () => {
    const usuarios = await prisma.user.findMany();

    usuarios.forEach(user => {
      expect(user.email).toBeDefined();
      expect(user.password).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.role).toBeDefined();
    });
  });

  test('emails devem ser únicos', async () => {
    const usuarios = await prisma.user.findMany({
      select: { email: true }
    });

    const emails = usuarios.map(u => u.email);
    const emailsUnicos = [...new Set(emails)];
    expect(emails.length).toBe(emailsUnicos.length);
  });
});
