import { MDXProvider } from '@mdx-js/react'
import React from 'react'
import CodeWrapper from './src/components/CodeWrapper'
import ZoomableImage from './src/components/ZoomableImage'

const components = {
  pre: (props) => (
    <CodeWrapper>
      <pre {...props} />
    </CodeWrapper>
  ),
  img: (props) => (
    <ZoomableImage>
      <img {...props} />
    </ZoomableImage>
  ),
  a: (props) => <a {...props} />,
  p: (props) => <div {...props} className='div-paragraph' />
}

export const wrapRootElement = ({ element }) => (
  <MDXProvider components={components}>{element}</MDXProvider>
)
