import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimConnection } from '../services/simConnection'
import { landAircraft, resetFlightData } from '../services/mockSimData'
import { calculateFlightScore } from '../services/scoring'
import { addScore } from '../utils/storage'
import PassengerChat from './PassengerChat'
import './FlightPage.css'

interface FlightStats {
  maxAltitude: number
  maxSpeed: number
  smoothnessScore: number
  landingQuality: string | null
  totalDistance: number
}

function FlightPage() {
  const navigate = useNavigate()
  const { connected, simData } = useSimConnection()
  const [flightStats, setFlightStats] = useState<FlightStats>({
    maxAltitude: 0,
    maxSpeed: 0,
    smoothnessScore: 100,
    landingQuality: null,
    totalDistance: 0
  })
  const [isFlightActive, setIsFlightActive] = useState<boolean>(false)
  const [showChat, setShowChat] = useState<boolean>(true)

  useEffect(() => {
    if (!connected) {
      navigate('/')
    }
  }, [connected, navigate])

  useEffect(() => {
    if (simData && isFlightActive) {
      setFlightStats(prev => ({
        ...prev,
        maxAltitude: Math.max(prev.maxAltitude, simData.altitude),
        maxSpeed: Math.max(prev.maxSpeed, simData.airspeed),
        smoothnessScore: Math.max(0, prev.smoothnessScore - Math.max(0, simData.gForce - 1.5) * 0.1)
      }))
    }
  }, [simData, isFlightActive])

  const startFlight = (): void => {
    resetFlightData()
    setIsFlightActive(true)
    setFlightStats({
      maxAltitude: 0,
      maxSpeed: 0,
      smoothnessScore: 100,
      landingQuality: null,
      totalDistance: 0
    })
  }

  const endFlight = (): void => {
    if (!simData) return

    const landingData = landAircraft()
    const landingQuality = (landingData.verticalSpeed > -200 ? 'Perfect' : 
                          landingData.verticalSpeed > -500 ? 'Good' : 'Hard') as 'Perfect' | 'Good' | 'Hard'
    
    const score = calculateFlightScore({
      flightTime: simData.flightTime,
      maxAltitude: flightStats.maxAltitude,
      maxSpeed: flightStats.maxSpeed,
      smoothnessScore: flightStats.smoothnessScore,
      landingQuality,
      fuelEfficiency: simData.fuelQuantity
    })

    const pilotName = prompt('Enter pilot name for the logbook:') || 'Anonymous'
    
    addScore({
      pilotName,
      score,
      aircraft: simData.aircraft,
      flightTime: simData.flightTime,
      maxAltitude: flightStats.maxAltitude,
      maxSpeed: flightStats.maxSpeed,
      landingQuality,
      smoothnessScore: flightStats.smoothnessScore,
      fuelEfficiency: simData.fuelQuantity
    })

    setIsFlightActive(false)
    navigate('/scores')
  }

  if (!connected || !simData) {
    return (
      <div className="flight-page page-content">
        <div className="no-connection">
          <h2>No Flight Simulator Connection</h2>
          <p>Please connect to your flight simulator to start flying.</p>
          <button className="primary-button" onClick={() => navigate('/settings')}>
            Go to Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flight-page page-content">
      <div className="flight-dashboard">
        <div className="flight-instruments">
          <div className="primary-instruments">
          <div className="instrument altitude">
            <h3>Altitude</h3>
            <div className="instrument-value">{Math.round(simData.altitude)}</div>
            <div className="instrument-unit">feet</div>
          </div>
          
          <div className="instrument airspeed">
            <h3>Airspeed</h3>
            <div className="instrument-value">{Math.round(simData.airspeed)}</div>
            <div className="instrument-unit">knots</div>
          </div>
          
          <div className="instrument heading">
            <h3>Heading</h3>
            <div className="instrument-value">{Math.round(simData.heading)}°</div>
            <div className="instrument-unit">{getCompassDirection(simData.heading)}</div>
          </div>
          
          <div className="instrument vsi">
            <h3>Vertical Speed</h3>
            <div className={`instrument-value ${simData.verticalSpeed > 0 ? 'climbing' : simData.verticalSpeed < 0 ? 'descending' : ''}`}>
              {simData.verticalSpeed > 0 ? '+' : ''}{Math.round(simData.verticalSpeed)}
            </div>
            <div className="instrument-unit">fpm</div>
          </div>
        </div>

        <div className="secondary-instruments">
          <div className="info-row">
            <span>Aircraft:</span>
            <span>{simData.aircraft}</span>
          </div>
          <div className="info-row">
            <span>Flight Time:</span>
            <span>{formatTime(simData.flightTime)}</span>
          </div>
          <div className="info-row">
            <span>Fuel:</span>
            <span>{Math.round(simData.fuelQuantity)}%</span>
          </div>
          <div className="info-row">
            <span>G-Force:</span>
            <span className={simData.gForce > 2 ? 'warning' : ''}>{simData.gForce.toFixed(2)}g</span>
          </div>
          <div className="info-row">
            <span>Gear:</span>
            <span className={simData.gear ? 'success' : 'neutral'}>{simData.gear ? 'Down' : 'Up'}</span>
          </div>
          <div className="info-row">
            <span>Ground:</span>
            <span className={simData.onGround ? 'success' : 'neutral'}>{simData.onGround ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="flight-stats">
          <h3>Flight Statistics</h3>
          <div className="stat-row">
            <span>Max Altitude:</span>
            <span>{Math.round(flightStats.maxAltitude)} ft</span>
          </div>
          <div className="stat-row">
            <span>Max Speed:</span>
            <span>{Math.round(flightStats.maxSpeed)} kts</span>
          </div>
          <div className="stat-row">
            <span>Smoothness:</span>
            <span>{Math.round(flightStats.smoothnessScore)}%</span>
          </div>
        </div>
      </div>

        <div className="flight-controls">
          {!isFlightActive ? (
            <button className="primary-button start-flight" onClick={startFlight}>
              Start New Flight
            </button>
          ) : (
            <button className="secondary-button end-flight" onClick={endFlight}>
              End Flight & Save
            </button>
          )}
        </div>
      </div>

      {showChat && (
        <div className="passenger-chat-container">
          <button 
            className="chat-toggle"
            onClick={() => setShowChat(!showChat)}
            title="Toggle pilot chat"
          >
            💬
          </button>
          <PassengerChat />
        </div>
      )}
      
      {!showChat && (
        <button 
          className="chat-toggle floating"
          onClick={() => setShowChat(true)}
          title="Open pilot chat"
        >
          💬
        </button>
      )}
    </div>
  )
}

function getCompassDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(heading / 45) % 8
  return directions[index]
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default FlightPage
