const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)

exports.createPages = ({ actions, graphql, getNodes }) => {
  const { createPage } = actions
  const PostView = path.resolve(`src/templates/PostView.js`)
  const allNodes = getNodes()

  return graphql(`
    {
      allMdx {
        nodes {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
      site {
        siteMetadata {
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

    const posts = allNodes.filter(
      ({ internal, fileAbsolutePath }) =>
        internal.type === 'Mdx' && fileAbsolutePath.indexOf('/posts/') !== -1
    )

    posts.forEach((post, index) => {
      const previous = index === posts.length - 1 ? null : posts[index + 1]
      const next = index === 0 ? null : posts[index - 1]
      createPage({
        path: post.fields.slug,
        component: PostView,
        context: {
          slug: post.fields.slug,
          previous,
          next,
        },
      })
    })

    const pages = allNodes.filter(
      ({ internal, fileAbsolutePath }) =>
        (internal.type === 'Mdx' || internal.type === 'MarkdownRemark') && fileAbsolutePath.indexOf('/pages/') !== -1
    )
    pages.forEach((page) => {
      createPage({
        path: page.fields.slug,
        component: PostView,
        context: {
          slug: page.fields.slug,
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
