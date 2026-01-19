/**
 * Testes da API de Clientes
 * Testa operações CRUD para clientes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Clientes', () => {
  let clienteId = null;

  afterAll(async () => {
    if (clienteId) {
      try {
        await prisma.cliente.delete({ where: { id: clienteId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar um cliente', async () => {
    const cliente = await prisma.cliente.create({
      data: {
        nome: 'Cliente Teste Automatizado',
        email: 'teste.automatizado@example.com',
        telefone: '(11) 99999-9999',
        cpfCnpj: '12345678901'
      }
    });

    expect(cliente).toBeDefined();
    expect(cliente.nome).toBe('Cliente Teste Automatizado');
    expect(cliente.email).toBe('teste.automatizado@example.com');
    expect(cliente.id).toBeDefined();
    clienteId = cliente.id;
  });

  test('deve buscar cliente por ID', async () => {
    expect(clienteId).not.toBeNull();
    
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    expect(cliente).toBeDefined();
    expect(cliente.id).toBe(clienteId);
  });

  test('deve atualizar um cliente', async () => {
    expect(clienteId).not.toBeNull();
    
    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: { nome: 'Cliente Teste Atualizado' }
    });

    expect(cliente.nome).toBe('Cliente Teste Atualizado');
  });

  test('deve listar clientes', async () => {
    const clientes = await prisma.cliente.findMany();
    expect(Array.isArray(clientes)).toBe(true);
    expect(clientes.length).toBeGreaterThan(0);
  });

  test('deve deletar um cliente', async () => {
    expect(clienteId).not.toBeNull();
    
    await prisma.cliente.delete({
      where: { id: clienteId }
    });

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });

    expect(cliente).toBeNull();
    clienteId = null;
  });
});
