import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback-secret-key-change-in-production'
const IV_LENGTH = 16

function getEncryptionKey() {
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32))
  if (key.length === 32) {
    return key
  }

  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text: string): string {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift() || '', 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}
