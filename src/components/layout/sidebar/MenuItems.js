import React from 'react'
import { Link } from 'gatsby'
import { useSiteMetadata } from '../../../hooks/useSiteMetadata'

import './MenuItems.css'

export const MenuItems = () => {
  const { menuItems } = useSiteMetadata()
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const onPost = url.indexOf('/tag/') !== -1 || url.indexOf('/post/') !== -1

  return (
    <div>
      <ul id='MenuItems'>
        <Link to='/' activeClassName='active' className={onPost ? 'active' : ''}>
          <li>Posts</li>
        </Link>
        {menuItems &&
          menuItems.map((menuItem) => {
            return (
              <Link
                to={menuItem.path}
                activeClassName='active'
                key={menuItem.title}
                partiallyActive
              >
                <li>{menuItem.title}</li>
              </Link>
            )
          })}
      </ul>
    </div>
  )
}
