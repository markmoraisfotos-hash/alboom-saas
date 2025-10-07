const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Configuração do AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração do Multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por arquivo
        files: 1500 // Máximo 1500 arquivos
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'), false);
        }
    }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de acesso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Funções utilitárias
const generateSessionToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const uploadToS3 = async (file, key) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: 'image/jpeg',
        ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
};

const createThumbnail = async (imageBuffer) => {
    return await sharp(imageBuffer)
        .resize(400, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
};

// Rotas de Autenticação
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, studioName } = req.body;

        // Verificar se o usuário já existe
        const existingUser = await pool.query(
            'SELECT id FROM photographers WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário
        const result = await pool.query(
            `INSERT INTO photographers (name, email, password_hash, studio_name, created_at) 
             VALUES ($1, $2, $3, $4, NOW()) 
             RETURNING id, name, email, studio_name, created_at`,
            [name, email, hashedPassword, studioName]
        );

        const user = result.rows[0];

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                studioName: user.studio_name,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuário
        const result = await pool.query(
            'SELECT id, name, email, password_hash, studio_name FROM photographers WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                studioName: user.studio_name
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, studio_name FROM photographers WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                studioName: user.studio_name
            }
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rotas de Sessões
app.post('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const { title, clientName, clientEmail, date, description } = req.body;
        const photographerId = req.user.userId;

        // Gerar token único para a sessão
        const clientToken = generateSessionToken();

        const result = await pool.query(
            `INSERT INTO sessions (photographer_id, title, client_name, client_email, date, description, client_token, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW())
             RETURNING *`,
            [photographerId, title, clientName, clientEmail, date, description, clientToken]
        );

        const session = result.rows[0];

        // Gerar link do cliente
        const clientLink = `${process.env.FRONTEND_URL}?session=${clientToken}`;

        res.status(201).json({
            message: 'Sessão criada com sucesso',
            session: {
                id: session.id,
                title: session.title,
                clientName: session.client_name,
                clientEmail: session.client_email,
                date: session.date,
                description: session.description,
                status: session.status,
                clientLink: clientLink,
                createdAt: session.created_at
            }
        });
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/api/sessions', authenticateToken, async (req, res) => {
    try {
        const photographerId = req.user.userId;

        const result = await pool.query(
            `SELECT s.*, 
                    COUNT(p.id) as photo_count,
                    COUNT(CASE WHEN ps.selected = true THEN 1 END) as selection_count
             FROM sessions s
             LEFT JOIN photos p ON s.id = p.session_id
             LEFT JOIN photo_selections ps ON p.id = ps.photo_id
             WHERE s.photographer_id = $1
             GROUP BY s.id
             ORDER BY s.created_at DESC`,
            [photographerId]
        );

        const sessions = result.rows.map(session => ({
            id: session.id,
            title: session.title,
            clientName: session.client_name,
            clientEmail: session.client_email,
            date: session.date,
            description: session.description,
            status: session.status,
            photoCount: parseInt(session.photo_count) || 0,
            selectionCount: parseInt(session.selection_count) || 0,
            clientLink: `${process.env.FRONTEND_URL}?session=${session.client_token}`,
            createdAt: session.created_at
        }));

        res.json(sessions);
    } catch (error) {
        console.error('Erro ao buscar sessões:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/api/sessions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const photographerId = req.user.userId;

        // Buscar sessão
        const sessionResult = await pool.query(
            'SELECT * FROM sessions WHERE id = $1 AND photographer_id = $2',
            [id, photographerId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada' });
        }

        const session = sessionResult.rows[0];

        // Buscar fotos da sessão
        const photosResult = await pool.query(
            `SELECT p.*, ps.selected 
             FROM photos p
             LEFT JOIN photo_selections ps ON p.id = ps.photo_id
             WHERE p.session_id = $1
             ORDER BY p.filename`,
            [id]
        );

        const photos = photosResult.rows.map(photo => ({
            id: photo.id,
            filename: photo.filename,
            url: photo.s3_url,
            thumbnailUrl: photo.thumbnail_url,
            selected: photo.selected || false
        }));

        // Buscar seleções
        const selectionsResult = await pool.query(
            'SELECT photo_id FROM photo_selections WHERE photo_id IN (SELECT id FROM photos WHERE session_id = $1) AND selected = true',
            [id]
        );

        const selections = selectionsResult.rows.map(row => row.photo_id);

        res.json({
            id: session.id,
            title: session.title,
            clientName: session.client_name,
            clientEmail: session.client_email,
            date: session.date,
            description: session.description,
            status: session.status,
            photos: photos,
            selections: selections
        });
    } catch (error) {
        console.error('Erro ao buscar sessão:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Upload de fotos
app.post('/api/sessions/:id/photos', authenticateToken, upload.array('photos', 1500), async (req, res) => {
    try {
        const { id } = req.params;
        const photographerId = req.user.userId;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'Nenhuma foto enviada' });
        }

        // Verificar se a sessão pertence ao fotógrafo
        const sessionResult = await pool.query(
            'SELECT id FROM sessions WHERE id = $1 AND photographer_id = $2',
            [id, photographerId]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada' });
        }

        const uploadedPhotos = [];

        // Processar fotos em lotes para evitar sobrecarga
        const batchSize = 10;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
                try {
                    // Gerar nomes únicos
                    const timestamp = Date.now();
                    const randomId = crypto.randomBytes(8).toString('hex');
                    const originalName = path.parse(file.originalname).name;
                    const extension = path.parse(file.originalname).ext;
                    
                    const filename = `${originalName}_${timestamp}_${randomId}${extension}`;
                    const s3Key = `sessions/${id}/photos/${filename}`;
                    const thumbnailKey = `sessions/${id}/thumbnails/thumb_${filename}`;

                    // Criar thumbnail
                    const thumbnailBuffer = await createThumbnail(file.buffer);

                    // Upload da foto original
                    const photoUrl = await uploadToS3(file.buffer, s3Key);
                    
                    // Upload do thumbnail
                    const thumbnailUrl = await uploadToS3(thumbnailBuffer, thumbnailKey);

                    // Salvar no banco de dados
                    const result = await pool.query(
                        `INSERT INTO photos (session_id, filename, original_name, s3_url, thumbnail_url, file_size, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, NOW())
                         RETURNING *`,
                        [id, filename, file.originalname, photoUrl, thumbnailUrl, file.size]
                    );

                    return {
                        id: result.rows[0].id,
                        filename: result.rows[0].filename,
                        url: result.rows[0].s3_url,
                        thumbnailUrl: result.rows[0].thumbnail_url
                    };
                } catch (error) {
                    console.error(`Erro ao processar foto ${file.originalname}:`, error);
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            uploadedPhotos.push(...batchResults.filter(photo => photo !== null));
        }

        res.json({
            message: `${uploadedPhotos.length} fotos enviadas com sucesso`,
            photos: uploadedPhotos
        });
    } catch (error) {
        console.error('Erro no upload de fotos:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Salvar seleções
app.post('/api/sessions/:id/selections', async (req, res) => {
    try {
        const { id } = req.params;
        const { selections } = req.body;

        // Limpar seleções anteriores
        await pool.query('DELETE FROM photo_selections WHERE photo_id IN (SELECT id FROM photos WHERE session_id = $1)', [id]);

        // Inserir novas seleções
        if (selections && selections.length > 0) {
            const values = selections.map(photoId => `(${photoId}, true)`).join(',');
            await pool.query(`INSERT INTO photo_selections (photo_id, selected) VALUES ${values}`);
        }

        res.json({ message: 'Seleções salvas com sucesso' });
    } catch (error) {
        console.error('Erro ao salvar seleções:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Estatísticas do dashboard
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const photographerId = req.user.userId;

        const result = await pool.query(
            `SELECT 
                COUNT(DISTINCT s.id) as total_sessions,
                COUNT(DISTINCT p.id) as total_photos,
                COUNT(DISTINCT ps.photo_id) as total_selections
             FROM sessions s
             LEFT JOIN photos p ON s.id = p.session_id
             LEFT JOIN photo_selections ps ON p.id = ps.photo_id AND ps.selected = true
             WHERE s.photographer_id = $1`,
            [photographerId]
        );

        const stats = result.rows[0];

        res.json({
            totalSessions: parseInt(stats.total_sessions) || 0,
            totalPhotos: parseInt(stats.total_photos) || 0,
            totalSelections: parseInt(stats.total_selections) || 0
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Acesso do cliente à sessão
app.get('/api/client/session/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Buscar sessão pelo token
        const sessionResult = await pool.query(
            'SELECT * FROM sessions WHERE client_token = $1',
            [token]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada ou expirada' });
        }

        const session = sessionResult.rows[0];

        // Verificar se a sessão está ativa
        if (session.status !== 'active') {
            return res.status(403).json({ message: 'Sessão não está mais ativa' });
        }

        // Buscar fotos da sessão
        const photosResult = await pool.query(
            `SELECT p.*, ps.selected 
             FROM photos p
             LEFT JOIN photo_selections ps ON p.id = ps.photo_id
             WHERE p.session_id = $1
             ORDER BY p.filename`,
            [session.id]
        );

        const photos = photosResult.rows.map(photo => ({
            id: photo.id,
            filename: photo.filename,
            url: photo.s3_url,
            thumbnailUrl: photo.thumbnail_url,
            selected: photo.selected || false
        }));

        // Buscar seleções atuais
        const selectionsResult = await pool.query(
            'SELECT photo_id FROM photo_selections WHERE photo_id IN (SELECT id FROM photos WHERE session_id = $1) AND selected = true',
            [session.id]
        );

        const selections = selectionsResult.rows.map(row => row.photo_id);

        res.json({
            id: session.id,
            title: session.title,
            clientName: session.client_name,
            date: session.date,
            description: session.description,
            photos: photos,
            selections: selections
        });
    } catch (error) {
        console.error('Erro ao acessar sessão do cliente:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Arquivo muito grande. Máximo 10MB por foto.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Muitos arquivos. Máximo 1500 fotos por sessão.' });
        }
    }
    
    console.error('Erro não tratado:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
