import { createWriteStream, type WriteStream } from "node:fs"
import type { CastHeader, CastEvent } from "./types.js"

// Patterns to redact from recorded output (best-effort — review recordings before sharing)
const REDACT_PATTERNS = [
  // Management keys in URLs: ?key=abc123...
  /([?&]key=)[A-Za-z0-9_-]{16,}/g,
  // JSON "key" fields: "key":"abc123..."
  /(["']key["']\s*:\s*["'])[A-Za-z0-9_-]{16,}/g,
  // JSON "manageUrl" / "manage" fields containing keys
  /(["'](?:manage|manageUrl)["']\s*:\s*["'][^"']*[?&]key=)[A-Za-z0-9_-]{16,}/g,
  // Common env var patterns: TOKEN=xxx, SECRET=xxx, KEY=xxx, PASSWORD=xxx, API_KEY=xxx
  /((?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL|AUTH|API_KEY|PRIVATE_KEY)=)[^\s'";]+/gi,
  // AWS access keys: AKIA followed by 16 alphanumeric chars
  /(AKIA)[A-Z0-9]{16}/g,
  // Bearer tokens
  /(Bearer\s+)[A-Za-z0-9._-]{20,}/g,
  // GitHub tokens: ghp_, gho_, ghs_, github_pat_
  /(gh[pos]_)[A-Za-z0-9_]{36,}/g,
  /(github_pat_)[A-Za-z0-9_]{22,}/g,
  // Basic auth in URLs: https://user:pass@host
  /(https?:\/\/[^:]+:)[^@]+(@)/g,
  // Private key blocks
  /(-----BEGIN\s+\w*\s*PRIVATE KEY-----).+?(-----END)/gs,
  // Connection strings with passwords: postgres://user:pass@, mongodb://user:pass@
  /((?:postgres|mysql|mongodb|redis|amqp)(?:ql)?:\/\/[^:]*:)[^@]+(@)/g,
]

function redactSensitive(data: string): string {
  let result = data
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, "$1[REDACTED]")
  }
  return result
}

export class CastWriter {
  private stream: WriteStream
  private startTime: number = 0

  constructor(filePath: string, header: CastHeader) {
    this.stream = createWriteStream(filePath, { mode: 0o600 })
    // Redact sensitive values from the command stored in the header
    if (header.bobbin?.command) {
      header = { ...header, bobbin: { ...header.bobbin, command: redactSensitive(header.bobbin.command) } }
    }
    this.stream.write(JSON.stringify(header) + "\n")
    this.startTime = Date.now()
  }

  writeEvent(data: string, type: string = "o"): void {
    const elapsed = (Date.now() - this.startTime) / 1000
    const event: CastEvent = [elapsed, type, redactSensitive(data)]
    this.stream.write(JSON.stringify(event) + "\n")
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.on("error", reject)
      this.stream.end(() => resolve())
    })
  }
}
