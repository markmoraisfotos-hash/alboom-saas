const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Iniciando servidor mínimo...');

// Rota básica
app.get('/', (req, res) => {
    res.send('AlboomProof Online - ' + new Date().toISOString());
});

// Health check mínimo
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Teste de variável com nomes corretos
app.get('/check-vars', (req, res) => {
    res.json({
        database_url: !!process.env.DATABASE_URL,     // Nome inglês correto
        jwt_secret: !!process.env.JWT_SECRET,         // Nome inglês correto
        vars_count: Object.keys(process.env).length,
        // Debug completo
        all_vars: Object.keys(process.env)
            .filter(key => 
                key.includes('DATABASE') || 
                key.includes('JWT') || 
                key.includes('SECRET')
            )
            .sort()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('✅ Online na porta ' + PORT);
});
