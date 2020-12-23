import React from 'react'
import './Layout.css'
import SideBar from './SideBar'
import ContentWrapper from './ContentWrapper'

export const Layout = ({ children }) => {
  return (
    <div className='root'>
      <div id='side-nav-toggle'>
        <label for='side-nav-toggle-cb' class='toggle'>
          ☰
        </label>
      </div>
      <input type='checkbox' id='side-nav-toggle-cb' name='' value='' />
      <SideBar />
      <ContentWrapper>{children}</ContentWrapper>
    </div>
  )
}
