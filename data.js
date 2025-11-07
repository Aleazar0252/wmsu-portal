// Data storage and utilities
class DataManager {
    constructor() {
        this.usersKey = 'wmsu_clients';
        this.filesKey = 'wmsu_client_files';
        this.init();
    }

    init() {
        // Initialize default admin if not exists
        if (!this.getUsers().some(user => user.username === 'admin')) {
            const defaultUsers = [
                {
                    id: this.generateId(),
                    username: 'admin',
                    password: 'admin123',
                    name: 'System Administrator',
                    email: 'admin@wmsu-research.com',
                    role: 'admin',
                    subdomain: 'admin',
                    plan: 'admin',
                    storageLimit: 0,
                    status: 'active',
                    accountCreated: new Date().toISOString().split('T')[0]
                }
            ];
            localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
        }
    }

    // User management
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey)) || [];
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    getUserByUsername(username) {
        return this.getUsers().find(user => user.username === username);
    }

    getUserById(id) {
        return this.getUsers().find(user => user.id === id);
    }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: this.generateId(),
            ...userData,
            status: 'active',
            accountCreated: new Date().toISOString().split('T')[0],
            files: [],
            storageUsed: 0
        };
        
        users.push(newUser);
        this.saveUsers(users);
        return newUser;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updates };
            this.saveUsers(users);
            return users[userIndex];
        }
        return null;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== userId);
        this.saveUsers(filteredUsers);
        return filteredUsers;
    }

    // File management
    getClientFiles(clientId) {
        const allFiles = JSON.parse(localStorage.getItem(this.filesKey)) || {};
        return allFiles[clientId] || [];
    }

    saveClientFiles(clientId, files) {
        const allFiles = JSON.parse(localStorage.getItem(this.filesKey)) || {};
        allFiles[clientId] = files;
        localStorage.setItem(this.filesKey, JSON.stringify(allFiles));
    }

    addClientFile(clientId, file) {
        const files = this.getClientFiles(clientId);
        const newFile = {
            id: this.generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString().split('T')[0],
            clientId: clientId
        };
        files.push(newFile);
        this.saveClientFiles(clientId, files);
        
        // Update storage used
        const user = this.getUserById(clientId);
        if (user) {
            user.storageUsed = (user.storageUsed || 0) + (file.size / (1024 * 1024)); // Convert to MB
            this.updateUser(clientId, { storageUsed: user.storageUsed });
        }
        
        return newFile;
    }

    deleteClientFile(clientId, fileId) {
        const files = this.getClientFiles(clientId);
        const fileIndex = files.findIndex(file => file.id === fileId);
        
        if (fileIndex !== -1) {
            const file = files[fileIndex];
            files.splice(fileIndex, 1);
            this.saveClientFiles(clientId, files);
            
            // Update storage used
            const user = this.getUserById(clientId);
            if (user) {
                user.storageUsed = Math.max(0, (user.storageUsed || 0) - (file.size / (1024 * 1024)));
                this.updateUser(clientId, { storageUsed: user.storageUsed });
            }
        }
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    validateSubdomain(subdomain) {
        const users = this.getUsers();
        return !users.some(user => user.subdomain === subdomain && user.role !== 'admin');
    }

    exportData() {
        const data = {
            users: this.getUsers(),
            files: JSON.parse(localStorage.getItem(this.filesKey)) || {},
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.users) this.saveUsers(data.users);
            if (data.files) localStorage.setItem(this.filesKey, JSON.stringify(data.files));
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Initialize data manager
const dataManager = new DataManager();