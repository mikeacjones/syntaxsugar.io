import React from 'react'
import { Link } from 'gatsby'
import { createTagSlug } from '../../helpers'
import { Chip } from '../Chip'

import './PostCard.css'

export const PostCard = ({ fields, frontmatter }) => {
  const { title, date, shortDescription, tags } = frontmatter
  const { slug } = fields
  return (
    <div className='PostCard'>
      <Link to={`/post${slug}`} className='PostCard-link' />
      <div className='PostCardard-header'>
        <div className='PostCard-date'>
          {date && date.substring(0, 10)}
        </div>
        <div className='PostCard-title'>{title}</div>
      </div>
      <div className='PostCard-description'>{shortDescription}</div>
      <div className='PostCard-tags'>
        {tags &&
          tags.map((tag, index) => (
            <Chip path={`/tag/${createTagSlug(tag)}`} title={tag} key={tag} active={false} />
          ))}
      </div>
    </div>
  )
}
