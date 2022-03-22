import React, { useMemo } from 'react'
import { format } from 'd3-format'
import { useViewport } from 'use-viewport'
import 'styled-components/macro'
import {
  ButtonBase,
  CircleGraph,
  DataView,
  Help,
  LineChart,
  Spacer,
  Split,
  textStyle,
  useTheme,
  GU,
  RADIUS,
} from '@pokt-foundation/ui'
import AnimatedLogo from '../../../components/AnimatedLogo/AnimatedLogo'
import Box from '../../../components/Box/Box'
import FloatUp from '../../../components/FloatUp/FloatUp'
import { getImageForChain } from '../../../known-chains/known-chains'
import {
  DailyRelayBucket,
  useChains,
  useLatestBlock,
  useNetworkStats,
  useNetworkSummary,
  useTotalWeeklyRelays,
} from '../../../hooks/network-hooks'
import Economics from '../../../assets/economicsDevs.png'
import {
  getServiceLevelByChain,
  ALPHA_CHAINS,
  PRODUCTION_CHAINS,
  Chain,
} from '../../../lib/chain-utils'
import { norm } from '../../../lib/math-utils'
import NetworkSummaryNodesImg from '../../../assets/networkSummaryNodes.png'
import NetworkSummaryAppsImg from '../../../assets/networkSummaryApps.png'
import NetworkSummaryNetworksImg from '../../../assets/networkSummaryNetworks.png'
import Card from '../../../components/Card/Card'
import LatestBlock from '../../../components/LatestBlock/LatestBlock'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PER_PAGE = 5

function formatDailyRelaysForGraphing(dailyRelays: DailyRelayBucket[] = []): {
  labels: string[]
  lines: { id: number; values: number[] }[]
  scales: { label: number }[]
} {
  dailyRelays.pop()
  const labels = dailyRelays
    .map(({ bucket }) => bucket.split('T')[0])
    .map((bucket) => DAYS[new Date(bucket).getUTCDay()])

  const highestDailyAmount = dailyRelays.reduce(
    (highest, { total_relays: totalRelays }) => Math.max(highest, totalRelays),
    0
  )

  const lines = [
    {
      id: 1,
      values: dailyRelays.map(({ total_relays: totalRelays }) =>
        norm(totalRelays, 0, highestDailyAmount)
      ),
    },
  ]

  const formatSi = format('.2s')

  const scales = [
    { label: 0 },
    { label: formatSi((highestDailyAmount * 0.25).toFixed(0)) },
    { label: formatSi((highestDailyAmount * 0.5).toFixed(0)) },
    { label: formatSi((highestDailyAmount * 0.75).toFixed(0)) },
    { label: formatSi(highestDailyAmount.toFixed(0)) },
  ]

  return {
    labels,
    lines,
    scales,
  }
}

export default function NetworkStatus() {
  const { isNetworkStatsLoading, networkStats } = useNetworkStats()
  const { isRelaysError, isRelaysLoading, relayData } = useTotalWeeklyRelays()
  const { isSummaryLoading, summaryData } = useNetworkSummary()
  const { isChainsLoading, chains } = useChains()
  const { isLatestBlockLoading, latestBlockData } = useLatestBlock()
  const theme = useTheme()
  const { within } = useViewport()
  const compactMode = within(-1, 'medium')

  const {
    labels = [],
    lines = [],
    scales = [],
  } = useMemo(
    () =>
      isRelaysLoading || isRelaysError || relayData === undefined
        ? { labels: [], scales: [], lines: [] }
        : formatDailyRelaysForGraphing(relayData),
    [isRelaysError, isRelaysLoading, relayData]
  )

  const loading = useMemo(
    () =>
      isNetworkStatsLoading ||
      isRelaysLoading ||
      isSummaryLoading ||
      isChainsLoading ||
      isLatestBlockLoading ||
      !networkStats,
    [
      networkStats,
      isChainsLoading,
      isRelaysLoading,
      isNetworkStatsLoading,
      isSummaryLoading,
      isLatestBlockLoading,
    ]
  )

  return loading || !networkStats ? (
    <div
      css={`
        position: relative;
        width: 100%;
        /* TODO: This is leaky. fix up with a permanent component */
        height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `}
    >
      <AnimatedLogo />
      <Spacer size={2 * GU} />
      <p
        css={`
          ${textStyle('body2')}
        `}
      >
        Loading network status...
      </p>
    </div>
  ) : (
    <FloatUp
      content={() => (
        <>
          <Split
            primary={
              <>
                <h3
                  css={`
                    ${textStyle('title3')};
                    margin-bottom: ${GU * 3}px;
                  `}
                >
                  Network Summary
                </h3>
                <div
                  css={`
                    display: flex;
                    justify-content: space-evenly;
                    margin-bottom: ${GU * 4}px;
                  `}
                >
                  <NetworkSummaryCard
                    title="Nodes Staked"
                    subtitle="7000+"
                    imgSrc={NetworkSummaryNodesImg}
                  />
                  <NetworkSummaryCard
                    title="Apps Staked"
                    subtitle={`${summaryData?.appsStaked}`}
                    imgSrc={NetworkSummaryAppsImg}
                  />
                  <NetworkSummaryCard
                    title="Networks"
                    subtitle={`${chains?.length}`}
                    imgSrc={NetworkSummaryNetworksImg}
                  />
                </div>
                <Box>
                  <div
                    css={`
                      display: flex;
                      justify-content: space-between;
                    `}
                  >
                    <h3
                      css={`
                        ${textStyle('title2')}
                      `}
                    >
                      Total Relays
                    </h3>

                    <div
                      css={`
                        text-align: right;
                      `}
                    >
                      <h4
                        css={`
                          ${textStyle('title2')}
                          color: ${theme.accentAlternative};
                        `}
                      >
                        {Intl.NumberFormat().format(
                          networkStats?.totalRelays || 0
                        )}
                      </h4>
                      <h5
                        css={`
                          ${textStyle('body4')}
                        `}
                      >
                        Last 7 Days
                      </h5>
                    </div>
                  </div>
                  <Spacer size={3 * GU} />
                  <LineChart
                    backgroundFill="#1B2331"
                    borderColor={`rgba(0,0,0,0)`}
                    color={() => theme.accentAlternative}
                    dotRadius={GU / 1.5}
                    height={240}
                    label={(index: number) => labels[index]}
                    lines={lines}
                    renderCheckpoints
                    scales={scales}
                  />
                </Box>
                <Spacer size={4 * GU} />
                <Box title="Available Networks">
                  <DataView
                    fields={[
                      { label: 'Network', align: 'start' },
                      { label: 'Apps', align: 'start' },
                      { label: 'ID', align: 'start' },
                      { label: 'Status', align: 'start' },
                    ]}
                    entries={chains}
                    mode={compactMode ? 'list' : 'table'}
                    entriesPerPage={PER_PAGE}
                    renderEntry={({
                      appCount,
                      description,
                      id,
                      network,
                    }: Chain) => {
                      const chainImage = getImageForChain(description)

                      return [
                        <div
                          css={`
                            height: 100%;
                            width: ${35 * GU}px;
                            display: flex;
                            justify-content: flex-start;
                            align-items: center;
                          `}
                        >
                          <img
                            src={chainImage}
                            css={`
                              max-height: ${2 * GU}px;
                              max-width: auto;
                            `}
                            alt=""
                          />
                          <Spacer size={compactMode ? 1 * GU : 2 * GU} />
                          <p
                            css={`
                              overflow-wrap: break-word;
                              word-break: break-word;
                              hyphens: auto;
                            `}
                          >
                            {description || network}
                          </p>
                        </div>,
                        <p>{appCount ?? 0}</p>,
                        <p>{id}</p>,
                        <div
                          css={`
                            display: flex;
                            flex-direction: row;
                            ${!compactMode &&
                            `
                              align-items: center;
                              justify-content: center;
                            `}
                          `}
                        >
                          <p>{getServiceLevelByChain(id)}</p>
                          <Spacer size={1 * GU} />
                          <Help
                            hint="What is this?"
                            placement={compactMode ? 'auto' : 'right'}
                          >
                            {PRODUCTION_CHAINS.includes(id)
                              ? 'Production RelayChainIDs are very stable and thoroughly tested.'
                              : ''}
                            {ALPHA_CHAINS.includes(id)
                              ? 'Alpha RelayChainIDs are in the earliest phase of node onboarding and testing. Users may encounter issues, higher than production latency, or some quality of service issues. '
                              : ''}
                            {!PRODUCTION_CHAINS.includes(id) &&
                            !ALPHA_CHAINS.includes(id)
                              ? 'Beta RelayChainIDs are in the process of being externally tested. Users may encounter edge case issues, higher than production latency, or some brief quality of service issues. '
                              : ''}
                          </Help>
                        </div>,
                      ]
                    }}
                  />
                </Box>
                {!compactMode && <Spacer size={3 * GU} />}
              </>
            }
            secondary={
              <>
                <h3
                  css={`
                    ${textStyle('title3')};
                    margin-bottom: ${GU * 3}px;
                  `}
                >
                  Network Success Rate
                </h3>

                <Box>
                  <div
                    css={`
                      display: flex;
                      align-items: flex-end;
                      ${compactMode &&
                      `
                  flex-direction: row;
                  justify-content: space-between;
                `}
                    `}
                  >
                    <CircleGraph
                      size={compactMode ? 18 * GU : 18 * GU}
                      strokeWidth={GU * 3}
                      value={
                        networkStats.successfulRelays / networkStats.totalRelays
                      }
                      color={theme.accent}
                    />
                    <Spacer size={2 * GU} />
                    <div>
                      <p
                        css={`
                          ${textStyle('title2')}
                        `}
                      >
                        {Intl.NumberFormat().format(
                          networkStats.successfulRelays
                        )}
                      </p>
                      <p
                        css={`
                          ${textStyle('body2')}
                        `}
                      >
                        Successful relays
                      </p>
                      <Spacer size={0.5 * GU} />
                      <p
                        css={`
                          ${textStyle('body4')}
                        `}
                      >
                        Last 7 Days
                      </p>
                    </div>
                  </div>
                  <Spacer size={1 * GU} />
                </Box>
                <Spacer size={4 * GU} />
                <LatestBlock data={latestBlockData} />
                {!compactMode && (
                  <>
                    <Spacer size={4 * GU} />
                    <EconomicsSection />
                  </>
                )}
              </>
            }
          />
        </>
      )}
    />
  )
}

function EconomicsSection() {
  const theme = useTheme()

  return (
    <section
      css={`
        position: relative;
        width: 100%;
        height: 100%;
        max-height: ${33 * GU}px;
        background: url(${Economics}),
          linear-gradient(
            180deg,
            ${theme.surfaceGradient1} 0%,
            ${theme.surfaceGradient2} 100%
          );
        background-size: cover;
        background-repeat: no-repeat;
        background-blend-mode: overlay;
        background-position: bottom;
        border-radius: ${RADIUS + 2}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `}
    >
      <h3
        css={`
          font-weight: 700;
        `}
      >
        Pocket Economics for{' '}
        <span
          css={`
            color: ${theme.accentAlternative};
            ${textStyle('title2')};
            display: block;
          `}
        >
          {' '}
          App Developers
        </span>
      </h3>
      <ButtonBase
        href="https://medium.com/pocket-network/pocket-economics-for-app-developers-487a6ce290c2"
        mode="normal"
        css={`
          && {
            width: ${28 * GU}px;
            display: inline-block;
            ${textStyle('body3')};
            line-height: ${0 * GU}px;
            font-weight: bold;
            height: ${5 * GU}px;
            padding: ${3 * GU}px;
            background: transparent;
            border: 2px solid ${theme.contentBorder};
            color: ${theme.surfaceContent};
            border: '0';
            margin-top: ${GU * 4}px;
          }
        `}
      >
        Read More
      </ButtonBase>
    </section>
  )
}

interface NetworkSummaryCardProps {
  title: string
  subtitle: string
  imgSrc: string
}

function NetworkSummaryCard({
  imgSrc,
  subtitle,
  title,
}: NetworkSummaryCardProps) {
  const theme = useTheme()

  return (
    <Card
      css={`
        display: flex;
        justify-content: space-between;
        width: ${GU * 28}px;
        height: ${GU * 16}px;
        margin-right: ${GU * 2}px;
      `}
    >
      <div
        css={`
          display: flex;
          flex-direction: column;
          margin-left: ${GU * 3}px;
        `}
      >
        <h3
          css={`
            color: ${theme.disabledContent};
            ${textStyle('title4')};
          `}
        >
          {title}
        </h3>
        <p
          css={`
            ${textStyle('title2')};
            margin-top: auto;
          `}
        >
          {subtitle}
        </p>
      </div>
      <img
        src={imgSrc}
        alt="network summary nodes"
        css={`
          width: 86px;
          height: 90px;
        `}
      />
    </Card>
  )
}
