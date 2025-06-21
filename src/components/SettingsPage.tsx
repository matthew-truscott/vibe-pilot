import { useState } from 'react'
import { getSettings, saveSettings, clearScores } from '../utils/storage'
import { useSimConnection } from '../services/simConnection'
import flightGoalService from '../services/flightGoalService'
import { Settings } from '../types'
import './SettingsPage.css'

function SettingsPage() {
  const { connected, connecting, connect, disconnect } = useSimConnection()
  const [settings, setSettings] = useState<Settings>(getSettings())
  const [saveStatus, setSaveStatus] = useState<string>('')

  const handleSettingChange = (path: string, value: any): void => {
    const newSettings = { ...settings }
    const keys = path.split('.')
    let current: any = newSettings
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }
    
    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
  }

  const handleSave = (): void => {
    saveSettings(settings)
    setSaveStatus('Settings saved successfully!')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  const handleConnectionToggle = (): void => {
    if (connected) {
      disconnect()
    } else {
      connect()
    }
  }

  const handleClearData = (): void => {
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
          <h2>Tour Settings</h2>
          
          <div className="setting-group">
            <label>Starting Location</label>
            <select 
              value={settings.startingLocation || 'athens'}
              onChange={(e) => handleSettingChange('startingLocation', e.target.value)}
            >
              <option value="athens">Athens</option>
              <option value="san-francisco">San Francisco</option>
              <option value="new-york">New York</option>
              <option value="grand-canyon">Grand Canyon</option>
              <option value="paris">Paris</option>
              <option value="dubai">Dubai</option>
              <option value="tokyo">Tokyo</option>
              <option value="sydney">Sydney</option>
              <option value="london">London</option>
              <option value="rio">Rio</option>
              <option value="rome">Rome</option>
              <option value="hawaii">Hawaii</option>
              <option value="alps">Alps</option>
              <option value="norway-fjords">Norway Fjords</option>
              <option value="antarctica">Antarctica</option>
            </select>
          </div>
          
          {settings.startingLocation && (
            <div className="destination-preview">
              <p>{flightGoalService.getDestinationDescription(settings.startingLocation)}</p>
            </div>
          )}
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