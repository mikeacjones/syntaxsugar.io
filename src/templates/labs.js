import { graphql } from 'gatsby'
import React from 'react'
import { Layout } from '../components/Layout'
import SEO from '../components/SEO'
import { Link } from 'gatsby'
import LabCard from '../components/LabCard'
import '../components/Labs.css'

export default ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title='Blog Posts' />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h1>Guided Labs</h1>
        </div>
      </div>
      <div className='LabCards'>
        {data.allFile.edges.map(({ node }) => (
          <LabCard {...node.childJson} key={node.url} />
        ))}
        <div className='LabCard' style={{visibility: 'hidden'}} />
      </div>
      <div className='paging-links'>
        {pageContext.previousPagePath && <Link to={pageContext.previousPagePath}>Previous</Link>}
        {pageContext.nextPagePath && <Link to={pageContext.nextPagePath}>Next</Link>}
      </div>
    </Layout>
  )
}

export const query = graphql`
  query labQuery($limit: Int!, $skip: Int!) {
    allFile(sort: { fields: [childJson___title], order: DESC }, filter: { absolutePath: { regex: "/.+codelab.json$/" } }, limit: $limit, skip: $skip) {
      edges {
        node {
          absolutePath
          childJson {
            title
            category
            url
            updated
            summary
          }
        }
      }
    }
  }
`
