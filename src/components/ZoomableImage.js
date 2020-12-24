import React from 'react'

export default ( props ) => {
  const [enlarged, setEnlarged] = React.useState(false)
  const toggleEnlarge = () => {
    setEnlarged(!enlarged)
  }
  return <div style={!enlarged ? {
    maxWidth: '100%',
    width: '700px',
    overflow: 'hidden',
    cursor: 'pointer',
  } : {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    cursor: 'pointer',
    display: 'flex',
    padding: '50px',
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, .8)',
  }} onClick={toggleEnlarge}>{props.children}</div>
}
