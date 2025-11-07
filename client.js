let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    document.getElementById('loginForm').addEventListener('submit', handleClientLogin);
    document.getElementById('uploadForm').addEventListener('submit', handleFileUpload);
});

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Verify token is still valid
        showClientSection();
        loadClientData();
    } else {
        showLoginSection();
    }
}

async function handleClientLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('clientUsername').value;
    const password = document.getElementById('clientPassword').value;
    
    try {
        const result = await apiClient.clientLogin(username, password);
        apiClient.setToken(result.token);
        currentUser = result.user;
        showClientSection();
        loadClientData();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function showLoginSection() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('clientSection').classList.add('hidden');
}

function showClientSection() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('clientSection').classList.remove('hidden');
    document.getElementById('username').textContent = currentUser?.username || 'Client';
}

async function loadClientData() {
    await loadFiles();
    await loadBackups();
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const files = fileInput.files;
    
    if (files.length === 0) {
        showMessage('Please select files to upload', 'error');
        return;
    }
    
    const formData = new FormData();
    for (let file of files) {
        formData.append('files[]', file);
    }
    
    try {
        const result = await apiClient.uploadFiles(formData);
        showMessage('Files uploaded successfully!', 'success');
        fileInput.value = '';
        await loadFiles();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function loadFiles() {
    try {
        const result = await apiClient.getFiles();
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        result.files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span>${file.name}</span>
                <div>
                    <button onclick="downloadFile('${file.name}')">Download</button>
                    <button onclick="deleteFile('${file.name}')" class="danger">Delete</button>
                </div>
            `;
            fileList.appendChild(fileItem);
        });
    } catch (error) {
        showMessage('Failed to load files', 'error');
    }
}

async function downloadFile(filename) {
    window.open(`/api/files.php?download=${filename}`);
}

async function deleteFile(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    try {
        await apiClient.deleteFile(filename);
        showMessage('File deleted successfully', 'success');
        await loadFiles();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function backupDatabase() {
    try {
        showMessage('Creating database backup...', 'info');
        const result = await apiClient.backupDatabase();
        showMessage('Backup created successfully!', 'success');
        await loadBackups();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function showTables() {
    try {
        const result = await apiClient.showTables();
        const dbResults = document.getElementById('dbResults');
        dbResults.innerHTML = '<h4>Database Tables:</h4>';
        
        result.tables.forEach(table => {
            const tableItem = document.createElement('div');
            tableItem.className = 'info';
            tableItem.textContent = table;
            dbResults.appendChild(tableItem);
        });
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function loadBackups() {
    try {
        const result = await apiClient.getBackups();
        const backupList = document.getElementById('backupList');
        backupList.innerHTML = '<h4>Available Backups:</h4>';
        
        if (result.backups.length === 0) {
            backupList.innerHTML += '<div class="info">No backups available</div>';
            return;
        }
        
        result.backups.forEach(backup => {
            const backupItem = document.createElement('div');
            backupItem.className = 'file-item';
            backupItem.innerHTML = `
                <span>${backup.name} (${backup.size})</span>
                <button onclick="downloadBackup('${backup.name}')">Download</button>
            `;
            backupList.appendChild(backupItem);
        });
    } catch (error) {
        console.error('Failed to load backups:', error);
    }
}

async function downloadBackup(filename) {
    apiClient.downloadBackup(filename);
}

function openTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    // Show the selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

async function logout() {
    try {
        await apiClient.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        apiClient.clearToken();
        currentUser = null;
        showLoginSection();
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