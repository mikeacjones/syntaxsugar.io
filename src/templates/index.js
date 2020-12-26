import { graphql } from 'gatsby'
import React from 'react'
import { Layout } from '../components/Layout'
import PostCard from '../components/PostCard'
import SEO from '../components/SEO'
import { Link } from 'gatsby'

export default ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title='Blog Posts' />
      {data.allMdx.nodes.map(({ id, fields, frontmatter }) => (
        <PostCard fields={fields} frontmatter={frontmatter} key={id} />
      ))}
      <div className='paging-links'>
        {pageContext.previousPagePath && (
          <Link to={pageContext.previousPagePath}>Newer Posts</Link>
        )}
        {pageContext.nextPagePath && (
          <Link to={pageContext.nextPagePath}>Older Posts</Link>
        )}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query SITE_INDEX_QUERY($pubStates: [Boolean]!, $skip: Int!, $limit: Int!) {
    allMdx(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        fileAbsolutePath: { regex: "//posts//" }
        frontmatter: { published: { in: $pubStates } }
      }
      skip: $skip
      limit: $limit
    ) {
      nodes {
        id
        frontmatter {
          title
          date
          shortDescription
          tags
        }
        fields {
          slug
        }
      }
    }
  }
`
