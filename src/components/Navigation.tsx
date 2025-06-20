import { NavLink } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
  return (
    <nav className="navigation">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏠</span>
        <span className="nav-text">Home</span>
      </NavLink>
      <NavLink to="/flight" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">✈️</span>
        <span className="nav-text">Flight</span>
      </NavLink>
      <NavLink to="/scores" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏆</span>
        <span className="nav-text">Scores</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">⚙️</span>
        <span className="nav-text">Settings</span>
      </NavLink>
    </nav>
  )
}

export default Navigation
