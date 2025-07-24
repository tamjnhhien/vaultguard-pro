# SecurePass Chrome Extension - Installation & Usage Guide

## 🚀 Quick Start

Your SecurePass Chrome extension is now complete! Follow these steps to install and start using it.

## 📦 Installation

### Method 1: Load Unpacked Extension (Recommended for Development)

1. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Navigate to your extension folder: `/Users/mymac/Documents/project_example/extension_chrome/extension02`
   - Select the folder and click "Open"

4. **Verify Installation**
   - You should see "SecurePass - Password Manager" in your extensions list
   - The extension icon should appear in your toolbar

### Method 2: Pack Extension (For Distribution)

1. In Chrome Extensions page, click "Pack extension"
2. Select your extension folder as the root directory
3. Chrome will create a `.crx` file you can distribute

## 🎯 First Time Setup

1. **Pin the Extension**
   - Click the puzzle piece icon in your toolbar
   - Find "SecurePass" and click the pin icon to keep it visible

2. **Open SecurePass**
   - Click the SecurePass icon in your toolbar
   - The popup interface will open

3. **Add Your First Password**
   - Click "Add New Password"
   - Fill in the form:
     - Website/Service Name (e.g., "Google")
     - Website URL (optional, e.g., "https://accounts.google.com")
     - Username/Email
     - Password (or generate one)
     - Notes (optional)
   - Click "Save Password"

## 🔧 Features & Usage

### 🔐 Password Management

**Adding Passwords:**
- Click the SecurePass icon → "Add New Password"
- Fill in the required information
- Use the password generator (dice icon) for secure passwords
- Save your password

**Viewing Passwords:**
- All saved passwords appear in the main popup
- Use the search bar to quickly find specific passwords
- Click on any password item to view details

**Copying Credentials:**
- Click the 🔑 icon to copy the password
- Click "Copy User" to copy the username
- Credentials are copied to your clipboard

**Editing Passwords:**
- Click the ✏️ (edit) icon on any password
- Modify the information as needed
- Save changes

**Deleting Passwords:**
- Click the 🗑️ (delete) icon on any password
- Confirm deletion in the popup

### 🎲 Password Generator

**Access the Generator:**
- Click the "Generate" tab in the popup
- Or use the dice icon when adding/editing passwords

**Customize Generation:**
- Adjust password length (8-50 characters)
- Toggle character types:
  - Uppercase letters (A-Z)
  - Lowercase letters (a-z)
  - Numbers (0-9)
  - Symbols (!@#$...)
- View real-time strength indicator

**Using Generated Passwords:**
- Click "Generate Password"
- Copy the password using the copy button
- Or generate directly into forms using the dice icon

### 🌐 Auto-Fill Feature

**How it Works:**
- Visit any website with login forms
- Look for the 🔐 icon in password fields
- Click the icon to see available passwords for that site
- Select a password to auto-fill both username and password

**Supported Sites:**
- Works on all websites with standard login forms
- Automatically matches saved passwords to current domain
- Smart detection of username and password fields

### ⚙️ Settings & Configuration

**Access Settings:**
- Click the gear icon (⚙️) in the popup
- Or right-click the extension icon → "Options"

**Security Settings:**
- Enable/disable auto-lock
- Set lock timeout (5 minutes to 1 hour)
- Configure password strength display

**Generator Defaults:**
- Set default password length
- Choose default character types
- Customize generation preferences

**Data Management:**
- Export passwords to JSON file (for backup)
- Import passwords from JSON file
- Clear all data (with confirmation)

## 🛡️ Security Features

### Local Storage Only
- All passwords stored locally on your device
- No cloud synchronization or external servers
- Data never leaves your computer

### Chrome's Secure Storage
- Uses Chrome's built-in encrypted storage API
- Passwords encrypted at rest
- Secure against local file access

### Auto-Lock (Optional)
- Automatically lock extension after inactivity
- Configurable timeout periods
- Prevents unauthorized access

## 🔍 Troubleshooting

### Extension Not Loading
1. Check that all files are in the correct directory
2. Verify manifest.json is valid
3. Check for errors in Chrome Extensions page
4. Try reloading the extension

### Icons Not Showing
- The current icon files are placeholders
- Replace them with proper 16x16, 32x32, 48x48, and 128x128 PNG files
- Use the included `generate-icons.html` to create proper icons

### Auto-Fill Not Working
1. Refresh the webpage
2. Check that password fields are properly detected
3. Verify you have passwords saved for that domain
4. Try manually clicking the 🔐 icon in password fields

### Data Not Saving
1. Check Chrome storage permissions
2. Verify you're not in incognito mode
3. Try clearing extension data and re-adding

## 📂 File Structure

```
extension02/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── options.html          # Settings page
├── background.js         # Service worker
├── content.js           # Auto-fill functionality
├── styles/
│   ├── popup.css        # Popup styling
│   └── options.css      # Settings styling
├── scripts/
│   ├── popup.js         # Popup functionality
│   └── options.js       # Settings functionality
├── icons/
│   ├── icon16.png       # 16x16 icon (placeholder)
│   ├── icon32.png       # 32x32 icon (placeholder)
│   ├── icon48.png       # 48x48 icon (placeholder)
│   ├── icon128.png      # 128x128 icon (placeholder)
│   └── generate-icons.html # Icon generator tool
└── README.md           # Documentation
```

## 🎨 Customization

### Replace Icons
1. Create proper PNG icons in sizes: 16x16, 32x32, 48x48, 128x128
2. Replace the placeholder files in `/icons/` folder
3. Reload the extension

### Modify Appearance
- Edit `styles/popup.css` for popup styling
- Edit `styles/options.css` for settings page styling
- Modify colors, fonts, and layout as desired

### Add Features
- Edit JavaScript files in `/scripts/` folder
- Add new functionality to `background.js`
- Extend auto-fill capabilities in `content.js`

## 🔄 Updates & Maintenance

### Updating the Extension
1. Make changes to files
2. Go to Chrome Extensions page
3. Click the reload icon on your extension
4. Test the changes

### Version Control
- Update version number in `manifest.json`
- Document changes in README.md
- Consider backing up user data before major updates

## 📞 Support

If you encounter issues:
1. Check the browser console for errors (F12 → Console)
2. Verify all files are properly created
3. Ensure Chrome is up to date
4. Try disabling other extensions temporarily

## 🎉 You're Ready!

Your SecurePass extension is fully functional and ready to use! Start by:

1. Adding a few test passwords
2. Trying the password generator
3. Testing auto-fill on your favorite websites
4. Exploring the settings page
5. Creating proper icons to replace the placeholders

Enjoy your new secure password manager! 🔐
