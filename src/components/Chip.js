import React from 'react'
import { Link } from 'gatsby'

import './Chip.css'

export const Chip = ({ path, title, active }) => {
  return (
    <Link
      to={path}
      className={`Chip Chip-link${active ? ' active' : ''}`}
    >
      {title}
    </Link>
  )
}

Chip.defaultProps = {
  active: false,
}
