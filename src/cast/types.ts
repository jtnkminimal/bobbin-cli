export interface BobbinMeta {
  version: string
  command?: string
  git_repo?: string
  git_branch?: string
  git_sha?: string
  exit_code?: number
}

export interface CastHeader {
  version: 2
  width: number
  height: number
  timestamp?: number
  duration?: number
  env?: Record<string, string>
  title?: string
  bobbin?: BobbinMeta
}

// [time_seconds, event_type, data]
// event_type: "o" = stdout, "i" = stdin
export type CastEvent = [number, string, string]

export interface CastFile {
  header: CastHeader
  events: CastEvent[]
}
