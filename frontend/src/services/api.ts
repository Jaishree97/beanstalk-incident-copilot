import type { Incident } from '../types/incident'

export async function fetchIncidents(): Promise<Incident[]> {
  const response = await fetch('/api/incidents')

  if (!response.ok) {
    throw new Error('Failed to load incidents')
  }

  const data = await response.json()
  return data.incidents ?? []
}
