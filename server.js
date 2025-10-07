const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 AlboomProof Server starting...');

// Middleware básico
app.use(express.json());

// Rota principal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AlboomProof SaaS</title>
            <style>
                body { font-family: Arial; text-align: center; margin-top: 100px; background: #f5f5f5; }
                .container { background: white; padding: 40px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                h1 { color: #667eea; margin-bottom: 20px; }
                .status { color: #28a745; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 AlboomProof SaaS</h1>
                <p class="status">✅ Sistema Online e Funcionando!</p>
                <p>Versão: 1.0.0</p>
                <p>Servidor: Railway</p>
                <a href="/health" style="color: #667eea;">Health Check</a>
            </div>
        </body>
        </html>
    `);
});

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AlboomProof funcionando perfeitamente!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AlboomProof Server rodando na porta ${PORT}`);
    console.log(`🌐 Acesse: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
});

module.exports = app;
