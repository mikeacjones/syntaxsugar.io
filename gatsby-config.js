const siteMetadata = {
  title: `The Localhost Blog`,
  description: `This is my coding blog where I write about my coding journey.`,
  menuItems: [
    {
      title: 'DW Cookbook',
      path: '/dw-cookbook',
    },
  ],
  postsPerPage: 1,
}



module.exports = {
  siteMetadata: siteMetadata,
  plugins: [
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [`.mdx`, `.md`],
        gatsbyRemarkPlugins: [
          `gatsby-remark-copy-linked-files`,
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              className: `autolink-header`,
            },
          },
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 800,
              quality: 100,
            },
          },
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              //theme: 'Material Theme Palenight High Contrast',
              theme: 'Community Material Theme Palenight',
              //theme: 'Shades of Purple',
              extensions: [
                `${__dirname}/vendor/blzjns.vscode-raml-3.0.1.vsix`,
                `${__dirname}/vendor/coenraads.bracket-pair-colorizer-1.0.61.vsix`,
                `${__dirname}/vendor/dataweave.data-weave-0.1.1.vsix`,
                `${__dirname}/vendor/equinusocio.vsc-community-material-theme-1.4.2.vsix`
              ],
            },
          },
          {
            resolve: 'gatsby-remark-embed-video',
            options: {
              width: 800,
              ratio: 1.77, // Optional: Defaults to 16/9 = 1.77
              height: 400, // Optional: Overrides optional.ratio
              related: false, //Optional: Will remove related videos from the end of an embedded YouTube video.
              noIframeBorder: true, //Optional: Disable insertion of <style> border: 0
              containerClass: 'embedVideo-container', //Optional: Custom CSS class for iframe container, for multiple classes separate them by space
            },
          },
        ],
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
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-copy-linked-files`,
        ],
      },
    },
  ],
}
