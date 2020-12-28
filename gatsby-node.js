const { createFilePath } = require(`gatsby-source-filesystem`)
const path = require(`path`)
const { paginate } = require(`gatsby-awesome-pagination`)
const { createTagSlug, powerSet } = require('./src/helpers')
const { generateCodeLabs } = require('./codelabs-script')

exports.onPreInit = async () => {
  await generateCodeLabs()
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions
  const PostView = path.resolve(`src/components/PostView.js`)
  const IndexView = path.resolve(`./src/templates/index.js`)
  const LabsView = path.resolve(`./src/templates/labs.js`)
  const CategoryLabView = path.resolve(`./src/templates/labsCategory.js`)
  const LabsByCat = path.resolve(`./src/templates/labsByCategory.js`)
  const PostsByTags = path.resolve(`./src/templates/postsByTags.js`)

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
    /*labCategories.forEach((labCategory) => {
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
    })*/

    //Create paginated lab lists by combined tag
    const combinedCategories = powerSet(labCategories).filter((set) => set.length > 0)
    combinedCategories.forEach((catCombo) => {
      const labsWithCategory = labs.filter((lab) => lab.category && catCombo.some((cat) => lab.category.includes(cat)))
      console.log(JSON.stringify(labsWithCategory, null, 2))
      const currentSlug = createTagSlug(catCombo.sort().join('-'))
      console.log(currentSlug)
      const catSlugs = labCategories.reduce((map, cat) => {
        const linkCats = (catCombo.includes(cat) ? [...catCombo.slice(0, catCombo.indexOf(cat)), ...catCombo.slice(catCombo.indexOf(cat) + 1)] : [...catCombo, cat]).sort()
        map[cat] = linkCats.length === 0 ? '/labs' : `/labs/${createTagSlug(linkCats.join('-'))}`
        return map
      }, {})
      console.log(JSON.stringify(catSlugs, null, 0))

      paginate({
        createPage,
        items: labsWithCategory,
        component: LabsByCat,
        itemsPerPage: result.data.site.siteMetadata.labsPerPage,
        pathPrefix: `/labs/${currentSlug}`,
        context: {
          categories: catCombo,
          catSlugs
        }
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

    //create paginated post lists by combined tag
    const tags = posts
      .filter(({ node }) => node.frontmatter.tags && node.frontmatter.tags != null)
      .flatMap(({ node }) => node.frontmatter.tags)
      .filter((tag, index, self) => self.indexOf(tag) === index)
    const combinedTags = powerSet(tags).filter((set) => set.length > 0)
    combinedTags.forEach((tagCombo) => {
      const postsWithTag = posts.filter(({ node }) => node.frontmatter.tags && tagCombo.some((tag) => node.frontmatter.tags.includes(tag)))
      const currentSlug = createTagSlug(tagCombo.sort().join('-'))
      const tagSlugs = tags.reduce((map, tag) => {
        const linkTags = (tagCombo.includes(tag) ? [...tagCombo.slice(0, tagCombo.indexOf(tag)), ...tagCombo.slice(tagCombo.indexOf(tag) + 1)] : [...tagCombo, tag]).sort()
        map[tag] = linkTags.length === 0 ? '/' : `/tag/${createTagSlug(linkTags.join('-'))}`
        return map
      }, {})
      paginate({
        createPage,
        items: postsWithTag,
        component: PostsByTags,
        itemsPerPage: result.data.site.siteMetadata.postsPerPage,
        pathPrefix: `/tag/${currentSlug}`,
        context: {
          tags: tagCombo,
          tagSlugs,
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
          url: `/post${node.fields.slug}`,
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
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
