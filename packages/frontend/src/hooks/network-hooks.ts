import axios from 'axios'
import { useQuery } from 'react-query'
import env from '../environment'
import { processChains, Chain } from '../lib/chain-utils'

export type SummaryData = {
  appsStaked: number
  nodesStaked: number
  poktStaked: number
}

export type DailyRelayBucket = {
  total_relays: number
  bucket: string
}

export type NetworkRelayStats = {
  successfulRelays: number
  totalRelays: number
}

export type LatestBlockData = {
  height: string
  txsCount: string
  producedTime: string
  producedIn: string
  processedDailyRelaysResponse: [{ total_relays: number; bucket: string }]
}

export function useNetworkSummary(): {
  isSummaryLoading: boolean
  isSummaryError: boolean
  summaryData: SummaryData
} {
  const {
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    data: summaryData,
  } = useQuery('/network/summary', async function getNetworkSummary() {
    const path = `${env('BACKEND_URL')}/api/network/summary`

    try {
      const { data } = await axios.get(path, {
        withCredentials: true,
      })

      return data
    } catch (err) {
      console.log('?', err)
    }
  })

  return {
    isSummaryError,
    isSummaryLoading,
    summaryData,
  }
}

export function useChains(): {
  isChainsError: boolean
  isChainsLoading: boolean
  chains: Chain[] | undefined
} {
  const {
    isLoading: isChainsLoading,
    isError: isChainsError,
    data: chains,
  } = useQuery('/network/chains', async function getNetworkChains() {
    const path = `${env('BACKEND_URL')}/api/network/${
      env('PROD') ? 'usable-' : ''
    }chains`

    try {
      const res = await axios.get(path, {
        withCredentials: true,
      })

      const { data } = res

      return processChains(data) as Chain[]
    } catch (err) {}
  })

  return {
    isChainsError,
    isChainsLoading,
    chains,
  }
}

export function useTotalWeeklyRelays(): {
  isRelaysError: boolean
  isRelaysLoading: boolean
  relayData: DailyRelayBucket[]
} {
  const {
    isLoading: isRelaysLoading,
    isError: isRelaysError,
    data: relayData,
  } = useQuery('network/weekly-relays', async function getWeeklyRelays() {
    try {
      const path = `${env('BACKEND_URL')}/api/network/daily-relays`
      const { data } = await axios.get(path, {
        withCredentials: true,
      })

      return data
    } catch (err) {}
  })

  return {
    isRelaysError,
    isRelaysLoading,
    relayData,
  }
}

export function useNetworkStats(): {
  isNetworkStatsLoading: boolean
  isNetworkStatsError: boolean
  networkStats: NetworkRelayStats | undefined
} {
  const {
    isLoading: isNetworkStatsLoading,
    isError: isNetworkStatsError,
    data: networkStats,
  } = useQuery(
    'network/weekly-aggregate-stats',
    async function getWeeklyRelays() {
      const path = `${env('BACKEND_URL')}/api/network/weekly-aggregate-stats`

      try {
        const {
          data: {
            successful_relays: successfulRelays,
            total_relays: totalRelays,
          },
        } = await axios.get(path, {
          withCredentials: true,
        })

        return { successfulRelays, totalRelays }
      } catch (err) {
        console.log(err, 'rip')
      }
    }
  )

  return {
    isNetworkStatsLoading,
    isNetworkStatsError,
    networkStats,
  }
}

export function useLatestBlock(): {
  isLatestBlockError: boolean
  isLatestBlockLoading: boolean
  latestBlockData: LatestBlockData
} {
  const {
    isLoading: isLatestBlockLoading,
    isError: isLatestBlockError,
    data: latestBlockData,
  } = useQuery('network/latest-block', async function getLatestBlock() {
    const path = `${env('BACKEND_URL')}/api/network/latest-block`

    try {
      const { data } = await axios.get(path, {
        withCredentials: true,
      })

      return data
    } catch (err) {
      return err
    }
  })

  return {
    isLatestBlockError,
    isLatestBlockLoading,
    latestBlockData,
  }
}
