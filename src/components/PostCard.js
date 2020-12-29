import React from 'react'
import { Link } from 'gatsby'
import { createTagSlug } from '../helpers'

import './PostCard.css'

export const PostCard = ({ fields, frontmatter }) => {
  const { title, date, shortDescription, tags } = frontmatter
  const { slug } = fields
  return (
    <div className='post-card'>
      <Link to={`/post${slug}`} className='post-link' />
      <div className='post-card-header'>
        <div className='post-card-header-date'>{date && date.substring(0, 10)}</div>
        <div className='post-card-title'>{title}</div>
      </div>
      <div className='post-card-description'>{shortDescription}</div>
      <div className='post-card-tags'>
        {tags &&
          tags.map((tag, index) => (
            <div className='chip' key={index}>
              <Link to={`/tag/${createTagSlug(tag)}`} className='tag-link'>
                {tag}
              </Link>
            </div>
          ))}
      </div>
    </div>
  )
}