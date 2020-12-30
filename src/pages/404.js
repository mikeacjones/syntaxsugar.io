import React from 'react'
import { Layout } from '../components/layout/Layout'
import confusedMan from '../../static/images/dizzy.svg'

export default ({ data }) => {
  return (
    <Layout>
      <div className='post-view'>
        <div className='post-view-content'>
          <img src={confusedMan} alt='confused-man' />
          <div className='post-view-header'>
            <div className='post-view-title'>
              <h1>Uh oh.. I can't find that page!</h1>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
