import React from 'react'
import './ZoomableImage.css'

export const ZoomableImage = (props) => {
  const [enlarged, setEnlarged] = React.useState(false)
  const toggleEnlarge = () => {
    setEnlarged(!enlarged)
  }
  return (
    <div role='button' className={enlarged ? 'ZoomableImage-enlarged' : 'ZoomableImage'} onClick={toggleEnlarge}>
      {props.children}
    </div>
  )
}
