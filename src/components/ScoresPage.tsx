import { useState, useEffect } from 'react'
import { getScores, clearScores } from '../utils/storage'
import { getScoreGrade, getAchievements } from '../services/scoring'
import { Score } from '../types'
import './ScoresPage.css'

function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [sortBy, setSortBy] = useState<string>('score')
  const [filterAircraft, setFilterAircraft] = useState<string>('all')

  useEffect(() => {
    loadScores()
  }, [sortBy, filterAircraft])

  const loadScores = (): void => {
    let allScores = getScores()
    
    if (filterAircraft !== 'all') {
      allScores = allScores.filter(score => score.aircraft === filterAircraft)
    }
    
    switch (sortBy) {
      case 'score':
        allScores.sort((a, b) => b.score - a.score)
        break
      case 'date':
        allScores.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
        break
      case 'flightTime':
        allScores.sort((a, b) => b.flightTime - a.flightTime)
        break
      default:
        break
    }
    
    setScores(allScores)
  }

  const handleClearScores = (): void => {
    if (window.confirm('Are you sure you want to clear all flight records? This cannot be undone.')) {
      clearScores()
      setScores([])
    }
  }

  const getUniqueAircraft = (): string[] => {
    const aircraft = new Set(getScores().map(s => s.aircraft))
    return Array.from(aircraft)
  }

  return (
    <div className="scores-page page-content">
      <div className="scores-header">
        <h1>Flight Logbook</h1>
        <p>Your complete flight history and achievements</p>
      </div>

      <div className="scores-controls">
        <div className="filter-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="score">Sort by Score</option>
            <option value="date">Sort by Date</option>
            <option value="flightTime">Sort by Flight Time</option>
          </select>
          
          <select 
            value={filterAircraft} 
            onChange={(e) => setFilterAircraft(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Aircraft</option>
            {getUniqueAircraft().map(aircraft => (
              <option key={aircraft} value={aircraft}>{aircraft}</option>
            ))}
          </select>
        </div>
        
        {scores.length > 0 && (
          <button 
            className="clear-button secondary-button"
            onClick={handleClearScores}
          >
            Clear All Records
          </button>
        )}
      </div>

      {scores.length === 0 ? (
        <div className="no-scores">
          <p>No flight records yet. Complete your first flight to see it here!</p>
        </div>
      ) : (
        <div className="scores-list">
          {scores.map((score, index) => {
            const grade = getScoreGrade(score.score)
            const achievements = getAchievements(score as any)
            const date = new Date(score.timestamp || '')
            
            return (
              <div key={score.id} className="score-card">
                <div className="score-rank">
                  {sortBy === 'score' ? `#${index + 1}` : ''}
                </div>
                
                <div className="score-main">
                  <div className="score-header">
                    <h3>{score.pilotName}</h3>
                    <div className="score-grade" style={{ backgroundColor: grade.color }}>
                      {grade.grade}
                    </div>
                  </div>
                  
                  <div className="score-details">
                    <div className="detail-item">
                      <span className="detail-label">Score:</span>
                      <span className="detail-value">{score.score} pts</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Aircraft:</span>
                      <span className="detail-value">{score.aircraft}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Flight Time:</span>
                      <span className="detail-value">{formatTime(score.flightTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Max Altitude:</span>
                      <span className="detail-value">{Math.round(score.maxAltitude)} ft</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Max Speed:</span>
                      <span className="detail-value">{Math.round(score.maxSpeed)} kts</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Landing:</span>
                      <span className={`detail-value landing-${score.landingQuality?.toLowerCase()}`}>
                        {score.landingQuality}
                      </span>
                    </div>
                  </div>
                  
                  {achievements.length > 0 && (
                    <div className="achievements">
                      {achievements.map((achievement, i) => (
                        <div key={i} className="achievement" title={achievement.description}>
                          <span className="achievement-icon">{achievement.icon}</span>
                          <span className="achievement-name">{achievement.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="score-date">
                    {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m ${seconds % 60}s`
}

export default ScoresPage