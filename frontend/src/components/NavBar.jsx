import React from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/dashboard.css'

export default function NavBar(){
  const linkStyle = ({ isActive }) => ({
    padding: '8px 12px',
    textDecoration: 'none',
    color: isActive ? 'var(--bn-accent)' : '#333',
    fontWeight: isActive ? 600 : 400
  })

  return (
    <nav style={{display:'flex', gap:12, alignItems:'center'}} aria-label="Main navigation">
      <NavLink to="/" style={linkStyle} end>Dashboard</NavLink>
      <NavLink to="/backtesting" style={linkStyle}>Backtesting</NavLink>
      <NavLink to="/sentiment" style={linkStyle}>Sentiment</NavLink>
      <NavLink to="/rules" style={linkStyle}>Rules Engine</NavLink>
      <NavLink to="/settings" style={linkStyle}>Settings</NavLink>
    </nav>
  )
}
