const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 AlboomProof iniciando...');
console.log('📊 Porta:', PORT);

// Middleware básico
app.use(express.json());

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
            font-family: system-ui, sans-serif;
            margin: 0; padding: 50px; text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
        }
        .card { 
            background: rgba(255,255,255,0.95); color: #333;
            padding: 40px; border-radius: 20px; 
            max-width: 500px; width: 100%;
        }
        h1 { color: #667eea; }
        .status { color: #28a745; font-weight: bold; }
        .btn { 
            display: inline-block; padding: 12px 24px; margin: 10px;
            background: #667eea; color: white; text-decoration: none;
            border-radius: 25px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🎉 AlboomProof SaaS</h1>
        <p class="status">✅ Sistema Online!</p>
        <p><strong>Versão:</strong> 2.1.0</p>
        <p><strong>Porta:</strong> ${PORT}</p>
        <div>
            <a href="/health" class="btn">Health Check</a>
        </div>
    </div>
</body>
</html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Funcionando!',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        port: PORT
    });
});
app.get('/test-db', (req, res) => {
    res.json({
        message: 'Rota test-db funcionando!',
        timestamp: new Date().toISOString(),
        database_url: !!process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
        environment: process.env.NODE_ENV
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Servidor rodando na porta ' + PORT);
    console.log('🌐 Sistema online!');
});
