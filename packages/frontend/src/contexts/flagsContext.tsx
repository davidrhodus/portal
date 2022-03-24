import React, { useState } from 'react'
import flags from '../utils/flags.json'

const FlagContext = React.createContext({})

const FlagContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [hookState, setHookState] = useState({
    flags: flags,
  })

  const updateHookState = (key: string, value: string) => {
    setHookState((prevState) => ({
      ...prevState,
      [key]: value,
    }))
  }

  return (
    <FlagContext.Provider value={{ hookState, updateHookState }}>
      {children}
    </FlagContext.Provider>
  )
}

export { FlagContext, FlagContextProvider }
