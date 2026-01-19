/**
 * Testes de Validação de Regras de Negócio
 * Verifica regras de negócio e validações
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Validação de Regras de Negócio', () => {
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Clientes', () => {
    test('deve ter pelo menos um cliente cadastrado', async () => {
      const totalClientes = await prisma.cliente.count();
      expect(totalClientes).toBeGreaterThanOrEqual(1);
    });

    test('clientes devem ter nome preenchido', async () => {
      const clientes = await prisma.cliente.findMany();
      clientes.forEach(cliente => {
        expect(cliente.nome).toBeDefined();
        expect(cliente.nome.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Veículos', () => {
    test('veículos devem ter tipo válido', async () => {
      const tiposValidos = ['carro', 'moto'];
      const veiculos = await prisma.veiculo.findMany();

      veiculos.forEach(veiculo => {
        expect(tiposValidos).toContain(veiculo.tipo);
      });
    });

    test('veículos devem ter marca e modelo', async () => {
      const veiculos = await prisma.veiculo.findMany();

      veiculos.forEach(veiculo => {
        expect(veiculo.marca).toBeDefined();
        expect(veiculo.modelo).toBeDefined();
      });
    });
  });

  describe('Ordens de Serviço', () => {
    test('valor total deve ser positivo ou zero', async () => {
      const ordens = await prisma.ordemServico.findMany();

      ordens.forEach(ordem => {
        expect(ordem.valorTotal).toBeGreaterThanOrEqual(0);
      });
    });

    test('data de saída deve ser após data de entrada quando definida', async () => {
      const ordens = await prisma.ordemServico.findMany({
        where: { dataSaida: { not: null } }
      });

      ordens.forEach(ordem => {
        if (ordem.dataSaida) {
          expect(new Date(ordem.dataSaida).getTime())
            .toBeGreaterThanOrEqual(new Date(ordem.dataEntrada).getTime());
        }
      });
    });

    test('ordens devem ter funcionário associado', async () => {
      const ordens = await prisma.ordemServico.findMany({
        include: { funcionario: true }
      });

      ordens.forEach(ordem => {
        expect(ordem.funcionario).toBeDefined();
        expect(ordem.funcionarioId).toBe(ordem.funcionario.id);
      });
    });
  });

  describe('Produtos', () => {
    test('quantidade não pode ser negativa', async () => {
      const produtos = await prisma.produto.findMany();

      produtos.forEach(produto => {
        expect(produto.quantidade).toBeGreaterThanOrEqual(0);
      });
    });

    test('estoque mínimo deve ser válido', async () => {
      const produtos = await prisma.produto.findMany();

      produtos.forEach(produto => {
        expect(produto.estoqueMinimo).toBeGreaterThanOrEqual(0);
      });
    });

    test('valor unitário deve ser positivo ou zero', async () => {
      const produtos = await prisma.produto.findMany();

      produtos.forEach(produto => {
        expect(produto.valorUnitario).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Serviços', () => {
    test('deve ter serviços cadastrados', async () => {
      const totalServicos = await prisma.servico.count();
      expect(totalServicos).toBeGreaterThan(0);
    });

    test('valor deve ser positivo ou zero', async () => {
      const servicos = await prisma.servico.findMany();

      servicos.forEach(servico => {
        expect(servico.valor).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Contas', () => {
    test('valores de contas a pagar devem ser positivos', async () => {
      const contasPagar = await prisma.contaPagar.findMany();

      contasPagar.forEach(conta => {
        expect(conta.valor).toBeGreaterThan(0);
      });
    });

    test('valores de contas a receber devem ser positivos', async () => {
      const contasReceber = await prisma.contaReceber.findMany();

      contasReceber.forEach(conta => {
        expect(conta.valor).toBeGreaterThan(0);
      });
    });
  });

  describe('Itens de Ordem', () => {
    test('itens devem ter tipo válido', async () => {
      const tiposValidos = ['produto', 'servico'];
      const itens = await prisma.itemOrdem.findMany();

      itens.forEach(item => {
        expect(tiposValidos).toContain(item.tipo);
      });
    });

    test('quantidade deve ser positiva', async () => {
      const itens = await prisma.itemOrdem.findMany();

      itens.forEach(item => {
        expect(item.quantidade).toBeGreaterThan(0);
      });
    });

    test('valor total deve ser calculado corretamente', async () => {
      const itens = await prisma.itemOrdem.findMany();

      itens.forEach(item => {
        const valorEsperado = item.quantidade * item.valorUnitario;
        expect(item.valorTotal).toBeCloseTo(valorEsperado, 2);
      });
    });
  });
});
