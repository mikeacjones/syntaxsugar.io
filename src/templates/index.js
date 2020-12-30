import React from 'react'
import { graphql, Link } from 'gatsby'
import { Layout } from '../components/layout/Layout'
import { SEO } from '../components/layout/SEO'
import { PostCard } from '../components/cards/PostCard'
import { createTagSlug } from '../helpers'
import { Chip } from '../components/Chip'

export default ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title='Blog Posts' />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h3>tags:</h3>
          <div className='category-tags'>
            <Chip path='/' title='all' active />
            {data.allTags.nodes
              .flatMap(({ frontmatter }) => frontmatter.tags)
              .filter((tag, index, self) => self.indexOf(tag) === index)
              .map((tag) => (
                <Chip
                  path={`/tag/${createTagSlug(tag)}`}
                  title={tag}
                  key={tag}
                />
              ))}
          </div>
        </div>
      </div>
      {data.allMdx.nodes.map(({ id, fields, frontmatter }) => (
        <PostCard fields={fields} frontmatter={frontmatter} key={id} />
      ))}
      <div className='paging-links'>
        {(pageContext.nextPagePath || pageContext.previousPagePath) && (
          <>
            {pageContext.nextPagePath ? (
              <Link to={pageContext.nextPagePath}>Older Posts</Link>
            ) : (
              <Link className='disabled'>Older Posts</Link>
            )}
            {pageContext.previousPagePath ? (
              <Link to={pageContext.previousPagePath}>Newer Posts</Link>
            ) : (
              <Link className='disabled'>Newer Posts</Link>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query indexQuery($pubStates: [Boolean]!, $skip: Int!, $limit: Int!) {
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
    allTags: allMdx(
      filter: {
        fileAbsolutePath: { regex: "//posts//" }
        frontmatter: { published: { in: $pubStates } }
      }
    ) {
      nodes {
        frontmatter {
          tags
        }
      }
    }
  }
`
