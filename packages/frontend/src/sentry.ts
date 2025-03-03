import { init as initSentry, captureMessage } from '@sentry/react'
import { Integrations } from '@sentry/tracing'
import { Severity } from '@sentry/types'
import env from './environment'

export const sentryEnabled = Boolean(env('SENTRY_DSN'))

export default function initializeSentry(): void {
  if (sentryEnabled) {
    console.log('SENTRY ENABLED')

    initSentry({
      dsn: env('SENTRY_DSN') as string,
      environment: env('PROD') ? 'production' : 'development',
      integrations: [new Integrations.BrowserTracing()],
      release: 'pocket-portal@' + env('BUILD'),
      tracesSampleRate: 1.0,
    })
  }
}

export function logWithSentry(message: string, level = 'warning'): void {
  if (sentryEnabled) {
    captureMessage(message, level as Severity)
  }
}
