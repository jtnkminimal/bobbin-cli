import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { getDefaultServer, validateServerUrl } from "../config.js"
import { output, info } from "../output.js"

export interface DownloadOptions {
  output?: string
  server?: string
  json?: boolean
}

const MAX_RECORDING_SIZE = 10 * 1024 * 1024 // 10 MB

export async function downloadCommand(idOrUrl: string, opts: DownloadOptions): Promise<void> {
  const jsonMode = opts.json || false
  const server = opts.server || getDefaultServer()
  validateServerUrl(server)

  // Extract ID from URL or use directly, then sanitize
  const rawId = idOrUrl.includes("/") ? idOrUrl.split("/").pop()! : idOrUrl
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "")
  if (!id) {
    console.error("Invalid recording ID")
    process.exit(1)
  }

  info(`Downloading recording ${id}...`, jsonMode)

  const response = await fetch(`${server}/api/r/${encodeURIComponent(id)}`)
  if (!response.ok) {
    console.error(`Download failed: ${response.status}`)
    process.exit(1)
  }

  const contentLength = response.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_RECORDING_SIZE) {
    console.error("Recording too large to download")
    process.exit(1)
  }
  const content = await response.text()
  if (content.length > MAX_RECORDING_SIZE) {
    console.error("Recording too large to download")
    process.exit(1)
  }
  const outputFile = opts.output || join(process.cwd(), `${id}.cast`)
  await writeFile(outputFile, content, { mode: 0o600 })

  if (jsonMode) {
    output({ file: outputFile, id }, true)
  } else {
    console.log(`Saved to ${outputFile}`)
  }
}
