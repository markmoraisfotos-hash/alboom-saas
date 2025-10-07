// Configuração da API
const API_BASE_URL = 'https://your-api-domain.com/api'; // Substitua pela sua URL de produção
// Para desenvolvimento local: const API_BASE_URL = 'http://localhost:3000/api';

// Estado global da aplicação
let currentUser = null;
let currentSession = null;
let selectedPhotos = new Set();
let allPhotos = [];

// Classe para gerenciar API
class APIClient {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Métodos de autenticação
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        this.token = data.token;
        localStorage.setItem('authToken', this.token);
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        this.token = data.token;
        localStorage.setItem('authToken', this.token);
        return data;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Métodos de sessões
    async getSessions() {
        return await this.request('/sessions');
    }

    async createSession(sessionData) {
        return await this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }

    async getSession(sessionId) {
        return await this.request(`/sessions/${sessionId}`);
    }

    async uploadPhotos(sessionId, files, onProgress) {
        const formData = new FormData();
        
        for (let file of files) {
            formData.append('photos', file);
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentage = (e.loaded / e.total) * 100;
                    onProgress(percentage);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Upload failed'));

            xhr.open('POST', `${API_BASE_URL}/sessions/${sessionId}/photos`);
            xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            xhr.send(formData);
        });
    }

    async saveSelections(sessionId, selections) {
        return await this.request(`/sessions/${sessionId}/selections`, {
            method: 'POST',
            body: JSON.stringify({ selections })
        });
    }

    async getStats() {
        return await this.request('/stats');
    }
}

// Instância global da API
const api = new APIClient();

// Gerenciamento de modais
class ModalManager {
    static show(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    static hide(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    static hideAll() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = 'auto';
    }
}

// Gerenciamento de notificações toast
class ToastManager {
    static show(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 100);

        // Remover após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
}

// Gerenciamento de loading
class LoadingManager {
    static show(message = 'Carregando...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.classList.remove('hidden');
    }

    static hide() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Verificar se já está logado
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verificar validade do token e carregar usuário
        loadUserData();
    } else {
        showLandingPage();
    }
}

async function loadUserData() {
    try {
        LoadingManager.show('Carregando dados do usuário...');
        const userData = await api.request('/auth/me');
        currentUser = userData.user;
        showDashboard();
        await loadDashboardData();
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        api.logout();
        showLandingPage();
    } finally {
        LoadingManager.hide();
    }
}

function showLandingPage() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('clientSelection').classList.add('hidden');
    
    // Mostrar botões de login/registro
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('registerBtn').classList.remove('hidden');
    document.getElementById('userMenu').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('clientSelection').classList.add('hidden');
    
    // Mostrar menu do usuário
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('registerBtn').classList.add('hidden');
    document.getElementById('userMenu').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.name;
}

async function loadDashboardData() {
    try {
        // Carregar estatísticas
        const stats = await api.getStats();
        document.getElementById('totalSessions').textContent = stats.totalSessions;
        document.getElementById('totalPhotos').textContent = stats.totalPhotos;
        document.getElementById('totalSelections').textContent = stats.totalSelections;

        // Carregar sessões
        const sessions = await api.getSessions();
        renderSessions(sessions);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        ToastManager.show('Erro ao carregar dados', 'error');
    }
}

function renderSessions(sessions) {
    const container = document.getElementById('sessionsList');
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-camera"></i>
                <h3>Nenhuma sessão encontrada</h3>
                <p>Crie sua primeira sessão de fotos para começar</p>
                <button class="btn-primary" onclick="document.getElementById('newSessionBtn').click()">
                    <i class="fas fa-plus"></i> Nova Sessão
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="session-card" data-session-id="${session.id}">
            <div class="session-header">
                <h3>${session.title}</h3>
                <div class="session-status ${session.status}">
                    ${getStatusText(session.status)}
                </div>
            </div>
            <div class="session-info">
                <p><i class="fas fa-user"></i> ${session.clientName}</p>
                <p><i class="fas fa-calendar"></i> ${new Date(session.date).toLocaleDateString('pt-BR')}</p>
                <p><i class="fas fa-images"></i> ${session.photoCount} fotos</p>
                <p><i class="fas fa-heart"></i> ${session.selectionCount || 0} selecionadas</p>
            </div>
            <div class="session-actions">
                <button class="btn-secondary" onclick="viewSession('${session.id}')">
                    <i class="fas fa-eye"></i> Visualizar
                </button>
                <button class="btn-primary" onclick="copyClientLink('${session.clientLink}')">
                    <i class="fas fa-link"></i> Link Cliente
                </button>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Ativa',
        'completed': 'Concluída',
        'expired': 'Expirada'
    };
    return statusMap[status] || status;
}

// Setup de event listeners
function setupEventListeners() {
    // Botões de autenticação
    document.getElementById('loginBtn').addEventListener('click', () => {
        ModalManager.show('loginModal');
    });

    document.getElementById('registerBtn').addEventListener('click', () => {
        ModalManager.show('registerModal');
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Formulários
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('newSessionForm').addEventListener('submit', handleCreateSession);

    // Botão nova sessão
    document.getElementById('newSessionBtn').addEventListener('click', () => {
        ModalManager.show('newSessionModal');
    });

    // Upload de fotos
    const uploadArea = document.getElementById('uploadArea');
    const photoUpload = document.getElementById('photoUpload');

    uploadArea.addEventListener('click', () => photoUpload.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    photoUpload.addEventListener('change', handleFileSelect);

    // Filtros e busca na seleção de fotos
    document.getElementById('searchFilter').addEventListener('input', filterPhotos);
    document.getElementById('filterBy').addEventListener('change', filterPhotos);

    // Botões de ação
    document.getElementById('generateCodesBtn').addEventListener('click', generateLightroomCodes);
    document.getElementById('copyCodesBtn').addEventListener('click', copyLightroomCodes);

    // Fechar modais
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            ModalManager.hide(modal.id);
        });
    });

    // Fechar modal clicando fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ModalManager.hide(modal.id);
            }
        });
    });
}

// Handlers de autenticação
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        LoadingManager.show('Fazendo login...');
        const result = await api.login(email, password);
        currentUser = result.user;
        
        ModalManager.hideAll();
        showDashboard();
        await loadDashboardData();
        
        ToastManager.show('Login realizado com sucesso!', 'success');
    } catch (error) {
        ToastManager.show(error.message, 'error');
    } finally {
        LoadingManager.hide();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        studioName: document.getElementById('registerStudio').value
    };

    try {
        LoadingManager.show('Criando conta...');
        const result = await api.register(userData);
        currentUser = result.user;
        
        ModalManager.hideAll();
        showDashboard();
        await loadDashboardData();
        
        ToastManager.show('Conta criada com sucesso!', 'success');
    } catch (error) {
        ToastManager.show(error.message, 'error');
    } finally {
        LoadingManager.hide();
    }
}

function logout() {
    api.logout();
    currentUser = null;
    showLandingPage();
    ToastManager.show('Logout realizado com sucesso', 'success');
}

// Handlers de upload
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function processFiles(files) {
    // Filtrar apenas imagens
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        ToastManager.show('Nenhuma imagem válida encontrada', 'error');
        return;
    }

    if (imageFiles.length > 1500) {
        ToastManager.show('Máximo de 1500 fotos permitido', 'error');
        return;
    }

    // Verificar tamanho dos arquivos
    const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
        ToastManager.show(`${oversizedFiles.length} arquivo(s) excede(m) 10MB`, 'error');
        return;
    }

    displayUploadedPhotos(imageFiles);
}

function displayUploadedPhotos(files) {
    const uploadedPhotos = document.getElementById('uploadedPhotos');
    const photoGrid = document.getElementById('photoGrid');
    const photoCount = document.getElementById('photoCount');
    
    uploadedPhotos.classList.remove('hidden');
    photoCount.textContent = files.length;
    
    // Mostrar preview das primeiras 20 fotos
    const previewFiles = files.slice(0, 20);
    photoGrid.innerHTML = previewFiles.map((file, index) => {
        const url = URL.createObjectURL(file);
        return `
            <div class="photo-preview">
                <img src="${url}" alt="Preview ${index + 1}">
                <span class="photo-filename">${file.name}</span>
            </div>
        `;
    }).join('');
    
    if (files.length > 20) {
        photoGrid.innerHTML += `
            <div class="photo-preview more-photos">
                <div class="more-count">+${files.length - 20}</div>
                <span>mais fotos</span>
            </div>
        `;
    }
    
    // Armazenar arquivos para upload
    window.pendingFiles = files;
}

// Handler de criação de sessão
async function handleCreateSession(e) {
    e.preventDefault();
    
    const sessionData = {
        title: document.getElementById('sessionTitle').value,
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        date: document.getElementById('sessionDate').value,
        description: document.getElementById('sessionDescription').value
    };

    try {
        LoadingManager.show('Criando sessão...');
        
        // Criar sessão
        const session = await api.createSession(sessionData);
        
        // Upload das fotos se houver
        if (window.pendingFiles && window.pendingFiles.length > 0) {
            await uploadPhotosToSession(session.id, window.pendingFiles);
        }
        
        ModalManager.hideAll();
        await loadDashboardData();
        
        ToastManager.show('Sessão criada com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('newSessionForm').reset();
        document.getElementById('uploadedPhotos').classList.add('hidden');
        window.pendingFiles = null;
        
    } catch (error) {
        ToastManager.show(error.message, 'error');
    } finally {
        LoadingManager.hide();
    }
}

async function uploadPhotosToSession(sessionId, files) {
    const progressElement = document.getElementById('uploadProgress');
    const statusElement = document.getElementById('uploadStatus');
    const progressFill = progressElement.querySelector('.progress-fill');
    
    progressElement.classList.remove('hidden');
    
    try {
        await api.uploadPhotos(sessionId, files, (percentage) => {
            progressFill.style.width = `${percentage}%`;
            statusElement.textContent = `Enviando fotos... ${Math.round(percentage)}%`;
        });
        
        statusElement.textContent = 'Upload concluído!';
        
    } catch (error) {
        statusElement.textContent = 'Erro no upload';
        throw error;
    }
}

// Funções de visualização e seleção
async function viewSession(sessionId) {
    try {
        LoadingManager.show('Carregando sessão...');
        
        const session = await api.getSession(sessionId);
        currentSession = session;
        allPhotos = session.photos;
        
        // Mostrar interface de seleção
        showClientSelection(session);
        
    } catch (error) {
        ToastManager.show('Erro ao carregar sessão', 'error');
    } finally {
        LoadingManager.hide();
    }
}

function showClientSelection(session) {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('clientSelection').classList.remove('hidden');
    
    // Atualizar cabeçalho
    document.getElementById('selectionTitle').textContent = session.title;
    document.getElementById('selectionDescription').textContent = 
        `Cliente: ${session.clientName} | ${session.photos.length} fotos`;
    
    // Renderizar galeria de fotos
    renderPhotoGallery(session.photos);
    updateSelectionStats();
}

function renderPhotoGallery(photos) {
    const gallery = document.getElementById('photoGallery');
    
    gallery.innerHTML = photos.map(photo => `
        <div class="photo-item ${selectedPhotos.has(photo.id) ? 'selected' : ''}" 
             data-photo-id="${photo.id}"
             onclick="togglePhotoSelection('${photo.id}')">
            <div class="photo-container">
                <img src="${photo.thumbnailUrl}" alt="${photo.filename}" loading="lazy">
                <div class="photo-overlay">
                    <div class="selection-indicator">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>
            </div>
            <div class="photo-info">
                <span class="photo-filename">${photo.filename}</span>
            </div>
        </div>
    `).join('');
}

function togglePhotoSelection(photoId) {
    if (selectedPhotos.has(photoId)) {
        selectedPhotos.delete(photoId);
    } else {
        selectedPhotos.add(photoId);
    }
    
    // Atualizar visual da foto
    const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`);
    photoElement.classList.toggle('selected');
    
    updateSelectionStats();
    saveSelectionsDebounced();
}

function updateSelectionStats() {
    document.getElementById('selectedCount').textContent = selectedPhotos.size;
}

// Debounce para salvar seleções
let saveTimeout;
function saveSelectionsDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            await api.saveSelections(currentSession.id, Array.from(selectedPhotos));
        } catch (error) {
            console.error('Erro ao salvar seleções:', error);
        }
    }, 1000);
}

// Filtros de fotos
function filterPhotos() {
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const filterBy = document.getElementById('filterBy').value;
    
    const photoItems = document.querySelectorAll('.photo-item');
    
    photoItems.forEach(item => {
        const photoId = item.dataset.photoId;
        const filename = item.querySelector('.photo-filename').textContent.toLowerCase();
        const isSelected = selectedPhotos.has(photoId);
        
        let showItem = true;
        
        // Filtro por texto
        if (searchTerm && !filename.includes(searchTerm)) {
            showItem = false;
        }
        
        // Filtro por seleção
        if (filterBy === 'selected' && !isSelected) {
            showItem = false;
        } else if (filterBy === 'unselected' && isSelected) {
            showItem = false;
        }
        
        item.style.display = showItem ? 'block' : 'none';
    });
}

// Geração de códigos Lightroom
function generateLightroomCodes() {
    if (selectedPhotos.size === 0) {
        ToastManager.show('Selecione pelo menos uma foto', 'error');
        return;
    }
    
    const selectedPhotoData = allPhotos.filter(photo => selectedPhotos.has(photo.id));
    const codes = selectedPhotoData.map(photo => photo.filename.split('.')[0]).join(' OR ');
    
    document.getElementById('lightroomCodes').value = codes;
    document.getElementById('summaryCount').textContent = selectedPhotos.size;
    
    // Lista de fotos selecionadas
    const selectedList = document.getElementById('selectedPhotosList');
    selectedList.innerHTML = selectedPhotoData.map(photo => `
        <div class="selected-photo-item">
            <img src="${photo.thumbnailUrl}" alt="${photo.filename}">
            <span>${photo.filename}</span>
        </div>
    `).join('');
    
    ModalManager.show('codesModal');
}

async function copyLightroomCodes() {
    const textarea = document.getElementById('lightroomCodes');
    
    try {
        await navigator.clipboard.writeText(textarea.value);
        ToastManager.show('Códigos copiados!', 'success');
    } catch (error) {
        // Fallback para browsers mais antigos
        textarea.select();
        document.execCommand('copy');
        ToastManager.show('Códigos copiados!', 'success');
    }
}

// Utilitários
function copyClientLink(link) {
    navigator.clipboard.writeText(link);
    ToastManager.show('Link copiado!', 'success');
}

// Sistema de navegação por URL (para links diretos de clientes)
function handleClientAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');
    
    if (sessionToken) {
        // Acesso direto do cliente
        loadClientSession(sessionToken);
    }
}

async function loadClientSession(sessionToken) {
    try {
        LoadingManager.show('Carregando sessão...');
        
        const session = await api.request(`/client/session/${sessionToken}`);
        currentSession = session;
        allPhotos = session.photos;
        selectedPhotos = new Set(session.selections || []);
        
        showClientSelection(session);
        
        // Esconder elementos do fotógrafo
        document.querySelector('.header').style.display = 'none';
        
    } catch (error) {
        ToastManager.show('Sessão não encontrada ou expirada', 'error');
    } finally {
        LoadingManager.hide();
    }
}

// Verificar acesso do cliente na inicialização
document.addEventListener('DOMContentLoaded', () => {
    handleClientAccess();
});