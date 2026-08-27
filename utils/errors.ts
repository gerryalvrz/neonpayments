import type { Language } from '@/types'

export type FriendlyErrorContext = 'swap' | 'send'

function asMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export function isWalletRejection(error: unknown) {
  const message = asMessage(error).toLowerCase()
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('rejected the request') ||
    message.includes('denied transaction') ||
    message.includes('user cancelled') ||
    message.includes('user canceled')
  )
}

export function friendlyError(
  error: unknown,
  language: Language,
  context: FriendlyErrorContext = 'swap'
) {
  const message = asMessage(error)
  const lower = message.toLowerCase()
  const es = language === 'es'

  const fallback = es
    ? context === 'send'
      ? 'No pudimos realizar el envío. Revisa la confirmación en tu wallet e intenta de nuevo.'
      : 'No pudimos completar el intercambio. Revisa la confirmación en tu wallet e intenta de nuevo.'
    : context === 'send'
      ? 'We could not complete this send. Check the wallet prompt and try again.'
      : 'We could not complete this swap. Check the wallet prompt and try again.'

  if (isWalletRejection(error)) {
    return es ? 'Cancelaste la confirmación en tu wallet.' : 'You cancelled the confirmation in your wallet.'
  }

  if (lower.includes('missing database_url')) {
    return es
      ? 'Falta configurar la base de datos (DATABASE_URL).'
      : 'Database is not configured (DATABASE_URL).'
  }

  if (
    lower.includes('too many quote requests') ||
    lower.includes('rate limit') ||
    lower.includes('429')
  ) {
    return es
      ? 'Demasiadas cotizaciones. Espera unos segundos.'
      : 'Too many quotes. Wait a few seconds.'
  }

  if (lower.includes('insufficient')) {
    return es ? 'Saldo o permiso insuficiente.' : 'Not enough balance or token permission.'
  }

  if (lower.includes('expir') || lower.includes('demasiado justa') || lower.includes('too close')) {
    return es
      ? 'La cotización firme expiró (~30 s). Confirma de nuevo.'
      : 'Firm quote expired (~30s). Confirm again.'
  }

  if (lower.includes('no route found') || lower.includes('does not have a route')) {
    return es
      ? 'Mento aún no tiene una ruta para este par.'
      : 'Mento does not have a route for this pair yet.'
  }

  if (lower.includes('circuit breaker') || lower.includes('not_tradable') || lower.includes('en pausa')) {
    return es
      ? 'Mento tiene este par en pausa. Intenta de nuevo más tarde.'
      : 'Mento has this pair paused. Try again later.'
  }

  if (
    lower.includes('no_makers') ||
    lower.includes('no_quote') ||
    lower.includes('nobody quoted') ||
    lower.includes('no maker quoted') ||
    lower.includes('onboarding') ||
    lower.includes('ningún maker')
  ) {
    return es
      ? 'Ningún maker cotizó ahora. Confirma de nuevo.'
      : 'No maker quoted just now. Confirm again.'
  }

  if (lower.includes('reverted') || lower.includes('revert')) {
    return es ? 'La transacción falló en Celo.' : 'The transaction reverted on Celo.'
  }

  if (
    lower.includes('could not be found') ||
    lower.includes('not be processed on a block') ||
    lower.includes('still confirming')
  ) {
    return es
      ? 'La transacción se envió. Espera la confirmación y vuelve a intentar el intercambio.'
      : 'The transaction was sent. Wait for confirmation, then confirm the swap again.'
  }

  if (message.length > 180 || lower.includes('request arguments')) {
    return fallback
  }

  return message || fallback
}
