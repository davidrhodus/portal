import { useMutation } from 'react-query'
import axios from 'axios'
import { Button, Link, Spacer, textStyle, GU } from '@pokt-foundation/ui'
import * as Sentry from '@sentry/react'
import 'styled-components/macro'
import env from '../../environment'
import { sentryEnabled } from '../../sentry'

interface VerifyNoticeProps {
  email: string
  mode: 'verify' | 'reset'
}

export default function VerifyNotice({
  email,
  mode = 'verify',
}: VerifyNoticeProps) {
  const { isLoading, mutate } = useMutation(async function signup() {
    try {
      const path = `${env('BACKEND_URL')}/api/users/send-${
        mode === 'verify' ? 'verify' : 'reset'
      }-mail`

      await axios.post(path, {
        email,
      })
    } catch (err) {
      if (sentryEnabled) {
        Sentry.captureException(err)
      }

      throw err
    }
  })

  return (
    <>
      <h2
        css={`
          ${textStyle('title1')}
          align-self: flex-start;
        `}
      >
        {mode === 'verify' ? 'Verify Your Account' : 'Reset Your Password'}
      </h2>
      <Spacer size={4 * GU} />
      <Paragraph>
        We've sent a {mode === 'verify' ? 'verification' : 'password reset'}{' '}
        email to:
      </Paragraph>
      <Spacer size={3 * GU} />
      <Link href={`mailto:${email}`}>{email}</Link>
      <Spacer size={3 * GU} />
      <Paragraph>
        Go and check it before it expires! Confirm your account by clicking the
        verification link.
      </Paragraph>
      <Spacer size={3 * GU} />
      <Paragraph>
        If you can't find it, check your junk folder. Be sure to mark it as "Not
        Spam" to avoid any problems with notifications.
      </Paragraph>
      <Spacer size={3 * GU} />
      <Button
        mode="primary"
        css={`
          && {
            width: ${22 * GU}px;
          }
        `}
        disabled={isLoading}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          mutate()
        }}
      >
        Resend
      </Button>
    </>
  )
}

interface ParagraphProps {
  children: React.ReactNode
}

function Paragraph({ children }: ParagraphProps) {
  return (
    <p
      css={`
        ${textStyle('body2')}
      `}
    >
      {children}
    </p>
  )
}
