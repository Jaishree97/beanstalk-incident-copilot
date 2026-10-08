export interface Incident {
  incident_id: string
  created_at: string
  environment: string
  region: string
  alarm_name: string
  severity: string
  root_cause: string
  confidence: number
  summary: string
  evidence: string[]
  recommended_actions: string[]
  prevention: string[]
}
