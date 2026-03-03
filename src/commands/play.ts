import { tmpdir } from "node:os"
import { join } from "node:path"
import { writeFile, unlink } from "node:fs/promises"
import { parseCastFile } from "../cast/reader.js"
import { getDefaultServer, validateServerUrl } from "../config.js"
import { info } from "../output.js"

export interface PlayOptions {
  speed?: string
  json?: boolean
  server?: string
}

function isRemote(input: string): boolean {
  // Full URL like https://bobbin.work/r/P2fumq1n
  if (/^https?:\/\//.test(input)) return true
  // Bare domain URL like bobbin.work/r/P2fumq1n
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(input)) return true
  // Bare key like P2fumq1n (alphanumeric, no path separators, no .cast extension)
  if (/^[a-zA-Z0-9_-]+$/.test(input) && !input.endsWith(".cast")) return true
  return false
}

function extractId(input: string): string {
  const raw = input.includes("/") ? input.split("/").pop()! : input
  const id = raw.replace(/[^a-zA-Z0-9_-]/g, "")
  if (!id) {
    console.error("Invalid recording ID")
    process.exit(1)
  }
  return id
}

const MAX_RECORDING_SIZE = 10 * 1024 * 1024 // 10 MB

async function fetchRecording(id: string, server: string): Promise<string> {
  validateServerUrl(server)
  const response = await fetch(`${server}/api/r/${encodeURIComponent(id)}`)
  if (!response.ok) {
    console.error(`Failed to fetch recording: ${response.status}`)
    process.exit(1)
  }
  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_RECORDING_SIZE) {
    console.error("Recording too large to play")
    process.exit(1)
  }
  const content = await response.text()
  if (content.length > MAX_RECORDING_SIZE) {
    console.error("Recording too large to play")
    process.exit(1)
  }
  const tmpFile = join(tmpdir(), `bobbin-play-${id}-${Date.now()}.cast`)
  await writeFile(tmpFile, content, { mode: 0o600 })
  return tmpFile
}

export async function playCommand(fileOrId: string, opts: PlayOptions): Promise<void> {
  const jsonMode = opts.json || false
  const speed = parseFloat(opts.speed || "1")
  const server = opts.server || getDefaultServer()

  let file: string
  let tmpFile: string | undefined
  if (isRemote(fileOrId)) {
    const id = extractId(fileOrId)
    info(`Fetching recording ${id}...`, jsonMode)
    tmpFile = await fetchRecording(id, server)
    file = tmpFile
  } else {
    file = fileOrId
  }

  try {
    const cast = await parseCastFile(file)

    info(`Playing ${file}`, jsonMode)
    info(`Terminal: ${cast.header.width}x${cast.header.height}`, jsonMode)
    if (cast.header.bobbin?.command) {
      info(`Command: ${cast.header.bobbin.command}`, jsonMode)
    }

    let prevTime = 0
    for (const event of cast.events) {
      const [time, type, data] = event
      if (type === "o") {
        const delay = ((time - prevTime) / speed) * 1000
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        process.stdout.write(data)
        prevTime = time
      }
    }

    console.log("")
  } finally {
    if (tmpFile) {
      await unlink(tmpFile).catch(() => {})
    }
  }
}
