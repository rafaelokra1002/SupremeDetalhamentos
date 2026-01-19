/**
 * Testes da API de Veículos
 * Testa operações CRUD para veículos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Veículos', () => {
  let clienteId = null;
  let veiculoId = null;

  beforeAll(async () => {
    const cliente = await prisma.cliente.create({
      data: {
        nome: 'Cliente Veículo Teste',
        email: 'veiculo.teste@example.com',
        telefone: '(11) 88888-8888'
      }
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    if (veiculoId) {
      try {
        await prisma.veiculo.delete({ where: { id: veiculoId } });
      } catch (e) {}
    }
    if (clienteId) {
      try {
        await prisma.cliente.delete({ where: { id: clienteId } });
      } catch (e) {}
    }
    await prisma.$disconnect();
  });

  test('deve criar um veículo', async () => {
    expect(clienteId).not.toBeNull();
    
    const veiculo = await prisma.veiculo.create({
      data: {
        tipo: 'carro',
        marca: 'BMW',
        modelo: 'M3',
        ano: '2024',
        cor: 'Preto',
        placa: 'TST1234',
        clienteId: clienteId
      }
    });

    expect(veiculo).toBeDefined();
    expect(veiculo.marca).toBe('BMW');
    expect(veiculo.modelo).toBe('M3');
    expect(veiculo.placa).toBe('TST1234');
    veiculoId = veiculo.id;
  });

  test('deve buscar veículo com cliente associado', async () => {
    expect(veiculoId).not.toBeNull();
    
    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: { cliente: true }
    });

    expect(veiculo).toBeDefined();
    expect(veiculo.cliente).toBeDefined();
    expect(veiculo.cliente.id).toBe(clienteId);
  });

  test('deve atualizar um veículo', async () => {
    expect(veiculoId).not.toBeNull();
    
    const veiculo = await prisma.veiculo.update({
      where: { id: veiculoId },
      data: { cor: 'Azul Metálico' }
    });

    expect(veiculo.cor).toBe('Azul Metálico');
  });

  test('deve listar veículos do cliente', async () => {
    expect(clienteId).not.toBeNull();
    
    const veiculos = await prisma.veiculo.findMany({
      where: { clienteId: clienteId }
    });

    expect(Array.isArray(veiculos)).toBe(true);
    expect(veiculos.length).toBeGreaterThanOrEqual(1);
  });

  test('deve deletar um veículo', async () => {
    expect(veiculoId).not.toBeNull();
    
    await prisma.veiculo.delete({
      where: { id: veiculoId }
    });

    const veiculo = await prisma.veiculo.findUnique({
      where: { id: veiculoId }
    });

    expect(veiculo).toBeNull();
    veiculoId = null;
  });
});
