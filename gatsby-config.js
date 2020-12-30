const siteMetadata = {
  title: `Michael Jones`,
  description: `This is my coding blog where I write about my coding journey.`,
  menuItems: [
    {
      title: 'DW Cookbook',
      path: '/dw-cookbook',
    },
  ],
  author: 'Michael Jones',
  description:
    'Just a personal blog currently focused on Mulesoft/Anypoint development',
  postsPerPage: 10,
  labsPerPage: 20,
  isDev: process.env.NODE_ENV === 'development',
}

module.exports = {
  siteMetadata: siteMetadata,
  plugins: [
    {
      resolve: `gatsby-transformer-json`,
      options: {
        typeName: 'json',
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/posts`,
        name: `posts`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/pages`,
        name: `pages`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/static/lab-content`,
        name: `labs`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/static/images`,
        name: `images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-react-helmet`,
    `gatsby-remark-images`,
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [`Titillium Web`, `Ubuntu Mono`],
        display: 'swap',
      },
    },
    `gatsby-remark-copy-linked-files`,
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.mdx`, `.md`],
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 1000,
              linkImagesToOriginal: false,
              wrapperStyle: {
                maxWidth: '98vw'
              }
            },
          },
          `gatsby-remark-embedder`,
          `gatsby-remark-copy-linked-files`,
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              className: `autolink-header`,
            },
          },
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: 'Community Material Theme Palenight',
              extensions: [
                `${__dirname}/vendor/blzjns.vscode-raml-3.0.1.vsix`,
                `${__dirname}/vendor/coenraads.bracket-pair-colorizer-1.0.61.vsix`,
                `${__dirname}/vendor/dataweave.data-weave-0.1.1.vsix`,
                `${__dirname}/vendor/equinusocio.vsc-community-material-theme-1.4.2.vsix`,
              ],
            },
          },
          {
            resolve: 'gatsby-remark-external-links',
            options: {
              target: '_blank',
              rel: 'noreferrer',
            },
          },
        ],
      },
    },
  ],
}
