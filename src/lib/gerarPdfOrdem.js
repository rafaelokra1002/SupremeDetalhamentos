import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

export async function gerarPdfOrdem(ordem, tipo = 'aberta', configuracao = null) {
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Cores
  const corPrimaria = [30, 30, 30]; // Cinza escuro
  const corSecundaria = [212, 175, 55]; // Dourado
  const corTexto = [60, 60, 60];
  const corClara = [245, 245, 245];

  let yPos = margin;

  // ============ CABEÇALHO ============
  // Fundo do cabeçalho
  doc.setFillColor(...corPrimaria);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Nome da empresa
  const nomeEmpresa = configuracao?.nomeEmpresa || 'SUPREME DETALHAMENTO';
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(nomeEmpresa.toUpperCase(), margin, 22);

  // Linha dourada decorativa
  doc.setDrawColor(...corSecundaria);
  doc.setLineWidth(2);
  doc.line(margin, 28, margin + 60, 28);

  // Tipo do documento
  const tipoDocumento = tipo === 'aberta' ? 'ORDEM DE SERVIÇO' : 'ORDEM DE SERVIÇO - FINALIZADA';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(tipoDocumento, margin, 38);

  // Dados da empresa (lado direito)
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  const empresaInfo = [];
  if (configuracao?.telefoneEmpresa) empresaInfo.push(configuracao.telefoneEmpresa);
  if (configuracao?.emailEmpresa) empresaInfo.push(configuracao.emailEmpresa);
  if (configuracao?.enderecoEmpresa) empresaInfo.push(configuracao.enderecoEmpresa);
  
  empresaInfo.forEach((info, i) => {
    doc.text(info, pageWidth - margin, 15 + (i * 5), { align: 'right' });
  });

  yPos = 55;

  // ============ INFORMAÇÕES DA ORDEM ============
  doc.setFillColor(...corClara);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 28, 3, 3, 'F');
  
  doc.setTextColor(...corTexto);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  // Número da OS - formato OS 001, OS 002, etc.
  const numeroOS = ordem.numero 
    ? `OS ${String(ordem.numero).padStart(3, '0')}` 
    : `OS ${ordem.id?.slice(-4).toUpperCase() || '0000'}`;
  
  doc.text('Nº DA ORDEM', margin + 5, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(numeroOS, margin + 5, yPos + 17);
  
  // Data de Entrada
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRADA', margin + 50, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const dataEntrada = ordem.dataEntrada 
    ? format(new Date(ordem.dataEntrada), "dd/MM/yyyy HH:mm", { locale: ptBR })
    : 'N/A';
  doc.text(dataEntrada, margin + 45, yPos + 16);
  
  // Data de Saída (se finalizada)
  if (tipo === 'finalizada' && ordem.dataSaida) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSÃO', margin + 95, yPos + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const dataSaida = format(new Date(ordem.dataSaida), "dd/MM/yyyy HH:mm", { locale: ptBR });
    doc.text(dataSaida, margin + 95, yPos + 16);
  }

  // Status
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('STATUS', pageWidth - margin - 28, yPos + 7);
  doc.setFillColor(...corSecundaria);
  doc.roundedRect(pageWidth - margin - 38, yPos + 11, 35, 10, 2, 2, 'F');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const statusLabel = {
    aberta: 'ABERTA',
    em_andamento: 'EM ANDAMENTO',
    finalizada: 'FINALIZADA',
    entregue: 'ENTREGUE'
  };
  doc.text(statusLabel[ordem.status] || ordem.status?.toUpperCase(), pageWidth - margin - 20.5, yPos + 17, { align: 'center' });

  yPos += 38;

  // ============ DADOS DO CLIENTE ============
  doc.setTextColor(...corSecundaria);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', margin, yPos);
  
  doc.setDrawColor(...corSecundaria);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

  yPos += 12;

  doc.setTextColor(...corTexto);
  doc.setFontSize(10);
  
  // Grid de informações do cliente
  const clienteInfo = [
    { label: 'Nome:', value: ordem.cliente?.nome || 'N/A' },
    { label: 'CPF/CNPJ:', value: ordem.cliente?.cpfCnpj || 'Não informado' },
    { label: 'Telefone:', value: ordem.cliente?.telefone || ordem.cliente?.whatsapp || 'Não informado' },
    { label: 'E-mail:', value: ordem.cliente?.email || 'Não informado' },
  ];

  clienteInfo.forEach((info, i) => {
    const xOffset = i % 2 === 0 ? margin : pageWidth / 2;
    const yOffset = Math.floor(i / 2) * 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, xOffset, yPos + yOffset);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, xOffset + 25, yPos + yOffset);
  });

  yPos += 28;

  // ============ DADOS DO VEÍCULO ============
  doc.setTextColor(...corSecundaria);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO VEÍCULO', margin, yPos);
  
  doc.setDrawColor(...corSecundaria);
  doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

  yPos += 12;

  doc.setTextColor(...corTexto);
  doc.setFontSize(10);
  
  const veiculoInfo = [
    { label: 'Veículo:', value: `${ordem.veiculo?.marca || ''} ${ordem.veiculo?.modelo || ''}`.trim() || 'N/A' },
    { label: 'Placa:', value: ordem.veiculo?.placa || 'Não informada' },
    { label: 'Cor:', value: ordem.veiculo?.cor || 'Não informada' },
    { label: 'Ano:', value: ordem.veiculo?.ano || 'Não informado' },
  ];

  veiculoInfo.forEach((info, i) => {
    const xOffset = i % 2 === 0 ? margin : pageWidth / 2;
    const yOffset = Math.floor(i / 2) * 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, xOffset, yPos + yOffset);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, xOffset + 20, yPos + yOffset);
  });

  yPos += 28;

  // ============ SERVIÇOS E PRODUTOS ============
  doc.setTextColor(...corSecundaria);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVIÇOS E PRODUTOS', margin, yPos);
  
  doc.setDrawColor(...corSecundaria);
  doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

  yPos += 8;

  // Tabela de itens
  const itensData = (ordem.itens || []).map((item, index) => [
    index + 1,
    item.tipo === 'servico' ? 'Serviço' : 'Produto',
    item.descricao || 'Item',
    item.quantidade || 1,
    formatCurrency(item.valorUnitario),
    formatCurrency(item.valorTotal),
  ]);

  if (itensData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Tipo', 'Descrição', 'Qtd', 'Valor Unit.', 'Total']],
      body: itensData,
      theme: 'striped',
      headStyles: {
        fillColor: corPrimaria,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: corTexto,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 15, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });

    yPos = doc.lastAutoTable.finalY + 5;
  } else {
    yPos += 5;
    doc.setTextColor(...corTexto);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum item adicionado', margin, yPos);
    yPos += 10;
  }

  // ============ VALOR TOTAL ============
  yPos += 5;
  
  doc.setFillColor(...corPrimaria);
  doc.roundedRect(pageWidth - margin - 70, yPos, 70, 20, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR TOTAL', pageWidth - margin - 35, yPos + 7, { align: 'center' });
  
  doc.setTextColor(...corSecundaria);
  doc.setFontSize(14);
  doc.text(formatCurrency(ordem.valorTotal), pageWidth - margin - 35, yPos + 16, { align: 'center' });

  yPos += 30;

  // ============ OBSERVAÇÕES ============
  if (ordem.observacoes) {
    doc.setTextColor(...corSecundaria);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVAÇÕES', margin, yPos);
    
    doc.setDrawColor(...corSecundaria);
    doc.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

    yPos += 10;
    
    doc.setTextColor(...corTexto);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const obsLines = doc.splitTextToSize(ordem.observacoes, pageWidth - (margin * 2));
    doc.text(obsLines, margin, yPos);
    yPos += obsLines.length * 5 + 10;
  }

  // ============ ASSINATURAS (se finalizada) ============
  if (tipo === 'finalizada') {
    // Verificar se precisa de nova página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }
    
    yPos = Math.max(yPos, pageHeight - 55);
    
    doc.setDrawColor(...corTexto);
    doc.setLineWidth(0.3);
    
    // Assinatura do cliente
    doc.line(margin, yPos, margin + 70, yPos);
    doc.setTextColor(...corTexto);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Assinatura do Cliente', margin + 35, yPos + 5, { align: 'center' });
    
    // Assinatura da empresa
    doc.line(pageWidth - margin - 70, yPos, pageWidth - margin, yPos);
    doc.text('Assinatura Responsável', pageWidth - margin - 35, yPos + 5, { align: 'center' });
  }

  // ============ RODAPÉ ============
  const rodapeY = pageHeight - 10;
  
  doc.setFillColor(...corPrimaria);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Documento gerado em ${dataGeracao}`, margin, rodapeY);
  
  doc.text(nomeEmpresa, pageWidth - margin, rodapeY, { align: 'right' });

  // ============ MENSAGEM DE AGRADECIMENTO ============
  if (tipo === 'finalizada') {
    const msgY = rodapeY - 20;
    doc.setTextColor(...corSecundaria);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Agradecemos a preferência!', pageWidth / 2, msgY, { align: 'center' });
  }

  return doc;
}

export function baixarPdfOrdem(ordem, tipo = 'aberta', configuracao = null) {
  return gerarPdfOrdem(ordem, tipo, configuracao).then((doc) => {
    const nomeArquivo = `OS_${ordem.id?.slice(-8).toUpperCase() || 'ordem'}_${tipo}.pdf`;
    doc.save(nomeArquivo);
    return nomeArquivo;
  });
}

export function compartilharPdfOrdem(ordem, tipo = 'aberta', configuracao = null) {
  return gerarPdfOrdem(ordem, tipo, configuracao).then(async (doc) => {
    const pdfBlob = doc.output('blob');
    const nomeArquivo = `OS_${ordem.id?.slice(-8).toUpperCase() || 'ordem'}_${tipo}.pdf`;
    
    // Verificar se o navegador suporta compartilhamento
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Ordem de Serviço - ${ordem.cliente?.nome || 'Cliente'}`,
            text: `Ordem de Serviço ${tipo === 'aberta' ? '(Abertura)' : '(Finalizada)'}`,
          });
          return { success: true, method: 'share' };
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Erro ao compartilhar:', err);
          }
        }
      }
    }
    
    // Fallback: Abrir em nova aba
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    return { success: true, method: 'window', url: pdfUrl };
  });
}

export async function enviarPdfWhatsApp(ordem, tipo = 'aberta', configuracao = null) {
  const doc = await gerarPdfOrdem(ordem, tipo, configuracao);
  const pdfBlob = doc.output('blob');
  const nomeArquivo = `OS_${ordem.id?.slice(-8).toUpperCase() || 'ordem'}_${tipo}.pdf`;
  
  const cliente = ordem.cliente;
  const veiculo = ordem.veiculo;
  
  if (!cliente?.whatsapp && !cliente?.telefone) {
    throw new Error('Cliente não possui WhatsApp ou telefone cadastrado');
  }

  const telefone = (cliente.whatsapp || cliente.telefone).replace(/\D/g, '');
  const telefoneFormatado = telefone.startsWith('55') ? telefone : `55${telefone}`;

  // Criar mensagem para WhatsApp
  let mensagem = '';
  
  if (tipo === 'aberta') {
    mensagem = `🚗 *${configuracao?.nomeEmpresa || 'SUPREME DETALHAMENTO'}*\n\n` +
      `Olá *${cliente.nome}*!\n\n` +
      `Segue em anexo a *Ordem de Serviço* do seu veículo:\n` +
      `🚘 ${veiculo.marca} ${veiculo.modelo}${veiculo.placa ? ` - ${veiculo.placa}` : ''}\n\n` +
      `📄 *Valor Total:* ${formatCurrency(ordem.valorTotal)}\n\n` +
      `Entraremos em contato assim que seu veículo estiver pronto!\n\n` +
      `Agradecemos a preferência! 🙏`;
  } else {
    mensagem = `🚗 *${configuracao?.nomeEmpresa || 'SUPREME DETALHAMENTO'}*\n\n` +
      `Olá *${cliente.nome}*!\n\n` +
      `✅ Seu veículo está *PRONTO* para retirada!\n\n` +
      `🚘 ${veiculo.marca} ${veiculo.modelo}${veiculo.placa ? ` - ${veiculo.placa}` : ''}\n\n` +
      `📄 Segue em anexo a *Ordem de Serviço Finalizada*.\n` +
      `💰 *Valor Total:* ${formatCurrency(ordem.valorTotal)}\n\n` +
      `Aguardamos você para a retirada!\n\n` +
      `Agradecemos a preferência! 🙏`;
  }

  // Em dispositivos móveis, tentar usar Web Share API para compartilhar PDF diretamente
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const file = new File([pdfBlob], nomeArquivo, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `OS - ${cliente.nome}`,
          text: mensagem.replace(/\*/g, ''),
        });
        return { success: true, method: 'share' };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
      console.log('Web Share não disponível, usando fallback');
    }
  }

  // Fallback (Desktop ou Web Share não disponível): Baixar PDF e abrir WhatsApp
  doc.save(nomeArquivo);
  
  const urlWhatsApp = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem + '\n\n📎 *O PDF foi baixado. Por favor, anexe-o à conversa.*')}`;
  
  setTimeout(() => {
    window.open(urlWhatsApp, '_blank');
  }, 300);
  
  return { success: true, method: 'whatsapp', filename: nomeArquivo };
}
