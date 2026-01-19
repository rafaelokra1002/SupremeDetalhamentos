/**
 * Testes da API de Usuários
 * Testa operações CRUD para usuários
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('API Usuários', () => {
  let usuarioTesteId = null;

  afterAll(async () => {
    // Limpa usuário de teste
    if (usuarioTesteId) {
      try {
        await prisma.user.delete({ where: { id: usuarioTesteId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar um novo usuário', async () => {
    const hashedPassword = await bcrypt.hash('teste123', 10);
    
    const usuario = await prisma.user.create({
      data: {
        name: 'Usuário Teste Automatizado',
        email: 'teste.automatizado.user@example.com',
        password: hashedPassword,
        telefone: '(11) 99999-0000',
        role: 'funcionario',
        active: true
      }
    });

    expect(usuario).toBeDefined();
    expect(usuario.name).toBe('Usuário Teste Automatizado');
    expect(usuario.email).toBe('teste.automatizado.user@example.com');
    expect(usuario.role).toBe('funcionario');
    usuarioTesteId = usuario.id;
  });

  test('deve buscar usuário por ID', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioTesteId }
    });

    expect(usuario).toBeDefined();
    expect(usuario.id).toBe(usuarioTesteId);
  });

  test('deve buscar usuário por email', async () => {
    const usuario = await prisma.user.findUnique({
      where: { email: 'teste.automatizado.user@example.com' }
    });

    expect(usuario).toBeDefined();
    expect(usuario.email).toBe('teste.automatizado.user@example.com');
  });

  test('deve atualizar dados do usuário', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    const usuario = await prisma.user.update({
      where: { id: usuarioTesteId },
      data: { 
        name: 'Usuário Teste Atualizado',
        telefone: '(11) 88888-0000'
      }
    });

    expect(usuario.name).toBe('Usuário Teste Atualizado');
    expect(usuario.telefone).toBe('(11) 88888-0000');
  });

  test('deve desativar um usuário', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    const usuario = await prisma.user.update({
      where: { id: usuarioTesteId },
      data: { active: false }
    });

    expect(usuario.active).toBe(false);
  });

  test('deve reativar um usuário', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    const usuario = await prisma.user.update({
      where: { id: usuarioTesteId },
      data: { active: true }
    });

    expect(usuario.active).toBe(true);
  });

  test('deve alterar role do usuário', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    const usuario = await prisma.user.update({
      where: { id: usuarioTesteId },
      data: { role: 'admin' }
    });

    expect(usuario.role).toBe('admin');

    // Volta para funcionario
    await prisma.user.update({
      where: { id: usuarioTesteId },
      data: { role: 'funcionario' }
    });
  });

  test('deve verificar senha do usuário', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioTesteId }
    });

    const senhaValida = await bcrypt.compare('teste123', usuario.password);
    expect(senhaValida).toBe(true);

    const senhaInvalida = await bcrypt.compare('senhaerrada', usuario.password);
    expect(senhaInvalida).toBe(false);
  });

  test('deve listar todos os usuários', async () => {
    const usuarios = await prisma.user.findMany();
    
    expect(Array.isArray(usuarios)).toBe(true);
    expect(usuarios.length).toBeGreaterThanOrEqual(2); // admin + funcionario + teste
  });

  test('deve deletar o usuário de teste', async () => {
    expect(usuarioTesteId).not.toBeNull();
    
    await prisma.user.delete({
      where: { id: usuarioTesteId }
    });

    const usuario = await prisma.user.findUnique({
      where: { id: usuarioTesteId }
    });

    expect(usuario).toBeNull();
    usuarioTesteId = null;
  });
});
