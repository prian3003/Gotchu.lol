import React, { useState, useMemo, useCallback } from 'react'
import QRCode from 'react-qr-code'
import ChangePasswordModal from '../../modals/ChangePasswordModal'
import Disable2FAModal from '../../modals/Disable2FAModal'
import { useToast } from '../../ui/Toast'
import { API_BASE_URL } from '../../../config/api'
import { 
  HiAdjustmentsHorizontal,
  HiUser,
  HiEnvelope,
  HiLockClosed,
  HiEyeSlash,
  HiShieldCheck,
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

const SettingsSection = ({ user, onUserUpdate }) => {
  const toast = useToast()
  
  const [freshUserData, setFreshUserData] = useState(null)
  const [fetchingFreshData, setFetchingFreshData] = useState(true)
  const [originalSettings, setOriginalSettings] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Fetch fresh user data directly from database (no cache)
  const fetchFreshUserData = async () => {
    try {
      setFetchingFreshData(true)
      // Use a timestamp to bypass any potential caching
      const timestamp = Date.now()
      const response = await fetch(`${API_BASE_URL}/dashboard?t=${timestamp}`, {
        method: 'GET',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) {
        const data = await response.json()
        const userData = data.data.user
        setFreshUserData(userData)
      }
    } catch (error) {
    } finally {
      setFetchingFreshData(false)
    }
  }
  
  // Fetch fresh data when component mounts
  React.useEffect(() => {
    fetchFreshUserData()
  }, [])
  
  const [activeTab, setActiveTab] = useState('account')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false)
  const [twoFAStep, setTwoFAStep] = useState(1)
  const [backupCodes, setBackupCodes] = useState([])
  const [verificationCode, setVerificationCode] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, title: '', message: '', type: 'error' })
  const [settings, setSettings] = useState({
    // Account settings
    username: '',
    email: '',
    displayName: '',
    bio: '',
    
    // Privacy settings
    
    
    // Appearance settings
    theme: 'system',
    language: 'en',
    timezone: 'auto',
    
    // Security settings
    twoFactorEnabled: false,
    sessionTimeout: 30
  })
  
  // Update settings when fresh user data is loaded
  React.useEffect(() => {
    if (freshUserData) {
      const newSettings = {
        // Account settings
        username: freshUserData.username || 'user123',
        email: freshUserData.email || 'user@example.com',
        displayName: freshUserData.display_name || freshUserData.username || 'User',
        bio: freshUserData.bio || '',
        
        // Privacy settings
        
        // Appearance settings
        theme: freshUserData.theme || 'system',
        language: freshUserData.language || 'en',
        timezone: freshUserData.timezone || 'auto',
        
        // Security settings - Use fresh data from database
        twoFactorEnabled: freshUserData.mfa_enabled || false,
        sessionTimeout: freshUserData.sessionTimeout || 30
      }
      
      setSettings(newSettings)
      setOriginalSettings(newSettings) // Store original settings for change detection
      setHasUnsavedChanges(false)
    }
  }, [freshUserData])
  
  // Check for changes whenever settings update
  React.useEffect(() => {
    if (originalSettings) {
      const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings)
      setHasUnsavedChanges(hasChanges)
    }
  }, [settings, originalSettings])
  

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
    { id: 'security', label: 'Security', icon: HiShieldCheck }
  ]

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await fetch(`${API_BASE_URL}/dashboard/settings`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Account settings
          username: settings.username,
          email: settings.email,
          displayName: settings.displayName,
          bio: settings.bio,
          
          // Privacy settings
          
          // Security settings (non-2FA/password)
          sessionTimeout: settings.sessionTimeout
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update original settings to new saved state
        setOriginalSettings({...settings})
        setHasUnsavedChanges(false)
        
        // Refresh user data
        await fetchFreshUserData()
        if (onUserUpdate) {
          onUserUpdate()
        }
        
        toast.success('Settings Saved', 'Your account settings have been saved successfully!')
      } else {
        const error = await response.json()
        toast.error('Save Failed', error.message || 'Failed to save settings. Please try again.')
      }
      
    } catch (error) {
      toast.error('Connection Error', 'Failed to save settings. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handle2FASetup = async () => {
    try {
      setShow2FAModal(true)
      setTwoFAStep(1)
      setIsLoading(true)

      // API call to generate 2FA secret from backend using cookies

      const response = await fetch(`${API_BASE_URL}/auth/2fa/generate`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: { 
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTotpSecret(data.secret)
        setQrCodeUrl(data.qr_code_url)
        setBackupCodes(data.backup_codes)
        
        // If 2FA is already enabled, skip to step 2 with reconfiguration message
        if (settings.twoFactorEnabled || data.message.includes('already enabled')) {
          setTwoFAStep(2)
          showAlert('2FA Already Enabled', 'You can reconfigure your 2FA or generate new backup codes.', 'success')
        }
      } else {
        const errorText = await response.text()
        
        try {
          const error = JSON.parse(errorText)
          showAlert('Setup Error', 'Failed to generate 2FA: ' + (error.message || `HTTP ${response.status}`))
        } catch {
          showAlert('Setup Error', 'Failed to generate 2FA: HTTP ' + response.status + ' - ' + errorText)
        }
        setShow2FAModal(false)
        return
      }
      
    } catch (error) {
      console.error('2FA setup error caught:', error)
      showAlert('Connection Error', 'Error connecting to server. Please check if backend is running.')
      // Don't close modal on error to debug
      // setShow2FAModal(false)
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

      // API call to verify and enable 2FA using cookies
      const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: { 
          'Content-Type': 'application/json',
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
        // Refresh fresh user data and parent user data
        fetchFreshUserData()
        if (onUserUpdate) {
          onUserUpdate()
        }
      } else {
        const error = await response.json()
        showAlert('Verification Failed', error.message || 'Invalid verification code. Please try again.')
        return // Don't enable 2FA if verification failed
      }
      
    } catch (error) {
      showAlert('Connection Error', 'Error connecting to server: ' + error.message)
      return // Don't enable 2FA if request failed
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
    }).catch(err => {
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


  const handleDisable2FA = () => {
    setShowDisable2FAModal(true)
  }

  const handleDisable2FASubmit = async (password) => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/2fa/disable`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies for auth
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        setSettings(prev => ({ ...prev, twoFactorEnabled: false }))
        setShowDisable2FAModal(false)
        showAlert('Success', '2FA disabled successfully!', 'success')
        // Refresh fresh user data and parent user data
        fetchFreshUserData()
        if (onUserUpdate) {
          onUserUpdate()
        }
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to disable 2FA')
      }
      
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }


  const handlePasswordChange = async (passwordData) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      credentials: 'include', // Use httpOnly cookies for auth
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to change password')
    }
    
    return await response.json()
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
                        <button 
                          className="enable-2fa-button disable-variant"
                          onClick={handleDisable2FA}
                        >
                          <HiLockClosed className="button-icon" />
                          Disable 2FA
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="enable-2fa-button"
                        onClick={handle2FASetup}
                        disabled={fetchingFreshData}
                      >
                        <HiFingerPrint className="button-icon" />
                        {fetchingFreshData ? 'Loading...' : 'Enable 2FA'}
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


                <div className="setting-item security-item">
                  <div className="setting-info">
                    <label className="setting-label">Change Password</label>
                    <p className="setting-description">Update your account password</p>
                  </div>
                  <div className="security-actions">
                    <button 
                      className="enable-2fa-button"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <HiKey className="button-icon" />
                      Change Password
                    </button>
                  </div>
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

          {/* Save Button - Only show when there are unsaved changes */}
          {hasUnsavedChanges && (
            <div className="settings-footer">
              <button 
                className="save-button" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <HiCheck className="button-icon" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && <TwoFactorModal />}
      
      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChange={handlePasswordChange}
      />
      
      {/* Delete Account Modal */}
      {showDeleteModal && <DeleteAccountModal />}
      
      {/* Disable 2FA Modal */}
      <Disable2FAModal 
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        onSubmit={handleDisable2FASubmit}
        loading={isLoading}
        colors={{
          surface: '#1a1a1a',
          background: '#0a0a0a',
          text: '#ffffff',
          muted: 'rgba(255, 255, 255, 0.7)',
          border: 'rgba(255, 255, 255, 0.1)',
          accent: '#58A4B0'
        }}
      />
    </>
  )
}

export default SettingsSection