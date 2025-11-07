const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Auth endpoints
    async clientLogin(username, password) {
        return this.request('/auth.php', {
            method: 'POST',
            body: JSON.stringify({ username, password, type: 'client' })
        });
    }

    async adminLogin(username, password) {
        return this.request('/auth.php', {
            method: 'POST',
            body: JSON.stringify({ username, password, type: 'admin' })
        });
    }

    async logout() {
        return this.request('/auth.php', {
            method: 'DELETE'
        });
    }

    // File endpoints
    async uploadFiles(formData) {
        const response = await fetch(`${API_BASE}/files.php`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
        return await response.json();
    }

    async getFiles() {
        return this.request('/files.php');
    }

    async deleteFile(filename) {
        return this.request('/files.php', {
            method: 'DELETE',
            body: JSON.stringify({ filename })
        });
    }

    // User management endpoints
    async createClient(userData) {
        return this.request('/users.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getClients() {
        return this.request('/users.php');
    }

    async deleteClient(userId) {
        return this.request('/users.php', {
            method: 'DELETE',
            body: JSON.stringify({ user_id: userId })
        });
    }

    // Database endpoints
    async backupDatabase() {
        return this.request('/backups.php', {
            method: 'POST'
        });
    }

    async getBackups() {
        return this.request('/backups.php');
    }

    async showTables() {
        return this.request('/backups.php?action=tables');
    }

    async downloadBackup(filename) {
        window.open(`${API_BASE}/backups.php?download=${filename}`);
    }
}

const apiClient = new ApiClient();