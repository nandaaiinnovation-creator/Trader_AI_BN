import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from '../NavBar'

test('NavBar renders links and highlights active route', ()=>{
  render(
    <MemoryRouter initialEntries={['/backtesting']}>
      <NavBar />
    </MemoryRouter>
  )

  const back = screen.getByText(/Backtesting/i)
  expect(back).toBeInTheDocument()
  // NavLink sets aria-current when active
  expect(back.getAttribute('aria-current')).toBe('page')

  // other links present
  expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  expect(screen.getByText(/Settings/i)).toBeInTheDocument()
})
