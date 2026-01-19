/**
 * Testes de Integração do Dashboard
 * Verifica se os dados do dashboard são calculados corretamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Dashboard - Estatísticas', () => {
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve calcular total de clientes', async () => {
    const totalClientes = await prisma.cliente.count();
    expect(typeof totalClientes).toBe('number');
    expect(totalClientes).toBeGreaterThanOrEqual(0);
  });

  test('deve calcular total de veículos', async () => {
    const totalVeiculos = await prisma.veiculo.count();
    expect(typeof totalVeiculos).toBe('number');
    expect(totalVeiculos).toBeGreaterThanOrEqual(0);
  });

  test('deve calcular ordens por status', async () => {
    const ordensAbertas = await prisma.ordemServico.count({
      where: { status: 'aberta' }
    });

    const ordensAndamento = await prisma.ordemServico.count({
      where: { status: 'em_andamento' }
    });

    const ordensFinalizadas = await prisma.ordemServico.count({
      where: { status: 'finalizada' }
    });

    expect(typeof ordensAbertas).toBe('number');
    expect(typeof ordensAndamento).toBe('number');
    expect(typeof ordensFinalizadas).toBe('number');
  });

  test('deve calcular faturamento total', async () => {
    const ordensFinalizadas = await prisma.ordemServico.findMany({
      where: { status: 'finalizada' }
    });

    const faturamento = ordensFinalizadas.reduce(
      (total, ordem) => total + (ordem.valorTotal || 0), 
      0
    );

    expect(typeof faturamento).toBe('number');
    expect(faturamento).toBeGreaterThanOrEqual(0);
  });

  test('deve listar produtos com estoque baixo', async () => {
    const produtosBaixoEstoque = await prisma.produto.findMany({
      where: {
        quantidade: { lte: 5 }
      }
    });

    expect(Array.isArray(produtosBaixoEstoque)).toBe(true);
  });

  test('deve listar serviços ativos', async () => {
    const servicosAtivos = await prisma.servico.findMany({
      where: { active: true }
    });

    expect(Array.isArray(servicosAtivos)).toBe(true);
    expect(servicosAtivos.length).toBeGreaterThan(0);
  });

  test('deve calcular contas a pagar pendentes', async () => {
    const contasPagar = await prisma.contaPagar.findMany({
      where: { status: 'pendente' }
    });

    const total = contasPagar.reduce((sum, c) => sum + c.valor, 0);
    expect(typeof total).toBe('number');
  });

  test('deve calcular contas a receber pendentes', async () => {
    const contasReceber = await prisma.contaReceber.findMany({
      where: { status: 'pendente' }
    });

    const total = contasReceber.reduce((sum, c) => sum + c.valor, 0);
    expect(typeof total).toBe('number');
  });

  test('deve buscar ordens recentes', async () => {
    const ordensRecentes = await prisma.ordemServico.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    expect(Array.isArray(ordensRecentes)).toBe(true);
    ordensRecentes.forEach(ordem => {
      expect(ordem.cliente).toBeDefined();
      expect(ordem.veiculo).toBeDefined();
    });
  });

  test('deve buscar total de usuários', async () => {
    const totalUsuarios = await prisma.user.count();
    expect(totalUsuarios).toBeGreaterThanOrEqual(2); // admin e funcionario
  });
});
