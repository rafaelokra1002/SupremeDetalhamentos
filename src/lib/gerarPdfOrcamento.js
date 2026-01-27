// Função para gerar PDF do orçamento
export function gerarPdfOrcamento(orcamento, config) {
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (data) => {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  const itens = orcamento.itens || [];

  // Criar conteúdo HTML do PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Orçamento #${orcamento.numero || orcamento.id?.slice(-6)}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 12px;
          color: #333;
          padding: 20px;
          background: #fff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #dc2626;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
          background-color: #1a1a1a;
          border-radius: 8px;
          padding: 5px;
        }
        .empresa-info h1 {
          font-size: 22px;
          color: #dc2626;
          margin-bottom: 5px;
        }
        .empresa-info p {
          font-size: 11px;
          color: #666;
        }
        .orcamento-info {
          text-align: right;
        }
        .orcamento-info h2 {
          font-size: 18px;
          color: #333;
          margin-bottom: 5px;
        }
        .orcamento-info p {
          font-size: 11px;
          color: #666;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #dc2626;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .info-item {
          display: flex;
          gap: 5px;
        }
        .info-label {
          font-weight: bold;
          color: #666;
        }
        .info-value {
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          background: #dc2626;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 11px;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
          font-size: 11px;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .text-right {
          text-align: right;
        }
        .totais {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .totais-box {
          width: 250px;
          border: 1px solid #ddd;
          border-radius: 5px;
          overflow: hidden;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 15px;
          border-bottom: 1px solid #eee;
        }
        .total-row:last-child {
          border-bottom: none;
        }
        .total-row.final {
          background: #dc2626;
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .observacoes {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .observacoes-title {
          font-weight: bold;
          margin-bottom: 5px;
          color: #666;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        .validade {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 5px;
          padding: 10px;
          margin-top: 15px;
          text-align: center;
          color: #92400e;
        }
        .status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 15px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-pendente { background: #fef3c7; color: #92400e; }
        .status-aprovado { background: #d1fae5; color: #065f46; }
        .status-recusado { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          ${config?.logoEmpresa ? `<img src="${config.logoEmpresa}" class="logo" alt="Logo">` : ''}
          <div class="empresa-info">
            <h1>${config?.nomeEmpresa || 'Supreme Detalhamento'}</h1>
            ${config?.cnpjEmpresa ? `<p><strong>CNPJ:</strong> ${config.cnpjEmpresa}</p>` : ''}
            ${config?.enderecoEmpresa ? `<p>📍 ${config.enderecoEmpresa}</p>` : ''}
            ${config?.telefoneEmpresa ? `<p>📞 ${config.telefoneEmpresa}</p>` : ''}
            ${config?.emailEmpresa ? `<p>✉️ ${config.emailEmpresa}</p>` : ''}
          </div>
        </div>
        <div class="orcamento-info">
          <h2>ORÇAMENTO #${orcamento.numero || orcamento.id?.slice(-6).toUpperCase()}</h2>
          <p>Data: ${formatarData(orcamento.createdAt)}</p>
          ${orcamento.responsavel ? `<p>Responsável: ${orcamento.responsavel}</p>` : ''}
          <p class="status status-${orcamento.status}">${orcamento.status}</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Dados do Cliente</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nome:</span>
            <span class="info-value">${orcamento.nomeCliente || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Telefone:</span>
            <span class="info-value">${orcamento.telefoneCliente || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">E-mail:</span>
            <span class="info-value">${orcamento.emailCliente || '-'}</span>
          </div>
        </div>
      </div>

      ${orcamento.veiculoMarca || orcamento.veiculoModelo || orcamento.veiculoPlaca ? `
      <div class="section">
        <div class="section-title">Dados do Veículo</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Marca/Modelo:</span>
            <span class="info-value">${orcamento.veiculoMarca || ''} ${orcamento.veiculoModelo || ''}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Placa:</span>
            <span class="info-value">${orcamento.veiculoPlaca || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Cor:</span>
            <span class="info-value">${orcamento.veiculoCor || '-'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Ano:</span>
            <span class="info-value">${orcamento.veiculoAno || '-'}</span>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Itens do Orçamento</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50%">Descrição</th>
              <th class="text-right" style="width: 15%">Qtd</th>
              <th class="text-right" style="width: 17%">Valor Unit.</th>
              <th class="text-right" style="width: 18%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itens.map(item => `
              <tr>
                <td>${item.descricao || '-'}</td>
                <td class="text-right">${item.quantidade || 1}</td>
                <td class="text-right">${formatarMoeda(item.valorUnitario)}</td>
                <td class="text-right">${formatarMoeda(item.valorTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totais">
        <div class="totais-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatarMoeda(orcamento.valorTotal)}</span>
          </div>
          ${orcamento.desconto > 0 ? `
          <div class="total-row">
            <span>Desconto:</span>
            <span style="color: #dc2626;">- ${formatarMoeda(orcamento.desconto)}</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>${formatarMoeda(orcamento.valorFinal)}</span>
          </div>
        </div>
      </div>

      ${orcamento.validade ? `
      <div class="validade">
        ⚠️ Este orçamento é válido até ${formatarData(orcamento.validade)}
      </div>
      ` : ''}

      ${orcamento.observacoes ? `
      <div class="observacoes">
        <div class="observacoes-title">Observações:</div>
        <p>${orcamento.observacoes}</p>
      </div>
      ` : ''}

      <div class="footer">
        <p>Orçamento gerado em ${formatarData(new Date())} | ${config?.nomeEmpresa || 'Supreme Detalhamento'}</p>
        ${config?.whatsappEmpresa ? `<p>WhatsApp: ${config.whatsappEmpresa}</p>` : ''}
      </div>
    </body>
    </html>
  `;

  return html;
}
