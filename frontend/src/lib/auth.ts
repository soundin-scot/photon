import bcrypt from 'bcryptjs'

// Re-export JWT functions for convenience in API routes
export { signToken, verifyToken, type TokenPayload } from './jwt'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
