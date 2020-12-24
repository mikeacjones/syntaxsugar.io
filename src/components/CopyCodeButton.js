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
      padding: '8px 12px',
      background: '#52307c',
      borderTopRightRadius: '8px',
      borderBottomLeftRadius: '8px',
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

const CodeLanguageStub = ({ language }) => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      border: 'none',
      boxShadow: 'none',
      padding: '8px 12px',
      background: '#52307c',
      borderTopLeftRadius: '8px',
      borderBottomRightRadius: '8px',
      color: '#ffffd2',
      fontSize: '14px',
      fontFamily: "'Ubuntu Mono', monospace",
      lineHeight: '1',
      zIndex: 98,
    }}
  >
    {language}
  </div>
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

export { CopyCodeButton, copyToClipboard, Wrapper, ConfettiWrapper, CodeLanguageStub }
