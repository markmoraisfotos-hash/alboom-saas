const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Servidor AlboomProof iniciando...');
console.log('📊 NODE_ENV:', process.env.NODE_ENV);
console.log('🗄️  DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('🔑 JWT_SECRET existe:', !!process.env.JWT_SECRET);

// Configuração básica do PostgreSQL
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Teste de conexão
    pool.connect()
        .then(client => {
            console.log('✅ Conexão PostgreSQL bem-sucedida!');
            client.release();
        })
        .catch(err => {
            console.error('❌ Erro PostgreSQL:', err.message);
            console.error('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Presente' : 'Ausente');
        });
} catch (error) {
    console.error('❌ Erro ao criar pool PostgreSQL:', error.message);
}

// Middlewares básicos
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS simples
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AlboomProof SaaS</title>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-align: center; 
                    margin: 0; 
                    padding: 50px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container { 
                    background: rgba(255,255,255,0.95);
                    color: #333;
                    padding: 40px; 
                    border-radius: 20px; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px;
                    width: 100%;
                }
                h1 { color: #667eea; margin-bottom: 20px; font-size: 2.5em; }
                .status { color: #28a745; font-weight: bold; font-size: 1.2em; }
                .info { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 8px; }
                a { 
                    color: #667eea; 
                    text-decoration: none; 
                    padding: 10px 20px; 
                    background: #f0f3ff; 
                    border-radius: 25px; 
                    display: inline-block; 
                    margin: 10px;
                    transition: all 0.3s;
                }
                a:hover { background: #667eea; color: white; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 AlboomProof SaaS</h1>
                <p class="status">✅ Sistema Online!</p>
                <div class="info">
                    <strong>Versão:</strong> 2.0.0 (Railway + PostgreSQL)<br>
                    <strong>Servidor:</strong> Railway Cloud<br>
                    <strong>Banco:</strong> ${process.env.DATABASE_URL ? '✅ PostgreSQL Conectado' : '❌ PostgreSQL Desconectado'}<br>
                    <strong>JWT:</strong> ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ Não Configurado'}
                </div>
                <div>
                    <a href="/health">🔍 Health Check</a>
                    <a href="/api/test-db">🗄️ Testar Banco</a>
                </div>
                <p><small>Request ID: ${Date.now()}</small></p>
            </div>
        </body>
        </html>
    `);
});

// Health check melhorado
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'AlboomProof funcionando!',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        environment: {
            node_env: process.env.NODE_ENV,
            has_database: !!process.env.DATABASE_URL,
            has_jwt: !!process.env.JWT_SECRET,
            port: PORT
        }
    });
});

// Teste de banco de dados
app.get('/api/test-db', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ 
                error: 'Pool PostgreSQL não inicializado',
                database_url_exists: !!process.env.DATABASE_URL
            });
        }

        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        client.release();
        
        res.json({
            success: true,
            message: 'Conexão PostgreSQL funcionando!',
            data: result.rows[0],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erro no teste do banco:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            database_url_exists: !!process.env.DATABASE_URL
        });
    }
});

// Tratamento de erros global
app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error.message);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor AlboomProof rodando na porta ${PORT}`);
    console.log(`🌐 URL: https://alboom-saas-production.up.railway.app`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? 'Configurado' : 'Não configurado'}`);
    console.log('🎯 Sistema pronto para testes!');
});

// Tratamento de sinais de término
process.on('SIGTERM', () => {
    console.log('📋 SIGTERM recebido, fechando servidor graciosamente...');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📋 SIGINT recebido, fechando servidor graciosamente...');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

module.exports = app;
