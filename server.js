const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 AlboomProof iniciando...');

// Middleware básico
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
    res.json({
        status: 'AlboomProof Online',
        timestamp: new Date().toISOString(),
        port: PORT,
        uptime: Math.floor(process.uptime())
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Teste simples de variáveis
app.get('/test-vars', (req, res) => {
    res.json({
        message: 'Teste de variáveis',
        database_url: process.env.URL_DO_BANCO_DE_DADOS ? 'EXISTE' : 'NAO_EXISTE',
        jwt_secret: process.env.JWT_SECRET ? 'EXISTE' : 'NAO_EXISTE',
        total_env_vars: Object.keys(process.env).length
    });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Servidor estável na porta ' + PORT);
});

// Evitar crashes
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGTERM', () => {
    console.log('SIGTERM recebido - fechando...');
    server.close(() => process.exit(0));
});
