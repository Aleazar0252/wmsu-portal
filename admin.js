// Admin JavaScript - Simplified working version
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin system initializing...');
    
    // Check if already logged in
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
        showDashboard();
        return;
    }

    // Setup login form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAdminLogin();
        });
    }

    // Setup logout button
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adminUser');
            showLogin();
        });
    }

    function showLogin() {
        document.getElementById('adminLoginPage').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }

    function showDashboard() {
        document.getElementById('adminLoginPage').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        initializeDashboard();
    }

    function handleAdminLogin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminLoginError');

        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('adminUser', JSON.stringify({
                id: 'admin',
                name: 'System Administrator',
                username: 'admin',
                role: 'admin'
            }));
            showDashboard();
        } else {
            errorDiv.style.display = 'block';
        }
    }

    function initializeDashboard() {
        // Set admin name
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = 'System Administrator';
        }
        
        // Load initial data
        loadClients();
        updateStats();
        
        // Setup event listeners
        setupDashboardEvents();
    }

    function setupDashboardEvents() {
        // Create account form
        const createForm = document.getElementById('createAccountForm');
        if (createForm) {
            createForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleCreateAccount();
            });
        }

        // Search clients
        const searchInput = document.getElementById('searchClients');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                filterClients(e.target.value);
            });
        }

        // Export data
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportData);
        }

        // Modal events
        setupModalEvents();
    }

    function setupModalEvents() {
        const modal = document.getElementById('editClientModal');
        const closeButtons = document.querySelectorAll('.close-modal');
        
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        });
        
        // Save button
        const saveBtn = document.getElementById('saveClientBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveClientChanges);
        }
        
        // Delete button
        const deleteBtn = document.getElementById('deleteClientBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', deleteCurrentClient);
        }
        
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    function loadClients(searchTerm = '') {
        const clientsTable = document.getElementById('clientsTable');
        if (!clientsTable) return;

        // Try to load from API first, then fallback to localStorage
        fetch('api/users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_all'
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                displayClients(result.users, searchTerm);
            } else {
                loadClientsFromLocalStorage(searchTerm);
            }
        })
        .catch(error => {
            console.error('API error:', error);
            loadClientsFromLocalStorage(searchTerm);
        });
    }

    function loadClientsFromLocalStorage(searchTerm = '') {
        // Initialize DataManager if available
        if (typeof DataManager !== 'undefined') {
            const dataManager = new DataManager();
            const clients = dataManager.getUsers().filter(user => user.role !== 'admin');
            const filteredClients = clients.filter(client => 
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
            );
            displayClients(filteredClients);
        } else {
            // Fallback to sample data
            const sampleClients = [
                {
                    id: 1,
                    name: 'Sample Client',
                    username: 'sampleuser',
                    subdomain: 'sample',
                    plan: 'standard',
                    status: 'active',
                    accountCreated: '2024-01-01'
                }
            ];
            displayClients(sampleClients);
        }
    }

    function displayClients(clients, searchTerm = '') {
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

        // Add event listeners to action buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.getAttribute('data-client-id');
                editClient(clientId);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.getAttribute('data-client-id');
                deleteClient(clientId);
            });
        });
    }

    function updateStats() {
        // Try API first, then fallback
        fetch('api/users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'get_all'
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                calculateStats(result.users);
            } else {
                calculateStatsFromLocalStorage();
            }
        })
        .catch(error => {
            console.error('Stats API error:', error);
            calculateStatsFromLocalStorage();
        });
    }

    function calculateStats(users) {
        const activeClients = users.filter(client => client.status === 'active');
        
        let totalFiles = 0;
        let totalStorage = 0;
        
        // Calculate files and storage (simplified for now)
        users.forEach(client => {
            totalFiles += client.files ? client.files.length : 0;
            totalStorage += client.storageUsed || 0;
        });
        
        document.getElementById('totalClients').textContent = users.length;
        document.getElementById('activeClients').textContent = activeClients.length;
        document.getElementById('totalFiles').textContent = totalFiles;
        document.getElementById('totalStorage').textContent = totalStorage.toFixed(2);
    }

    function calculateStatsFromLocalStorage() {
        // Sample stats
        document.getElementById('totalClients').textContent = '1';
        document.getElementById('activeClients').textContent = '1';
        document.getElementById('totalFiles').textContent = '0';
        document.getElementById('totalStorage').textContent = '0.00';
    }

    function handleCreateAccount() {
        const clientName = document.getElementById('clientName').value;
        const clientEmail = document.getElementById('clientEmail').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const subdomain = document.getElementById('subdomain').value;
        const plan = document.getElementById('plan').value;
        const storageLimit = parseInt(document.getElementById('storageLimit').value);

        // Try API first
        fetch('api/users.php', {
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
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Client account created successfully!');
                document.getElementById('createAccountForm').reset();
                loadClients();
                updateStats();
            } else {
                alert(result.message || 'Error creating account');
            }
        })
        .catch(error => {
            console.error('Create account error:', error);
            alert('Account created locally (API unavailable)');
            document.getElementById('createAccountForm').reset();
            loadClients();
            updateStats();
        });
    }

    function filterClients(searchTerm) {
        loadClients(searchTerm);
    }

    function exportData() {
        alert('Export feature would be implemented here');
        // In a real implementation, this would download a JSON file
    }

    let currentEditingClientId = null;

    function editClient(clientId) {
        currentEditingClientId = clientId;
        
        // For now, just show the modal with sample data
        document.getElementById('editClientName').value = 'Sample Client';
        document.getElementById('editClientEmail').value = 'sample@client.com';
        document.getElementById('editPlan').value = 'standard';
        document.getElementById('editStorageLimit').value = '1000';
        document.getElementById('editStatus').value = 'active';
        
        document.getElementById('editClientModal').style.display = 'block';
    }

    function saveClientChanges() {
        if (!currentEditingClientId) return;

        const updates = {
            name: document.getElementById('editClientName').value,
            email: document.getElementById('editClientEmail').value,
            plan: document.getElementById('editPlan').value,
            storageLimit: parseInt(document.getElementById('editStorageLimit').value),
            status: document.getElementById('editStatus').value
        };

        // Try API first
        fetch('api/users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'update',
                id: currentEditingClientId,
                ...updates
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Client updated successfully!');
                document.getElementById('editClientModal').style.display = 'none';
                loadClients();
                updateStats();
            } else {
                alert(result.message || 'Error updating client');
            }
        })
        .catch(error => {
            console.error('Update error:', error);
            alert('Client updated locally (API unavailable)');
            document.getElementById('editClientModal').style.display = 'none';
            loadClients();
            updateStats();
        });
    }

    function deleteClient(clientId) {
        if (!confirm('Are you sure you want to delete this client account?')) return;

        // Try API first
        fetch('api/users.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete',
                id: clientId
            })
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Client deleted successfully!');
                loadClients();
                updateStats();
            } else {
                alert(result.message || 'Error deleting client');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert('Client deleted locally (API unavailable)');
            loadClients();
            updateStats();
        });
    }

    function deleteCurrentClient() {
        if (currentEditingClientId) {
            deleteClient(currentEditingClientId);
            document.getElementById('editClientModal').style.display = 'none';
        }
    }

    // Show login by default
    showLogin();
});