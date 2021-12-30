import React, { useContext, useMemo } from 'react'
import { useQuery } from 'react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { KNOWN_QUERY_SUFFIXES } from '../known-query-suffixes'

type UserInfo = {
  userLoading: boolean
  email: string | undefined
  id: string | undefined
  token: string
}

const DEFAULT_USER_STATE = {
  userLoading: true,
  email: '',
  token: '',
  id: '',
}

const UserContext = React.createContext<UserInfo>(DEFAULT_USER_STATE)

export function useUser(): UserInfo {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUser cannot be used without declaring the provider')
  }

  return context
}

function useUserData() {
  const { getAccessTokenSilently, getAccessTokenWithPopup } = useAuth0()

  const { data, isLoading, isError } = useQuery(
    [KNOWN_QUERY_SUFFIXES.USER_CONTEXT],
    async function getUserContext() {
      let token = ''

      try {
        token = await getAccessTokenSilently()
      } catch (e) {
        token = await getAccessTokenWithPopup()
      } finally {
        return { email: '', id: '', token } as {
          email: string | undefined
          id: string | undefined
          token: string
        }
      }
    }
  )

  return {
    data,
    isLoading,
    isError,
  }
}

export function UserContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data, isLoading } = useUserData()

  const userData = useMemo(() => {
    if (isLoading) {
      return {
        email: '',
        id: '',
        token: '',
        userLoading: true,
      } as UserInfo
    }

    return {
      ...data,
      userLoading: false,
    } as UserInfo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data), isLoading])

  return (
    <UserContext.Provider value={userData}>{children}</UserContext.Provider>
  )
}
