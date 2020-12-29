import { graphql } from 'gatsby'
import React from 'react'
import { Layout } from '../components/Layout'
import { SEO } from '../components/SEO'
import { Link } from 'gatsby'
import { LabCard } from '../components/LabCard'

import './labs.css'

const CategoryLabView = ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO title={`Guided Labs`} description='Guided labs which walk you through a specific concept / task' />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h3>categories:</h3>
          <div className='category-tags'>
            <Link to='/labs' className='tag-link chip' activeClassName='active'>
              All Labs
            </Link>
            {data.allCategories.edges
              .flatMap(({ node }) => node.childJson.category)
              .filter((cat, index, self) => self.indexOf(cat) === index)
              .map((cat, index) => (
                <Link key={index} to={pageContext.catSlugs[cat]} className={`tag-link chip${pageContext.categories.includes(cat) ? ' active' : ''}`}>
                  {cat}
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className='LabCards'>
        {data.allFile.edges.map(({ node }, index) => (
          <LabCard {...node.childJson} key={index} />
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

export default CategoryLabView

export const query = graphql`
  query labsByCategoryQuery($limit: Int!, $skip: Int!, $categories: [String]!) {
    allFile(
      sort: { fields: [childJson___title], order: DESC }
      filter: { absolutePath: { regex: "/.+codelab.json$/" }, childJson: { category: { in: $categories } } }
      limit: $limit
      skip: $skip
    ) {
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
