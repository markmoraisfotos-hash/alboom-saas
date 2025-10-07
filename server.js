// Teste de conexão E criação de tabelas
pool.connect()
    .then(async (client) => {
        console.log('✅ Conexão PostgreSQL bem-sucedida!');
        
        // Criar tabelas automaticamente
        try {
            console.log('🗄️  Verificando/criando tabelas...');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS photographers (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    studio_name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
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
                );
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
                );
            `);
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS photo_selections (
                    id SERIAL PRIMARY KEY,
                    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
                    selected BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            
            console.log('✅ Tabelas verificadas/criadas com sucesso!');
            
            // Verificar quantas tabelas foram criadas
            const tableCheck = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);
            
            console.log('📋 Tabelas disponíveis:', tableCheck.rows.map(row => row.table_name).join(', '));
            
        } catch (error) {
            console.error('❌ Erro ao criar tabelas:', error.message);
        }
        
        client.release();
    })
    .catch(err => {
        console.error('❌ Erro PostgreSQL:', err.message);
        console.error('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Presente' : 'Ausente');
    });
