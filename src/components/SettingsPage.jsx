import { useState, useEffect } from 'react'
import { getSettings, saveSettings, clearScores } from '../utils/storage'
import { useSimConnection } from '../services/simConnection'
import './SettingsPage.css'

function SettingsPage() {
  const { connected, connecting, connect, disconnect } = useSimConnection()
  const [settings, setSettings] = useState(getSettings())
  const [saveStatus, setSaveStatus] = useState('')

  const handleSettingChange = (path, value) => {
    const newSettings = { ...settings }
    const keys = path.split('.')
    let current = newSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  const handleSave = () => {
    saveSettings(settings)
    setSaveStatus('Settings saved successfully!')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  const handleConnectionToggle = () => {
    if (connected) {
      disconnect()
    } else {
      connect()
    }
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all flight data? This cannot be undone.')) {
      clearScores()
      setSaveStatus('All flight data cleared!')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }

  return (
    <div className="settings-page page-content">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Configure your flight simulator connection and preferences</p>
      </div>

      {saveStatus && (
        <div className="save-status">
          {saveStatus}
        </div>
      )}

      <div className="settings-sections">
        <div className="settings-section">
          <h2>Simulator Connection</h2>
          
          <div className="connection-status">
            <div className="status-info">
              <span>Connection Status:</span>
              <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
            <button 
              className={connected ? 'secondary-button' : 'primary-button'}
              onClick={handleConnectionToggle}
              disabled={connecting}
            >
              {connected ? 'Disconnect' : connecting ? 'Connecting...' : 'Connect to Simulator'}
            </button>
          </div>

          <div className="setting-group">
            <label>Connection Type</label>
            <select 
              value={settings.simConnection.type}
              onChange={(e) => handleSettingChange('simConnection.type', e.target.value)}
            >
              <option value="simconnect">SimConnect</option>
              <option value="fsuipc">FSUIPC</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Host</label>
            <input 
              type="text"
              value={settings.simConnection.host}
              onChange={(e) => handleSettingChange('simConnection.host', e.target.value)}
              placeholder="localhost"
            />
          </div>

          <div className="setting-group">
            <label>Port</label>
            <input 
              type="number"
              value={settings.simConnection.port}
              onChange={(e) => handleSettingChange('simConnection.port', parseInt(e.target.value))}
              placeholder="8080"
            />
          </div>

          <div className="setting-group checkbox">
            <label>
              <input 
                type="checkbox"
                checked={settings.simConnection.autoConnect}
                onChange={(e) => handleSettingChange('simConnection.autoConnect', e.target.checked)}
              />
              Auto-connect on startup
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Graphics Settings</h2>
          
          <div className="setting-group">
            <label>Graphics Quality</label>
            <select 
              value={settings.graphics}
              onChange={(e) => handleSettingChange('graphics', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="ultra">Ultra</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Sound Volume</label>
            <div className="volume-control">
              <input 
                type="range"
                min="0"
                max="100"
                value={settings.soundVolume}
                onChange={(e) => handleSettingChange('soundVolume', parseInt(e.target.value))}
              />
              <span>{settings.soundVolume}%</span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Control Bindings</h2>
          
          <div className="controls-grid">
            <div className="setting-group">
              <label>Throttle</label>
              <input 
                type="text"
                value={settings.controls.throttle}
                onChange={(e) => handleSettingChange('controls.throttle', e.target.value)}
                placeholder="W/S"
              />
            </div>

            <div className="setting-group">
              <label>Rudder</label>
              <input 
                type="text"
                value={settings.controls.rudder}
                onChange={(e) => handleSettingChange('controls.rudder', e.target.value)}
                placeholder="A/D"
              />
            </div>

            <div className="setting-group">
              <label>Elevator</label>
              <input 
                type="text"
                value={settings.controls.elevator}
                onChange={(e) => handleSettingChange('controls.elevator', e.target.value)}
                placeholder="Up/Down"
              />
            </div>

            <div className="setting-group">
              <label>Aileron</label>
              <input 
                type="text"
                value={settings.controls.aileron}
                onChange={(e) => handleSettingChange('controls.aileron', e.target.value)}
                placeholder="Left/Right"
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Data Management</h2>
          
          <div className="data-actions">
            <button 
              className="secondary-button danger"
              onClick={handleClearData}
            >
              Clear All Flight Data
            </button>
            <p className="warning-text">
              This will permanently delete all flight records and scores.
            </p>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="primary-button" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default SettingsPage