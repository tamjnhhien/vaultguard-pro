// Content script for SecurePass extension
// This script runs on web pages to detect password fields and provide auto-fill functionality

class ContentScriptManager {
    constructor() {
        this.passwordFields = [];
        this.usernameFields = [];
        this.isInjected = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Don't run on extension pages
        if (window.location.protocol === 'chrome-extension:') {
            return;
        }

        this.detectPasswordFields();
        this.setupMutationObserver();
        this.setupMessageListener();
    }

    detectPasswordFields() {
        // Find password fields
        this.passwordFields = Array.from(document.querySelectorAll('input[type="password"]'));
        
        // Find potential username fields (email, text fields near password fields)
        this.usernameFields = [];
        
        this.passwordFields.forEach(passwordField => {
            const usernameField = this.findUsernameField(passwordField);
            if (usernameField && !this.usernameFields.includes(usernameField)) {
                this.usernameFields.push(usernameField);
            }
        });

        // Add SecurePass indicators if fields are found
        if (this.passwordFields.length > 0) {
            this.addSecurePassIndicators();
        }
    }

    findUsernameField(passwordField) {
        // Look for username fields in the same form
        const form = passwordField.closest('form');
        if (form) {
            // Look for email fields first
            let usernameField = form.querySelector('input[type="email"]');
            if (usernameField) return usernameField;

            // Look for text fields with username-related names/ids
            const usernameSelectors = [
                'input[name*="user" i]',
                'input[name*="email" i]',
                'input[name*="login" i]',
                'input[id*="user" i]',
                'input[id*="email" i]',
                'input[id*="login" i]',
                'input[type="text"]'
            ];

            for (const selector of usernameSelectors) {
                usernameField = form.querySelector(selector);
                if (usernameField && usernameField !== passwordField) {
                    return usernameField;
                }
            }
        }

        // Look for nearby text/email fields if no form is found
        const container = passwordField.parentElement;
        if (container) {
            const nearbyFields = container.querySelectorAll('input[type="text"], input[type="email"]');
            if (nearbyFields.length > 0) {
                return nearbyFields[0];
            }
        }

        return null;
    }

    addSecurePassIndicators() {
        this.passwordFields.forEach(field => {
            if (field.hasAttribute('data-securepass-enhanced')) return;

            field.setAttribute('data-securepass-enhanced', 'true');
            
            // Create SecurePass button
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'securepass-autofill-btn';
            button.innerHTML = '🔐';
            button.title = 'Fill with SecurePass';
            button.style.cssText = `
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                width: 24px;
                height: 24px;
                border: none;
                background: #667eea;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            `;

            button.addEventListener('mouseenter', () => {
                button.style.background = '#5a6fd8';
            });

            button.addEventListener('mouseleave', () => {
                button.style.background = '#667eea';
            });

            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPasswordSelection(field);
            });

            // Position the button relative to the field
            const fieldRect = field.getBoundingClientRect();
            const fieldStyle = window.getComputedStyle(field);
            
            // Make the field container relative if it's not already positioned
            const container = field.parentElement;
            if (window.getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }

            container.appendChild(button);
        });
    }

    async showPasswordSelection(passwordField) {
        try {
            // Get passwords for current site
            const response = await this.sendMessage({
                action: 'findPasswordsForSite',
                url: window.location.href
            });

            if (response.success && response.data.length > 0) {
                this.showPasswordDropdown(passwordField, response.data);
            } else {
                this.showNoPasswordsMessage(passwordField);
            }
        } catch (error) {
            console.error('Error getting passwords for site:', error);
        }
    }

    showPasswordDropdown(passwordField, passwords) {
        // Remove existing dropdown
        this.removePasswordDropdown();

        const dropdown = document.createElement('div');
        dropdown.className = 'securepass-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            max-height: 200px;
            overflow-y: auto;
        `;

        passwords.forEach(password => {
            const item = document.createElement('div');
            item.className = 'securepass-dropdown-item';
            item.style.cssText = `
                padding: 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                transition: background 0.2s;
            `;

            item.innerHTML = `
                <div style="font-weight: 500; color: #333;">${this.escapeHtml(password.siteName)}</div>
                <div style="font-size: 12px; color: #666;">${this.escapeHtml(password.username)}</div>
            `;

            item.addEventListener('mouseenter', () => {
                item.style.background = '#f8f9fa';
            });

            item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
            });

            item.addEventListener('click', () => {
                this.fillCredentials(password, passwordField);
                this.removePasswordDropdown();
            });

            dropdown.appendChild(item);
        });

        // Position dropdown relative to password field
        const container = passwordField.parentElement;
        if (window.getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        container.appendChild(dropdown);

        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', this.handleDropdownClickOutside.bind(this), { once: true });
        }, 0);
    }

    showNoPasswordsMessage(passwordField) {
        // Show a temporary message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10002;
            font-size: 14px;
        `;
        message.textContent = 'No passwords found for this site';

        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentElement) {
                message.parentElement.removeChild(message);
            }
        }, 3000);
    }

    fillCredentials(password, passwordField) {
        // Fill password field
        passwordField.value = password.password;
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));

        // Find and fill username field
        const usernameField = this.findUsernameField(passwordField);
        if (usernameField) {
            usernameField.value = password.username;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Show success message
        this.showSuccessMessage();
    }

    showSuccessMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10002;
            font-size: 14px;
        `;
        message.textContent = 'Credentials filled successfully!';

        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentElement) {
                message.parentElement.removeChild(message);
            }
        }, 2000);
    }

    removePasswordDropdown() {
        const existingDropdown = document.querySelector('.securepass-dropdown');
        if (existingDropdown) {
            existingDropdown.parentElement.removeChild(existingDropdown);
        }
    }

    handleDropdownClickOutside(e) {
        if (!e.target.closest('.securepass-dropdown') && !e.target.closest('.securepass-autofill-btn')) {
            this.removePasswordDropdown();
        }
    }

    setupMutationObserver() {
        // Watch for dynamically added password fields
        const observer = new MutationObserver((mutations) => {
            let shouldRedetect = false;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches && node.matches('input[type="password"]')) {
                            shouldRedetect = true;
                        } else if (node.querySelector && node.querySelector('input[type="password"]')) {
                            shouldRedetect = true;
                        }
                    }
                });
            });

            if (shouldRedetect) {
                setTimeout(() => this.detectPasswordFields(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'fillCredentials') {
                this.fillCredentialsFromMessage(message.credentials);
                sendResponse({ success: true });
            }
            return true;
        });
    }

    fillCredentialsFromMessage(credentials) {
        if (this.passwordFields.length > 0) {
            const passwordField = this.passwordFields[0];
            this.fillCredentials(credentials, passwordField);
        }
    }

    sendMessage(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, resolve);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the content script manager
new ContentScriptManager();
