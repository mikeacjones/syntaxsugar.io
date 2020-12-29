import React from 'react'
import { graphql } from 'gatsby'
import { Layout } from '../components/Layout'
import { PostCard } from '../components/PostCard'
import { SEO } from '../components/SEO'
import { Link } from 'gatsby'

export default ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title={`Posts`} />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h3>tags:</h3>
          <div className='category-tags'>
            <Link to='/' className='tag-link chip' activeClassName='active'>
              all
            </Link>
            {data.allTags.nodes
              .flatMap(({ frontmatter }) => frontmatter.tags)
              .filter((tag, index, self) => self.indexOf(tag) === index)
              .map((tag) => (
                <Link key={tag} to={pageContext.tagSlugs[tag]} className={`tag-link chip${pageContext.tags.includes(tag) ? ' active' : ''}`}>
                  {tag}
                </Link>
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
            {pageContext.nextPagePath ? <Link to={pageContext.nextPagePath}>Older Posts</Link> : <Link className='disabled'>Older Posts</Link>}
            {pageContext.previousPagePath ? <Link to={pageContext.previousPagePath}>Newer Posts</Link> : <Link className='disabled'>Newer Posts</Link>}
          </>
        )}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query postsByTag($pubStates: [Boolean]!, $skip: Int!, $limit: Int!, $tags: [String]!) {
    allMdx(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { fileAbsolutePath: { regex: "//posts//" }, frontmatter: { published: { in: $pubStates }, tags: { in: $tags } } }
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
    allTags: allMdx(filter: { fileAbsolutePath: { regex: "//posts//" }, frontmatter: { published: { in: $pubStates } } }) {
      nodes {
        frontmatter {
          tags
        }
      }
    }
  }
`
