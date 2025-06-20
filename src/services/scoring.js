export const calculateFlightScore = ({
  flightTime,
  maxAltitude,
  maxSpeed,
  smoothnessScore,
  landingQuality,
  fuelEfficiency
}) => {
  let score = 0
  
  score += Math.min(flightTime * 0.5, 1000)
  
  score += Math.min(maxAltitude / 100, 300)
  
  score += Math.min(maxSpeed / 10, 200)
  
  score += smoothnessScore * 5
  
  const landingBonus = {
    'Perfect': 1000,
    'Good': 500,
    'Hard': 100,
    'Crash': -500
  }
  score += landingBonus[landingQuality] || 0
  
  score += fuelEfficiency * 2
  
  score = Math.max(0, Math.round(score))
  
  return score
}

export const getScoreGrade = (score) => {
  if (score >= 3000) return { grade: 'S', color: '#FFD700' }
  if (score >= 2500) return { grade: 'A+', color: '#4CAF50' }
  if (score >= 2000) return { grade: 'A', color: '#45B14E' }
  if (score >= 1500) return { grade: 'B', color: '#2196F3' }
  if (score >= 1000) return { grade: 'C', color: '#FF9800' }
  return { grade: 'D', color: '#F44336' }
}

export const getAchievements = (flightData) => {
  const achievements = []
  
  if (flightData.maxAltitude >= 40000) {
    achievements.push({ name: 'High Flyer', icon: '🚀', description: 'Reached 40,000 feet' })
  }
  
  if (flightData.maxSpeed >= 300) {
    achievements.push({ name: 'Speed Demon', icon: '⚡', description: 'Exceeded 300 knots' })
  }
  
  if (flightData.landingQuality === 'Perfect') {
    achievements.push({ name: 'Butter Landing', icon: '🧈', description: 'Perfect landing' })
  }
  
  if (flightData.flightTime >= 3600) {
    achievements.push({ name: 'Endurance', icon: '⏱️', description: 'Flew for over an hour' })
  }
  
  if (flightData.smoothnessScore >= 90) {
    achievements.push({ name: 'Smooth Operator', icon: '🎯', description: 'Maintained smooth flight' })
  }
  
  return achievements
}