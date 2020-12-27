import React from 'react'
import { Link } from 'gatsby'
import './SideBar.css'
import profilePicture from '../../static/profilePicture.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faLinkedin, faStackOverflow } from '@fortawesome/free-brands-svg-icons'
import { useSiteMetadata } from '../hooks/useSiteMetadata'

export default () => {
  const { menuItems } = useSiteMetadata()

  return (
    <div id='sideBar'>
      <div id='aboutMe'>
        <Link to='/' className='link-to'>
          <div id='aboutMe_image'>
            <img src={profilePicture} alt='' />
          </div>
        </Link>
        <h1>Michael Jones</h1>
        <div id='aboutMe_pages'>
          <div>
            <ul id='aboutMe_pages_links'>
              <Link to='/' activeClassName='active'>
                <li>Posts</li>
              </Link>
              {menuItems &&
                menuItems.map((menuItem) => (
                  <Link to={menuItem.path} activeClassName='active' key={menuItem.title}>
                    <li>{menuItem.title}</li>
                  </Link>
                ))}
            </ul>
          </div>
        </div>
      </div>
      <div id='aboutMe_icons'>
        <i>
          <a href='https://github.com/mikeacjones' className='link-to' target='_blank' rel='noreferrer'>
            <FontAwesomeIcon icon={faGithub} alt='github' />
          </a>
        </i>
        <i>
          <a href='https://www.linkedin.com/in/michael-jones-5a870678/' className='link-to' target='_blank' rel='noreferrer'>
            <FontAwesomeIcon icon={faLinkedin} alt='linkedin' />
          </a>
        </i>
        <i>
          <a href='https://stackoverflow.com/users/10890536/michael-jones' className='link-to' target='_blank' rel='noreferrer'>
            <FontAwesomeIcon icon={faStackOverflow} alt='stackoverflow' />
          </a>
        </i>
      </div>
    </div>
  )
}
