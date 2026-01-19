/**
 * Testes da API de Contas a Receber
 * Testa operações CRUD para contas a receber
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Contas a Receber', () => {
  let contaId = null;
  let clienteId = null;

  beforeAll(async () => {
    const cliente = await prisma.cliente.create({
      data: {
        nome: 'Cliente Conta Receber Teste',
        email: 'conta.receber@example.com',
        telefone: '(11) 66666-6666'
      }
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    if (contaId) {
      try {
        await prisma.contaReceber.delete({ where: { id: contaId } });
      } catch (e) {}
    }
    if (clienteId) {
      try {
        await prisma.cliente.delete({ where: { id: clienteId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar uma conta a receber', async () => {
    expect(clienteId).not.toBeNull();
    
    const conta = await prisma.contaReceber.create({
      data: {
        descricao: 'Serviço de Vitrificação Teste',
        valor: 3500.00,
        clienteId: clienteId,
        status: 'pendente',
        formaPagamento: 'Cartão'
      }
    });

    expect(conta).toBeDefined();
    expect(conta.descricao).toBe('Serviço de Vitrificação Teste');
    expect(conta.valor).toBe(3500.00);
    expect(conta.status).toBe('pendente');
    contaId = conta.id;
  });

  test('deve buscar conta com cliente associado', async () => {
    expect(contaId).not.toBeNull();
    
    const conta = await prisma.contaReceber.findUnique({
      where: { id: contaId },
      include: { cliente: true }
    });

    expect(conta).toBeDefined();
    expect(conta.cliente).toBeDefined();
    expect(conta.cliente.nome).toBe('Cliente Conta Receber Teste');
  });

  test('deve listar contas por cliente', async () => {
    expect(clienteId).not.toBeNull();
    
    const contasCliente = await prisma.contaReceber.findMany({
      where: { clienteId: clienteId }
    });

    expect(Array.isArray(contasCliente)).toBe(true);
    expect(contasCliente.length).toBeGreaterThanOrEqual(1);
  });

  test('deve marcar conta como recebida', async () => {
    expect(contaId).not.toBeNull();
    
    const conta = await prisma.contaReceber.update({
      where: { id: contaId },
      data: { 
        status: 'recebido',
        dataRecebido: new Date()
      }
    });

    expect(conta.status).toBe('recebido');
    expect(conta.dataRecebido).toBeDefined();
  });

  test('deve calcular total a receber', async () => {
    const contasPendentes = await prisma.contaReceber.findMany({
      where: { status: 'pendente' }
    });

    const total = contasPendentes.reduce((sum, conta) => sum + conta.valor, 0);
    expect(typeof total).toBe('number');
  });

  test('deve deletar uma conta', async () => {
    expect(contaId).not.toBeNull();
    
    await prisma.contaReceber.delete({
      where: { id: contaId }
    });

    const conta = await prisma.contaReceber.findUnique({
      where: { id: contaId }
    });

    expect(conta).toBeNull();
    contaId = null;
  });
});
