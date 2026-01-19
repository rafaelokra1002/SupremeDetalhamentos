# Supreme Detalhamento - Sistema de Gestão

Sistema web moderno para gestão de estética automotiva.

![Supreme Detalhamento](https://img.shields.io/badge/Supreme-Detalhamento-gold)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)

## 🚗 Sobre

Sistema interno de gestão para a **Supreme Detalhamento**, especialista em vitrificação de pinturas automotivas.

### Funcionalidades

- ✅ Autenticação com controle de permissões (Admin/Funcionário)
- ✅ Dashboard com métricas e gráficos
- ✅ Cadastro de Clientes
- ✅ Cadastro de Veículos
- ✅ Ordens de Serviço
- ✅ Cadastro de Produtos (estoque)
- ✅ Cadastro de Serviços
- ✅ Contas a Pagar
- ✅ Contas a Receber
- ✅ Interface responsiva (mobile e desktop)
- ✅ Dark theme premium

## 🛠️ Tecnologias

- **Frontend:** Next.js 14 (React)
- **Backend:** API Routes (Next.js)
- **Banco de Dados:** SQLite + Prisma ORM
- **Autenticação:** NextAuth.js
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Gráficos:** Recharts
- **Notificações:** React Hot Toast

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🚀 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Gerar cliente Prisma

```bash
npm run db:generate
```

### 3. Criar banco de dados

```bash
npm run db:push
```

### 4. Popular banco com dados iniciais

```bash
npm run db:seed
```

### 5. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🔐 Credenciais de Acesso

### Administrador
- **Email:** admin@supreme.com
- **Senha:** admin123
- **Acesso:** Total ao sistema

### Funcionário
- **Email:** funcionario@supreme.com
- **Senha:** func123
- **Acesso:** Restrito (sem acesso financeiro)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/           # API Routes
│   │   ├── auth/
│   │   ├── clientes/
│   │   ├── veiculos/
│   │   ├── ordens/
│   │   ├── produtos/
│   │   ├── servicos/
│   │   ├── contas-pagar/
│   │   ├── contas-receber/
│   │   └── dashboard/
│   ├── login/
│   ├── dashboard/
│   ├── clientes/
│   ├── veiculos/
│   ├── ordens/
│   ├── produtos/
│   ├── servicos/
│   ├── contas-pagar/
│   └── contas-receber/
├── components/
│   ├── Sidebar.js
│   ├── Header.js
│   ├── DashboardLayout.js
│   ├── Modal.js
│   ├── ConfirmDialog.js
│   ├── Loading.js
│   └── Providers.js
├── contexts/
│   └── AuthContext.js
└── lib/
    └── prisma.js
```

## 🎨 Identidade Visual

- **Cores principais:**
  - Preto: `#0a0a0a`
  - Grafite: `#121212`, `#1a1a1a`, `#2a2a2a`
  - Dourado: `#d4af37`

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px+)

## 🔒 Permissões

| Funcionalidade | Admin | Funcionário |
|---------------|:-----:|:-----------:|
| Dashboard | ✅ | ✅ (sem faturamento) |
| Clientes | ✅ | ✅ |
| Veículos | ✅ | ✅ |
| Ordens de Serviço | ✅ | ✅ |
| Produtos | ✅ | ❌ |
| Serviços | ✅ | ❌ |
| Contas a Pagar | ✅ | ❌ |
| Contas a Receber | ✅ | ❌ |

## 📝 Scripts Disponíveis

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run start      # Iniciar produção
npm run db:generate # Gerar cliente Prisma
npm run db:push    # Sincronizar schema com banco
npm run db:seed    # Popular banco com dados iniciais
```

## 🤝 Suporte

Sistema desenvolvido para **Supreme Detalhamento**.

---

**Supreme Detalhamento** - *Especialista em Vitrificação de Pinturas*
