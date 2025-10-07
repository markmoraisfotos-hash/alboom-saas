// Inicializar tabelas (rota especial)
app.get('/api/init-tables', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ 
                error: 'Pool PostgreSQL não inicializado'
            });
        }

        const client = await pool.connect();
        
        console.log('🗄️  Criando tabelas...');
        
        // Criar tabelas uma por vez
        await client.query(`
            CREATE TABLE IF NOT EXISTS photographers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                studio_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id SERIAL PRIMARY KEY,
                photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                client_name VARCHAR(255) NOT NULL,
                client_email VARCHAR(255),
                date DATE,
                description TEXT,
                client_token VARCHAR(255) UNIQUE NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS photos (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255),
                s3_url TEXT,
                thumbnail_url TEXT,
                file_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS photo_selections (
                id SERIAL PRIMARY KEY,
                photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
                selected BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Verificar tabelas criadas
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        client.release();
        
        console.log('✅ Tabelas criadas com sucesso!');
        
        res.json({
            success: true,
            message: 'Tabelas criadas com sucesso!',
            tables: result.rows.map(row => row.table_name),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
