import React from 'react'
import { useStaticQuery, Link, graphql } from 'gatsby'
import { MenuItems } from './MenuItems'
import Img from 'gatsby-image'
import './AboutMe.css'

export const AboutMe = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "profilePicture.png" }) {
        childImageSharp {
          fluid(maxWidth: 800) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  return (
    <div id='AboutMe'>
      <Link to='/' className='link-to' id='AboutMe-ProfilePicture'>
        <Img fluid={data.file.childImageSharp.fluid} />
      </Link>
      <h1>Michael Jones</h1>
      <div id='AboutMe-MenuItems'>
        <MenuItems />
      </div>
    </div>
  )
}
