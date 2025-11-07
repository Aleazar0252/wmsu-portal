// Admin-specific JavaScript
class AdminApp {
    constructor() {
        this.dataManager = new DataManager();
        this.currentAdmin = null;
        this.init();
    }

    init() {
        this.checkAdminAuth();
        this.setupEventListeners();
    }

    checkAdminAuth() {
        const admin = JSON.parse(localStorage.getItem('adminUser'));
        if (admin && admin.role === 'admin') {
            this.currentAdmin = admin;
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAdminLogin();
            });
        }

        // Admin logout
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', () => {
                this.handleAdminLogout();
            });
        }
    }

    handleAdminLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminLoginError');

        // Check admin credentials
        if (username === 'admin' && password === 'admin123') {
            this.currentAdmin = {
                id: 'admin',
                name: 'System Administrator',
                username: 'admin',
                role: 'admin'
            };
            
            localStorage.setItem('adminUser', JSON.stringify(this.currentAdmin));
            this.showDashboard();
        } else {
            errorDiv.style.display = 'block';
        }
    }

    handleAdminLogout() {
        localStorage.removeItem('adminUser');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('adminLoginPage').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('adminLoginPage').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        document.getElementById('adminName').textContent = this.currentAdmin.name;
        this.loadClients();
        this.updateStats();
        this.setupDashboardEvents();
    }

    setupDashboardEvents() {
        // Create account form
        const createAccountForm = document.getElementById('createAccountForm');
        if (createAccountForm) {
            createAccountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateAccount();
            });
        }

        // Search clients
        const searchClients = document.getElementById('searchClients');
        if (searchClients) {
            searchClients.addEventListener('input', (e) => {
                this.loadClients(e.target.value);
            });
        }

        // Export data
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const modal = document.getElementById('editClientModal');
        const closeButtons = document.querySelectorAll('.close-modal');
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    loadClients(searchTerm = '') {
        const clients = this.dataManager.getUsers().filter(user => user.role !== 'admin');
        const filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const clientsTable = document.getElementById('clientsTable');
        clientsTable.innerHTML = '';
        
        filteredClients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.name}</td>
                <td>${client.username}</td>
                <td>${client.subdomain}.wmsu-research.com</td>
                <td><span class="badge badge-${client.plan}">${client.plan}</span></td>
                <td><span class="status status-${client.status}">${client.status}</span></td>
                <td>${client.accountCreated}</td>
                <td>
                    <button class="btn-icon btn-edit" data-client-id="${client.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" data-client-id="${client.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            clientsTable.appendChild(row);
        });
        
        // Add event listeners to edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientId = e.currentTarget.getAttribute('data-client-id');
                this.editClient(clientId);
            });
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const clientId = e.currentTarget.getAttribute('data-client-id');
                this.deleteClient(clientId);
            });
        });
    }

    updateStats() {
        const clients = this.dataManager.getUsers().filter(user => user.role !== 'admin');
        const activeClients = clients.filter(client => client.status === 'active');
        
        // Calculate total files and storage
        let totalFiles = 0;
        let totalStorage = 0;
        
        clients.forEach(client => {
            const clientFiles = this.dataManager.getClientFiles(client.id);
            totalFiles += clientFiles.length;
            totalStorage += client.storageUsed || 0;
        });
        
        document.getElementById('totalClients').textContent = clients.length;
        document.getElementById('activeClients').textContent = activeClients.length;
        document.getElementById('totalFiles').textContent = totalFiles;
        document.getElementById('totalStorage').textContent = totalStorage.toFixed(2);
    }

    handleCreateAccount() {
        const clientName = document.getElementById('clientName').value;
        const clientEmail = document.getElementById('clientEmail').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const subdomain = document.getElementById('subdomain').value;
        const plan = document.getElementById('plan').value;
        const storageLimit = parseInt(document.getElementById('storageLimit').value);
        
        // Validate subdomain uniqueness
        if (!this.dataManager.validateSubdomain(subdomain)) {
            alert('Subdomain already exists. Please choose a different one.');
            return;
        }
        
        // Check if username already exists
        if (this.dataManager.getUserByUsername(username)) {
            alert('Username already exists. Please choose a different one.');
            return;
        }
        
        const newUser = this.dataManager.createUser({
            name: clientName,
            email: clientEmail,
            username: username,
            password: password,
            subdomain: subdomain,
            plan: plan,
            storageLimit: storageLimit,
            role: 'client'
        });
        
        if (newUser) {
            alert('Client account created successfully!');
            document.getElementById('createAccountForm').reset();
            this.loadClients();
            this.updateStats();
        } else {
            alert('Error creating client account.');
        }
    }

    editClient(clientId) {
        const client = this.dataManager.getUserById(clientId);
        if (!client) return;
        
        document.getElementById('editClientId').value = clientId;
        document.getElementById('editClientName').value = client.name;
        document.getElementById('editClientEmail').value = client.email;
        document.getElementById('editPlan').value = client.plan;
        document.getElementById('editStorageLimit').value = client.storageLimit;
        document.getElementById('editStatus').value = client.status;
        
        // Show modal
        document.getElementById('editClientModal').style.display = 'block';
        
        // Set up save button
        document.getElementById('saveClientBtn').onclick = () => {
            this.saveClientChanges(clientId);
        };
        
        // Set up delete button
        document.getElementById('deleteClientBtn').onclick = () => {
            if (confirm('Are you sure you want to delete this client account? This action cannot be undone.')) {
                this.deleteClient(clientId);
            }
        };
    }

    saveClientChanges(clientId) {
        const updates = {
            name: document.getElementById('editClientName').value,
            email: document.getElementById('editClientEmail').value,
            plan: document.getElementById('editPlan').value,
            storageLimit: parseInt(document.getElementById('editStorageLimit').value),
            status: document.getElementById('editStatus').value
        };
        
        const newPassword = document.getElementById('editPassword').value;
        if (newPassword) {
            updates.password = newPassword;
        }
        
        const success = this.dataManager.updateUser(clientId, updates);
        
        if (success) {
            alert('Client account updated successfully!');
            document.getElementById('editClientModal').style.display = 'none';
            this.loadClients();
            this.updateStats();
        } else {
            alert('Error updating client account.');
        }
    }

    deleteClient(clientId) {
        const users = this.dataManager.deleteUser(clientId);
        
        if (users) {
            alert('Client account deleted successfully!');
            document.getElementById('editClientModal').style.display = 'none';
            this.loadClients();
            this.updateStats();
        } else {
            alert('Error deleting client account.');
        }
    }

    exportData() {
        const data = this.dataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wmsu-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize admin application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});