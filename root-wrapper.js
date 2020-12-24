import { MDXProvider } from '@mdx-js/react'
import React from 'react'
import CodeWrapper from './src/components/CodeWrapper'

const components = {
  pre: (props) => (
    <CodeWrapper>
      <pre {...props} />
    </CodeWrapper>
  ),
  img: (props) => (
    <div
      style={{
        maxWidth: '700px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '20px',
        cursor: 'pointer',
      }}
    >
      <img {...props} />
    </div>
  ),
}

export const wrapRootElement = ({ element }) => (
  <MDXProvider components={components}>{element}</MDXProvider>
)
