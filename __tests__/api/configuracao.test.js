/**
 * Testes da API de Configuração
 * Testa operações de configuração da empresa
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('API Configuração', () => {
  let configId = null;

  beforeAll(async () => {
    // Cria uma configuração inicial para os testes
    await prisma.configuracao.deleteMany();
    const config = await prisma.configuracao.create({
      data: {
        nomeEmpresa: 'Supreme Detalhamento Teste',
        telefoneEmpresa: '(11) 99999-9999',
        emailEmpresa: 'contato@supreme.com'
      }
    });
    configId = config.id;
  }, 15000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('deve buscar configuração existente', async () => {
    const config = await prisma.configuracao.findFirst();
    
    expect(config).toBeDefined();
    expect(config).not.toBeNull();
    expect(config.nomeEmpresa).toBeDefined();
  });

  test('deve atualizar configuração da empresa', async () => {
    expect(configId).not.toBeNull();

    const config = await prisma.configuracao.update({
      where: { id: configId },
      data: { 
        nomeEmpresa: 'Supreme Detalhamento Atualizado',
        facebookEmpresa: 'facebook.com/supreme'
      }
    });

    expect(config.nomeEmpresa).toBe('Supreme Detalhamento Atualizado');
    expect(config.facebookEmpresa).toBe('facebook.com/supreme');
  });

  test('configuração deve ter todos os campos esperados', async () => {
    const config = await prisma.configuracao.findFirst();
    
    expect(config).not.toBeNull();
    expect(config).toHaveProperty('nomeEmpresa');
    expect(config).toHaveProperty('logoEmpresa');
    expect(config).toHaveProperty('telefoneEmpresa');
    expect(config).toHaveProperty('emailEmpresa');
    expect(config).toHaveProperty('enderecoEmpresa');
    expect(config).toHaveProperty('instagramEmpresa');
    expect(config).toHaveProperty('facebookEmpresa');
    expect(config).toHaveProperty('whatsappEmpresa');
  });
});

describe('API Perfil de Usuário', () => {
  
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('usuário deve ter campos de avatar e telefone', async () => {
    const user = await prisma.user.findFirst();
    
    expect(user).toHaveProperty('avatar');
    expect(user).toHaveProperty('telefone');
  });

  test('deve atualizar avatar do usuário', async () => {
    const user = await prisma.user.findFirst();
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        telefone: '(11) 98765-4321'
      }
    });

    expect(updatedUser.avatar).toBeDefined();
    expect(updatedUser.telefone).toBe('(11) 98765-4321');

    // Limpa após o teste
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null, telefone: null }
    });
  });
});
