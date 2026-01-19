/**
 * Testes de Integridade do Banco de Dados
 * Verifica relações e constraints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Integridade do Banco de Dados', () => {
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('todos os veículos devem ter cliente válido', async () => {
    const veiculos = await prisma.veiculo.findMany({
      include: { cliente: true }
    });

    veiculos.forEach(veiculo => {
      expect(veiculo.cliente).toBeDefined();
      expect(veiculo.cliente.id).toBe(veiculo.clienteId);
    });
  });

  test('todas as ordens devem ter cliente e veículo válidos', async () => {
    const ordens = await prisma.ordemServico.findMany({
      include: { 
        cliente: true, 
        veiculo: true 
      }
    });

    ordens.forEach(ordem => {
      expect(ordem.cliente).toBeDefined();
      expect(ordem.veiculo).toBeDefined();
    });
  });

  test('todos os itens de ordem devem ter ordem válida', async () => {
    const itens = await prisma.itemOrdem.findMany({
      include: {
        ordemServico: true,
        servico: true,
        produto: true
      }
    });

    itens.forEach(item => {
      expect(item.ordemServico).toBeDefined();
      // servico ou produto pode ser null dependendo do tipo
      if (item.servicoId) {
        expect(item.servico).toBeDefined();
      }
      if (item.produtoId) {
        expect(item.produto).toBeDefined();
      }
    });
  });

  test('contas a receber devem ter cliente válido', async () => {
    const contas = await prisma.contaReceber.findMany({
      include: { cliente: true }
    });

    contas.forEach(conta => {
      expect(conta.cliente).toBeDefined();
      expect(conta.clienteId).toBe(conta.cliente.id);
    });
  });

  test('usuários devem ter campos obrigatórios', async () => {
    const usuarios = await prisma.user.findMany();

    usuarios.forEach(user => {
      expect(user.email).toBeDefined();
      expect(user.password).toBeDefined();
      expect(user.name).toBeDefined();
      expect(user.role).toBeDefined();
    });
  });

  test('produtos devem ter valores válidos', async () => {
    const produtos = await prisma.produto.findMany();

    produtos.forEach(produto => {
      expect(produto.valorUnitario).toBeGreaterThanOrEqual(0);
      expect(produto.quantidade).toBeGreaterThanOrEqual(0);
    });
  });

  test('serviços devem ter valor válido', async () => {
    const servicos = await prisma.servico.findMany();

    servicos.forEach(servico => {
      expect(servico.valor).toBeGreaterThanOrEqual(0);
    });
  });

  test('ordens devem ter status válido', async () => {
    const statusValidos = ['aberta', 'em_andamento', 'finalizada', 'entregue'];
    const ordens = await prisma.ordemServico.findMany();

    ordens.forEach(ordem => {
      expect(statusValidos).toContain(ordem.status);
    });
  });

  test('contas a pagar devem ter status válido', async () => {
    const statusValidos = ['pendente', 'pago'];
    const contas = await prisma.contaPagar.findMany();

    contas.forEach(conta => {
      expect(statusValidos).toContain(conta.status);
    });
  });

  test('contas a receber devem ter status válido', async () => {
    const statusValidos = ['pendente', 'recebido'];
    const contas = await prisma.contaReceber.findMany();

    contas.forEach(conta => {
      expect(statusValidos).toContain(conta.status);
    });
  });
});
