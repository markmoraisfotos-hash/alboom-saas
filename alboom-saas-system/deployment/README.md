# 🚀 Guia Completo de Deploy - AlboomProof SaaS

Este guia fornece instruções detalhadas para fazer o deploy do seu sistema AlboomProof como um SaaS comercializável.

## 📋 Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configuração Local](#configuração-local)
- [Deploy em Produção](#deploy-em-produção)
- [Configuração de Infraestrutura](#configuração-de-infraestrutura)
- [Monitoramento](#monitoramento)
- [Backup e Segurança](#backup-e-segurança)
- [Monetização](#monetização)

## 🔧 Pré-requisitos

### Ferramentas Necessárias
- **Node.js** 16+ e npm
- **PostgreSQL** 12+
- **Docker** e Docker Compose (recomendado)
- **Git** para controle de versão
- Conta **AWS** (para S3 e potencialmente EC2/RDS)
- Conta **Stripe** para pagamentos

### Serviços Externos
- **AWS S3**: Armazenamento de fotos
- **PostgreSQL**: Banco de dados principal
- **Stripe**: Processamento de pagamentos
- **SendGrid/Mailgun**: Envio de emails
- **Cloudflare**: CDN e DNS (opcional)

## 💻 Configuração Local

### 1. Clone e Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/alboom-saas-system.git
cd alboom-saas-system

# Configure o backend
cd backend
cp .env.example .env
npm install

# Configure o frontend
cd ../frontend
npm install
```

### 2. Configuração do Banco de Dados

```bash
# Instale PostgreSQL localmente ou use Docker
docker run --name alboom-postgres -e POSTGRES_PASSWORD=sua_senha -p 5432:5432 -d postgres:15

# Execute as migrações
psql -h localhost -U postgres -d postgres -f backend/database.sql
```

### 3. Configuração do AWS S3

```bash
# Crie um bucket S3
aws s3 mb s3://alboom-photos-production

# Configure CORS no bucket
aws s3api put-bucket-cors --bucket alboom-photos-production --cors-configuration file://aws-cors.json
```

Arquivo `aws-cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 4. Executar Localmente

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 Deploy em Produção

### Opção 1: Railway (Recomendado para Iniciantes)

1. **Conecte seu repositório ao Railway**
   - Acesse [railway.app](https://railway.app)
   - Conecte sua conta GitHub
   - Importe o projeto

2. **Configure variáveis de ambiente**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=sua_chave_super_secreta
   AWS_ACCESS_KEY_ID=sua_key
   AWS_SECRET_ACCESS_KEY=sua_secret
   STRIPE_SECRET_KEY=sk_live_...
   ```

3. **Deploy automático**
   - Railway fará o deploy automático a cada push

### Opção 2: Heroku

```bash
# Install Heroku CLI
heroku create alboom-saas-app

# Configure add-ons
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev

# Configure variáveis
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=sua_chave_secreta
# ... outras variáveis

# Deploy
git push heroku main
```

### Opção 3: VPS/EC2 com Docker

```bash
# No servidor
git clone https://github.com/seu-usuario/alboom-saas-system.git
cd alboom-saas-system

# Configure variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com valores de produção

# Execute com Docker Compose
docker-compose -f deployment/docker-compose.yml up -d
```

## 🏗️ Configuração de Infraestrutura

### 1. Domínio e DNS

```bash
# Configure no Cloudflare ou seu provedor DNS
A    alboomproof.com      → seu_ip_servidor
A    api.alboomproof.com  → seu_ip_servidor
A    cdn.alboomproof.com  → seu_cdn_endpoint
```

### 2. Certificado SSL

```bash
# Com Certbot (Let's Encrypt)
sudo certbot --nginx -d alboomproof.com -d api.alboomproof.com

# Ou use Cloudflare SSL (mais fácil)
```

### 3. Configuração do Nginx

```nginx
# /etc/nginx/sites-available/alboomproof.com
server {
    listen 443 ssl http2;
    server_name alboomproof.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoramento

### 1. Logs Centralizados

```javascript
// Backend logging com Winston
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});
```

### 2. Métricas com Prometheus

```yaml
# deployment/prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'alboom-backend'
    static_configs:
      - targets: ['backend:3000']
```

### 3. Alertas

```bash
# Configure alertas por email/Slack para:
# - Erro 500+ frequente
# - Uso de storage > 80%
# - Tempo de resposta > 2s
# - Falha no processamento de upload
```

## 🔒 Backup e Segurança

### 1. Backup do Banco de Dados

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="alboom_saas"

# Backup PostgreSQL
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Upload para S3
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://alboom-backups/database/

# Manter apenas últimos 30 backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +30 -delete
```

### 2. Backup de Fotos

```javascript
// Sincronização automática S3 → Backup S3
const AWS = require('aws-sdk');

async function backupPhotos() {
    const s3 = new AWS.S3();
    
    // Listar objetos no bucket principal
    const objects = await s3.listObjectsV2({
        Bucket: 'alboom-photos-production'
    }).promise();
    
    // Copiar para bucket de backup
    for (const obj of objects.Contents) {
        await s3.copyObject({
            Bucket: 'alboom-photos-backup',
            CopySource: `alboom-photos-production/${obj.Key}`,
            Key: obj.Key
        }).promise();
    }
}
```

### 3. Segurança

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Muitas tentativas, tente novamente em 15 minutos'
});

app.use('/api/', limiter);
```

## 💰 Monetização

### 1. Integração Stripe

```javascript
// backend/stripe-config.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-subscription', async (req, res) => {
    const { planId, paymentMethodId, customerEmail } = req.body;
    
    try {
        // Criar cliente
        const customer = await stripe.customers.create({
            email: customerEmail,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
        
        // Criar assinatura
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: planId }],
            expand: ['latest_invoice.payment_intent'],
        });
        
        res.json({ subscription });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### 2. Webhook do Stripe

```javascript
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'invoice.payment_succeeded':
            // Renovar plano do usuário
            handlePaymentSuccess(event.data.object);
            break;
        case 'invoice.payment_failed':
            // Suspender conta
            handlePaymentFailed(event.data.object);
            break;
    }
    
    res.json({received: true});
});
```

### 3. Planos de Preços

| Plano | Preço Mensal | Sessões | Fotos/Sessão | Storage | Recursos |
|-------|-------------|---------|--------------|---------|-----------|
| **Gratuito** | R$ 0 | 3 | 100 | 1GB | Básico |
| **Básico** | R$ 29,90 | 20 | 500 | 10GB | Sem marca d'água |
| **Pro** | R$ 59,90 | 100 | 1500 | 50GB | White-label |
| **Enterprise** | R$ 149,90 | Ilimitado | Ilimitado | 200GB | API + Suporte |

## 📈 Estimativa de Custos e ROI

### Custos Mensais (100 usuários ativos)

- **Servidor (Railway/Heroku)**: $25-50
- **Banco de dados**: $15-30  
- **AWS S3**: $20-40 (dependendo do uso)
- **CDN**: $5-15
- **Email service**: $10
- **Monitoramento**: $10
- **Total**: ~$85-160/mês

### Receita Potencial

- 20 usuários gratuitos = R$ 0
- 50 usuários básicos = R$ 1.495
- 25 usuários pro = R$ 1.497,50
- 5 usuários enterprise = R$ 749,50
- **Total mensal**: R$ 3.742 (~$750)

**ROI**: 500-800% nos primeiros 100 usuários

## 🚀 Próximos Passos

1. **Configure o ambiente local** seguindo as instruções acima
2. **Escolha uma plataforma de deploy** (Railway recomendado)
3. **Configure os serviços externos** (S3, Stripe, Email)
4. **Faça o primeiro deploy** em ambiente de teste
5. **Configure monitoramento** e backup
6. **Lance versão beta** para primeiros usuários
7. **Implemente feedback** e otimizações
8. **Marketing e vendas** para escalabilidade

## 📞 Suporte

Para dúvidas específicas sobre o deploy:
- 📧 Email: dev@alboomproof.com  
- 💬 Discord: [AlboomProof Community]
- 📖 Docs: [docs.alboomproof.com]

---

**Sucesso no seu negócio SaaS! 🎉**