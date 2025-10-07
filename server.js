const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 AlboomProof iniciando...');
console.log('📊 Porta:', PORT);
console.log('🌐 Environment:', process.env.NODE_ENV);

// Middleware básico
app.use(express.json());
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AlboomProof SaaS - Online</title>
            <meta charset="utf-8">
            <style>
                body { 
                    font-family: system-ui, -apple-system, sans-serif;
                    margin: 0; padding: 50px; text-align: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; min-height: 100vh;
                    display: flex; align-items: center; justify-content: center;
                }
                .card { 
                    background: rgba(255,255,255,0.95); color: #333;
                    padding: 40px; border-radius: 20px; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px; width: 100%;
                }
                h1 { color: #667eea; margin-bottom: 20px; }
                .status { color: #28a745; font-weight: bold; }
                .info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .btn { 
                    display: inline-block; padding: 12px 24px; margin: 10px;
                    background: #667eea; color: white; text-decoration: none;
                    border-radius: 25px; transition: all 0.3s;
                }
                .btn:hover { background: #5a67d8; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🎉 AlboomProof SaaS</h1>
                <p class="status">✅ Sistema Online e Funcionando!</p>
                
                <div class="info">
                    <strong>Status:</strong> Servidor Estável<br>
                    <strong>Versão:</strong> 2.1.0 Básica<br>
                    <strong>Plataforma:</strong> Railway<br>
                    <strong>Porta:</strong> ${PORT}<br>
                    <strong>Tempo:</strong> ${new Date().toLocaleString('pt-BR')}
                </div>
                
                <div>
                    <a href="/health" class="btn">🔍 Health Check</a>
                    <a href="/status" class="btn">📊 Status Detalhado</a>
                </div>
                
                <p><small>Request ID: ${Date.now()}</small></p>
            </div>
        </body>
        </html>
    `);
});

// Health check simples
app.get('/health',<span class="cursor">█</span>
