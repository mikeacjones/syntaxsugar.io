import React from 'react'
import { SideBar } from './sidebar/SideBar'
import { ContentWrapper } from './ContentWrapper'
import { SideBarToggle } from './sidebar/SideBarToggle'

import './Layout.css'

export const Layout = ({ children }) => {
  return (
    <div id='Layout'>
      <SideBar />
      <div id='Layout-ContentWrapper'>
        <SideBarToggle />
        <ContentWrapper>{children}</ContentWrapper>
      </div>
    </div>
  )
}
