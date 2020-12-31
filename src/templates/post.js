import React from 'react'
import { MDXRenderer } from 'gatsby-plugin-mdx'
import { graphql } from 'gatsby'
import { Layout } from '../components/layout/Layout'
import { SEO } from '../components/layout/SEO'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

import './post.css'

export default ({ data, pageContext }) => {
  const { frontmatter, body } = data.mdx
  return (
    <Layout>
      <SEO
        title={frontmatter.title}
        description={frontmatter.shortDescription}
        keywords={frontmatter.tags}
      />
      <div className='post-view'>
        <div className='post-view-header'>
          <div className='post-view-title'>
            <h1>{frontmatter.title}</h1>
            {frontmatter?.date !== null && (
              <div className='post-view-date'>
                Written on {frontmatter.date.substring(0, 10)}
              </div>
            )}
            <a
              href={`https://github.com/mikeacjones/syntaxsugar.io/issues/new?labels=post%20question&assignees=mikeacjones&title=${
                frontmatter.title
                  ? frontmatter.title
                  : 'Question / Issue <-- Update the title'
              }&body=I%20have%20a%20question/issue%20about:`}
              referrer='noreferrer'
              target='_blank'
            >
              <h3>
                <FontAwesomeIcon icon={faGithub} alt='github' /> Ask Question /
                Submit Issue
              </h3>
            </a>
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
  query POST_BY_SLUG($slug: String!) {
    mdx(fields: { slug: { eq: $slug } }) {
      body
      frontmatter {
        title
        date
        tags
        shortDescription
      }
    }
  }
`
