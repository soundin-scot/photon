import { z } from 'zod'

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  RELAY_SERVICE_URL: z.string().url().optional(),
  RELAY_SERVICE_SECRET: z.string().min(1).optional(),
})

export type Env = z.infer<typeof envSchema>

let validated: Env | null = null

export function getEnv(): Env {
  if (validated) return validated
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ')
    throw new Error(`Environment validation failed:\n  ${missing}`)
  }
  validated = result.data
  return validated
}
