import React, { useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from 'react-query'
import axios from 'axios'
import { getAddressFromPublicKey } from 'pocket-tools'
import { useViewport } from 'use-viewport'
import Styled from 'styled-components/macro'
import * as Sentry from '@sentry/react'
import {
  Button,
  CircleGraph,
  DataView,
  Spacer,
  Split,
  textStyle,
  useTheme,
  useToast,
  GU,
  TextCopy,
} from '@pokt-foundation/ui'
import AppStatus from '../../../components/AppStatus/AppStatus'
import Box from '../../../components/Box/Box'
import FloatUp from '../../../components/FloatUp/FloatUp'
import { log, shorten } from '../../../lib/utils'
import env from '../../../environment'
import { KNOWN_QUERY_SUFFIXES } from '../../../known-query-suffixes'
import { sentryEnabled } from '../../../sentry'

const REFETCH_INTERVAL = 60 * 1000

interface SuccessDetailsProps {
  id: string
  maxDailyRelays: number
  stakedTokens: number
  successfulRelays: number
  totalRelays: number
}

interface EndpointRpcError {
  bytes: number
  message: string
  method: string
  nodepublickey: string
}

export default function SuccessDetails({
  id,
  maxDailyRelays,
  stakedTokens,
  successfulRelays,
  totalRelays,
}: SuccessDetailsProps) {
  const theme = useTheme()
  const toast = useToast()
  const { within } = useViewport()

  const compactMode = within(-1, 'medium')

  const { isLoading, data } = useQuery(
    [KNOWN_QUERY_SUFFIXES.LATEST_FILTERED_DETAILS, id],
    async function getFilteredRelays() {
      const errorMetricsURL = `${env('BACKEND_URL')}/api/lb/error-metrics/${id}`

      if (!id) {
        return []
      }

      try {
        const { data } = await axios.get(errorMetricsURL, {
          withCredentials: true,
        })

        const transformedErrorMetrics = await Promise.all(
          data.map(async (e: EndpointRpcError) => {
            const nodeAddress = await getAddressFromPublicKey(e.nodepublickey)

            return {
              bytes: e.bytes,
              message: e.message,
              method: e.method,
              nodeAddress,
            }
          })
        )

        const errorMetrics = transformedErrorMetrics.filter(
          (e) => !e.method.includes('check')
        )

        return {
          errorMetrics,
        }
      } catch (err) {
        if (sentryEnabled) {
          Sentry.configureScope((scope) => {
            scope.setTransactionName(
              KNOWN_QUERY_SUFFIXES.LATEST_FILTERED_DETAILS
            )
          })
          Sentry.captureException(err)
        }
        log('SUCCESS DETAILS ERROR', Object.entries(err as Error))
        throw err
      }
    },
    {
      keepPreviousData: true,
      refetchInterval: REFETCH_INTERVAL,
    }
  )

  const successRate = useMemo(() => {
    return totalRelays === 0 ? 0 : successfulRelays / totalRelays
  }, [totalRelays, successfulRelays])
  const failureRate = useMemo(() => {
    return totalRelays === 0
      ? 0
      : (totalRelays - successfulRelays) / totalRelays
  }, [successfulRelays, totalRelays])

  return (
    <FloatUp
      loading={false}
      content={() => (
        <Split
          primary={
            <>
              {compactMode && (
                <>
                  <NavigationOptions />
                  <Spacer size={3 * GU} />
                </>
              )}
              <Box padding={[3 * GU, 4 * GU, 3 * GU, 4 * GU]}>
                <div
                  css={`
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    width: 100%;
                    height: 100%;
                    ${compactMode &&
                    `
                      flex-direction: column;
                    `}
                  `}
                >
                  <div
                    css={`
                      display: flex;
                      flex-direction: column;
                    `}
                  >
                    <h2
                      css={`
                        ${textStyle('title1')}
                      `}
                    >
                      {Intl.NumberFormat().format(totalRelays)}
                      <span
                        css={`
                          display: block;
                          ${textStyle('title3')}
                        `}
                      >
                        Total requests
                      </span>
                      <span
                        css={`
                          ${textStyle('body3')}
                        `}
                      >
                        Last 24 hours
                      </span>
                    </h2>
                  </div>
                  <Inline>
                    <CircleGraph
                      value={Math.min(successRate, 1)}
                      size={12 * GU}
                      color={theme.positive}
                    />
                    <Spacer size={1 * GU} />
                    <div>
                      <h2
                        css={`
                          ${textStyle('title2')}
                        `}
                      >
                        {Intl.NumberFormat().format(
                          Math.min(successfulRelays, totalRelays)
                        )}
                        <span
                          css={`
                            display: block;
                            ${textStyle('body3')}
                          `}
                        >
                          Processed requests
                        </span>
                      </h2>
                      <h2
                        css={`
                          ${textStyle('title3')}
                        `}
                      >
                        Successful Requests
                      </h2>
                    </div>
                  </Inline>
                  {compactMode && <Spacer size={3 * GU} />}
                  <Inline>
                    <CircleGraph
                      value={Math.max(0, failureRate)}
                      size={12 * GU}
                      color={theme.negative}
                    />
                    <Spacer size={1 * GU} />
                    <div>
                      <h2
                        css={`
                          ${textStyle('title2')}
                        `}
                      >
                        {Intl.NumberFormat().format(
                          Math.max(totalRelays - successfulRelays, 0)
                        )}
                        <span
                          css={`
                            display: block;
                            ${textStyle('body3')}
                          `}
                        >
                          Failed Requests
                        </span>
                      </h2>
                      <h2
                        css={`
                          ${textStyle('title3')}
                        `}
                      >
                        Failure rate
                      </h2>
                    </div>
                  </Inline>
                </div>
              </Box>
              <Spacer size={3 * GU} />
              <Box padding={[0, 0, 0, 0]}>
                <Spacer size={5 * GU} />
                <DataView
                  fields={[
                    '',
                    'Request type',
                    'Bytes transferred',
                    'Service Node',
                  ]}
                  entries={data?.errorMetrics ?? ([] as EndpointRpcError[])}
                  renderEntry={({
                    bytes,
                    method,
                    nodeAddress,
                  }: EndpointRpcError & { nodeAddress: string }) => {
                    return [
                      <div
                        css={`
                          display: inline-block;
                          width: ${1.5 * GU}px;
                          height: ${1.5 * GU}px;
                          border-radius: 50% 50%;
                          background: ${theme.negative};
                          box-shadow: ${theme.negative} 0px 2px 8px 0px;
                        `}
                      />,
                      <p
                        css={`
                          ${textStyle('body3')}
                        `}
                      >
                        {method ? method : 'Unknown'}
                      </p>,
                      <p
                        css={`
                          ${textStyle('body3')}
                        `}
                      >
                        {bytes}B
                      </p>,
                      <TextCopy
                        value={shorten(nodeAddress, 16)}
                        onCopy={() => toast('Node address copied to cliboard')}
                        css={`
                          width: 100%;
                          > div > input {
                            background: transparent;
                          }
                        `}
                      />,
                    ]
                  }}
                  renderEntryExpansion={({ message }: EndpointRpcError) => {
                    const formattedMessage = message?.includes('html')
                      ? 'Server Error'
                      : message

                    return formattedMessage
                      ? [<p>{formattedMessage}</p>]
                      : undefined
                  }}
                  status={isLoading ? 'loading' : 'default'}
                />
              </Box>
            </>
          }
          secondary={
            <>
              {!compactMode && (
                <>
                  <NavigationOptions />

                  <Spacer size={2 * GU} />
                </>
              )}
              <AppStatus
                maxDailyRelays={maxDailyRelays}
                stakedTokens={stakedTokens}
              />
            </>
          }
        />
      )}
    />
  )
}

function NavigationOptions() {
  const history = useHistory()

  return (
    <Button wide mode="primary" onClick={() => history.goBack()}>
      Back to application
    </Button>
  )
}

const Inline = Styled.div`
  display: flex;
  align-items: center;
`
