export function toPublicError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('rate limit') || msg.includes('429')) return 'Service temporarily unavailable. Please try again.'
    if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) return 'Authentication failed.'
    if (msg.includes('not found') || msg.includes('404')) return 'Resource not found.'
  }
  return 'An error occurred. Please try again.'
}
