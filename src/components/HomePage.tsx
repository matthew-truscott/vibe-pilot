import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScores } from '../utils/storage'
import { Score } from '../types'
import './HomePage.css'

function HomePage() {
  const navigate = useNavigate()
  const [topScores, setTopScores] = useState<Score[]>([])
  const [simConnected] = useState<boolean>(false)

  useEffect(() => {
    const scores = getScores()
    setTopScores(scores.slice(0, 3))
  }, [])

  const handlePlay = (): void => {
    navigate('/flight')
  }

  return (
    <div className="home-page page-content">
      <div className="hero-section">
        <h1 className="game-title floating">VIBE PILOT</h1>
        <p className="game-subtitle">Scenic Flight Tours</p>

        <div className="hero-buttons">
          <button 
            className="play-button primary-button"
            onClick={handlePlay}
          >
            START TOUR
          </button>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <h3>Tours Taken</h3>
            <p>{getScores().length}</p>
          </div>
          <div className="stat-card">
            <h3>Hours in Air</h3>
            <p>{Math.floor(getScores().reduce((acc, s) => acc + (s.flightTime || 0), 0) / 3600)}</p>
          </div>
          <div className="stat-card">
            <h3>Flight Time</h3>
            <p>{Math.floor(getScores().reduce((acc, s) => acc + (s.flightTime || 0), 0) / 60)}h</p>
          </div>
        </div>
      </div>

      {/* <div className="top-scores-section">
        <h2>Top Pilots</h2>
        {topScores.length > 0 ? (
          <div className="scores-list">
            {topScores.map((score, index) => (
              <div key={index} className="score-item">
                <span className="rank">#{index + 1}</span>
                <span className="pilot-name">{score.pilotName}</span>
                <span className="score">{score.score} pts</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-scores">No flights recorded yet. Be the first pilot!</p>
        )}
        <button 
          className="secondary-button view-all-button"
          onClick={() => navigate('/scores')}
        >
          View All Scores
        </button>
      </div> */}

      <div className="quick-actions">
        <button 
          className="action-card"
          onClick={() => navigate('/flight')}
        >
          <span className="action-icon">✈️</span>
          <span className="action-text">Quick Tour</span>
        </button>
        {/* <button 
          className="action-card"
          onClick={() => navigate('/scores')}
        >
          <span className="action-icon">🏆</span>
          <span className="action-text">Leaderboard</span>
        </button> */}
        <button 
          className="action-card"
          onClick={() => navigate('/settings')}
        >
          <span className="action-icon">⚙️</span>
          <span className="action-text">Settings</span>
        </button>
      </div>
    </div>
  )
}

export default HomePage
