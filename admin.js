// Admin-specific JavaScript
class AdminApp {
    constructor() {
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

    async handleAdminLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminLoginError');

        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });

            const result = await response.json();

            if (result.success && result.user.role === 'admin') {
                this.currentAdmin = result.user;
                localStorage.setItem('adminUser', JSON.stringify(result.user));
                this.showDashboard();
            } else {
                errorDiv.style.display = 'block';
                errorDiv.textContent = result.message || 'Invalid credentials';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Network error. Please try again.';
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

    async loadClients(searchTerm = '') {
        try {
            const response = await fetch('api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_all'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.displayClients(result.users, searchTerm);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            // Fallback to localStorage if API fails
            this.loadClientsFromLocalStorage(searchTerm);
        }
    }

    loadClientsFromLocalStorage(searchTerm = '') {
        const dataManager = new DataManager();
        const clients = dataManager.getUsers().filter(user => user.role !== 'admin');
        const filteredClients = clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.displayClients(filteredClients);
    }

    displayClients(clients, searchTerm = '') {
        const filteredClients = searchTerm ? 
            clients.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
            ) : clients;
        
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

    async updateStats() {
        try {
            const response = await fetch('api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_all'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.calculateStats(result.users);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            // Fallback to localStorage
            const dataManager = new DataManager();
            const clients = dataManager.getUsers().filter(user => user.role !== 'admin');
            this.calculateStats(clients);
        }
    }

    calculateStats(clients) {
        const activeClients = clients.filter(client => client.status === 'active');
        
        // Calculate total files and storage
        let totalFiles = 0;
        let totalStorage = 0;
        
        clients.forEach(client => {
            const dataManager = new DataManager();
            const clientFiles = dataManager.getClientFiles(client.id);
            totalFiles += clientFiles.length;
            totalStorage += client.storageUsed || 0;
        });
        
        document.getElementById('totalClients').textContent = clients.length;
        document.getElementById('activeClients').textContent = activeClients.length;
        document.getElementById('totalFiles').textContent = totalFiles;
        document.getElementById('totalStorage').textContent = totalStorage.toFixed(2);
    }

    async handleCreateAccount() {
        const clientName = document.getElementById('clientName').value;
        const clientEmail = document.getElementById('clientEmail').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const subdomain = document.getElementById('subdomain').value;
        const plan = document.getElementById('plan').value;
        const storageLimit = parseInt(document.getElementById('storageLimit').value);
        
        try {
            const response = await fetch('api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create',
                    name: clientName,
                    email: clientEmail,
                    username: username,
                    password: password,
                    subdomain: subdomain,
                    plan: plan,
                    storageLimit: storageLimit
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Client account created successfully!');
                document.getElementById('createAccountForm').reset();
                this.loadClients();
                this.updateStats();
                
                // Also create in localStorage for fallback
                const dataManager = new DataManager();
                dataManager.createUser({
                    name: clientName,
                    email: clientEmail,
                    username: username,
                    password: password,
                    subdomain: subdomain,
                    plan: plan,
                    storageLimit: storageLimit,
                    role: 'client'
                });
            } else {
                alert(result.message || 'Error creating client account.');
            }
        } catch (error) {
            console.error('Create account error:', error);
            // Fallback to localStorage
            const dataManager = new DataManager();
            
            // Validate subdomain uniqueness
            if (!dataManager.validateSubdomain(subdomain)) {
                alert('Subdomain already exists. Please choose a different one.');
                return;
            }
            
            // Check if username already exists
            if (dataManager.getUserByUsername(username)) {
                alert('Username already exists. Please choose a different one.');
                return;
            }
            
            const newUser = dataManager.createUser({
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
                alert('Client account created successfully! (Local storage)');
                document.getElementById('createAccountForm').reset();
                this.loadClients();
                this.updateStats();
            } else {
                alert('Error creating client account.');
            }
        }
    }

    editClient(clientId) {
        // Try to get client from API first, then fallback to localStorage
        const dataManager = new DataManager();
        const client = dataManager.getUserById(clientId);
        
        if (!client) {
            alert('Client not found');
            return;
        }
        
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

    async saveClientChanges(clientId) {
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
        
        try {
            const response = await fetch('api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update',
                    id: clientId,
                    ...updates
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Client account updated successfully!');
                document.getElementById('editClientModal').style.display = 'none';
                this.loadClients();
                this.updateStats();
                
                // Also update in localStorage
                const dataManager = new DataManager();
                dataManager.updateUser(clientId, updates);
            } else {
                alert(result.message || 'Error updating client account.');
            }
        } catch (error) {
            console.error('Update error:', error);
            // Fallback to localStorage
            const dataManager = new DataManager();
            const success = dataManager.updateUser(clientId, updates);
            
            if (success) {
                alert('Client account updated successfully! (Local storage)');
                document.getElementById('editClientModal').style.display = 'none';
                this.loadClients();
                this.updateStats();
            } else {
                alert('Error updating client account.');
            }
        }
    }

    async deleteClient(clientId) {
        try {
            const response = await fetch('api/users.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: clientId
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Client account deleted successfully!');
                document.getElementById('editClientModal').style.display = 'none';
                this.loadClients();
                this.updateStats();
                
                // Also delete from localStorage
                const dataManager = new DataManager();
                dataManager.deleteUser(clientId);
            } else {
                alert(result.message || 'Error deleting client account.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            // Fallback to localStorage
            const dataManager = new DataManager();
            const users = dataManager.deleteUser(clientId);
            
            if (users) {
                alert('Client account deleted successfully! (Local storage)');
                document.getElementById('editClientModal').style.display = 'none';
                this.loadClients();
                this.updateStats();
            } else {
                alert('Error deleting client account.');
            }
        }
    }

    exportData() {
        const dataManager = new DataManager();
        const data = dataManager.exportData();
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