class OptionsManager {
    constructor() {
        this.defaultSettings = {
            autoLock: false,
            lockTimeout: 15,
            showPasswordStrength: true,
            defaultPasswordLength: 16,
            defaultUppercase: true,
            defaultLowercase: true,
            defaultNumbers: true,
            defaultSymbols: false
        };
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Auto-lock toggle
        document.getElementById('autoLock').addEventListener('change', (e) => {
            this.toggleLockTimeout(e.target.checked);
        });

        // Password length slider
        document.getElementById('defaultPasswordLength').addEventListener('input', (e) => {
            document.getElementById('defaultLengthValue').textContent = e.target.value;
        });

        // Save settings
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        // Export data
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // Import data
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Clear all data
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearAllData();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            this.settings = { ...this.defaultSettings, ...result.settings };
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }

    updateUI() {
        // Update all form elements with current settings
        document.getElementById('autoLock').checked = this.settings.autoLock;
        document.getElementById('lockTimeout').value = this.settings.lockTimeout;
        document.getElementById('showPasswordStrength').checked = this.settings.showPasswordStrength;
        document.getElementById('defaultPasswordLength').value = this.settings.defaultPasswordLength;
        document.getElementById('defaultLengthValue').textContent = this.settings.defaultPasswordLength;
        document.getElementById('defaultUppercase').checked = this.settings.defaultUppercase;
        document.getElementById('defaultLowercase').checked = this.settings.defaultLowercase;
        document.getElementById('defaultNumbers').checked = this.settings.defaultNumbers;
        document.getElementById('defaultSymbols').checked = this.settings.defaultSymbols;

        // Show/hide lock timeout setting
        this.toggleLockTimeout(this.settings.autoLock);
    }

    toggleLockTimeout(show) {
        const lockTimeoutSetting = document.getElementById('lockTimeoutSetting');
        lockTimeoutSetting.style.display = show ? 'flex' : 'none';
    }

    async saveSettings() {
        // Collect all settings from the form
        this.settings = {
            autoLock: document.getElementById('autoLock').checked,
            lockTimeout: parseInt(document.getElementById('lockTimeout').value),
            showPasswordStrength: document.getElementById('showPasswordStrength').checked,
            defaultPasswordLength: parseInt(document.getElementById('defaultPasswordLength').value),
            defaultUppercase: document.getElementById('defaultUppercase').checked,
            defaultLowercase: document.getElementById('defaultLowercase').checked,
            defaultNumbers: document.getElementById('defaultNumbers').checked,
            defaultSymbols: document.getElementById('defaultSymbols').checked
        };

        try {
            await chrome.storage.local.set({ settings: this.settings });
            this.showStatus('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    async exportData() {
        try {
            const result = await chrome.storage.local.get(['passwords']);
            const passwords = result.passwords || [];

            if (passwords.length === 0) {
                this.showStatus('No passwords to export', 'error');
                return;
            }

            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                passwords: passwords
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `securepass-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showStatus('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showStatus('Error exporting data', 'error');
        }
    }

    async importData(file) {
        if (!file) return;

        try {
            const text = await this.readFile(file);
            const importData = JSON.parse(text);

            if (!importData.passwords || !Array.isArray(importData.passwords)) {
                throw new Error('Invalid file format');
            }

            // Validate password structure
            const validPasswords = importData.passwords.filter(password => 
                password.siteName && password.username && password.password
            );

            if (validPasswords.length === 0) {
                throw new Error('No valid passwords found in file');
            }

            // Get existing passwords
            const result = await chrome.storage.local.get(['passwords']);
            const existingPasswords = result.passwords || [];

            // Merge passwords (avoid duplicates by checking siteName + username)
            const merged = [...existingPasswords];
            let importedCount = 0;

            validPasswords.forEach(newPassword => {
                const exists = merged.some(existing => 
                    existing.siteName === newPassword.siteName && 
                    existing.username === newPassword.username
                );

                if (!exists) {
                    merged.push({
                        ...newPassword,
                        id: this.generateId(),
                        importedAt: new Date().toISOString()
                    });
                    importedCount++;
                }
            });

            await chrome.storage.local.set({ passwords: merged });
            
            this.showStatus(`Successfully imported ${importedCount} passwords!`, 'success');
        } catch (error) {
            console.error('Error importing data:', error);
            this.showStatus('Error importing data: ' + error.message, 'error');
        }

        // Reset file input
        document.getElementById('importFile').value = '';
    }

    async clearAllData() {
        const confirmation = prompt(
            'This will permanently delete ALL your saved passwords and settings. ' +
            'Type "DELETE ALL" to confirm:'
        );

        if (confirmation === 'DELETE ALL') {
            try {
                await chrome.storage.local.clear();
                this.showStatus('All data cleared successfully!', 'success');
                
                // Reset to default settings
                this.settings = { ...this.defaultSettings };
                this.updateUI();
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showStatus('Error clearing data', 'error');
            }
        } else if (confirmation !== null) {
            this.showStatus('Data clear cancelled - incorrect confirmation', 'error');
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    generateId() {
        return 'pwd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showStatus(message, type = 'success') {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status-message show ${type}`;

        setTimeout(() => {
            statusElement.classList.remove('show');
        }, 3000);
    }
}

// Initialize the options manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
});
