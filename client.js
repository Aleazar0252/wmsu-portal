// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const welcomeName = document.getElementById('welcomeName');
const logoutBtn = document.getElementById('logoutBtn');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const accountStatus = document.getElementById('accountStatus');

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedInUser && loggedInUser.role !== 'admin') {
        showDashboard(loggedInUser);
    }
});

// Login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Check credentials
    const user = dataManager.getUserByUsername(username);
    
    if (user && user.password === password && user.role !== 'admin') {
        if (user.status === 'suspended') {
            loginError.textContent = 'Your account has been suspended. Please contact support.';
            loginError.style.display = 'block';
            return;
        }
        
        if (user.status === 'inactive') {
            loginError.textContent = 'Your account is inactive. Please contact support.';
            loginError.style.display = 'block';
            return;
        }
        
        // Save user to localStorage
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        showDashboard(user);
        loginError.style.display = 'none';
    } else {
        loginError.textContent = 'Invalid username or password. Please try again.';
        loginError.style.display = 'block';
    }
});

// Logout functionality
logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('loggedInUser');
    showLogin();
});

// File upload functionality
uploadArea.addEventListener('click', function() {
    fileInput.click();
});

uploadArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--secondary)';
    uploadArea.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
});

uploadArea.addEventListener('dragleave', function() {
    uploadArea.style.borderColor = 'var(--gray)';
    uploadArea.style.backgroundColor = 'transparent';
});

uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--gray)';
    uploadArea.style.backgroundColor = 'transparent';
    
    const files = e.dataTransfer.files;
    handleFiles(files);
});

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

function handleFiles(files) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) return;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSizeMB = file.size / (1024 * 1024);
        const user = dataManager.getUserById(loggedInUser.id);
        
        // Check storage limit
        if ((user.storageUsed || 0) + fileSizeMB > user.storageLimit) {
            alert(`Cannot upload ${file.name}. Storage limit exceeded.`);
            continue;
        }
        
        // Add file to data manager
        const fileData = dataManager.addClientFile(loggedInUser.id, file);
        addFileToList(fileData);
    }
    updateFileStats();
}

function addFileToList(fileData) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.fileId = fileData.id;
    
    const fileExtension = fileData.name.split('.').pop().toLowerCase();
    let fileIcon = 'fa-file';
    
    if (['pdf'].includes(fileExtension)) {
        fileIcon = 'fa-file-pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
        fileIcon = 'fa-file-image';
    } else if (['doc', 'docx'].includes(fileExtension)) {
        fileIcon = 'fa-file-word';
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
        fileIcon = 'fa-file-excel';
    }
    
    fileItem.innerHTML = `
        <div class="file-info">
            <i class="fas ${fileIcon} file-icon"></i>
            <div>
                <div>${fileData.name}</div>
                <div style="font-size: 0.8rem; color: var(--gray);">
                    Uploaded: ${fileData.uploadDate} | 
                    Size: ${(fileData.size / (1024 * 1024)).toFixed(2)} MB
                </div>
            </div>
        </div>
        <div class="file-actions">
            <button class="btn-icon download-btn"><i class="fas fa-download"></i></button>
            <button class="btn-icon btn-danger delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // Add delete functionality
    const deleteBtn = fileItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', function() {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        dataManager.deleteClientFile(loggedInUser.id, fileData.id);
        fileItem.remove();
        updateFileStats();
    });
    
    // Add download functionality
    const downloadBtn = fileItem.querySelector('.download-btn');
    downloadBtn.addEventListener('click', function() {
        // In a real app, this would download from the server
        alert(`Downloading ${fileData.name}`);
    });
    
    fileList.prepend(fileItem);
}

function updateFileStats() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) return;
    
    const user = dataManager.getUserById(loggedInUser.id);
    const files = dataManager.getClientFiles(loggedInUser.id);
    
    document.getElementById('fileCount').textContent = files.length;
    document.getElementById('storageUsed').textContent = (user.storageUsed || 0).toFixed(1);
    
    // Update storage progress
    const storagePercent = ((user.storageUsed || 0) / user.storageLimit) * 100;
    document.getElementById('dbSize').textContent = 
        `${(user.storageUsed || 0).toFixed(1)} MB / ${user.storageLimit} MB`;
    
    const progressBar = document.querySelector('.progress-bar .progress');
    if (progressBar) {
        progressBar.style.width = `${Math.min(storagePercent, 100)}%`;
        progressBar.style.background = storagePercent > 90 ? 'var(--danger)' : 
                                      storagePercent > 75 ? 'var(--warning)' : 'var(--success)';
    }
}

function showDashboard(user) {
    loginContainer.style.display = 'none';
    dashboard.style.display = 'block';
    userInfo.style.display = 'flex';
    
    // Update user info
    userName.textContent = user.name;
    welcomeName.textContent = user.name;
    userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('');
    document.getElementById('subdomain').textContent = `${user.subdomain}.wmsu-research.com`;
    document.getElementById('clientName').textContent = user.name;
    document.getElementById('clientEmail').textContent = user.email;
    document.getElementById('accountCreated').textContent = user.accountCreated;
    document.getElementById('clientPlan').textContent = user.plan.charAt(0).toUpperCase() + user.plan.slice(1);
    document.getElementById('dbName').textContent = `${user.subdomain}_db`;
    
    // Update account status
    accountStatus.textContent = user.status.charAt(0).toUpperCase() + user.status.slice(1);
    accountStatus.className = `account-status status-${user.status}`;
    
    // Load user files
    loadUserFiles(user.id);
    updateFileStats();
}

function loadUserFiles(userId) {
    const files = dataManager.getClientFiles(userId);
    fileList.innerHTML = '';
    
    files.forEach(file => {
        addFileToList(file);
    });
}

function showLogin() {
    loginContainer.style.display = 'block';
    dashboard.style.display = 'none';
    userInfo.style.display = 'none';
    loginForm.reset();
}

// Database backup and import buttons
document.getElementById('backupBtn')?.addEventListener('click', function() {
    alert('Database backup functionality would be implemented here.');
});

document.getElementById('importBtn')?.addEventListener('click', function() {
    alert('Database import functionality would be implemented here.');
});