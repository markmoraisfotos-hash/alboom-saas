const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Servidor SEM database - teste...');

// Rota básica
app.get('/', (req, res) => {
    res.send('AlboomProof Online SEM Database - ' + new Date().toISOString());
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Funcionando SEM database',
        timestamp: new Date().toISOString()
    });
});

// Teste sem database
app.get('/test-simple', (req, res) => {
    res.json({
        message: 'Teste simples - sem database',
        port: PORT,
        env_count: Object.keys(process.env).length,
        has_problematic_var: !!process.env.DATABASE_URL
    });
});

// Servidor básico
app.listen(PORT, () => {
    console.log('✅ Servidor SIMPLES na porta ' + PORT);
});
