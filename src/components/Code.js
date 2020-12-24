import Highlight, { defaultProps } from 'prism-react-renderer'
import {
  CopyCodeButton,
  copyToClipboard,
  Wrapper,
  ConfettiWrapper,
} from './CopyCodeButton'
import theme from 'prism-react-renderer/themes/shadesOfPurple'
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

const Code = ({ codeString, language, ...props }) => {
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
      <Highlight
        {...defaultProps}
        code={codeString}
        language={language}
        theme={theme}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <Pre className={className} style={style}>
            <CopyCodeButton
              onClick={() => {
                copyToClipboard(codeString)
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 3000)
              }}
            >
              {isCopied ? '🎉 Copied!' : 'Copy'}
            </CopyCodeButton>
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                <LineNo>{i + 1}</LineNo>
                {line.map((token, key) => (
                  <span {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </Pre>
        )}
      </Highlight>
      <ConfettiWrapper>
        <Confetti active={isCopied} config={confettiConfig} />
      </ConfettiWrapper>
    </Wrapper>
  )
}

export default Code
