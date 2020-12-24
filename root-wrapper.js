import { MDXProvider } from '@mdx-js/react'
import React from 'react'
import CodeWrapper from './src/components/CodeWrapper'

const components = {
  pre: (props) => (
      <CodeWrapper>
        <pre {...props} />
      </CodeWrapper>
  ),
}

export const wrapRootElement = ({ element }) => (
  <MDXProvider components={components}>{element}</MDXProvider>
)
