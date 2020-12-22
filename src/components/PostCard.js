import React from 'react'
import { Link } from 'gatsby'
import './PostCard.css'

export default ({ fields, frontmatter }) => {
  const { title, date, shortDescription, tags } = frontmatter
  const { slug } = fields
  return (
    <Link to={slug} className='link-to'>
      <div className='post-card'>
        <div className='post-card-header'>
          <div className='post-card-header-date'>{date && date.substring(0,10)}</div>
          <div className='post-card-title'>{title}</div>
        </div>
        <div className='post-card-description'>{shortDescription}</div>
        <div className='post-card-tags'>
          {tags && tags.map((tag) => <div key={tag} className='chip'>{tag}</div>)}
        </div>
      </div>
    </Link>
  )
}
