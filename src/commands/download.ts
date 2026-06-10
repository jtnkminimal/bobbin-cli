import { writeFile } from "node:fs/promises"
import { join } from "node:path"
import { getDefaultServer } from "../config.js"
import { output, info } from "../output.js"
import { extractId, fetchRecordingText } from "../remote.js"

export interface DownloadOptions {
  output?: string
  server?: string
  json?: boolean
}

export async function downloadCommand(idOrUrl: string, opts: DownloadOptions): Promise<void> {
  const jsonMode = opts.json || false
  const server = opts.server || getDefaultServer()

  const id = extractId(idOrUrl)

  info(`Downloading recording ${id}...`, jsonMode)

  const content = await fetchRecordingText(id, server)
  const outputFile = opts.output || join(process.cwd(), `${id}.cast`)
  await writeFile(outputFile, content, { mode: 0o600 })

  if (jsonMode) {
    output({ file: outputFile, id }, true)
  } else {
    console.log(`Saved to ${outputFile}`)
  }
}
