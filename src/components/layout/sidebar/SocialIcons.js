import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGithub,
  faLinkedin,
  faStackOverflow,
} from '@fortawesome/free-brands-svg-icons'

import './SocialIcons.css'

export const SocialIcons = () => {
  return (
    <div id='SocialIcons'>
      <i>
        <a
          href='https://github.com/mikeacjones'
          className='link-to'
          target='_blank'
          rel='noreferrer'
        >
          <FontAwesomeIcon icon={faGithub} alt='github' />
        </a>
      </i>
      <i>
        <a
          href='https://www.linkedin.com/in/michael-jones-5a870678/'
          className='link-to'
          target='_blank'
          rel='noreferrer'
        >
          <FontAwesomeIcon icon={faLinkedin} alt='linkedin' />
        </a>
      </i>
      <i>
        <a
          href='https://stackoverflow.com/users/10890536/michael-jones'
          className='link-to'
          target='_blank'
          rel='noreferrer'
        >
          <FontAwesomeIcon icon={faStackOverflow} alt='stackoverflow' />
        </a>
      </i>
    </div>
  )
}
