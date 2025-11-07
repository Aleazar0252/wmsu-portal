document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuthStatus();
    
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('createClientForm').addEventListener('submit', handleCreateClient);
});

function checkAdminAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // In a real app, verify if token has admin privileges
        showAdminSection();
        loadAdminData();
    } else {
        showAdminLoginSection();
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsernameInput').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const result = await apiClient.adminLogin(username, password);
        apiClient.setToken(result.token);
        showAdminSection();
        loadAdminData();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function showAdminLoginSection() {
    document.getElementById('adminLoginSection').classList.remove('hidden');
    document.getElementById('adminSection').classList.add('hidden');
}

function showAdminSection() {
    document.getElementById('adminLoginSection').classList.add('hidden');
    document.getElementById('adminSection').classList.remove('hidden');
    document.getElementById('adminUsername').textContent = 'Admin';
}

async function loadAdminData() {
    await loadClients();
    await loadSystemInfo();
}

async function handleCreateClient(e) {
    e.preventDefault();
    
    const clientData = {
        name: document.getElementById('clientName').value,
        username: document.getElementById('clientUser').value,
        password: document.getElementById('clientPass').value,
        email: document.getElementById('clientEmail').value
    };
    
    try {
        await apiClient.createClient(clientData);
        showMessage('Client created successfully!', 'success');
        document.getElementById('createClientForm').reset();
        await loadClients();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function loadClients() {
    try {
        const result = await apiClient.getClients();
        const clientsList = document.getElementById('clientsList');
        clientsList.innerHTML = '';
        
        result.clients.forEach(client => {
            const clientItem = document.createElement('div');
            clientItem.className = 'client-item';
            clientItem.innerHTML = `
                <div>
                    <strong>${client.name}</strong><br>
                    <small>Username: ${client.username} | Email: ${client.email}</small><br>
                    <small>Created: ${client.created_at}</small>
                </div>
                <button onclick="deleteClient(${client.id})" class="danger">Delete</button>
            `;
            clientsList.appendChild(clientItem);
        });
    } catch (error) {
        showMessage('Failed to load clients', 'error');
    }
}

async function deleteClient(clientId) {
    if (!confirm('Are you sure you want to delete this client?')) return;
    
    try {
        await apiClient.deleteClient(clientId);
        showMessage('Client deleted successfully', 'success');
        await loadClients();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function loadSystemInfo() {
    const systemInfo = document.getElementById('systemInfo');
    // This would typically fetch system statistics
    systemInfo.innerHTML = `
        <div class="info">
            <strong>System Status:</strong> Operational<br>
            <strong>Total Clients:</strong> Loading...<br>
            <strong>Storage Used:</strong> Calculating...
        </div>
    `;
}

function openAdminTab(tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'clientManagement') {
        loadClients();
    } else if (tabName === 'systemStatus') {
        loadSystemInfo();
    }
}

async function adminLogout() {
    try {
        await apiClient.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        apiClient.clearToken();
        showAdminLoginSection();
    }
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}