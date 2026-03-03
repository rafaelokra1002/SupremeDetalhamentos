const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDataSaida() {
  try {
    // Atualizar ordens finalizadas/entregues que não têm dataSaida
    const result = await prisma.$executeRaw`
      UPDATE "OrdemServico" 
      SET "dataSaida" = "updatedAt" 
      WHERE status IN ('finalizada', 'entregue') 
      AND "dataSaida" IS NULL
    `;
    
    console.log(`Ordens atualizadas: ${result}`);
  } catch (error) {
    console.error('Erro ao atualizar ordens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDataSaida();
