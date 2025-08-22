import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import { 
  HiAdjustmentsHorizontal,
  HiUser,
  HiEnvelope,
  HiLockClosed,
  HiEyeSlash,
  HiShieldCheck,
  HiBell,
  HiGlobeAlt,
  HiSun,
  HiMoon,
  HiComputerDesktop,
  HiTrash,
  HiExclamationTriangle,
  HiCog6Tooth,
  HiFingerPrint,
  HiKey,
  HiDevicePhoneMobile,
  HiCheck,
  HiXMark,
  HiInformationCircle,
  HiQrCode,
  HiClipboardDocument,
  HiArrowLeft,
  HiCheckCircle
} from 'react-icons/hi2'

const SettingsSection = ({ user }) => {
  const [activeTab, setActiveTab] = useState('account')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFAStep, setTwoFAStep] = useState(1)
  const [backupCodes, setBackupCodes] = useState([])
  const [verificationCode, setVerificationCode] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, title: '', message: '', type: 'error' })
  const [settings, setSettings] = useState({
    // Account settings
    username: user?.username || 'user123',
    email: user?.email || 'user@example.com',
    displayName: user?.displayName || user?.username || 'User',
    bio: user?.bio || '',
    
    // Privacy settings
    profileVisibility: user?.profileVisibility || 'public',
    showEmail: user?.showEmail || false,
    showLastSeen: user?.showLastSeen !== false,
    allowDirectMessages: user?.allowDirectMessages !== false,
    
    // Notification settings
    emailNotifications: user?.emailNotifications !== false,
    pushNotifications: user?.pushNotifications !== false,
    marketingEmails: user?.marketingEmails || false,
    weeklyDigest: user?.weeklyDigest !== false,
    
    // Appearance settings
    theme: user?.theme || 'system',
    language: user?.language || 'en',
    timezone: user?.timezone || 'auto',
    
    // Security settings
    twoFactorEnabled: user?.mfaEnabled || user?.twoFactorEnabled || false,
    sessionTimeout: user?.sessionTimeout || 30,
    loginAlerts: user?.loginAlerts !== false
  })

  // Generate random secret for TOTP
  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  // Generate TOTP URL for QR code
  const generateTotpUrl = (secret, email) => {
    const issuer = 'gotchu.lol'
    const label = `${issuer}:${email}`
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
  }
  
  // Generate mock backup codes
  const generateBackupCodes = () => {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase())
    }
    setBackupCodes(codes)
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: HiUser },
    { id: 'privacy', label: 'Privacy', icon: HiEyeSlash },
    { id: 'notifications', label: 'Notifications', icon: HiBell },
    { id: 'appearance', label: 'Appearance', icon: HiSun },
    { id: 'security', label: 'Security', icon: HiShieldCheck }
  ]

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    // In real app, would make API call to save settings
    console.log('Saving settings:', settings)
  }

  const handle2FASetup = async () => {
    try {
      setShow2FAModal(true)
      setTwoFAStep(1)
      setIsLoading(true)
      
      // API call to generate 2FA secret from backend
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      console.log('Debug - Token found:', token ? 'YES' : 'NO', token?.substring(0, 20) + '...')
      console.log('Debug - SessionId found:', sessionId ? 'YES' : 'NO', sessionId?.substring(0, 20) + '...')
      
      if (!token && !sessionId) {
        showAlert('Authentication Required', 'No authentication found. Please log in again.')
        setShow2FAModal(false)
        return
      }
      
      const response = await fetch('http://localhost:8080/api/auth/2fa/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTotpSecret(data.secret)
        setQrCodeUrl(data.qr_code_url)
        setBackupCodes(data.backup_codes)
      } else {
        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))
        
        const errorText = await response.text()
        console.log('Raw error response:', errorText)
        
        try {
          const error = JSON.parse(errorText)
          console.error('Failed to generate 2FA:', error.message)
          showAlert('Setup Error', 'Failed to generate 2FA: ' + (error.message || `HTTP ${response.status}`))
        } catch {
          showAlert('Setup Error', 'Failed to generate 2FA: HTTP ' + response.status + ' - ' + errorText)
        }
        setShow2FAModal(false)
        return
      }
      
    } catch (error) {
      console.error('Failed to setup 2FA:', error)
      showAlert('Connection Error', 'Error connecting to server. Please check if backend is running.')
      setShow2FAModal(false)
      return
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async () => {
    try {
      if (verificationCode.length !== 6) {
        showAlert('Invalid Code', 'Please enter a 6-digit verification code from your authenticator app.')
        return
      }
      
      setIsLoading(true)
      
      // API call to verify and enable 2FA
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      const response = await fetch('http://localhost:8080/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({ 
          code: verificationCode,
          secret: totpSecret
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.backup_codes) {
          setBackupCodes(data.backup_codes)
        }
        setSettings(prev => ({ ...prev, twoFactorEnabled: true }))
        showAlert('Success!', '2FA has been enabled successfully! Make sure to save your backup codes.', 'success')
      } else {
        const error = await response.json()
        console.error('Failed to verify 2FA:', error.message)
        showAlert('Verification Failed', error.message || 'Invalid verification code. Please try again.')
        return // Don't enable 2FA if verification failed
      }
      
    } catch (error) {
      console.error('Failed to verify 2FA code:', error)
      showAlert('Connection Error', 'Error connecting to server: ' + error.message)
      return // Don't enable 2FA if request failed
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add toast notification here
      console.log('Copied to clipboard:', text)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    copyToClipboard(codesText)
  }

  const showAlert = (title, message, type = 'error') => {
    setCustomAlert({ show: true, title, message, type })
  }

  const hideAlert = () => {
    setCustomAlert({ show: false, title: '', message: '', type: 'error' })
  }

  const handleDisable2FA = async () => {
    try {
      const password = prompt('Enter your password to disable 2FA:')
      if (!password) return

      setIsLoading(true)
      const token = localStorage.getItem('authToken')
      const sessionId = localStorage.getItem('sessionId')
      
      const response = await fetch('http://localhost:8080/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Session-ID': sessionId || '',
        },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, twoFactorEnabled: false }))
        showAlert('Success', '2FA disabled successfully!', 'success')
      } else {
        const error = await response.json()
        console.error('Failed to disable 2FA:', error.message)
        showAlert('Error', 'Failed to disable 2FA: ' + error.message)
      }
      
    } catch (error) {
      console.error('Failed to disable 2FA:', error)
      showAlert('Error', 'Failed to disable 2FA. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="setting-item">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <div 
        className={`toggle-switch ${enabled ? 'enabled' : 'disabled'}`}
        onClick={() => onChange(!enabled)}
      >
        <div className={`toggle-thumb ${enabled ? 'enabled' : 'disabled'}`} />
      </div>
    </div>
  )

  const SelectSetting = ({ value, onChange, options, label, description }) => (
    <div className="setting-item">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="setting-select"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const InputSetting = ({ value, onChange, label, description, type = 'text', placeholder }) => (
    <div className="setting-item">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        {description && <p className="setting-description">{description}</p>}
      </div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="setting-input"
      />
    </div>
  )


  const TwoFactorModal = () => (
    <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
      <div className="twofa-modal-content" onClick={e => e.stopPropagation()}>
        {/* Compact Header */}
        <div className="twofa-header">
          <div className="header-left">
            {twoFAStep > 1 && (
              <button 
                className="back-btn" 
                onClick={() => setTwoFAStep(twoFAStep - 1)}
              >
                <HiArrowLeft />
              </button>
            )}
            <div className="title-section">
              <HiShieldCheck className="title-icon" />
              <h3>Enable 2FA</h3>
            </div>
          </div>
          <button className="close-btn" onClick={() => setShow2FAModal(false)}>
            <HiXMark />
          </button>
        </div>
        
        {/* Alert inside modal */}
        {customAlert.show && (
          <div className="modal-alert">
            <div className="alert-header">
              <div className={`alert-icon ${customAlert.type}`}>
                {customAlert.type === 'success' ? (
                  <HiCheckCircle />
                ) : customAlert.type === 'warning' ? (
                  <HiExclamationTriangle />
                ) : (
                  <HiInformationCircle />
                )}
              </div>
              <h3 className="alert-title">{customAlert.title}</h3>
            </div>
            <p className="alert-message">{customAlert.message}</p>
            <div className="alert-actions">
              <button className={`alert-button ${customAlert.type}`} onClick={hideAlert}>
                OK
              </button>
            </div>
          </div>
        )}

        {/* Compact Progress */}
        <div className="progress-steps">
          <div className={`progress-step ${twoFAStep >= 1 ? 'active' : ''}`} />
          <div className={`progress-step ${twoFAStep >= 2 ? 'active' : ''}`} />
          <div className={`progress-step ${twoFAStep >= 3 ? 'active' : ''}`} />
        </div>

        {/* Step 1: App Download */}
        {twoFAStep === 1 && (
          <div className="twofa-content">
            <div className="content-main">
              <h4>Download Authenticator App</h4>
              <p>Use Google Authenticator, Authy, or similar app</p>
              
              <div className="app-options">
                <div className="app-option">
                  <HiDevicePhoneMobile className="app-icon" />
                  <span>Google Authenticator</span>
                </div>
                <div className="app-option">
                  <HiShieldCheck className="app-icon" />
                  <span>Authy</span>
                </div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="cancel-btn" onClick={() => setShow2FAModal(false)} disabled={isLoading}>
                Cancel
              </button>
              <button className="continue-btn" onClick={() => setTwoFAStep(2)} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Loading...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: QR Code & Secret */}
        {twoFAStep === 2 && (
          <div className="twofa-content">
            <div className="content-main">
              <h4>Scan QR Code</h4>
              <div className="qr-container">
                {qrCodeUrl ? (
                  <div className="qr-code-wrapper">
                    <QRCode
                      value={qrCodeUrl}
                      size={160}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 160 160`}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                    <small>gotchu.lol:{settings.email}</small>
                  </div>
                ) : (
                  <div className="qr-placeholder">
                    <HiQrCode className="qr-icon" />
                    <small>Generating QR code...</small>
                  </div>
                )}
                
                <div className="secret-section">
                  <span>Manual key:</span>
                  <div className="secret-key">
                    <code>{totpSecret || 'Generating...'}</code>
                    <button 
                      className="copy-btn" 
                      onClick={() => copyToClipboard(totpSecret)}
                      disabled={!totpSecret}
                    >
                      <HiClipboardDocument />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="back-btn" onClick={() => setTwoFAStep(1)} disabled={isLoading}>
                Back
              </button>
              <button className="continue-btn" onClick={() => setTwoFAStep(3)} disabled={isLoading}>
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verification & Enable */}
        {twoFAStep === 3 && (
          <div className="twofa-content">
            <div className="content-main">
              <h4>Verify & Enable</h4>
              <p>Enter 6-digit code from your app:</p>
              
              <input 
                type="text"
                className="code-input"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                autoFocus
              />
              
              {settings.twoFactorEnabled ? (
                <div className="success-state">
                  <HiCheckCircle className="success-icon" />
                  <span>2FA Enabled Successfully!</span>
                  <div className="backup-codes-compact">
                    <span>Backup codes generated</span>
                    <button className="copy-backup-btn" onClick={copyBackupCodes}>
                      <HiClipboardDocument />
                      Copy Codes
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="action-buttons">
              {!settings.twoFactorEnabled ? (
                <>
                  <button className="back-btn" onClick={() => setTwoFAStep(2)} disabled={isLoading}>
                    Back
                  </button>
                  <button 
                    className="enable-btn" 
                    onClick={handleVerification}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="spinner" />
                        Verifying...
                      </>
                    ) : (
                      'Enable 2FA'
                    )}
                  </button>
                </>
              ) : (
                <button className="done-btn" onClick={() => setShow2FAModal(false)} disabled={isLoading}>
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const DeleteAccountModal = () => (
    <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <HiExclamationTriangle className="warning-icon" />
          <h3>Delete Account</h3>
        </div>
        <p>This action cannot be undone. Your profile, links, and all data will be permanently deleted.</p>
        <div className="modal-actions">
          <button 
            className="cancel-button"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </button>
          <button className="delete-button">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Header */}
      <div className="content-header">
        <h1>Account Settings</h1>
        <p>Manage your account preferences and privacy settings</p>
      </div>

      <div className="settings-layout">
        {/* Settings Tabs */}
        <div className="settings-sidebar">
          {tabs.map(tab => {
            const IconComponent = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                className={`settings-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent className="tab-icon" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Account Information</h2>
                <p>Update your account details and profile information</p>
              </div>

              <div className="settings-list">
                <InputSetting
                  label="Username"
                  description="Your unique username on gotchu.lol"
                  value={settings.username}
                  onChange={(value) => handleSettingChange('username', value)}
                  placeholder="Enter username"
                />

                <InputSetting
                  label="Display Name"
                  description="The name shown on your profile"
                  value={settings.displayName}
                  onChange={(value) => handleSettingChange('displayName', value)}
                  placeholder="Enter display name"
                />

                <InputSetting
                  label="Email Address"
                  description="Your primary email for notifications and login"
                  value={settings.email}
                  onChange={(value) => handleSettingChange('email', value)}
                  type="email"
                  placeholder="Enter email address"
                />

                <div className="setting-item">
                  <div className="setting-info">
                    <label className="setting-label">Bio</label>
                    <p className="setting-description">Tell others about yourself</p>
                  </div>
                  <textarea 
                    value={settings.bio}
                    onChange={(e) => handleSettingChange('bio', e.target.value)}
                    placeholder="Enter your bio..."
                    className="setting-textarea"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Privacy & Visibility</h2>
                <p>Control who can see your profile and information</p>
              </div>

              <div className="settings-list">
                <SelectSetting
                  label="Profile Visibility"
                  description="Who can view your profile"
                  value={settings.profileVisibility}
                  onChange={(value) => handleSettingChange('profileVisibility', value)}
                  options={[
                    { value: 'public', label: 'Public - Anyone can view' },
                    { value: 'unlisted', label: 'Unlisted - Only with link' },
                    { value: 'private', label: 'Private - Only you' }
                  ]}
                />

                <ToggleSwitch
                  label="Show Email Address"
                  description="Display your email on your public profile"
                  enabled={settings.showEmail}
                  onChange={(value) => handleSettingChange('showEmail', value)}
                />

                <ToggleSwitch
                  label="Show Last Seen"
                  description="Let others see when you were last active"
                  enabled={settings.showLastSeen}
                  onChange={(value) => handleSettingChange('showLastSeen', value)}
                />

                <ToggleSwitch
                  label="Allow Direct Messages"
                  description="Allow others to send you messages"
                  enabled={settings.allowDirectMessages}
                  onChange={(value) => handleSettingChange('allowDirectMessages', value)}
                />
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notifications</h2>
                <p>Manage how and when you receive notifications</p>
              </div>

              <div className="settings-list">
                <ToggleSwitch
                  label="Email Notifications"
                  description="Receive important updates via email"
                  enabled={settings.emailNotifications}
                  onChange={(value) => handleSettingChange('emailNotifications', value)}
                />

                <ToggleSwitch
                  label="Push Notifications"
                  description="Get notifications in your browser"
                  enabled={settings.pushNotifications}
                  onChange={(value) => handleSettingChange('pushNotifications', value)}
                />

                <ToggleSwitch
                  label="Marketing Emails"
                  description="Receive emails about new features and updates"
                  enabled={settings.marketingEmails}
                  onChange={(value) => handleSettingChange('marketingEmails', value)}
                />

                <ToggleSwitch
                  label="Weekly Digest"
                  description="Get a weekly summary of your profile activity"
                  enabled={settings.weeklyDigest}
                  onChange={(value) => handleSettingChange('weeklyDigest', value)}
                />
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Appearance & Display</h2>
                <p>Customize how gotchu.lol looks and feels</p>
              </div>

              <div className="settings-list">
                <SelectSetting
                  label="Theme"
                  description="Choose your preferred color scheme"
                  value={settings.theme}
                  onChange={(value) => handleSettingChange('theme', value)}
                  options={[
                    { value: 'system', label: 'System Default' },
                    { value: 'light', label: 'Light Mode' },
                    { value: 'dark', label: 'Dark Mode' }
                  ]}
                />

                <SelectSetting
                  label="Language"
                  description="Select your preferred language"
                  value={settings.language}
                  onChange={(value) => handleSettingChange('language', value)}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' },
                    { value: 'fr', label: 'Français' },
                    { value: 'de', label: 'Deutsch' }
                  ]}
                />

                <SelectSetting
                  label="Timezone"
                  description="Set your local timezone"
                  value={settings.timezone}
                  onChange={(value) => handleSettingChange('timezone', value)}
                  options={[
                    { value: 'auto', label: 'Automatic' },
                    { value: 'utc', label: 'UTC' },
                    { value: 'est', label: 'Eastern Time' },
                    { value: 'pst', label: 'Pacific Time' },
                    { value: 'cet', label: 'Central European Time' }
                  ]}
                />
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Security & Authentication</h2>
                <p>Protect your account with security features</p>
              </div>

              <div className="settings-list">
                <div className="setting-item security-item">
                  <div className="setting-info">
                    <label className="setting-label">Two-Factor Authentication</label>
                    <p className="setting-description">Add an extra layer of security to your account</p>
                  </div>
                  <div className="security-actions">
                    {settings.twoFactorEnabled ? (
                      <div className="security-status enabled">
                        <HiCheck className="status-icon" />
                        <span>Enabled</span>
                        <button className="disable-button" onClick={handleDisable2FA}>Disable</button>
                      </div>
                    ) : (
                      <button 
                        className="enable-2fa-button"
                        onClick={handle2FASetup}
                      >
                        <HiFingerPrint className="button-icon" />
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>

                <SelectSetting
                  label="Session Timeout"
                  description="Automatically log out after period of inactivity"
                  value={settings.sessionTimeout}
                  onChange={(value) => handleSettingChange('sessionTimeout', parseInt(value))}
                  options={[
                    { value: '15', label: '15 minutes' },
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                    { value: '240', label: '4 hours' },
                    { value: '0', label: 'Never' }
                  ]}
                />

                <ToggleSwitch
                  label="Login Alerts"
                  description="Get notified when someone logs into your account"
                  enabled={settings.loginAlerts}
                  onChange={(value) => handleSettingChange('loginAlerts', value)}
                />

                <div className="setting-item">
                  <div className="setting-info">
                    <label className="setting-label">Change Password</label>
                    <p className="setting-description">Update your account password</p>
                  </div>
                  <button className="change-password-button">
                    <HiKey className="button-icon" />
                    Change Password
                  </button>
                </div>
              </div>

              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <div className="setting-item danger">
                  <div className="setting-info">
                    <label className="setting-label danger">Delete Account</label>
                    <p className="setting-description">Permanently delete your account and all data</p>
                  </div>
                  <button 
                    className="delete-account-button"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <HiTrash className="button-icon" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="settings-footer">
            <button className="save-button" onClick={handleSave}>
              <HiCheck className="button-icon" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && <TwoFactorModal />}
      
      {/* Delete Account Modal */}
      {showDeleteModal && <DeleteAccountModal />}
    </>
  )
}

export default SettingsSection