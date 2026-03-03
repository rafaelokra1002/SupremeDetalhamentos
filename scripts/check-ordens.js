const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const todas = await prisma.ordemServico.findMany({
    select: { id: true, status: true }
  });
  
  console.log('=== TODAS AS ORDENS ===');
  console.log('Total:', todas.length);
  
  const contagem = {};
  todas.forEach(o => {
    contagem[o.status] = (contagem[o.status] || 0) + 1;
  });
  
  console.log('\nPor status:');
  Object.keys(contagem).forEach(status => {
    console.log(`  ${status}: ${contagem[status]}`);
  });
  
  console.log('\nAbertas + Em Andamento:', (contagem['aberta'] || 0) + (contagem['em_andamento'] || 0));
  console.log('Finalizadas + Entregues:', (contagem['finalizada'] || 0) + (contagem['entregue'] || 0));
}

main().catch(console.error).finally(() => prisma.$disconnect());
