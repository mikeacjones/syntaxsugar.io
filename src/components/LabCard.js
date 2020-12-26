import React from 'react'
import { Link } from 'gatsby'
import './LabCard.css'

export default ({ title, category, url, updated, summary }) => {
  return (
    <Link to={`/lab-content/${url}`} className='LabCard'>
        <div className='LabCard-header'>
          <div className='LabCard-title'>{title}</div>
          <div className='LabCard-updated'>Updated {updated}</div>
        </div>
        <div className='LabCard-body'>{summary}</div>
        <div className='LabCard-footer'></div>
    </Link>
  )
}
