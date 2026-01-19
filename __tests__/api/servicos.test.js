/**
 * Testes da API de Serviços
 * Testa operações CRUD para serviços
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Serviços', () => {
  let servicoId = null;

  afterAll(async () => {
    if (servicoId) {
      try {
        await prisma.servico.delete({ where: { id: servicoId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar um serviço', async () => {
    const servico = await prisma.servico.create({
      data: {
        nome: 'Vitrificação Teste',
        descricao: 'Serviço de vitrificação para testes',
        valor: 1500.00,
        active: true
      }
    });

    expect(servico).toBeDefined();
    expect(servico.nome).toBe('Vitrificação Teste');
    expect(servico.valor).toBe(1500.00);
    servicoId = servico.id;
  });

  test('deve buscar serviço por ID', async () => {
    expect(servicoId).not.toBeNull();
    
    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    });

    expect(servico).toBeDefined();
    expect(servico.id).toBe(servicoId);
  });

  test('deve listar serviços ativos', async () => {
    const servicosAtivos = await prisma.servico.findMany({
      where: { active: true }
    });

    expect(Array.isArray(servicosAtivos)).toBe(true);
    expect(servicosAtivos.length).toBeGreaterThan(0);
  });

  test('deve atualizar valor do serviço', async () => {
    expect(servicoId).not.toBeNull();
    
    const servico = await prisma.servico.update({
      where: { id: servicoId },
      data: { valor: 1800.00 }
    });

    expect(servico.valor).toBe(1800.00);
  });

  test('deve desativar um serviço', async () => {
    expect(servicoId).not.toBeNull();
    
    const servico = await prisma.servico.update({
      where: { id: servicoId },
      data: { active: false }
    });

    expect(servico.active).toBe(false);
  });

  test('deve deletar um serviço', async () => {
    expect(servicoId).not.toBeNull();
    
    await prisma.servico.delete({
      where: { id: servicoId }
    });

    const servico = await prisma.servico.findUnique({
      where: { id: servicoId }
    });

    expect(servico).toBeNull();
    servicoId = null;
  });
});
