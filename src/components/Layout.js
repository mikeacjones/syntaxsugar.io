import React from 'react'
import './Layout.css'
import SideBar from './SideBar'
import ContentWrapper from './ContentWrapper'

export const Layout = ({ children }) => {
  return (
    <div className='root'>
      <SideBar />
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </div>
  )
}
