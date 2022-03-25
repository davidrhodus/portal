import React, { useMemo } from 'react'
import { GU, textStyle, useTheme } from '@pokt-foundation/ui'
import Card from '../Card/Card'
import { LatestBlockData } from '../../hooks/network-hooks'

interface LatestBlockProps {
  data: LatestBlockData
}

function appendZeroToTime(time: string) {
  return time.length < 2 ? `0${time}` : time
}

export default function LatestBlock({ data }: LatestBlockProps) {
  const theme = useTheme()

  const blockProducedDateInLocalTime = useMemo(() => {
    const blockProducedTimeInDate = new Date(data.producedTime)
    const hours = appendZeroToTime(
      blockProducedTimeInDate.getHours().toString()
    )
    const minutes = appendZeroToTime(
      blockProducedTimeInDate.getMinutes().toString()
    )

    return `${hours}:${minutes} ${
      Intl.DateTimeFormat().resolvedOptions().timeZone
    }`
  }, [data.producedTime])

  const totalRelaysInThisBlock = useMemo(() => {
    data.processedDailyRelaysResponse.reverse()

    for (const relay of data.processedDailyRelaysResponse) {
      if (relay.total_relays < 1) {
        continue
      }

      return relay.total_relays
    }
  }, [data.processedDailyRelaysResponse])

  return (
    <Card
      css={`
        padding: ${4 * GU}px;
      `}
    >
      <React.Fragment>
        <h3
          css={`
            ${textStyle('title3')};
            margin-bottom: ${2 * GU}px;
          `}
        >
          Latest Block
        </h3>
        <BlockRow
          title="Block"
          data={data.height}
          css={`
            margin-bottom: ${2 * GU}px;

            p:nth-child(2) {
              color: ${theme.accentAlternative};
            }
          `}
        />
        <BlockRow
          title="Time"
          data={blockProducedDateInLocalTime}
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        />
        <BlockRow
          title="Relays"
          data={`${totalRelaysInThisBlock?.toLocaleString()}`}
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        />
        <BlockRow
          title="Txs"
          data={Number(data.txsCount).toLocaleString()}
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        />
        <BlockRow
          title="Produced in"
          data={`${data.producedIn} min`}
          css={`
            margin-bottom: ${2 * GU}px;
          `}
        />
      </React.Fragment>
    </Card>
  )
}

interface RowProps {
  title: string
  data: string
}

function BlockRow({ title, data, ...props }: RowProps) {
  const theme = useTheme()

  return (
    <div
      css={`
        display: flex;
        justify-content: space-between;
      `}
      {...props}
    >
      <p
        css={`
          ${textStyle('body3')};
          color: ${theme.placeholder};
          font-weight: 500;
        `}
      >
        {title}
      </p>
      <p
        css={`
          ${textStyle('body3')};
          font-weight: 600;
        `}
      >
        {data}
      </p>
    </div>
  )
}
