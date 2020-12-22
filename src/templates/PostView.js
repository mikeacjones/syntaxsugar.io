import React from 'react'
import './PostView.css'
import { MDXRenderer } from 'gatsby-plugin-mdx'
import { graphql } from 'gatsby'
import { Layout } from '../components/Layout'

export default ({ data, pageContext }) => {
  console.log(JSON.stringify(data, null, 2))
  const { frontmatter, body } = data.mdx
  const { previous, next } = pageContext
  return (
    <Layout>
      <div className='post-view'>
        <div className='post-view-header'>
          <div className='post-view-title'>
            <h1>{frontmatter.title}</h1>
          </div>
          <div className='post-view-date'>
            {frontmatter?.date !== null && <>Written on {frontmatter.date.substring(0,10)}</>}
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