// DOM Elements
const createAccountForm = document.getElementById('createAccountForm');
const clientsTable = document.getElementById('clientsTable');
const searchClients = document.getElementById('searchClients');
const editClientModal = document.getElementById('editClientModal');
const editClientForm = document.getElementById('editClientForm');
const saveClientBtn = document.getElementById('saveClientBtn');
const deleteClientBtn = document.getElementById('deleteClientBtn');
const exportDataBtn = document.getElementById('exportDataBtn');

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    loadClients();
    updateStats();
    
    // Check if admin is logged in (basic protection)
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        // Redirect to login or show warning
        console.warn('Admin access required');
    }
});

// Create account form submission
createAccountForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('clientName').value,
        email: document.getElementById('clientEmail').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        subdomain: document.getElementById('subdomain').value,
        plan: document.getElementById('plan').value,
        storageLimit: parseInt(document.getElementById('storageLimit').value),
        role: 'client'
    };
    
    // Validate subdomain
    if (!dataManager.validateSubdomain(formData.subdomain)) {
        alert('Subdomain already exists. Please choose a different one.');
        return;
    }
    
    // Create the user
    const newUser = dataManager.createUser(formData);
    
    if (newUser) {
        alert(`Account created successfully for ${newUser.name}`);
        createAccountForm.reset();
        loadClients();
        updateStats();
    } else {
        alert('Error creating account. Please try again.');
    }
});

// Search functionality
searchClients.addEventListener('input', function() {
    loadClients(this.value);
});

// Export data
exportDataBtn.addEventListener('click', function() {
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
});

// Modal functionality
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function() {
        editClientModal.style.display = 'none';
    });
});

// Save client changes
saveClientBtn.addEventListener('click', function() {
    const clientId = document.getElementById('editClientId').value;
    const updates = {
        name: document.getElementById('editClientName').value,
        email: document.getElementById('editClientEmail').value,
        plan: document.getElementById('editPlan').value,
        storageLimit: parseInt(document.getElementById('editStorageLimit').value),
        status: document.getElementById('editStatus').value
    };
    
    // Update password if provided
    const newPassword = document.getElementById('editPassword').value;
    if (newPassword) {
        updates.password = newPassword;
    }
    
    const updatedUser = dataManager.updateUser(clientId, updates);
    
    if (updatedUser) {
        alert('Client account updated successfully');
        editClientModal.style.display = 'none';
        loadClients();
        updateStats();
    } else {
        alert('Error updating client account');
    }
});

// Delete client
deleteClientBtn.addEventListener('click', function() {
    const clientId = document.getElementById('editClientId').value;
    const clientName = document.getElementById('editClientName').value;
    
    if (confirm(`Are you sure you want to delete the account for ${clientName}? This action cannot be undone.`)) {
        dataManager.deleteUser(clientId);
        alert('Client account deleted successfully');
        editClientModal.style.display = 'none';
        loadClients();
        updateStats();
    }
});

function loadClients(searchTerm = '') {
    const clients = dataManager.getUsers().filter(user => user.role === 'client');
    const filteredClients = searchTerm ? 
        clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())
        ) : clients;
    
    clientsTable.innerHTML = '';
    
    if (filteredClients.length === 0) {
        clientsTable.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray);">
                    No clients found
                </td>
            </tr>
        `;
        return;
    }
    
    filteredClients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.username}</td>
            <td>${client.subdomain}.wmsu-research.com</td>
            <td>
                <span class="status-badge" style="background: ${
                    client.plan === 'premium' ? 'var(--warning)' : 
                    client.plan === 'standard' ? 'var(--secondary)' : 'var(--gray)'
                }; color: white; padding: 4px 8px; border-radius: 12px;">
                    ${client.plan.charAt(0).toUpperCase() + client.plan.slice(1)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${client.status}">
                    ${client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </span>
            </td>
            <td>${client.accountCreated}</td>
            <td>
                <button class="btn-icon edit-client" data-client-id="${client.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon view-files" data-client-id="${client.id}">
                    <i class="fas fa-folder"></i>
                </button>
            </td>
        `;
        clientsTable.appendChild(row);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-client').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.dataset.clientId;
            openEditModal(clientId);
        });
    });
    
    // Add event listeners to view files buttons
    document.querySelectorAll('.view-files').forEach(btn => {
        btn.addEventListener('click', function() {
            const clientId = this.dataset.clientId;
            viewClientFiles(clientId);
        });
    });
}

function openEditModal(clientId) {
    const client = dataManager.getUserById(clientId);
    if (!client) return;
    
    document.getElementById('editClientId').value = client.id;
    document.getElementById('editClientName').value = client.name;
    document.getElementById('editClientEmail').value = client.email;
    document.getElementById('editPlan').value = client.plan;
    document.getElementById('editStorageLimit').value = client.storageLimit;
    document.getElementById('editStatus').value = client.status;
    document.getElementById('editPassword').value = '';
    
    editClientModal.style.display = 'flex';
}

function viewClientFiles(clientId) {
    const client = dataManager.getUserById(clientId);
    const files = dataManager.getClientFiles(clientId);
    
    const fileList = files.map(file => 
        `• ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
    ).join('\n');
    
    alert(`Files for ${client.name}:\n\n${fileList || 'No files uploaded'}`);
}

function updateStats() {
    const clients = dataManager.getUsers().filter(user => user.role === 'client');
    const activeClients = clients.filter(client => client.status === 'active').length;
    const totalFiles = clients.reduce((total, client) => {
        return total + dataManager.getClientFiles(client.id).length;
    }, 0);
    const totalStorage = clients.reduce((total, client) => {
        return total + (client.storageUsed || 0);
    }, 0) / 1024; // Convert to GB
    
    document.getElementById('totalClients').textContent = clients.length;
    document.getElementById('activeClients').textContent = activeClients;
    document.getElementById('totalFiles').textContent = totalFiles;
    document.getElementById('totalStorage').textContent = totalStorage.toFixed(2);
}