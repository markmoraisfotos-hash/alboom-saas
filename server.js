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
       // Debug completo de environment
app.get('/test-db', (req, res) => {
    // Buscar database com qualquer nome possível
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.URL_DO_BANCO_DE_DADOS || 
                       process.env.POSTGRES_URL ||
                       process.env.POSTGRESQL_URL ||
                       process.env.DB_URL;
    
    // Buscar JWT com qualquer nome possível  
    const jwtSecret = process.env.JWT_SECRET || 
                     process.env.SEGREDO_JWT ||
                     process.env.JWT_SEGREDO;
    
    res.json({
        message: 'Detecção completa de variáveis',
        timestamp: new Date().toISOString(),
        found_variables: {
            // Database URLs 
            DATABASE_URL: !!process.env.DATABASE_URL,
            URL_DO_BANCO_DE_DADOS: !!process.env.URL_DO_BANCO_DE_DADOS,
            POSTGRES_URL: !!process.env.POSTGRES_URL,
            POSTGRESQL_URL: !!process.env.POSTGRESQL_URL,
            DB_URL: !!process.env.DB_URL,
            // JWT Secrets
            JWT_SECRET: !!process.env.JWT_SECRET,
            SEGREDO_JWT: !!process.env.SEGREDO_JWT,
            JWT_SEGREDO: !!process.env.JWT_SEGREDO
        },
        final_values: {
            database_url_found: !!databaseUrl,
            database_url_starts_with: databaseUrl ? databaseUrl.substring(0, 20) + '...' : 'N/A',
            jwt_secret_found: !!jwtSecret
        },
        all_env_keys: Object.keys(process.env)
            .filter(key => 
                key.toLowerCase().includes('database') || 
                key.toLowerCase().includes('banco') || 
                key.toLowerCase().includes('postgres') ||
                key.toLowerCase().includes('jwt') ||
                key.toLowerCase().includes('segredo') ||
                key.toLowerCase().includes('secret')
            )
            .sort()
    });
});

    res.json({
        message: 'Debug completo de variáveis',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        port: process.env.PORT,
        // Verificações específicas
        database_checks: {
            DATABASE_URL_exists: !!process.env.DATABASE_URL,
            DATABASE_URL_length: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
            DATABASE_URL_starts_with: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'N/A'
        },
        // Todas as variáveis que começam com DB
        db_variables: Object.keys(process.env)
            .filter(key => key.toLowerCase().includes('db') || key.toLowerCase().includes('database'))
            .reduce((obj, key) => {
                obj[key] = process.env[key] ? '✅ SET (' + process.env[key].substring(0, 20) + '...)' : '❌ NOT SET';
                return obj;
            }, {}),
        // Algumas outras variáveis importantes
        other_vars: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            JWT_SECRET: process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'
        }
    });
});


// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Servidor rodando na porta ' + PORT);
    console.log('🌐 Sistema online!');
});
