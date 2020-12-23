import React from 'react'
import './PostView.css'
import { MDXRenderer } from 'gatsby-plugin-mdx'
import { graphql } from 'gatsby'
import { Layout } from '../components/Layout'

export default ({ data, pageContext }) => {
  const { frontmatter, body } = data.mdx
  const { previous, next } = pageContext
  return (
    <Layout>
      <div className='post-view'>
        <div className='post-view-header'>
          <div className='post-view-title'>
            <h1>{frontmatter.title}</h1>
            {frontmatter?.date !== null && (
              <div className='post-view-date'>
                Written on {frontmatter.date.substring(0, 10)}
              </div>
            )}
          </div>
        </div>
        <div className='post-view-content'>
          <MDXRenderer>{body}</MDXRenderer>
        </div>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query PostBySlug($slug: String!) {
    mdx(fields: { slug: { eq: $slug } }) {
      body
      frontmatter {
        title
        date
      }
    }
  }
`
