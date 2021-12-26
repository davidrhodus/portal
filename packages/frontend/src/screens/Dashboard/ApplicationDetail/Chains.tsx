import { useCallback, useMemo, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import axios from 'axios'
import 'styled-components/macro'
import { UserLB } from '@pokt-foundation/portal-types'
import {
  Button,
  DataView,
  Split,
  Spacer,
  Switch,
  useToast,
  GU,
} from '@pokt-foundation/ui'
import * as Sentry from '@sentry/react'
import Box from '../../../components/Box/Box'
import FloatUp from '../../../components/FloatUp/FloatUp'
import { useUser } from '../../../contexts/UserContext'
import { Chain } from '../../../lib/chain-utils'
import { log } from '../../../lib/utils'
import env from '../../../environment'
import {
  KNOWN_MUTATION_SUFFIXES,
  KNOWN_QUERY_SUFFIXES,
} from '../../../known-query-suffixes'
import { sentryEnabled } from '../../../sentry'

interface SwitchChainsProps {
  appData: UserLB
}

export default function SwitchChains({ appData }: SwitchChainsProps) {
  const [selectedChain, setSelectedChain] = useState('')
  const history = useHistory()
  const { appId } = useParams<{ appId: string }>()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { userLoading } = useUser()
  const { isLoading: isChainsLoading, data: chains } = useQuery(
    KNOWN_QUERY_SUFFIXES.STAKEABLE_CHAINS,
    async function getNetworkChains() {
      const path = `${env('BACKEND_URL')}/api/network/stakeable-chains`

      try {
        const res = await axios.get(path, {
          withCredentials: true,
        })

        const {
          data: { chains },
        } = res

        return chains
      } catch (err) {
        if (sentryEnabled) {
          Sentry.configureScope((scope) => {
            scope.setTransactionName(
              `QUERY ${KNOWN_QUERY_SUFFIXES.STAKEABLE_CHAINS}`
            )
          })
          Sentry.captureException(err)
        }
        throw err
      }
    }
  )
  const { isLoading: isSwitchLoading, mutate } = useMutation(
    async function switchChains() {
      const path = `${env('BACKEND_URL')}/api/lb/switch/${appId}`

      try {
        const res = await axios.post(
          path,
          {
            chain: selectedChain,
          },
          {
            withCredentials: true,
          }
        )

        const {
          data: { id },
        } = res

        queryClient.invalidateQueries(KNOWN_QUERY_SUFFIXES.USER_APPS)

        toast('Chain successfully switched')
        history.push(`/app/${id}`)
      } catch (err) {
        if (sentryEnabled) {
          Sentry.configureScope((scope) => {
            scope.setTransactionName(
              `QUERY ${KNOWN_MUTATION_SUFFIXES.SWITCH_CHAINS_MUTATION}`
            )
          })
          Sentry.captureException(err)
        }
        log('SWITCH ERROR', Object.entries(err as Error))
        throw err
      }
    }
  )
  const onSwitchClick = useCallback(
    (id) => {
      setSelectedChain(id === selectedChain ? '' : id)
    },
    [selectedChain]
  )

  const { chain: activeAppChain } = appData

  const isSubmitDisabled = useMemo(
    () => isSwitchLoading || !selectedChain || userLoading,
    [isSwitchLoading, selectedChain, userLoading]
  )

  return (
    <FloatUp
      fallback={() => <p>Loading...</p>}
      loading={isChainsLoading}
      content={() => (
        <Split
          primary={
            <>
              <Box title="Available networks">
                <DataView
                  fields={['Selected', 'Network', 'Ticker', 'Chain ID']}
                  entries={chains}
                  renderEntry={({
                    description,
                    id,
                    ticker,
                    isAvailableForStaking,
                  }: Chain) => [
                    <Switch
                      disabled={!isAvailableForStaking || activeAppChain === id}
                      onChange={() => onSwitchClick(id)}
                      checked={selectedChain === id}
                    />,
                    description,
                    ticker,
                    id,
                  ]}
                />
              </Box>
            </>
          }
          secondary={
            <>
              <Button
                wide
                mode="primary"
                disabled={isSubmitDisabled}
                onClick={mutate}
              >
                Save changes
              </Button>
              <Spacer size={2 * GU} />
              <Button wide onClick={() => history.goBack()}>
                Go back
              </Button>
              <Spacer size={2 * GU} />
              <Box title="Free-tier info">
                <ul
                  css={`
                    list-style: none;
                    height: 100%;
                    li {
                      display: flex;
                      justify-content: space-between;
                    }
                    li:not(:last-child) {
                      margin-bottom: ${2 * GU}px;
                    }
                  `}
                >
                  <li>
                    Amount of POKT: <span>25,000</span>
                  </li>
                  <li>
                    Max relays per day: <span>1M</span>
                  </li>
                </ul>
              </Box>
            </>
          }
        />
      )}
    />
  )
}
