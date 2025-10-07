const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.static('frontend'));
app.use(express.json());

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AlboomProof SaaS funcionando!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Rota principal - serve o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Rota de teste da API
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API funcionando!',
        sistema: 'AlboomProof SaaS',
        status: 'online'
    });
});

// Rota para todas as outras páginas (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AlboomProof Server rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🌐 Frontend: Servindo pasta 'frontend'`);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
    console.error('Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada:', reason);
});

module.exports = app;
