import React from 'react'
import './ZoomableImage.css'

export default (props) => {
  const [enlarged, setEnlarged] = React.useState(false)
  const toggleEnlarge = () => {
    setEnlarged(!enlarged)
  }
  return (
    <div className={enlarged ? 'ZoomableImage-enlarged' : 'ZoomableImage'} onClick={toggleEnlarge}>
      {props.children}
    </div>
  )
}
