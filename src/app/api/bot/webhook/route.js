import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

const getApiKey = (request) => {
  const auth = request.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return request.headers.get('x-api-key') || '';
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

const parseValor = (text) => {
  const match = text.match(/(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;
  let valorStr = match[1].replace(/\s/g, '');
  if (valorStr.includes('.') && valorStr.includes(',')) {
    valorStr = valorStr.replace(/\./g, '').replace(',', '.');
  } else {
    valorStr = valorStr.replace(',', '.');
  }
  const valor = parseFloat(valorStr);
  if (Number.isNaN(valor)) return null;
  return { valor, raw: match[1] };
};

const parseCategoria = (text) => {
  const match = text.match(/\b(categoria|cat)\s*:\s*([^,;\n]+)/i);
  if (!match) return null;
  return match[2].trim();
};

const limparDescricao = (text, rawValor) => {
  let descricao = text
    .replace(/\b(paguei|gastei|gasto|recebi|recebido|receita)\b/gi, '')
    .replace(/\b(valor|r\$|reais|rs)\b/gi, '')
    .replace(/\b(categoria|cat)\s*:\s*([^,;\n]+)/gi, '')
    .replace(rawValor, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!descricao) return 'Registro via bot';
  return descricao.charAt(0).toUpperCase() + descricao.slice(1);
};

const detectarTipo = (text) => {
  const lower = text.toLowerCase();
  if (/(\bpaguei\b|\bgastei\b|\bgasto\b)/.test(lower)) return 'pagar';
  if (/(\brecebi\b|\brecebido\b|\breceita\b)/.test(lower)) return 'receber';
  return null;
};

const detectarConsulta = (text) => {
  const lower = text.toLowerCase().trim();
  
  // Comandos de consulta financeira
  if (/^(resumo|relat[oó]rio|financeiro|faturamento)(\s|$)/i.test(lower)) return 'resumo';
  if (/^(gastos?|despesas?|contas?\s*a?\s*pagar)(\s|$)/i.test(lower)) return 'gastos';
  if (/^(receitas?|entradas?|contas?\s*a?\s*receber)(\s|$)/i.test(lower)) return 'receitas';
  if (/^(saldo|lucro|balan[cç]o)(\s|$)/i.test(lower)) return 'saldo';
  if (/^(pendentes?|a\s*receber|a\s*pagar)(\s|$)/i.test(lower)) return 'pendentes';
  if (/^(hoje|dia|di[aá]rio)(\s|$)/i.test(lower)) return 'hoje';
  if (/^(semana|semanal)(\s|$)/i.test(lower)) return 'semana';
  if (/^(m[eê]s|mensal)(\s|$)/i.test(lower)) return 'mes';
  if (/^(ajuda|help|comandos|\?)(\s|$)/i.test(lower)) return 'ajuda';
  
  return null;
};

const garantirClienteBot = async () => {
  const nome = 'Financeiro Bot';
  const existente = await prisma.cliente.findFirst({ where: { nome } });
  if (existente) return existente;
  return prisma.cliente.create({
    data: {
      nome,
      observacoes: 'Cliente criado automaticamente para registros do bot.',
    },
  });
};

// Funções de consulta financeira
const getResumoFinanceiro = async () => {
  const now = new Date();
  const inicioDia = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inicioSemana = new Date(now);
  inicioSemana.setDate(now.getDate() - now.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

  const [faturamentoDia, faturamentoSemana, faturamentoMes, despesasMes] = await Promise.all([
    prisma.ordemServico.aggregate({
      where: {
        status: 'entregue',
        dataSaida: { gte: inicioDia },
      },
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.ordemServico.aggregate({
      where: {
        status: 'entregue',
        dataSaida: { gte: inicioSemana },
      },
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.ordemServico.aggregate({
      where: {
        status: 'entregue',
        dataSaida: { gte: inicioMes },
      },
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.contaPagar.aggregate({
      where: {
        status: 'pago',
        dataPago: { gte: inicioMes },
      },
      _sum: { valor: true },
    }),
  ]);

  const lucroMes = (faturamentoMes._sum.valorTotal || 0) - (despesasMes._sum.valor || 0);

  return {
    mensagem: `📊 *RESUMO FINANCEIRO*\n\n` +
      `📅 *Hoje:*\n` +
      `   💰 ${formatCurrency(faturamentoDia._sum.valorTotal)} (${faturamentoDia._count} ordens)\n\n` +
      `📅 *Semana:*\n` +
      `   💰 ${formatCurrency(faturamentoSemana._sum.valorTotal)} (${faturamentoSemana._count} ordens)\n\n` +
      `📅 *Mês:*\n` +
      `   💰 Faturamento: ${formatCurrency(faturamentoMes._sum.valorTotal)}\n` +
      `   💸 Despesas: ${formatCurrency(despesasMes._sum.valor)}\n` +
      `   📈 Lucro: ${formatCurrency(lucroMes)}`,
  };
};

const getGastos = async () => {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [gastosMes, gastosPendentes] = await Promise.all([
    prisma.contaPagar.findMany({
      where: {
        status: 'pago',
        dataPago: { gte: inicioMes },
      },
      orderBy: { dataPago: 'desc' },
      take: 10,
    }),
    prisma.contaPagar.aggregate({
      where: { status: 'pendente' },
      _sum: { valor: true },
      _count: true,
    }),
  ]);

  let msg = `💸 *GASTOS DO MÊS*\n\n`;
  
  if (gastosMes.length === 0) {
    msg += `Nenhum gasto registrado este mês.\n`;
  } else {
    const totalPago = gastosMes.reduce((acc, g) => acc + (g.valor || 0), 0);
    gastosMes.forEach((g) => {
      msg += `• ${g.descricao}: ${formatCurrency(g.valor)}\n`;
    });
    msg += `\n💰 *Total pago:* ${formatCurrency(totalPago)}\n`;
  }

  msg += `\n⏳ *Pendentes:* ${formatCurrency(gastosPendentes._sum.valor)} (${gastosPendentes._count} contas)`;

  return { mensagem: msg };
};

const getReceitas = async () => {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const receitasMes = await prisma.ordemServico.findMany({
    where: {
      status: 'entregue',
      dataSaida: { gte: inicioMes },
    },
    include: {
      cliente: { select: { nome: true } },
      veiculo: { select: { marca: true, modelo: true } },
    },
    orderBy: { dataSaida: 'desc' },
    take: 10,
  });

  let msg = `💰 *RECEITAS DO MÊS*\n\n`;

  if (receitasMes.length === 0) {
    msg += `Nenhuma receita registrada este mês.`;
  } else {
    const total = receitasMes.reduce((acc, r) => acc + (r.valorTotal || 0), 0);
    receitasMes.forEach((r) => {
      const veiculo = `${r.veiculo?.marca || ''} ${r.veiculo?.modelo || ''}`.trim();
      msg += `• ${r.cliente?.nome || 'Cliente'} - ${veiculo}: ${formatCurrency(r.valorTotal)}\n`;
    });
    msg += `\n💰 *Total:* ${formatCurrency(total)}`;
  }

  return { mensagem: msg };
};

const getSaldo = async () => {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [receitas, despesas] = await Promise.all([
    prisma.ordemServico.aggregate({
      where: {
        status: 'entregue',
        dataSaida: { gte: inicioMes },
      },
      _sum: { valorTotal: true },
    }),
    prisma.contaPagar.aggregate({
      where: {
        status: 'pago',
        dataPago: { gte: inicioMes },
      },
      _sum: { valor: true },
    }),
  ]);

  const totalReceitas = receitas._sum.valorTotal || 0;
  const totalDespesas = despesas._sum.valor || 0;
  const saldo = totalReceitas - totalDespesas;
  const emoji = saldo >= 0 ? '📈' : '📉';

  return {
    mensagem: `${emoji} *SALDO DO MÊS*\n\n` +
      `💰 Receitas: ${formatCurrency(totalReceitas)}\n` +
      `💸 Despesas: ${formatCurrency(totalDespesas)}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `${emoji} *Saldo:* ${formatCurrency(saldo)}`,
  };
};

const getPendentes = async () => {
  const [aReceber, aPagar] = await Promise.all([
    prisma.ordemServico.aggregate({
      where: { status: 'finalizada' },
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.contaPagar.aggregate({
      where: { status: 'pendente' },
      _sum: { valor: true },
      _count: true,
    }),
  ]);

  return {
    mensagem: `⏳ *PENDENTES*\n\n` +
      `💰 *A Receber:*\n` +
      `   ${formatCurrency(aReceber._sum.valorTotal)} (${aReceber._count} ordens)\n\n` +
      `💸 *A Pagar:*\n` +
      `   ${formatCurrency(aPagar._sum.valor)} (${aPagar._count} contas)`,
  };
};

const getFaturamentoHoje = async () => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const resultado = await prisma.ordemServico.aggregate({
    where: {
      status: 'entregue',
      dataSaida: { gte: hoje },
    },
    _sum: { valorTotal: true },
    _count: true,
  });

  return {
    mensagem: `📅 *FATURAMENTO DE HOJE*\n\n` +
      `💰 ${formatCurrency(resultado._sum.valorTotal)}\n` +
      `📋 ${resultado._count} ordem(s) entregue(s)`,
  };
};

const getFaturamentoSemana = async () => {
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const resultado = await prisma.ordemServico.aggregate({
    where: {
      status: 'entregue',
      dataSaida: { gte: inicioSemana },
    },
    _sum: { valorTotal: true },
    _count: true,
  });

  return {
    mensagem: `📅 *FATURAMENTO DA SEMANA*\n\n` +
      `💰 ${formatCurrency(resultado._sum.valorTotal)}\n` +
      `📋 ${resultado._count} ordem(s) entregue(s)`,
  };
};

const getFaturamentoMes = async () => {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const resultado = await prisma.ordemServico.aggregate({
    where: {
      status: 'entregue',
      dataSaida: { gte: inicioMes },
    },
    _sum: { valorTotal: true },
    _count: true,
  });

  const mesNome = new Date().toLocaleDateString('pt-BR', { month: 'long' });

  return {
    mensagem: `📅 *FATURAMENTO DE ${mesNome.toUpperCase()}*\n\n` +
      `💰 ${formatCurrency(resultado._sum.valorTotal)}\n` +
      `📋 ${resultado._count} ordem(s) entregue(s)`,
  };
};

const getAjuda = () => {
  return {
    mensagem: `🤖 *COMANDOS DISPONÍVEIS*\n\n` +
      `📊 *Consultas:*\n` +
      `• *resumo* - Resumo financeiro geral\n` +
      `• *hoje* - Faturamento do dia\n` +
      `• *semana* - Faturamento da semana\n` +
      `• *mes* - Faturamento do mês\n` +
      `• *gastos* - Gastos do mês\n` +
      `• *receitas* - Receitas do mês\n` +
      `• *saldo* - Saldo/Lucro do mês\n` +
      `• *pendentes* - Valores pendentes\n\n` +
      `💰 *Registrar:*\n` +
      `• *paguei* [valor] [descrição]\n` +
      `  Ex: paguei 150 material limpeza\n\n` +
      `• *recebi* [valor] [descrição]\n` +
      `  Ex: recebi 500 serviço extra\n\n` +
      `💡 Dica: Use "cat: nome" para categoria\n` +
      `  Ex: gastei 80 gasolina cat: combustível`,
  };
};

export async function POST(request) {
  try {
    const apiKeyEnv = process.env.BOT_API_KEY;
    if (apiKeyEnv) {
      const apiKey = getApiKey(request);
      if (!apiKey || apiKey !== apiKeyEnv) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    }

    const body = await request.json();
    const text = (body?.text || body?.mensagem || body?.message || '').toString().trim();

    if (!text) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    // Verificar se é uma consulta
    const consulta = detectarConsulta(text);
    if (consulta) {
      let resultado;
      switch (consulta) {
        case 'resumo':
          resultado = await getResumoFinanceiro();
          break;
        case 'gastos':
          resultado = await getGastos();
          break;
        case 'receitas':
          resultado = await getReceitas();
          break;
        case 'saldo':
          resultado = await getSaldo();
          break;
        case 'pendentes':
          resultado = await getPendentes();
          break;
        case 'hoje':
          resultado = await getFaturamentoHoje();
          break;
        case 'semana':
          resultado = await getFaturamentoSemana();
          break;
        case 'mes':
          resultado = await getFaturamentoMes();
          break;
        case 'ajuda':
          resultado = getAjuda();
          break;
        default:
          resultado = { mensagem: 'Comando não reconhecido. Digite *ajuda* para ver os comandos disponíveis.' };
      }
      return NextResponse.json({ ok: true, tipo: 'consulta', ...resultado }, { status: 200 });
    }

    // Se não é consulta, tenta registrar gasto/receita
    const tipo = detectarTipo(text);
    if (!tipo) {
      return NextResponse.json({ 
        ok: false,
        mensagem: '❓ Não entendi. Digite *ajuda* para ver os comandos disponíveis.\n\nExemplos:\n• resumo\n• paguei 100 almoço\n• recebi 500 serviço extra'
      }, { status: 200 });
    }

    const valorInfo = parseValor(text);
    if (!valorInfo) {
      return NextResponse.json({ 
        ok: false,
        mensagem: '❌ Não consegui identificar o valor. Exemplo: paguei 150 material limpeza'
      }, { status: 200 });
    }

    const categoria = parseCategoria(text);
    const descricao = limparDescricao(text, valorInfo.raw);

    if (tipo === 'pagar') {
      const conta = await prisma.contaPagar.create({
        data: {
          descricao,
          categoria: categoria || null,
          valor: valorInfo.valor,
          vencimento: new Date(),
          status: 'pago',
          dataPago: new Date(),
        },
      });

      return NextResponse.json({ 
        ok: true, 
        tipo: 'gasto', 
        conta,
        mensagem: `✅ *Gasto registrado!*\n\n💸 ${formatCurrency(valorInfo.valor)}\n📝 ${descricao}${categoria ? `\n🏷️ ${categoria}` : ''}`
      }, { status: 201 });
    }

    const cliente = await garantirClienteBot();
    const conta = await prisma.contaReceber.create({
      data: {
        clienteId: cliente.id,
        descricao,
        valor: valorInfo.valor,
        formaPagamento: 'Bot',
        status: 'recebido',
        dataRecebido: new Date(),
      },
    });

    return NextResponse.json({ 
      ok: true, 
      tipo: 'recebimento', 
      conta,
      mensagem: `✅ *Receita registrada!*\n\n💰 ${formatCurrency(valorInfo.valor)}\n📝 ${descricao}`
    }, { status: 201 });
  } catch (error) {
    console.error('Erro no webhook do bot:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
