const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuracaoAgendamento.findFirst();
  console.log('=== CONFIGURAÇÃO DE AGENDAMENTO ===');
  console.log(JSON.stringify(config, null, 2));
  
  console.log('\n=== AGENDAMENTOS DE HOJE ===');
  const hoje = new Date();
  const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
  const dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
  
  const agendamentosHoje = await prisma.agendamento.findMany({
    where: {
      dataAgendamento: {
        gte: dataInicio,
        lte: dataFim
      }
    },
    select: {
      id: true,
      horario: true,
      status: true,
      nomeCliente: true,
      servicoNome: true
    }
  });
  
  console.log(JSON.stringify(agendamentosHoje, null, 2));
  
  console.log('\n=== BLOQUEIOS ===');
  const bloqueios = await prisma.bloqueioAgenda.findMany();
  console.log(JSON.stringify(bloqueios, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
