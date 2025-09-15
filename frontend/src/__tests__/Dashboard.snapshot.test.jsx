import React from 'react'
import { render } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'

test('Dashboard snapshot', ()=>{
  const { container } = render(<Dashboard />)
  expect(container).toMatchSnapshot()
})
