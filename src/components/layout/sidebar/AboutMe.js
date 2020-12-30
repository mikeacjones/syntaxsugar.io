import React from 'react'
import { Link } from 'gatsby'
import { MenuItems } from './MenuItems'

import profilePicture from '../../../../static/images/profilePicture.png'
import './AboutMe.css'

export const AboutMe = () => {
  return (
    <div id='AboutMe'>
      <Link to='/' className='link-to'>
        <div id='AboutMe-ProfilePicture'>
          <img src={profilePicture} alt='' />
        </div>
      </Link>
      <h1>Michael Jones</h1>
      <div id='AboutMe-MenuItems'>
        <MenuItems />
      </div>
    </div>
  )
}
