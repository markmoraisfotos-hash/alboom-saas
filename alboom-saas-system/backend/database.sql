-- Banco de dados para AlboomProof SaaS
-- PostgreSQL Schema

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de fotógrafos (usuários do sistema)
CREATE TABLE photographers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    studio_name VARCHAR(255),
    phone VARCHAR(50),
    plan_type VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
    plan_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões de fotos
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    date DATE,
    description TEXT,
    client_token VARCHAR(255) UNIQUE NOT NULL, -- Token único para acesso do cliente
    status VARCHAR(50) DEFAULT 'active', -- active, completed, expired, archived
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    password_protected BOOLEAN DEFAULT false,
    access_password VARCHAR(255), -- Hash da senha para acesso restrito
    watermark_enabled BOOLEAN DEFAULT true,
    max_selections INTEGER, -- Limite de seleções (null = ilimitado)
    download_enabled BOOLEAN DEFAULT false,
    download_quality VARCHAR(50) DEFAULT 'high', -- low, medium, high, original
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fotos
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    s3_url TEXT NOT NULL, -- URL da foto original no S3
    thumbnail_url TEXT NOT NULL, -- URL do thumbnail no S3
    medium_url TEXT, -- URL da versão média no S3 (opcional)
    file_size BIGINT, -- Tamanho em bytes
    width INTEGER, -- Largura da imagem
    height INTEGER, -- Altura da imagem
    metadata JSONB, -- Metadados EXIF e outros
    upload_batch VARCHAR(100), -- Identificador do lote de upload
    is_processed BOOLEAN DEFAULT false, -- Se o processamento foi concluído
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de seleções de fotos
CREATE TABLE photo_selections (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
    selected BOOLEAN DEFAULT false,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    client_ip VARCHAR(45), -- IP do cliente que fez a seleção
    notes TEXT, -- Comentários opcionais do cliente
    UNIQUE(photo_id)
);

-- Tabela de comentários nas fotos (opcional)
CREATE TABLE photo_comments (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER REFERENCES photos(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    author_name VARCHAR(255), -- Nome de quem comentou
    author_email VARCHAR(255), -- Email de quem comentou
    comment TEXT NOT NULL,
    is_photographer BOOLEAN DEFAULT false, -- Se é comentário do fotógrafo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de planos de assinatura
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    max_sessions INTEGER, -- Limite de sessões por mês (null = ilimitado)
    max_photos_per_session INTEGER, -- Limite de fotos por sessão
    max_storage_gb INTEGER, -- Limite de armazenamento em GB
    custom_branding BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    features JSONB, -- Lista de recursos específicos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de assinaturas dos fotógrafos
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'active', -- active, canceled, expired, past_due
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    stripe_subscription_id VARCHAR(255), -- ID da assinatura no Stripe
    stripe_customer_id VARCHAR(255), -- ID do cliente no Stripe
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de uso/métricas
CREATE TABLE usage_metrics (
    id SERIAL PRIMARY KEY,
    photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    sessions_created INTEGER DEFAULT 0,
    photos_uploaded INTEGER DEFAULT 0,
    storage_used_mb BIGINT DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photographer_id, metric_date)
);

-- Tabela de logs de atividade
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- login, upload, selection, etc.
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de configurações personalizadas
CREATE TABLE photographer_settings (
    id SERIAL PRIMARY KEY,
    photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
    branding_logo_url TEXT,
    branding_color VARCHAR(7), -- Cor hexadecimal
    watermark_text VARCHAR(255),
    watermark_opacity DECIMAL(3,2) DEFAULT 0.5,
    email_notifications JSONB DEFAULT '{"new_selection": true, "session_expired": true}',
    default_session_duration INTEGER DEFAULT 30, -- Dias
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    custom_css TEXT, -- CSS personalizado para white-label
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photographer_id)
);

-- Tabela de templates de email
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    photographer_id INTEGER REFERENCES photographers(id) ON DELETE CASCADE,
    template_type VARCHAR(50) NOT NULL, -- welcome, session_ready, reminder, etc.
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_photographers_email ON photographers(email);
CREATE INDEX idx_photographers_plan ON photographers(plan_type, is_active);

CREATE INDEX idx_sessions_photographer ON sessions(photographer_id);
CREATE INDEX idx_sessions_token ON sessions(client_token);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE INDEX idx_photos_session ON photos(session_id);
CREATE INDEX idx_photos_filename ON photos(filename);
CREATE INDEX idx_photos_created ON photos(created_at);

CREATE INDEX idx_selections_photo ON photo_selections(photo_id);

CREATE INDEX idx_usage_photographer_date ON usage_metrics(photographer_id, metric_date);

CREATE INDEX idx_activity_photographer ON activity_logs(photographer_id);
CREATE INDEX idx_activity_session ON activity_logs(session_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON photographers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON photographer_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpeza automática de sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Marcar sessões como expiradas
    UPDATE sessions 
    SET status = 'expired' 
    WHERE status = 'active' 
    AND expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas de uso
CREATE OR REPLACE FUNCTION calculate_daily_usage(p_photographer_id INTEGER, p_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_metrics (photographer_id, metric_date, sessions_created, photos_uploaded, storage_used_mb)
    SELECT 
        p_photographer_id,
        p_date,
        COUNT(DISTINCT s.id) as sessions_created,
        COUNT(DISTINCT p.id) as photos_uploaded,
        COALESCE(SUM(p.file_size), 0) / 1024 / 1024 as storage_used_mb
    FROM sessions s
    LEFT JOIN photos p ON s.id = p.session_id
    WHERE s.photographer_id = p_photographer_id
    AND DATE(s.created_at) = p_date
    ON CONFLICT (photographer_id, metric_date) 
    DO UPDATE SET
        sessions_created = EXCLUDED.sessions_created,
        photos_uploaded = EXCLUDED.photos_uploaded,
        storage_used_mb = EXCLUDED.storage_used_mb;
END;
$$ LANGUAGE plpgsql;

-- Inserir planos padrão
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, max_sessions, max_photos_per_session, max_storage_gb, custom_branding, priority_support) VALUES
('Gratuito', 'free', 'Plano gratuito com funcionalidades básicas', 0.00, 0.00, 3, 100, 1, false, false),
('Básico', 'basic', 'Ideal para fotógrafos iniciantes', 29.90, 299.00, 20, 500, 10, false, false),
('Profissional', 'pro', 'Para fotógrafos estabelecidos', 59.90, 599.00, 100, 1500, 50, true, true),
('Empresarial', 'enterprise', 'Para estúdios e grandes volumes', 149.90, 1499.00, NULL, NULL, 200, true, true);

-- Views úteis
CREATE VIEW session_stats AS
SELECT 
    s.id,
    s.title,
    s.photographer_id,
    COUNT(p.id) as total_photos,
    COUNT(CASE WHEN ps.selected = true THEN 1 END) as selected_photos,
    ROUND(
        (COUNT(CASE WHEN ps.selected = true THEN 1 END)::float / 
         NULLIF(COUNT(p.id), 0)) * 100, 2
    ) as selection_percentage
FROM sessions s
LEFT JOIN photos p ON s.id = p.session_id
LEFT JOIN photo_selections ps ON p.id = ps.photo_id
GROUP BY s.id, s.title, s.photographer_id;

CREATE VIEW photographer_usage AS
SELECT 
    p.id,
    p.name,
    p.plan_type,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT ph.id) as total_photos,
    COALESCE(SUM(ph.file_size), 0) / 1024 / 1024 / 1024 as storage_gb_used
FROM photographers p
LEFT JOIN sessions s ON p.id = s.photographer_id
LEFT JOIN photos ph ON s.id = ph.session_id
GROUP BY p.id, p.name, p.plan_type;

-- Comentários nas tabelas
COMMENT ON TABLE photographers IS 'Tabela de fotógrafos cadastrados no sistema';
COMMENT ON TABLE sessions IS 'Sessões de fotos criadas pelos fotógrafos';
COMMENT ON TABLE photos IS 'Fotos individuais de cada sessão';
COMMENT ON TABLE photo_selections IS 'Seleções feitas pelos clientes';
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas dos fotógrafos';
COMMENT ON TABLE usage_metrics IS 'Métricas de uso diário para controle de limites';
COMMENT ON TABLE activity_logs IS 'Log de atividades para auditoria';
COMMENT ON TABLE photographer_settings IS 'Configurações personalizadas de cada fotógrafo';

-- Função para backup/restore de sessões
CREATE OR REPLACE FUNCTION export_session_data(p_session_id INTEGER)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'session', to_json(s.*),
        'photos', json_agg(to_json(p.*)),
        'selections', json_agg(to_json(ps.*))
    ) INTO result
    FROM sessions s
    LEFT JOIN photos p ON s.id = p.session_id
    LEFT JOIN photo_selections ps ON p.id = ps.photo_id
    WHERE s.id = p_session_id
    GROUP BY s.id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;