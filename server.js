const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Servidor com health check manual...');

// Health check para Railway
app.get('/', (req, res) => {
    res.status(200).send('OK');
});

// Ping simples
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'pong', time: Date.now() });
});

// Servidor com configurações Railway-friendly
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Server STABLE on port ' + PORT);
});

// Configurações anti-timeout
server.timeout = 120000;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📋 SIGTERM - closing gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📋 SIGINT - closing gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// LINHA NOVA PARA FORÇAR DEPLOY
console.log('🔥 VERSÃO NOVA - Timestamp:', Date.now());
console.log('🚀 Servidor com health check manual...');
