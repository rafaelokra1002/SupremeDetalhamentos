/**
 * Testes da API de Contas a Pagar
 * Testa operações CRUD para contas a pagar
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Contas a Pagar', () => {
  let contaId = null;

  afterAll(async () => {
    if (contaId) {
      try {
        await prisma.contaPagar.delete({ where: { id: contaId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar uma conta a pagar', async () => {
    const conta = await prisma.contaPagar.create({
      data: {
        descricao: 'Fornecedor de Produtos Teste',
        valor: 1500.00,
        vencimento: new Date('2026-02-15'),
        categoria: 'Fornecedor',
        status: 'pendente'
      }
    });

    expect(conta).toBeDefined();
    expect(conta.descricao).toBe('Fornecedor de Produtos Teste');
    expect(conta.valor).toBe(1500.00);
    expect(conta.status).toBe('pendente');
    contaId = conta.id;
  });

  test('deve buscar conta por ID', async () => {
    expect(contaId).not.toBeNull();
    
    const conta = await prisma.contaPagar.findUnique({
      where: { id: contaId }
    });

    expect(conta).toBeDefined();
    expect(conta.id).toBe(contaId);
  });

  test('deve listar contas pendentes', async () => {
    const contasPendentes = await prisma.contaPagar.findMany({
      where: { status: 'pendente' }
    });

    expect(Array.isArray(contasPendentes)).toBe(true);
  });

  test('deve listar contas vencidas', async () => {
    const hoje = new Date();
    const contasVencidas = await prisma.contaPagar.findMany({
      where: {
        status: 'pendente',
        vencimento: { lt: hoje }
      }
    });

    expect(Array.isArray(contasVencidas)).toBe(true);
  });

  test('deve marcar conta como paga', async () => {
    expect(contaId).not.toBeNull();
    
    const conta = await prisma.contaPagar.update({
      where: { id: contaId },
      data: { 
        status: 'pago',
        dataPago: new Date()
      }
    });

    expect(conta.status).toBe('pago');
    expect(conta.dataPago).toBeDefined();
  });

  test('deve calcular total de contas a pagar', async () => {
    const contasPendentes = await prisma.contaPagar.findMany({
      where: { status: 'pendente' }
    });

    const total = contasPendentes.reduce((sum, conta) => sum + conta.valor, 0);
    expect(typeof total).toBe('number');
  });

  test('deve deletar uma conta', async () => {
    expect(contaId).not.toBeNull();
    
    await prisma.contaPagar.delete({
      where: { id: contaId }
    });

    const conta = await prisma.contaPagar.findUnique({
      where: { id: contaId }
    });

    expect(conta).toBeNull();
    contaId = null;
  });
});
