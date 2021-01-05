const path = require('path')
const { createFilePath } = require(`gatsby-source-filesystem`)
const { paginate } = require(`gatsby-awesome-pagination`)
const { createTagSlug, powerSet } = require(`./src/helpers`)
const { generateCodeLabs } = require('./codelabs-script')

exports.onPreInit = async () => {
  if (process.env.NODE_ENV !== 'development') await generateCodeLabs()
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
  `).then(result => {
    if (result.errors) {
      throw result.errors
    }
    const {
      postsPerPage,
      labsPerPage,
      menuItems,
    } = result.data.site.siteMetadata

    const postTemplate = path.resolve(`./src/templates/post.js`)
    const indexTemplate = path.resolve(`./src/templates/index.js`)
    const postsByTagsTemplate = path.resolve(`./src/templates/postsByTags.js`)
    const labsTemplate = path.resolve(`./src/templates/labs.js`)
    const labsByCategoryTemplate = path.resolve(
      `./src/templates/labsByCategory.js`
    )

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
          process.env.NODE_ENV === 'development' ? [true, false] : [true],
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
            process.env.NODE_ENV === 'development' ? [true, false] : [true],
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

    //Create paginated lab pages
    const labs = result.data.allFile.edges.map(({ node }) => {
      return { path: node.absolutePath, category: node.childJson.category }
    })
    paginate({
      createPage,
      items: labs,
      itemsPerPage: result.data.site.siteMetadata.labsPerPage,
      pathPrefix: '/labs',
      component: labsTemplate,
    })

    //Create paginated lab lists by combined tag
    const labCategories = labs
      .flatMap(({ category }) => category)
      .filter((item, index, self) => self.indexOf(item) === index)
    const combinedCategories = powerSet(labCategories).filter(
      set => set.length > 0
    )
    combinedCategories.forEach(catCombo => {
      const labsWithCategory = labs.filter(
        lab => lab.category && catCombo.some(cat => lab.category.includes(cat))
      )
      const currentSlug = createTagSlug(catCombo.sort().join('-'))
      const catSlugs = labCategories.reduce((map, cat) => {
        const linkCats = (catCombo.includes(cat)
          ? [
              ...catCombo.slice(0, catCombo.indexOf(cat)),
              ...catCombo.slice(catCombo.indexOf(cat) + 1),
            ]
          : [...catCombo, cat]
        ).sort()
        map[cat] =
          linkCats.length === 0
            ? '/labs'
            : `/labs/${createTagSlug(linkCats.join('-'))}`
        return map
      }, {})

      paginate({
        createPage,
        items: labsWithCategory,
        component: labsByCategoryTemplate,
        itemsPerPage: result.data.site.siteMetadata.labsPerPage,
        pathPrefix: `/labs/${currentSlug}`,
        context: {
          categories: catCombo,
          catSlugs,
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
