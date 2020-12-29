import React from 'react'
import { Link } from 'gatsby'
import { createTagSlug } from '../helpers'

import './LabCard.css'

export const LabCard = ({ title, category, url, updated, summary }) => {
  return (
    <div className='LabCard'>
      <a href={`/lab-content/${url}`} className='LabCard-link' />
      <div className='LabCard-header'>
        <div className='LabCard-updated'>Updated {updated.substring(0, 10)}</div>
        <div className='LabCard-title'>{title}</div>
      </div>
      <div className='LabCard-body'>{summary}</div>
      <div className='LabCard-footer'>
        {category &&
          category.map((cat) => (
            <Link key={cat} to={`/labs/${createTagSlug(cat)}`} className='chip tag-link'>
              {cat}
            </Link>
          ))}
      </div>
    </div>
  )
}
