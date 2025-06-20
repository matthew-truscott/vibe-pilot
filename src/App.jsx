import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './components/HomePage'
import FlightPage from './components/FlightPage'
import ScoresPage from './components/ScoresPage'
import SettingsPage from './components/SettingsPage'
import Navigation from './components/Navigation'
import SimStatus from './components/SimStatus'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <SimStatus />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flight" element={<FlightPage />} />
          <Route path="/scores" element={<ScoresPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  )
}

export default App