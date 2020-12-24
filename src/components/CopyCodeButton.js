import React from 'react'

const CopyCodeButton = (props) => (
  <button
    style={{
      position: 'absolute',
      top: 0,
      right: 0,
      border: 'none',
      boxShadow: 'none',
      textDecoration: 'none',
      margin: '8px',
      padding: '8px 12px',
      background: '#52307c',
      borderRadius: '8px',
      cursor: 'pointer',
      color: '#ffffd2',
      fontSize: '14px',
      fontFamily: "'Ubuntu Mono', monospace",
      lineHeight: '1',
      zIndex: 98,
    }}
    {...props}
  />
)

const copyToClipboard = (str) => {
  const el = document.createElement('textarea')
  el.value = str
  el.setAttribute('readonly', '')
  el.style.position = 'absolute'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

const Wrapper = (props) => <div style={{ position: 'relative' }} {...props} />

const ConfettiWrapper = (props) => (
  <div
    style={{ position: 'absolute', top: 0, right: 0, zIndex: 99 }}
    {...props}
  />
)

export { CopyCodeButton, copyToClipboard, Wrapper, ConfettiWrapper }
