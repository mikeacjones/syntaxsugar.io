import React from 'react'
import { graphql, Link } from 'gatsby'
import { Layout } from '../components/layout/Layout'
import { SEO } from '../components/layout/SEO'
import { LabCard } from '../components/cards/LabCard'
import { Chip } from '../components/Chip'
import { createTagSlug } from '../helpers'

import './labs.css'

const LabView = ({ data, pageContext }) => {
  return (
    <Layout>
      <SEO
        title='Guided Labs'
        description='Guided labs which walk you through a specific concept / task'
      />
      <div className='post-view-header'>
        <div className='post-view-title'>
          <h3>categories:</h3>
          <div className='category-tags'>
            <Chip path='/labs/' title='All Labs' active />
            {data.allCategories.edges
              .flatMap(({ node }) => node.childJson.category)
              .filter((cat, index, self) => self.indexOf(cat) === index)
              .map((cat, index) => (
                <Chip
                  path={`/labs/${createTagSlug(cat)}`}
                  title={cat}
                  key={index}
                />
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
            {pageContext.previousPagePath ? (
              <Link to={pageContext.previousPagePath}>Previous</Link>
            ) : (
              <Link className='disabled'>Previous</Link>
            )}
            {pageContext.nextPagePath ? (
              <Link to={pageContext.nextPagePath}>Next</Link>
            ) : (
              <Link className='disabled'>Next</Link>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default LabView

export const query = graphql`
  query labQuery($limit: Int!, $skip: Int!) {
    allFile(
      sort: { fields: [childJson___title], order: DESC }
      filter: { absolutePath: { regex: "/.+codelab.json$/" } }
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
    allCategories: allFile(
      filter: { absolutePath: { regex: "/.+codelab.json$/" } }
    ) {
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
