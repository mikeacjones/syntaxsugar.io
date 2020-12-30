import React from 'react'

import './SideBarToggle.css'

export const SideBarToggle = () => {
  return (
    <div id='SideBarToggleWrapper'>
      <div id='SideBarToggle'>
        <label htmlFor='SideBarToggle-checkbox' className='toggle'>
          ☰
        </label>
      </div>
    </div>
  )
}
