# 📸 AlboomProof SaaS - Sistema Completo de Seleção de Fotos

Sistema profissional SaaS para fotógrafos criarem galerias de seleção de fotos com integração ao Lightroom Classic, armazenamento em nuvem e funcionalidades comerciais completas.

## 🌟 Características Principais

### Para Fotógrafos
- ✅ **Upload em massa**: Até 1500 fotos por sessão
- ✅ **Armazenamento em nuvem**: AWS S3 com CDN
- ✅ **Dashboard profissional**: Gestão completa de sessões
- ✅ **Links únicos para clientes**: Acesso seguro e personalizado
- ✅ **Estatísticas detalhadas**: Métricas de uso e seleções
- ✅ **Integração Lightroom**: Códigos de filtro automáticos
- ✅ **Multi-tenant**: Sistema SaaS completo

### Para Clientes
- ✅ **Interface intuitiva**: Seleção fácil e rápida
- ✅ **Visualização otimizada**: Thumbnails e preview
- ✅ **Filtros avançados**: Busca e organização
- ✅ **Acesso mobile**: Responsivo em todos os dispositivos
- ✅ **Seleção em tempo real**: Salvamento automático

### Recursos Técnicos
- ✅ **Arquitetura escalável**: Node.js + PostgreSQL + AWS
- ✅ **Segurança**: Autenticação JWT, validação de dados
- ✅ **Performance**: Otimizações para grandes volumes
- ✅ **Monitoramento**: Logs, métricas e alertas
- ✅ **Backup automático**: Proteção de dados

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (React/JS)    │◄──►│   (Node.js)     │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AWS S3        │
                       │   (Photos)      │
                       └─────────────────┘
```

## 📁 Estrutura do Projeto

```
alboom-saas-system/
├── frontend/                 # Interface do usuário
│   ├── index.html           # Página principal
│   ├── script.js           # Lógica JavaScript
│   └── style.css           # Estilos CSS
├── backend/                 # API do servidor
│   ├── server.js           # Servidor principal
│   ├── database.sql        # Schema do banco
│   ├── package.json        # Dependências
│   └── .env.example        # Variáveis de ambiente
├── deployment/              # Configurações de deploy
│   ├── docker-compose.yml  # Orquestração Docker
│   └── README.md           # Guia de deploy
└── README.md               # Este arquivo
```

## 🚀 Início Rápido

### 1. Pré-requisitos
- Node.js 16+
- PostgreSQL 12+
- Conta AWS (S3)
- Git

### 2. Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/alboom-saas-system.git
cd alboom-saas-system

# Configure o backend
cd backend
cp .env.example .env
# Edite o .env com suas configurações
npm install

# Configure o banco de dados
psql -U postgres -d postgres -f database.sql

# Inicie o backend
npm run dev

# Em outro terminal, sirva o frontend
cd ../frontend
# Use um servidor web local (Live Server, http-server, etc.)
npx http-server . -p 3001
```

### 3. Configuração Básica

Edite o arquivo `backend/.env`:

```env
# Banco de dados
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=sua_senha
DB_NAME=alboom_saas

# AWS S3
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_S3_BUCKET=alboom-photos

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui

# Frontend
FRONTEND_URL=http://localhost:3001
```

## 💻 Como Usar

### Para Fotógrafos

1. **Cadastro/Login**
   - Acesse o sistema e crie sua conta
   - Informe dados do estúdio

2. **Criar Nova Sessão**
   - Clique em "Nova Sessão"
   - Preencha dados do cliente
   - Faça upload das fotos (até 1500)

3. **Compartilhar com Cliente**
   - Copie o link único gerado
   - Envie para o cliente por email/WhatsApp

4. **Gerar Códigos Lightroom**
   - Aguarde as seleções do cliente
   - Clique em "Gerar Códigos Lightroom"
   - Cole na barra de filtros do Lightroom Classic

### Para Clientes

1. **Acessar Sessão**
   - Clique no link enviado pelo fotógrafo
   - Visualize todas as fotos

2. **Selecionar Fotos**
   - Clique nas fotos favoritas (ícone de coração)
   - Use filtros para organizar
   - Seleções são salvas automaticamente

3. **Finalizar**
   - Fotógrafo recebe as seleções automaticamente

## 🔧 Funcionalidades Avançadas

### Sistema Multi-tenant
- Cada fotógrafo tem conta isolada
- Dados seguros e privados
- Planos de assinatura configuráveis

### Integração Lightroom
```javascript
// Exemplo de código gerado
DSC_001 OR DSC_005 OR DSC_010 OR DSC_023
```

### Upload Otimizado
- Processamento em lotes de 50 fotos
- Criação automática de thumbnails
- Validação de formato e tamanho
- Progress bar em tempo real

### API REST Completa
```javascript
// Exemplos de endpoints
POST /api/auth/login
GET  /api/sessions
POST /api/sessions/:id/photos
POST /api/sessions/:id/selections
```

## 📊 Planos de Monetização

| Plano | Preço | Sessões/mês | Fotos/sessão | Storage |
|-------|-------|-------------|--------------|---------|
| **Free** | R$ 0 | 3 | 100 | 1GB |
| **Basic** | R$ 29,90 | 20 | 500 | 10GB |
| **Pro** | R$ 59,90 | 100 | 1500 | 50GB |
| **Enterprise** | R$ 149,90 | ∞ | ∞ | 200GB |

## 🌐 Deploy em Produção

### Opções de Hospedagem

1. **Railway** (Recomendado)
   - Deploy automático via Git
   - PostgreSQL e Redis inclusos
   - Escalabilidade automática
   - ~$20-50/mês

2. **Heroku**
   - Fácil configuração
   - Add-ons PostgreSQL/Redis
   - ~$25-60/mês

3. **VPS Próprio**
   - Docker Compose incluído
   - Controle total
   - ~$10-30/mês + configuração

### Guia Completo
Consulte o arquivo [`deployment/README.md`](deployment/README.md) para instruções detalhadas de deploy.

## 🔒 Segurança

- ✅ **Autenticação JWT** com expiração
- ✅ **Hash de senhas** com bcrypt
- ✅ **Validação de dados** em todas as rotas
- ✅ **Rate limiting** para APIs
- ✅ **CORS** configurado adequadamente
- ✅ **HTTPS** obrigatório em produção
- ✅ **Sanitização** de uploads

## 📈 Monitoramento

### Métricas Incluídas
- Número de sessões ativas
- Volume de fotos enviadas
- Taxa de seleção dos clientes
- Uso de storage por usuário
- Performance de upload

### Logs Estruturados
```javascript
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Photos uploaded successfully",
  "userId": 123,
  "sessionId": 456,
  "photoCount": 50
}
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5/CSS3**: Interface moderna e responsiva
- **JavaScript ES6+**: Funcionalidades interativas
- **Fetch API**: Comunicação com backend
- **CSS Grid/Flexbox**: Layout profissional

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **PostgreSQL**: Banco de dados relacional
- **AWS S3**: Armazenamento de fotos
- **JWT**: Autenticação segura
- **Multer**: Upload de arquivos
- **Sharp**: Processamento de imagens

### DevOps
- **Docker**: Containerização
- **Nginx**: Proxy reverso
- **PM2**: Gerenciamento de processos
- **Winston**: Logging estruturado

## 📝 Roadmap

### Versão 1.1 (Próxima)
- [ ] Sistema de pagamentos Stripe
- [ ] Dashboard administrativo
- [ ] API para integrações
- [ ] Marca branca (white-label)

### Versão 1.2
- [ ] App mobile nativo
- [ ] Integração Capture One
- [ ] Download de fotos selecionadas
- [ ] Comentários em fotos

### Versão 2.0
- [ ] IA para seleção automática
- [ ] Edição básica online
- [ ] Integração redes sociais
- [ ] Marketplace de fotógrafos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📜 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@alboomproof.com
- **WhatsApp**: +55 11 99999-9999
- **Discord**: [Comunidade AlboomProof](https://discord.gg/alboomproof)
- **Docs**: [docs.alboomproof.com](https://docs.alboomproof.com)

## 🎉 Agradecimentos

- Comunidade de fotógrafos que testaram o sistema
- Desenvolvedores que contribuíram com código
- Designers que criaram a interface
- Usuários que forneceram feedback valioso

---

**Transforme seu negócio de fotografia com AlboomProof! 📸✨**

[![Deploy](https://img.shields.io/badge/Deploy-Railway-blueviolet)](https://railway.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://postgresql.org)