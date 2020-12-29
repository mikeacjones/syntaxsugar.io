import { MDXProvider } from '@mdx-js/react'
import React from 'react'
import { CodeWrapper } from './src/components/CodeWrapper'
import { ZoomableImage } from './src/components/ZoomableImage'

const components = {
  pre: (props) => (
    <CodeWrapper>
      <pre {...props} />
    </CodeWrapper>
  ),
  img: (props) => (
    <ZoomableImage>
      <img alt='' {...props} />
    </ZoomableImage>
  ),
  p: (props) => <div {...props} className='div-paragraph' />,
  iframe: (props) => <div className='iframe-wrapper'><iframe {...props} /></div>
}

export const wrapRootElement = ({ element }) => (
  <MDXProvider components={components}>{element}</MDXProvider>
)
