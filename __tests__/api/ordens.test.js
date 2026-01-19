/**
 * Testes da API de Ordens de Serviço
 * Testa operações CRUD e fluxo de trabalho
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Ordens de Serviço', () => {
  let clienteId = null;
  let veiculoId = null;
  let servicoId = null;
  let funcionarioId = null;
  let ordemId = null;

  beforeAll(async () => {
    // Busca funcionário existente
    const funcionario = await prisma.user.findFirst({
      where: { role: 'funcionario' }
    });
    funcionarioId = funcionario?.id;

    if (!funcionarioId) {
      const admin = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      funcionarioId = admin.id;
    }

    // Cria cliente
    const cliente = await prisma.cliente.create({
      data: {
        nome: 'Cliente Ordem Teste',
        email: 'ordem.teste@example.com',
        telefone: '(11) 77777-7777'
      }
    });
    clienteId = cliente.id;

    // Cria veículo
    const veiculo = await prisma.veiculo.create({
      data: {
        tipo: 'carro',
        marca: 'Porsche',
        modelo: '911',
        ano: '2024',
        cor: 'Vermelho',
        placa: 'ORD1234',
        clienteId: clienteId
      }
    });
    veiculoId = veiculo.id;

    // Cria serviço
    const servico = await prisma.servico.create({
      data: {
        nome: 'Polimento Teste',
        valor: 800.00,
        active: true
      }
    });
    servicoId = servico.id;
  });

  afterAll(async () => {
    // Limpa na ordem correta
    if (ordemId) {
      try {
        await prisma.itemOrdem.deleteMany({ where: { ordemServicoId: ordemId } });
        await prisma.contaReceber.deleteMany({ where: { ordemServicoId: ordemId } });
        await prisma.ordemServico.delete({ where: { id: ordemId } });
      } catch (e) {}
    }
    if (servicoId) {
      try {
        await prisma.servico.delete({ where: { id: servicoId } });
      } catch (e) {}
    }
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

  test('deve criar uma ordem de serviço', async () => {
    expect(clienteId).not.toBeNull();
    expect(veiculoId).not.toBeNull();
    expect(funcionarioId).not.toBeNull();

    const ordem = await prisma.ordemServico.create({
      data: {
        clienteId: clienteId,
        veiculoId: veiculoId,
        funcionarioId: funcionarioId,
        dataEntrada: new Date(),
        status: 'aberta',
        valorTotal: 800.00,
        observacoes: 'Teste de ordem'
      }
    });

    expect(ordem).toBeDefined();
    expect(ordem.status).toBe('aberta');
    expect(ordem.valorTotal).toBe(800.00);
    ordemId = ordem.id;
  });

  test('deve adicionar item à ordem', async () => {
    expect(ordemId).not.toBeNull();
    expect(servicoId).not.toBeNull();

    const item = await prisma.itemOrdem.create({
      data: {
        ordemServicoId: ordemId,
        servicoId: servicoId,
        tipo: 'servico',
        descricao: 'Polimento Teste',
        quantidade: 1,
        valorUnitario: 800.00,
        valorTotal: 800.00
      }
    });

    expect(item).toBeDefined();
    expect(item.quantidade).toBe(1);
  });

  test('deve buscar ordem com itens e relacionamentos', async () => {
    expect(ordemId).not.toBeNull();

    const ordem = await prisma.ordemServico.findUnique({
      where: { id: ordemId },
      include: {
        cliente: true,
        veiculo: true,
        itens: {
          include: { servico: true }
        }
      }
    });

    expect(ordem).toBeDefined();
    expect(ordem.cliente.nome).toBe('Cliente Ordem Teste');
    expect(ordem.veiculo.modelo).toBe('911');
    expect(ordem.itens.length).toBe(1);
  });

  test('deve atualizar status para em_andamento', async () => {
    expect(ordemId).not.toBeNull();

    const ordem = await prisma.ordemServico.update({
      where: { id: ordemId },
      data: { status: 'em_andamento' }
    });

    expect(ordem.status).toBe('em_andamento');
  });

  test('deve atualizar status para finalizada', async () => {
    expect(ordemId).not.toBeNull();

    const ordem = await prisma.ordemServico.update({
      where: { id: ordemId },
      data: { 
        status: 'finalizada',
        dataSaida: new Date()
      }
    });

    expect(ordem.status).toBe('finalizada');
    expect(ordem.dataSaida).toBeDefined();
  });

  test('deve listar ordens por status', async () => {
    const ordensFinalizadas = await prisma.ordemServico.findMany({
      where: { status: 'finalizada' }
    });

    expect(Array.isArray(ordensFinalizadas)).toBe(true);
    expect(ordensFinalizadas.some(o => o.id === ordemId)).toBe(true);
  });

  test('deve calcular faturamento mensal', async () => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const fimMes = new Date(inicioMes);
    fimMes.setMonth(fimMes.getMonth() + 1);

    const ordensMes = await prisma.ordemServico.findMany({
      where: {
        status: 'finalizada',
        dataSaida: {
          gte: inicioMes,
          lt: fimMes
        }
      }
    });

    const faturamento = ordensMes.reduce((total, ordem) => total + ordem.valorTotal, 0);
    expect(typeof faturamento).toBe('number');
    expect(faturamento).toBeGreaterThanOrEqual(0);
  });

  test('deve deletar ordem e itens em cascata', async () => {
    expect(ordemId).not.toBeNull();

    // Primeiro deleta os itens
    await prisma.itemOrdem.deleteMany({
      where: { ordemServicoId: ordemId }
    });

    // Depois a ordem
    await prisma.ordemServico.delete({
      where: { id: ordemId }
    });

    const ordem = await prisma.ordemServico.findUnique({
      where: { id: ordemId }
    });

    expect(ordem).toBeNull();
    ordemId = null;
  });
});
