const NEXT_API_URL = process.env.NEXT_API_URL || 'http://localhost:3000'
const RELAY_SERVICE_SECRET = process.env.RELAY_SERVICE_SECRET || ''

export async function sendHeartbeat(instanceId: string): Promise<void> {
  try {
    await fetch(`${NEXT_API_URL}/api/instances/${instanceId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-relay-secret': RELAY_SERVICE_SECRET,
      },
    })
  } catch {
    // Heartbeat failure is non-fatal
  }
}
