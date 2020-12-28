import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'

const SEO = ({ description, lang, meta, keywords, title }) => {
  const data = useStaticQuery(graphql`
    query DefaultSEOQuery {
      site {
        siteMetadata {
          title
          description
          author
        }
      }
    }
  `)
  const {
    title: siteTitle,
    description: siteDescription,
    author,
  } = data.site.siteMetadata
  const metaTitle = title || siteTitle
  const metaDescription = description || siteDescription

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
    >
      <title>{title ? `${title} :: ${siteTitle}` : siteTitle}</title>
      <meta name='description' content={metaDescription} />
      <meta name='keywords' content={keywords.join(', ')} />

      <meta
        itemprop='name'
        content={title ? `${title} :: ${siteTitle}` : siteTitle}
      />
      <meta itemprop='description' content={metaDescription} />
      <meta itemprop='image' content='https://syntaxsugar.io/favicon.svg' />

      <meta property='og:url' content='https://syntaxsugar.io' />
      <meta property='og:type' content='website' />
      <meta
        property='og:title'
        content={title ? `${title} :: ${siteTitle}` : siteTitle}
      />
      <meta property='og:description' content={metaDescription} />
      <meta property='og:image' content='https://syntaxsugar.io/favicon.svg' />

      <meta name='twitter:card' content='summary_large_image' />
      <meta
        name='twitter:title'
        content={title ? `${title} :: ${siteTitle}` : siteTitle}
      />
      <meta name='twitter:description' content={metaDescription} />
      <meta name='twitter:image' content='https://syntaxsugar.io/favicon.svg' />

      <link
        rel='apple-touch-icon'
        sizes='180x180'
        href='/apple-touch-icon.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='32x32'
        href='/favicon-32x32.png'
      />
      <link
        rel='icon'
        type='image/png'
        sizes='16x16'
        href='/favicon-16x16.png'
      />
      <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
      <link rel='manifest' href='/site.webmanifest' />
      <link rel='mask-icon' href='/safari-pinned-tab.svg' color='#5bbad5' />
      <meta name='msapplication-TileColor' content='#da532c' />
      <meta name='theme-color' content='#ffffff' />
    </Helmet>
  )
}

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  keywords: ['mulesoft', 'dataweave', 'anypoint', 'michael jones'],
}

SEO.propTypes = {
  description: PropTypes.string,
  lang: PropTypes.string,
  meta: PropTypes.array,
  keywords: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string,
}

export default SEO
