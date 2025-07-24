// Background service worker for SecurePass extension

class BackgroundManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        // Handle messages from content scripts or popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Handle tab updates for auto-fill detection
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.handleTabUpdate(tabId, tab);
            }
        });
    }

    async handleInstallation(details) {
        if (details.reason === 'install') {
            // First installation
            console.log('SecurePass installed');
            
            // Initialize default settings
            await this.initializeDefaultSettings();
            
            // Open welcome page
            chrome.tabs.create({
                url: chrome.runtime.getURL('options.html')
            });
        } else if (details.reason === 'update') {
            // Extension updated
            console.log('SecurePass updated');
            
            // Migrate settings if needed
            await this.migrateSettings();
        }
    }

    async initializeDefaultSettings() {
        const defaultSettings = {
            autoLock: false,
            lockTimeout: 15,
            showPasswordStrength: true,
            defaultPasswordLength: 16,
            defaultUppercase: true,
            defaultLowercase: true,
            defaultNumbers: true,
            defaultSymbols: false,
            firstRun: true
        };

        try {
            await chrome.storage.local.set({ settings: defaultSettings });
            console.log('Default settings initialized');
        } catch (error) {
            console.error('Error initializing default settings:', error);
        }
    }

    async migrateSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            const currentSettings = result.settings || {};

            // Add any new settings that might not exist in older versions
            const defaultSettings = {
                autoLock: false,
                lockTimeout: 15,
                showPasswordStrength: true,
                defaultPasswordLength: 16,
                defaultUppercase: true,
                defaultLowercase: true,
                defaultNumbers: true,
                defaultSymbols: false
            };

            const migratedSettings = { ...defaultSettings, ...currentSettings };
            await chrome.storage.local.set({ settings: migratedSettings });
            
            console.log('Settings migrated successfully');
        } catch (error) {
            console.error('Error migrating settings:', error);
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getPasswords':
                    const passwords = await this.getPasswords();
                    sendResponse({ success: true, data: passwords });
                    break;

                case 'savePassword':
                    await this.savePassword(message.password);
                    sendResponse({ success: true });
                    break;

                case 'deletePassword':
                    await this.deletePassword(message.passwordId);
                    sendResponse({ success: true });
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, data: settings });
                    break;

                case 'saveSettings':
                    await this.saveSettings(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'findPasswordsForSite':
                    const sitePasswords = await this.findPasswordsForSite(message.url);
                    sendResponse({ success: true, data: sitePasswords });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleTabUpdate(tabId, tab) {
        // This could be used for auto-fill functionality in the future
        // For now, we'll just log the tab update
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            // Could check if we have passwords for this domain
            const domain = this.extractDomain(tab.url);
            if (domain) {
                const passwords = await this.findPasswordsForSite(tab.url);
                if (passwords.length > 0) {
                    // Could show a badge or notification that passwords are available
                    chrome.action.setBadgeText({
                        tabId: tabId,
                        text: passwords.length.toString()
                    });
                    chrome.action.setBadgeBackgroundColor({
                        tabId: tabId,
                        color: '#667eea'
                    });
                } else {
                    chrome.action.setBadgeText({
                        tabId: tabId,
                        text: ''
                    });
                }
            }
        }
    }

    async getPasswords() {
        try {
            const result = await chrome.storage.local.get(['passwords']);
            return result.passwords || [];
        } catch (error) {
            console.error('Error getting passwords:', error);
            return [];
        }
    }

    async savePassword(password) {
        try {
            const passwords = await this.getPasswords();
            
            if (password.id) {
                // Update existing password
                const index = passwords.findIndex(p => p.id === password.id);
                if (index !== -1) {
                    passwords[index] = { ...passwords[index], ...password, updatedAt: new Date().toISOString() };
                }
            } else {
                // Add new password
                password.id = this.generateId();
                password.createdAt = new Date().toISOString();
                password.updatedAt = new Date().toISOString();
                passwords.push(password);
            }

            await chrome.storage.local.set({ passwords });
            console.log('Password saved successfully');
        } catch (error) {
            console.error('Error saving password:', error);
            throw error;
        }
    }

    async deletePassword(passwordId) {
        try {
            const passwords = await this.getPasswords();
            const filteredPasswords = passwords.filter(p => p.id !== passwordId);
            await chrome.storage.local.set({ passwords: filteredPasswords });
            console.log('Password deleted successfully');
        } catch (error) {
            console.error('Error deleting password:', error);
            throw error;
        }
    }

    async getSettings() {
        try {
            const result = await chrome.storage.local.get(['settings']);
            return result.settings || {};
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.local.set({ settings });
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    }

    async findPasswordsForSite(url) {
        try {
            const passwords = await this.getPasswords();
            const domain = this.extractDomain(url);
            
            if (!domain) return [];

            return passwords.filter(password => {
                if (password.siteUrl) {
                    const passwordDomain = this.extractDomain(password.siteUrl);
                    return passwordDomain === domain;
                }
                // Fallback to checking if site name contains domain
                return password.siteName.toLowerCase().includes(domain.toLowerCase());
            });
        } catch (error) {
            console.error('Error finding passwords for site:', error);
            return [];
        }
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
            return null;
        }
    }

    generateId() {
        return 'pwd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Initialize the background manager
new BackgroundManager();
