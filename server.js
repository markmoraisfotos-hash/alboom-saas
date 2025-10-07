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

// Teste de variável específica
app.get('/check-vars', (req, res) => {
    res.json({
        url_banco: !!process.env.URL_DO_BANCO_DE_DADOS,
        jwt: !!process.env.JWT_SECRET,
        vars_count: Object.keys(process.env).length
    });
});

// Iniciar com configurações Railway-friendly
app.listen(PORT, () => {
    console.log('✅ Online na porta ' + PORT);
});
