import pkg from '../package.json'

type EnvVarKey =
  | 'AMPLITUDE_API_KEY'
  | 'BACKEND_URL'
  | 'BUILD'
  | 'GODMODE_ACCOUNTS'
  | 'PROD'
  | 'SENTRY_DSN'

const ENV_VARS = {
  AMPLITUDE_API_KEY(): string {
    return import.meta.env.VITE_APP_AMPLITUDE_API_KEY as string
  },
  BACKEND_URL(): string {
    return import.meta.env.VITE_APP_BACKEND_URL ?? ''
  },
  BUILD(): string {
    return pkg.gitHead ?? 'undefined'
  },
  GODMODE_ACCOUNTS(): string[] {
    return import.meta.env.VITE_APP_GODMODE_ACCOUNTS?.trim().split(',') ?? []
  },
  PROD(): boolean {
    return import.meta.env.MODE === 'production'
  },
  SENTRY_DSN(): string {
    return import.meta.env.VITE_APP_SENTRY_DSN?.trim() ?? ''
  },
}

export default function env(name: EnvVarKey): unknown {
  const envGetter = ENV_VARS[name]

  return envGetter() as ReturnType<typeof envGetter>
}
