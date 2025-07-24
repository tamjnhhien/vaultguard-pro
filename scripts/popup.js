class PasswordManager {
    constructor() {
        this.passwords = [];
        this.currentEditId = null;
        this.init();
    }

    async init() {
        await this.loadPasswords();
        this.setupEventListeners();
        this.setupTabs();
        this.renderPasswordsList();
        this.updatePasswordLength();
    }

    setupEventListeners() {
        // Tab switching
        document.getElementById('passwordsTab').addEventListener('click', () => this.switchTab('passwords'));
        document.getElementById('generateTab').addEventListener('click', () => this.switchTab('generate'));

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => this.searchPasswords(e.target.value));

        // Add password
        document.getElementById('addPasswordBtn').addEventListener('click', () => this.openPasswordModal());

        // Generate password
        document.getElementById('generateBtn').addEventListener('click', () => this.generatePassword());
        document.getElementById('copyGeneratedBtn').addEventListener('click', () => this.copyGeneratedPassword());

        // Password length slider
        document.getElementById('passwordLength').addEventListener('input', () => this.updatePasswordLength());

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closePasswordModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closePasswordModal());
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.savePassword(e));

        // Password visibility toggle
        document.getElementById('togglePassword').addEventListener('click', () => this.togglePasswordVisibility());

        // Generate password for form
        document.getElementById('generateForForm').addEventListener('click', () => this.generatePasswordForForm());

        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

        // Modal click outside to close
        document.getElementById('passwordModal').addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') {
                this.closePasswordModal();
            }
        });
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const views = document.querySelectorAll('.view');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                views.forEach(v => v.classList.remove('active'));
                
                tab.classList.add('active');
                const targetView = tab.id === 'passwordsTab' ? 'passwordsView' : 'generateView';
                document.getElementById(targetView).classList.add('active');
            });
        });
    }

    switchTab(tab) {
        const tabs = document.querySelectorAll('.tab-btn');
        const views = document.querySelectorAll('.view');

        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));

        if (tab === 'passwords') {
            document.getElementById('passwordsTab').classList.add('active');
            document.getElementById('passwordsView').classList.add('active');
        } else {
            document.getElementById('generateTab').classList.add('active');
            document.getElementById('generateView').classList.add('active');
        }
    }

    async loadPasswords() {
        try {
            const result = await chrome.storage.local.get(['passwords']);
            this.passwords = result.passwords || [];
        } catch (error) {
            console.error('Error loading passwords:', error);
            this.passwords = [];
        }
    }

    async savePasswords() {
        try {
            await chrome.storage.local.set({ passwords: this.passwords });
        } catch (error) {
            console.error('Error saving passwords:', error);
            this.showToast('Error saving passwords', 'error');
        }
    }

    renderPasswordsList(filteredPasswords = null) {
        const passwordsList = document.getElementById('passwordsList');
        const noPasswords = document.getElementById('noPasswords');
        const passwordsToShow = filteredPasswords || this.passwords;

        if (passwordsToShow.length === 0) {
            passwordsList.innerHTML = '';
            noPasswords.style.display = 'block';
            return;
        }

        noPasswords.style.display = 'none';
        passwordsList.innerHTML = '';

        passwordsToShow.forEach(password => {
            const passwordItem = this.createPasswordItem(password);
            passwordsList.appendChild(passwordItem);
        });
    }

    createPasswordItem(password) {
        const item = document.createElement('div');
        item.className = 'password-item';
        item.innerHTML = `
            <div class="password-header">
                <span class="site-name">${this.escapeHtml(password.siteName)}</span>
                <div class="password-actions">
                    <button class="action-btn copy-password-btn" data-id="${password.id}" title="Copy Password">🔑</button>
                    <button class="action-btn edit-btn" data-id="${password.id}" title="Edit">✏️</button>
                    <button class="action-btn delete-btn" data-id="${password.id}" title="Delete">🗑️</button>
                </div>
            </div>
            <div class="password-details">
                <span class="username">${this.escapeHtml(password.username)}</span>
                <button class="copy-username-btn" data-username="${this.escapeHtml(password.username)}">Copy User</button>
            </div>
        `;

        // Add event listeners
        item.querySelector('.copy-password-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyPassword(password.id);
        });

        item.querySelector('.copy-username-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyUsername(password.username);
        });

        item.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editPassword(password.id);
        });

        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deletePassword(password.id);
        });

        return item;
    }

    searchPasswords(query) {
        if (!query.trim()) {
            this.renderPasswordsList();
            return;
        }

        const filtered = this.passwords.filter(password => 
            password.siteName.toLowerCase().includes(query.toLowerCase()) ||
            password.username.toLowerCase().includes(query.toLowerCase()) ||
            (password.siteUrl && password.siteUrl.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderPasswordsList(filtered);
    }

    openPasswordModal(passwordId = null) {
        this.currentEditId = passwordId;
        const modal = document.getElementById('passwordModal');
        const form = document.getElementById('passwordForm');
        const title = document.getElementById('modalTitle');

        form.reset();

        if (passwordId) {
            const password = this.passwords.find(p => p.id === passwordId);
            if (password) {
                title.textContent = 'Edit Password';
                document.getElementById('siteName').value = password.siteName;
                document.getElementById('siteUrl').value = password.siteUrl || '';
                document.getElementById('username').value = password.username;
                document.getElementById('password').value = password.password;
                document.getElementById('notes').value = password.notes || '';
            }
        } else {
            title.textContent = 'Add New Password';
        }

        modal.style.display = 'flex';
        document.getElementById('siteName').focus();
    }

    closePasswordModal() {
        document.getElementById('passwordModal').style.display = 'none';
        this.currentEditId = null;
    }

    async savePassword(e) {
        e.preventDefault();

        const siteName = document.getElementById('siteName').value.trim();
        const siteUrl = document.getElementById('siteUrl').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const notes = document.getElementById('notes').value.trim();

        if (!siteName || !username || !password) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const passwordData = {
            id: this.currentEditId || this.generateId(),
            siteName,
            siteUrl,
            username,
            password,
            notes,
            createdAt: this.currentEditId ? 
                this.passwords.find(p => p.id === this.currentEditId).createdAt : 
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditId) {
            const index = this.passwords.findIndex(p => p.id === this.currentEditId);
            this.passwords[index] = passwordData;
            this.showToast('Password updated successfully', 'success');
        } else {
            this.passwords.push(passwordData);
            this.showToast('Password saved successfully', 'success');
        }

        await this.savePasswords();
        this.renderPasswordsList();
        this.closePasswordModal();
    }

    editPassword(id) {
        this.openPasswordModal(id);
    }

    async deletePassword(id) {
        if (confirm('Are you sure you want to delete this password?')) {
            this.passwords = this.passwords.filter(p => p.id !== id);
            await this.savePasswords();
            this.renderPasswordsList();
            this.showToast('Password deleted successfully', 'success');
        }
    }

    async copyPassword(id) {
        const password = this.passwords.find(p => p.id === id);
        if (password) {
            try {
                await navigator.clipboard.writeText(password.password);
                this.showToast('Password copied to clipboard', 'success');
            } catch (error) {
                console.error('Error copying password:', error);
                this.showToast('Error copying password', 'error');
            }
        }
    }

    async copyUsername(username) {
        try {
            await navigator.clipboard.writeText(username);
            this.showToast('Username copied to clipboard', 'success');
        } catch (error) {
            console.error('Error copying username:', error);
            this.showToast('Error copying username', 'error');
        }
    }

    generatePassword() {
        const length = parseInt(document.getElementById('passwordLength').value);
        const includeUppercase = document.getElementById('includeUppercase').checked;
        const includeLowercase = document.getElementById('includeLowercase').checked;
        const includeNumbers = document.getElementById('includeNumbers').checked;
        const includeSymbols = document.getElementById('includeSymbols').checked;

        if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
            this.showToast('Please select at least one character type', 'error');
            return;
        }

        let chars = '';
        if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) chars += '0123456789';
        if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        document.getElementById('generatedPasswordText').value = password;
        document.getElementById('generatedPassword').style.display = 'block';
        
        this.updatePasswordStrength(password);
    }

    async copyGeneratedPassword() {
        const password = document.getElementById('generatedPasswordText').value;
        if (password) {
            try {
                await navigator.clipboard.writeText(password);
                this.showToast('Generated password copied to clipboard', 'success');
            } catch (error) {
                console.error('Error copying generated password:', error);
                this.showToast('Error copying password', 'error');
            }
        }
    }

    generatePasswordForForm() {
        const length = 16;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        document.getElementById('password').value = password;
        document.getElementById('password').type = 'text';
        
        setTimeout(() => {
            document.getElementById('password').type = 'password';
        }, 2000);
    }

    updatePasswordLength() {
        const length = document.getElementById('passwordLength').value;
        document.getElementById('lengthValue').textContent = length;
    }

    updatePasswordStrength(password) {
        const indicator = document.getElementById('strengthIndicator');
        let score = 0;

        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score < 3) {
            indicator.textContent = 'Weak';
            indicator.className = 'strength-indicator strength-weak';
        } else if (score < 5) {
            indicator.textContent = 'Medium';
            indicator.className = 'strength-indicator strength-medium';
        } else {
            indicator.textContent = 'Strong';
            indicator.className = 'strength-indicator strength-strong';
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleBtn.textContent = '👁️';
        }
    }

    openSettings() {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    generateId() {
        return 'pwd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the password manager when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new PasswordManager();
});
