/**
 * Testes da API de Produtos
 * Testa operações CRUD para produtos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Produtos', () => {
  let produtoId = null;

  afterAll(async () => {
    if (produtoId) {
      try {
        await prisma.produto.delete({ where: { id: produtoId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar um produto', async () => {
    const produto = await prisma.produto.create({
      data: {
        nome: 'Cera Teste Premium',
        categoria: 'Ceras',
        marca: 'TesteBrand',
        valorUnitario: 299.99,
        quantidade: 10,
        estoqueMinimo: 2
      }
    });

    expect(produto).toBeDefined();
    expect(produto.nome).toBe('Cera Teste Premium');
    expect(produto.valorUnitario).toBe(299.99);
    produtoId = produto.id;
  });

  test('deve buscar produto por ID', async () => {
    expect(produtoId).not.toBeNull();
    
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    expect(produto).toBeDefined();
    expect(produto.id).toBe(produtoId);
  });

  test('deve atualizar quantidade do produto', async () => {
    expect(produtoId).not.toBeNull();
    
    const produto = await prisma.produto.update({
      where: { id: produtoId },
      data: { quantidade: 15 }
    });

    expect(produto.quantidade).toBe(15);
  });

  test('deve listar todos os produtos', async () => {
    const produtos = await prisma.produto.findMany();
    expect(Array.isArray(produtos)).toBe(true);
    expect(produtos.length).toBeGreaterThan(0);
  });

  test('deve verificar produtos com estoque baixo', async () => {
    const produtosBaixoEstoque = await prisma.produto.findMany({
      where: {
        quantidade: { lte: 5 }
      }
    });

    expect(Array.isArray(produtosBaixoEstoque)).toBe(true);
  });

  test('deve deletar um produto', async () => {
    expect(produtoId).not.toBeNull();
    
    await prisma.produto.delete({
      where: { id: produtoId }
    });

    const produto = await prisma.produto.findUnique({
      where: { id: produtoId }
    });

    expect(produto).toBeNull();
    produtoId = null;
  });
});
