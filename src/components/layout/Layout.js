import React from 'react'
import { SideBar } from './sidebar/SideBar'
import { ContentWrapper } from './ContentWrapper'
import { SideBarToggle } from './sidebar/SideBarToggle'
// The following import prevents a Font Awesome icon server-side rendering bug,
// where the icons flash from a very large icon down to a properly sized one:
import '@fortawesome/fontawesome-svg-core/styles.css';
// Prevent fontawesome from adding its CSS since we did it manually above:
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false; /* eslint-disable import/first */

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
