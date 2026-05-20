function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }

  return undefined
}

export function getGoogleOAuthConfig() {
  return {
    clientId: firstEnv(
      'GOOGLE_CLIENT_ID',
      'AUTH_GOOGLE_ID',
      'AUTH_GOOGLE_CLIENT_ID',
      'GOOGLE_AUTH_CLIENT_ID'
    ),
    clientSecret: firstEnv(
      'GOOGLE_CLIENT_SECRET',
      'AUTH_GOOGLE_SECRET',
      'AUTH_GOOGLE_CLIENT_SECRET',
      'GOOGLE_AUTH_CLIENT_SECRET'
    ),
  }
}
