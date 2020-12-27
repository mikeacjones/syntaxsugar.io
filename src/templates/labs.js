import { graphql } from 'gatsby'
import React from 'react'
import { Layout } from '../components/Layout'
import SEO from '../components/SEO'
import { Link } from 'gatsby'
import LabCard from '../components/LabCard'
import { createTagSlug } from '../helpers'
import '../components/Labs.css'

const LabView = ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title='Guided Labs' description='Guided labs which walk you through a specific concept / task' />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h1>Guided Labs</h1>
          <h3>Categories:</h3>
          <div className='category-tags'>
            <Link to='/labs' className='chip tag-link' activeClassName='active' partiallyActive={true}>
              All Labs
            </Link>
            {data.allCategories.edges
              .flatMap(({ node }) => node.childJson.category)
              .filter((cat, index, self) => self.indexOf(cat) === index)
              .map((cat) => (
                <Link to={`/labs/${createTagSlug(cat)}`} className='tag-link chip' activeClassName='active' partiallyActive={true}>
                  {cat}
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className='LabCards'>
        {data.allFile.edges.map(({ node }) => (
          <LabCard {...node.childJson} key={node.url} />
        ))}
        <div className='LabCard' style={{ visibility: 'hidden' }} />
        <div className='LabCard' style={{ visibility: 'hidden' }} />
      </div>
      <div className='paging-links'>
        {(pageContext.nextPagePath || pageContext.previousPagePath) && (
          <>
            {pageContext.previousPagePath ? <Link to={pageContext.previousPagePath}>Previous</Link> : <Link className='disabled'>Previous</Link>}
            {pageContext.nextPagePath ? <Link to={pageContext.nextPagePath}>Next</Link> : <Link className='disabled'>Next</Link>}
          </>
        )}
      </div>
    </Layout>
  )
}

export default LabView

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
    allCategories: allFile(filter: { absolutePath: { regex: "/.+codelab.json$/" } }) {
      edges {
        node {
          childJson {
            category
          }
        }
      }
    }
  }
`
