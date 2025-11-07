// Admin-specific JavaScript
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginError = document.getElementById('adminLoginError');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Check if admin is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));
    
    if (window.location.pathname.includes('admin/index.html') && adminUser) {
        // Redirect to dashboard if already logged in
        window.location.href = 'dashboard.html';
    } else if (window.location.pathname.includes('admin/dashboard.html') && !adminUser) {
        // Redirect to login if not logged in
        window.location.href = 'index.html';
    }
    
    if (adminUser && window.location.pathname.includes('dashboard.html')) {
        initializeAdminDashboard(adminUser);
    }
});

// Admin login form submission
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        
        // Check admin credentials (in real app, this would be API call)
        if (username === 'admin' && password === 'admin123') {
            const adminUser = {
                id: 'admin',
                name: 'System Administrator',
                username: 'admin',
                role: 'admin'
            };
            
            localStorage.setItem('adminUser', JSON.stringify(adminUser));
            window.location.href = 'dashboard.html';
        } else {
            adminLoginError.style.display = 'block';
        }
    });
}

// Admin logout
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', function() {
        localStorage.removeItem('adminUser');
        window.location.href = 'index.html';
    });
}

// Initialize admin dashboard
function initializeAdminDashboard(adminUser) {
    document.getElementById('adminName').textContent = adminUser.name;
    loadClients();
    updateStats();
    
    // Add event listeners for admin functionality
    const createAccountForm = document.getElementById('createAccountForm');
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', handleCreateAccount);
    }
    
    const searchClients = document.getElementById('searchClients');
    if (searchClients) {
        searchClients.addEventListener('input', function() {
            loadClients(this.value);
        });
    }
    
    // Add other admin event listeners...
}

// Rest of your admin functionality from the previous admin.js
// (loadClients, updateStats, handleCreateAccount, etc.)