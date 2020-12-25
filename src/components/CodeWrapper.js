import {
  CopyCodeButton,
  CodeLanguageStub,
  copyToClipboard,
  Wrapper,
  ConfettiWrapper,
} from './CopyCodeButton'
import React from 'react'
import styled from 'styled-components'
import Confetti from 'react-dom-confetti'

export const Pre = styled.pre`
  text-align: left;
  margin: 1em 0;
  padding: 2rem;
  position: relative;
  overflow-x: auto;
  border-radius: 3px;

  & .token-line {
    line-height: 1.3em;
    white-space: pre-wrap;
  }
  font-family: 'Ubuntu Mono', monospace;
`

export const LineNo = styled.span`
  display: inline-block;
  width: 2em;
  user-select: none;
  opacity: 0.3;
`

const CodeWrapper = (props) => {
  const [isCopied, setIsCopied] = React.useState(false)

  const confettiConfig = {
    angle: 90,
    spread: 360,
    startVelocity: 40,
    elementCount: 70,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: '10px',
    height: '10px',
    perspective: '500px',
    colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a'],
  }

  return (
    <Wrapper>
      <CopyCodeButton
        onClick={(e) => {
          let elm = e.target.parentNode.children
          elm = elm[elm.length - 1].querySelectorAll('.grvsc-source')

          const pre = document.createElement('pre')
          const lines = document.createElement('code')
          pre.className = 'grvsc-container'
          pre.style.position = 'absolute'
          pre.style.left = '-9999px'
          lines.className = 'grvsc-code'
          pre.appendChild(lines)

          elm.forEach((line) => {
            const thisLine = document.createElement('span')
            thisLine.className = 'grvsc-line'
            thisLine.appendChild(line.cloneNode(true))
            lines.appendChild(thisLine)
          })

          document.body.appendChild(pre)
          copyToClipboard(pre.innerText)
          document.body.removeChild(pre)

          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 3000)
        }}
      >
        {isCopied ? '🎉 Copied!' : 'Copy'}
      </CopyCodeButton>
      <CodeLanguageStub language={props.children.props['data-language']} />
      <ConfettiWrapper>
        <Confetti active={isCopied} config={confettiConfig} />
      </ConfettiWrapper>
      {props.children}
    </Wrapper>
  )
}

export default CodeWrapper
