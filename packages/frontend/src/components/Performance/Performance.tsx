import React from 'react'
import { useTheme, GU, textStyle } from '@pokt-foundation/ui'
import Card from '../Card/Card'

export default function Performance() {
  const theme = useTheme()

  return (
    <Card
      css={`
        padding: ${3 * GU}px;
      `}
    >
      <React.Fragment>
        <h3
          css={`
            ${textStyle('title3')};
            margin-bottom: ${2 * GU}px;
          `}
        >
          Performance
        </h3>
        <h4
          css={`
            color: ${theme.accentAlternative};
            ${textStyle('body2')};
            font-weight: 700;
            margin-bottom: ${GU * 2}px;
          `}
        >
          Relays
        </h4>

        <div
          css={`
            display: flex;
            justify-content: space-between;
          `}
        >
          <div
            css={`
              display: flex;
              flex-direction: column;
            `}
          >
            <p
              css={`
                color: ${theme.placeholder};
                font-size: ${GU + 6}px;
                font-weight: 500;
              `}
            >
              Today:
            </p>
            <p
              css={`
                color: ${theme.inactive};
                font-size: ${GU + 6}px;
                font-weight: 700;
              `}
            >
              231.5M
            </p>
          </div>
          <div
            css={`
              display: flex;
              flex-direction: column;
            `}
          >
            <p
              css={`
                color: ${theme.placeholder};
                font-size: ${GU + 6}px;
                font-weight: 500;
              `}
            >
              Month:
            </p>
            <p
              css={`
                color: ${theme.inactive};
                font-size: ${GU + 6}px;
                font-weight: 700;
              `}
            >
              231.5M
            </p>
          </div>
          <div
            css={`
              display: flex;
              flex-direction: column;
            `}
          >
            <p
              css={`
                color: ${theme.placeholder};
                font-size: ${GU + 6}px;
                font-weight: 500;
              `}
            >
              Max:
            </p>
            <p
              css={`
                color: ${theme.inactive};
                font-size: ${GU + 6}px;
                font-weight: 700;
              `}
            >
              231.5M
            </p>
          </div>
        </div>
      </React.Fragment>
    </Card>
  )
}
