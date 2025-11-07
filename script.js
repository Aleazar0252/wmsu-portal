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

// Sample user data (in a real app, this would come from a server)
const users = [
    { 
        username: 'client1', 
        password: 'password1', 
        name: 'John Doe', 
        email: 'john.doe@example.com', 
        subdomain: 'client1.wmsu-research.com',
        dbName: 'client1_db',
        accountCreated: '2023-05-15',
        plan: 'Standard'
    },
    { 
        username: 'client2', 
        password: 'password2', 
        name: 'Jane Smith', 
        email: 'jane.smith@example.com', 
        subdomain: 'client2.wmsu-research.com',
        dbName: 'client2_db',
        accountCreated: '2023-06-01',
        plan: 'Premium'
    }
];

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        showDashboard(JSON.parse(loggedInUser));
    }
});

// Login form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Check credentials
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Save user to localStorage
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        showDashboard(user);
        loginError.style.display = 'none';
    } else {
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
    for (let i = 0; i < files.length; i++) {
        // In a real app, you would upload files to the server here
        // For this demo, we'll just add them to the file list
        addFileToList(files[i]);
    }
}

function addFileToList(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
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
    
    const now = new Date();
    const uploadDate = now.toISOString().split('T')[0];
    
    fileItem.innerHTML = `
        <div class="file-info">
            <i class="fas ${fileIcon} file-icon"></i>
            <div>
                <div>${file.name}</div>
                <div style="font-size: 0.8rem; color: var(--gray);">Uploaded: ${uploadDate}</div>
            </div>
        </div>
        <div class="file-actions">
            <button class="btn-icon"><i class="fas fa-download"></i></button>
            <button class="btn-icon btn-danger"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    // Add delete functionality
    const deleteBtn = fileItem.querySelector('.btn-danger');
    deleteBtn.addEventListener('click', function() {
        fileItem.remove();
        updateFileStats();
    });
    
    // Add download functionality
    const downloadBtn = fileItem.querySelector('.btn-icon:not(.btn-danger)');
    downloadBtn.addEventListener('click', function() {
        downloadFile(file);
    });
    
    fileList.prepend(fileItem);
    updateFileStats();
}

function downloadFile(file) {
    // In a real app, this would download from the server
    // For demo purposes, we'll create a temporary download link
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateFileStats() {
    const fileCount = fileList.children.length;
    document.getElementById('fileCount').textContent = fileCount;
    
    // In a real app, you would calculate actual storage used
    const storageUsed = 78.5 + (fileCount * 0.5); // Simulated increase
    document.getElementById('storageUsed').textContent = storageUsed.toFixed(1);
}

function showDashboard(user) {
    loginContainer.style.display = 'none';
    dashboard.style.display = 'block';
    userInfo.style.display = 'flex';
    
    // Update user info
    userName.textContent = user.name;
    welcomeName.textContent = user.name;
    userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('');
    document.getElementById('subdomain').textContent = user.subdomain;
    document.getElementById('clientName').textContent = user.name;
    document.getElementById('clientEmail').textContent = user.email;
    document.getElementById('accountCreated').textContent = user.accountCreated;
    document.getElementById('clientPlan').textContent = user.plan;
    document.getElementById('dbName').textContent = user.dbName;
}

function showLogin() {
    loginContainer.style.display = 'block';
    dashboard.style.display = 'none';
    userInfo.style.display = 'none';
    loginForm.reset();
}

// Initialize demo files and setup event listeners for existing files
document.addEventListener('DOMContentLoaded', function() {
    // Add delete functionality to existing demo files
    const existingDeleteButtons = document.querySelectorAll('.file-item .btn-danger');
    existingDeleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.file-item').remove();
            updateFileStats();
        });
    });
    
    // Add download functionality to existing demo files
    const existingDownloadButtons = document.querySelectorAll('.file-item .btn-icon:not(.btn-danger)');
    existingDownloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('In a real application, this would download the file from the server.');
        });
    });
    
    // Initialize file stats
    updateFileStats();
});