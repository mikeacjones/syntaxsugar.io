import { graphql } from 'gatsby'
import React from 'react'
import { Layout } from '../components/Layout'
import PostCard from '../components/PostCard'
import SEO from '../components/SEO'

export default ({ data }) => {
  return (
    <>
      <Layout>
      <SEO title='Blog Posts' />
        {data.allMdx.nodes.map(({ id, fields, frontmatter }) => (
          <PostCard fields={fields} frontmatter={frontmatter} key={id} />
        ))}
      </Layout>
    </>
  )
}

export const query = graphql`
  query SITE_INDEX_QUERY {
    allMdx(
      sort: { fields: [frontmatter___date], order: DESC }
      filter: {
        fileAbsolutePath: { regex: "//posts//" }
      }
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
