const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando AlboomProof Server...');

// Middleware básico
app.use(express.json());
app.use(express.static('frontend'));

// Rota de teste
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>AlboomProof SaaS</title></head>
            <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                <h1>🎉 AlboomProof SaaS Online!</h1>
                <p>Sistema funcionando perfeitamente!</p>
                <p>Versão: 1.0.0</p>
                <a href="/health">Health Check</a>
            </body>
        </html>
    `);
});

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Sistema funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
});
