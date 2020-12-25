import React from 'react'
import { Layout } from '../components/Layout'

export default ({ data }) => {
  return (
    <Layout>
      <div className='post-view'>
        <div className='post-view-header'>
          <div className='post-view-title'>
            <h1>Page not Found</h1>
          </div>
        </div>
        <div className='post-view-content'></div>
      </div>
    </Layout>
  )
}
