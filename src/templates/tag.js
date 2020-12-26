import { graphql } from 'gatsby'
import React from 'react'
import { Layout } from '../components/Layout'
import PostCard from '../components/PostCard'
import SEO from '../components/SEO'
import { Link } from 'gatsby'

export default ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title={`${pageContext.tag} Posts`} />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h1>tag: {pageContext.tag}</h1>
        </div>
      </div>
      {data.allMdx.nodes.map(({ id, fields, frontmatter }) => (
        <PostCard fields={fields} frontmatter={frontmatter} key={id} />
      ))}
      <div className='paging-links'>
        {pageContext.previousPagePath && <Link to={pageContext.previousPagePath}>Newer Posts</Link>}
        {pageContext.nextPagePath && <Link to={pageContext.nextPagePath}>Older Posts</Link>}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query tagQuery($pubStates: [Boolean]!, $skip: Int!, $limit: Int!, $tag: String!) {
    allMdx(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { fileAbsolutePath: { regex: "//posts//" }, frontmatter: { published: { in: $pubStates }, tags: { in: [$tag] } } }
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
