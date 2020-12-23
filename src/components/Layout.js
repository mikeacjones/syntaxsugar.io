import React from 'react'
import './Layout.css'
import SideBar from './SideBar'
import ContentWrapper from './ContentWrapper'

export const Layout = ({ children }) => {
  return (
    <div id='Layout'>
      <div id='side-nav-toggle-wrapper'>
        <div id='side-nav-toggle'>
          <label htmlFor='side-nav-toggle-cb' className='toggle'>
            ☰
          </label>
        </div>
      </div>
      <div id='Layout-inner'>
        <div className='sideBar'>
          <input type='checkbox' id='side-nav-toggle-cb' name='' value='' />
          <SideBar />
        </div>
        <ContentWrapper>{children}</ContentWrapper>
      </div>
    </div>
  )
}
