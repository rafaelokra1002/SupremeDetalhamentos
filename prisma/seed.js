const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@supreme.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@supreme.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  // Criar usuário funcionário
  const funcPassword = await bcrypt.hash('func123', 10);
  const funcionario = await prisma.user.upsert({
    where: { email: 'funcionario@supreme.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'funcionario@supreme.com',
      password: funcPassword,
      role: 'funcionario',
    },
  });
  console.log('✅ Usuário funcionário criado:', funcionario.email);

  // Criar serviços padrão
  const servicos = [
    { nome: 'Vitrificação de Pintura', valor: 1500, descricao: 'Proteção cerâmica de alta durabilidade' },
    { nome: 'Polimento Técnico', valor: 800, descricao: 'Correção de pintura e brilho espelhado' },
    { nome: 'Polimento Cristalizado', valor: 500, descricao: 'Polimento com acabamento cristalizado' },
    { nome: 'Lavagem Técnica', valor: 150, descricao: 'Lavagem detalhada com produtos premium' },
    { nome: 'Higienização Interna', valor: 300, descricao: 'Limpeza completa do interior' },
    { nome: 'Vitrificação de Vidros', valor: 400, descricao: 'Tratamento hidrofóbico nos vidros' },
    { nome: 'Vitrificação de Rodas', valor: 350, descricao: 'Proteção cerâmica nas rodas' },
    { nome: 'Revitalização de Plásticos', valor: 200, descricao: 'Tratamento de plásticos externos' },
    { nome: 'Descontaminação de Pintura', valor: 250, descricao: 'Remoção de contaminantes da pintura' },
    { nome: 'Proteção de Couro', valor: 350, descricao: 'Hidratação e proteção de bancos de couro' },
  ];

  for (const servico of servicos) {
    await prisma.servico.upsert({
      where: { id: servico.nome.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: servico,
    });
  }
  console.log('✅ Serviços padrão criados');

  // Criar produtos padrão
  const produtos = [
    { nome: 'Ceramic Pro 9H', categoria: 'Vitrificação', marca: 'Ceramic Pro', quantidade: 10, valorUnitario: 350 },
    { nome: 'Compound Polish', categoria: 'Polimento', marca: 'Menzerna', quantidade: 15, valorUnitario: 180 },
    { nome: 'Finish Polish', categoria: 'Polimento', marca: 'Menzerna', quantidade: 12, valorUnitario: 160 },
    { nome: 'Shampoo Neutro', categoria: 'Lavagem', marca: 'Vonixx', quantidade: 20, valorUnitario: 45 },
    { nome: 'Desengraxante', categoria: 'Lavagem', marca: 'Vonixx', quantidade: 8, valorUnitario: 55 },
    { nome: 'Hidratante de Couro', categoria: 'Interno', marca: 'Leather Care', quantidade: 6, valorUnitario: 120 },
    { nome: 'Limpa Vidros', categoria: 'Vidros', marca: 'Soft99', quantidade: 10, valorUnitario: 65 },
    { nome: 'Iron Remover', categoria: 'Descontaminação', marca: 'CarPro', quantidade: 5, valorUnitario: 180 },
  ];

  for (const produto of produtos) {
    await prisma.produto.create({
      data: produto,
    });
  }
  console.log('✅ Produtos padrão criados');

  // Criar clientes de exemplo
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Carlos Eduardo Mendes',
      cpfCnpj: '123.456.789-00',
      telefone: '(11) 99999-8888',
      whatsapp: '(11) 99999-8888',
      email: 'carlos@email.com',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Maria Fernanda Silva',
      cpfCnpj: '987.654.321-00',
      telefone: '(11) 98888-7777',
      whatsapp: '(11) 98888-7777',
      email: 'maria@email.com',
    },
  });
  console.log('✅ Clientes de exemplo criados');

  // Criar veículos de exemplo
  await prisma.veiculo.create({
    data: {
      clienteId: cliente1.id,
      tipo: 'carro',
      marca: 'BMW',
      modelo: 'M3',
      ano: '2023',
      placa: 'ABC-1234',
      cor: 'Preto',
    },
  });

  await prisma.veiculo.create({
    data: {
      clienteId: cliente2.id,
      tipo: 'carro',
      marca: 'Mercedes-Benz',
      modelo: 'C300',
      ano: '2022',
      placa: 'XYZ-5678',
      cor: 'Branco',
    },
  });
  console.log('✅ Veículos de exemplo criados');

  console.log('');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('');
  console.log('📧 Credenciais de acesso:');
  console.log('   Admin: admin@supreme.com / admin123');
  console.log('   Funcionário: funcionario@supreme.com / func123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
