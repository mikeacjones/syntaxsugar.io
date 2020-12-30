import React from 'react'
import { SocialIcons } from './SocialIcons'
import { AboutMe } from './AboutMe'

import './SideBar.css'

export const SideBar = () => {
  return (
    <div className='SideBarWrapper'>
      <input type='checkbox' id='SideBarToggle-checkbox' name='' value='' />
      <div id='SideBar'>
        <AboutMe />
        <SocialIcons />
      </div>
    </div>
  )
}
