import React from 'react'
import './CopyCodeButton.css'

const CopyCodeButton = (props) => (
  <button className='CopyCodeButton' {...props} />
)

const CodeLanguageStub = ({ language }) => (
  <div className='CodeLanguageStub'>{language}</div>
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

const Wrapper = (props) => <div className='codeWrapper' {...props} />

const ConfettiWrapper = (props) => (
  <div className='ConfettiWrapper' {...props} />
)

export {
  CopyCodeButton,
  copyToClipboard,
  Wrapper,
  ConfettiWrapper,
  CodeLanguageStub,
}
