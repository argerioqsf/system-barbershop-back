/* eslint-disable no-console */
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.info(formatMessage('info', message, meta))
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(formatMessage('warn', message, meta))
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(formatMessage('error', message, meta))
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta))
    }
  },
}

function formatMessage(
  level: string,
  message: string,
  meta?: Record<string, unknown>,
) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${level.toUpperCase()}] ${message}${payload}`
}
