import React from 'react'
import { createTagSlug } from '../../helpers'
import { Chip } from '../Chip'

import './LabCard.css'

export const LabCard = ({ title, category, url, updated, summary }) => {
  return (
    <div className='LabCard'>
      <a href={`/lab-content/${url}`} className='LabCard-link' />
      <div className='LabCard-header'>
        <div className='LabCard-updated'>
          Updated {updated.substring(0, 10)}
        </div>
        <div className='LabCard-title'>{title}</div>
      </div>
      <div className='LabCard-body'>{summary}</div>
      <div className='LabCard-footer'>
        {category &&
          category.map((cat) => (
            <Chip path={`/labs/${createTagSlug(cat)}`} title={cat} key={cat} active={false} />
          ))}
      </div>
    </div>
  )
}
