const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
  const PostView = path.resolve(`src/components/PostView.js`)
  const IndexView = path.resolve(`src/templates/index.js`)

  return graphql(`
    {
      allMdx(sort: { fields: frontmatter___date, order: DESC }, limit: 1000) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              date
              published
              tags
              shortDescription
              title
            }
            fileAbsolutePath
            internal {
              type
            }
          }
        }
      }
      site {
        siteMetadata {
          postsPerPage
          menuItems {
            path
            title
          }
        }
      }
    }
  `).then((result) => {
    if (result.errors) {
      throw result.errors
    }

    createPage({
      path: '/',
      component: IndexView,
      context: {
        pubStates:
          process.env.NODE_ENV === 'development' ? [true, false] : [true],
      },
    })

    const posts = result.data.allMdx.edges.filter(
      ({ node }) =>
        node.internal.type === 'Mdx' &&
        node.fileAbsolutePath.indexOf('/posts/') !== -1 &&
        (node.frontmatter.published || process.env.NODE_ENV === 'development')
    )

    posts.forEach(({ node }, index) => {
      const previous = index === posts.length - 1 ? null : posts[index + 1]
      const next = index === 0 ? null : posts[index - 1]
      createPage({
        path: node.fields.slug,
        component: PostView,
        context: {
          isDev: process.env.NODE_ENV === 'development',
          slug: node.fields.slug,
          previous: previous?.node.fields.slug,
          next: next?.node.fields.slug,
        },
      })
    })

    const pages = result.data.allMdx.edges.filter(
      ({ node }) =>
        node.internal.type === 'Mdx' &&
        node.fileAbsolutePath.indexOf('/pages/') !== -1 &&
        (node.frontmatter.published || process.env.NODE_ENV === 'development')
    )

    pages.forEach(({ node }) => {
      createPage({
        path: node.fields.slug,
        component: PostView,
        context: {
          slug: node.fields.slug,
        },
      })
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions
  if (node.internal.type === `Mdx` || node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
