const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)
const { paginate } = require(`gatsby-awesome-pagination`)
const { createTagSlug } = require('./src/helpers')
const { generateCodeLabs } = require('./codelabs-script')

exports.onPreInit = async () => {
  await generateCodeLabs()
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
  const PostView = path.resolve(`src/components/PostView.js`)
  const IndexView = path.resolve(`./src/templates/index.js`)
  const TagView = path.resolve(`./src/templates/tag.js`)
  const LabsView = path.resolve(`./src/templates/labs.js`)
  const CategoryLabView = path.resolve(`./src/templates/labsCategory.js`)

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
          labsPerPage
          menuItems {
            path
            title
          }
        }
      }
      allFile(filter: { absolutePath: { regex: "/.+codelab.json$/" } }) {
        edges {
          node {
            absolutePath
            childJson {
              category
            }
          }
        }
      }
    }
  `).then((result) => {
    if (result.errors) {
      throw result.errors
    }

    //Create paginated lab pages
    const labs = result.data.allFile.edges.map(({ node }) => {
      return { path: node.absolutePath, category: node.childJson.category }
    })
    paginate({
      createPage,
      items: labs,
      itemsPerPage: result.data.site.siteMetadata.labsPerPage,
      pathPrefix: '/labs',
      component: LabsView,
    })

    //Create paginated lab pages, by category
    const labCategories = labs.flatMap(({ category }) => category).filter((item, index, self) => self.indexOf(item) === index)
    labCategories.forEach((labCategory) => {
      const labsWithCategory = labs.filter((lab) => lab.category.indexOf(labCategory) !== -1)
      paginate({
        createPage,
        items: labsWithCategory,
        component: CategoryLabView,
        itemsPerPage: result.data.site.siteMetadata.labsPerPage,
        pathPrefix: `/labs/${createTagSlug(labCategory)}`,
        context: {
          labCategory,
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
      itemsPerPage: result.data.site.siteMetadata.postsPerPage,
      pathPrefix: '/',
      component: IndexView,
      context: {
        pubStates: process.env.NODE_ENV === 'development' ? [true, false] : [true],
      },
    })

    //Create paginated post lists, by tag
    const tags = posts
      .filter(({ node }) => node.frontmatter.tags && node.frontmatter.tags != null)
      .flatMap(({ node }) => node.frontmatter.tags)
      .filter((tag, index, self) => self.indexOf(tag) === index)
    tags.forEach((tag) => {
      const postsWithTag = posts.filter(({ node }) => node.frontmatter.tags && node.frontmatter.tags.indexOf(tag) !== -1)
      paginate({
        createPage,
        items: postsWithTag,
        component: TagView,
        itemsPerPage: result.data.site.siteMetadata.postsPerPage,
        pathPrefix: `/tag/${createTagSlug(tag)}`,
        context: {
          tag,
          pubStates: process.env.NODE_ENV === 'development' ? [true, false] : [true],
        },
      })
    })

    //Create actual posts
    posts.forEach(({ node }, index) => {
      createPage({
        path: `/post${node.fields.slug}`,
        component: PostView,
        context: {
          isDev: process.env.NODE_ENV === 'development',
          slug: node.fields.slug,
          url: `/post${node.fields.slug}`
        },
      })
    })

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
    console.log(value)
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
