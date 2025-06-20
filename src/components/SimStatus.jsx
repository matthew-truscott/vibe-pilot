import { useState, useEffect } from 'react'
import { useSimConnection } from '../services/simConnection'
import './SimStatus.css'

function SimStatus() {
  const { connected, connecting, simData } = useSimConnection()

  return (
    <div className="sim-status">
      <div className="status-indicator">
        <span className={`status-dot ${connected ? 'connected' : connecting ? 'connecting' : 'disconnected'}`}></span>
        <span className="status-text">
          {connected ? 'Sim Connected' : connecting ? 'Connecting...' : 'Sim Disconnected'}
        </span>
      </div>
      {connected && simData && (
        <div className="sim-info">
          <span>Alt: {Math.round(simData.altitude)}ft</span>
          <span>IAS: {Math.round(simData.airspeed)}kts</span>
          <span>HDG: {Math.round(simData.heading)}°</span>
        </div>
      )}
    </div>
  )
}

export default SimStatus