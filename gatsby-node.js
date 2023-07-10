const path = require('path')
const { createFilePath } = require(`gatsby-source-filesystem`)
const { paginate } = require(`gatsby-awesome-pagination`)
const { createTagSlug, powerSet } = require(`./src/helpers`)

exports.onPreInit = async () => {
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
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
          previewMode
          menuItems {
            path
            title
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      throw result.errors
    }
    const {
      postsPerPage,
      menuItems,
      previewMode,
    } = result.data.site.siteMetadata

    const postTemplate = path.resolve(`./src/templates/post.js`)
    const indexTemplate = path.resolve(`./src/templates/index.js`)
    const postsByTagsTemplate = path.resolve(`./src/templates/postsByTags.js`)

    //Create individual pages (side menu)
    const pages = result.data.allMdx.edges.filter(
      ({ node }) =>
        node.internal.type === 'Mdx' &&
        node.fileAbsolutePath.indexOf('/pages/') !== -1 &&
        (node.frontmatter.published || process.env.NODE_ENV === 'development')
    )
    pages.forEach(({ node }) => {
      createPage({
        path: node.fields.slug,
        component: postTemplate,
        context: {
          slug: node.fields.slug,
        },
      })
    })

    //Created paginated post listings
    const posts = result.data.allMdx.edges.filter(
      ({ node }) =>
        node.internal.type === 'Mdx' &&
        node.fileAbsolutePath.indexOf('/posts/') !== -1 &&
        (node.frontmatter.published || process.env.NODE_ENV === 'development')
    )
    paginate({
      createPage,
      items: posts,
      itemsPerPage: postsPerPage,
      pathPrefix: '/',
      component: indexTemplate,
      context: {
        pubStates:
          previewMode ? [true, false] : [true],
      },
    })

    //create paginated post lists by combined tag
    const tags = posts
      .filter(
        ({ node }) => node.frontmatter.tags && node.frontmatter.tags != null
      )
      .flatMap(({ node }) => node.frontmatter.tags)
      .filter((tag, index, self) => self.indexOf(tag) === index)
    const combinedTags = powerSet(tags).filter(set => set.length > 0)
    combinedTags.forEach(tagCombo => {
      const postsWithTag = posts.filter(
        ({ node }) =>
          node.frontmatter.tags &&
          tagCombo.some(tag => node.frontmatter.tags.includes(tag))
      )
      const currentSlug = createTagSlug(tagCombo.sort().join('-'))
      const tagSlugs = tags.reduce((map, tag) => {
        const linkTags = (tagCombo.includes(tag)
          ? [
              ...tagCombo.slice(0, tagCombo.indexOf(tag)),
              ...tagCombo.slice(tagCombo.indexOf(tag) + 1),
            ]
          : [...tagCombo, tag]
        ).sort()
        map[tag] =
          linkTags.length === 0
            ? '/'
            : `/tag/${createTagSlug(linkTags.join('-'))}`
        return map
      }, {})
      paginate({
        createPage,
        items: postsWithTag,
        component: postsByTagsTemplate,
        itemsPerPage: postsPerPage,
        pathPrefix: `/tag/${currentSlug}`,
        context: {
          tags: tagCombo,
          tagSlugs,
          pubStates:
            previewMode ? [true, false] : [true],
        },
      })
    })

    //Create actual posts
    result.data.allMdx.edges
      .filter(
        ({ node }) =>
          node.internal.type === 'Mdx' &&
          node.fileAbsolutePath.indexOf('/posts/') !== -1
      )
      .forEach(({ node }, index) => {
        createPage({
          path: `/post${node.fields.slug}`,
          component: postTemplate,
          context: {
            slug: node.fields.slug,
          },
        })
      })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions
  if (node.internal.type === `Mdx`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
