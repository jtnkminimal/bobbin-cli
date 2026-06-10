import { parseCastFile, parseCastString } from "../cast/reader.js"
import type { CastFile } from "../cast/types.js"
import { getDefaultServer } from "../config.js"
import { info } from "../output.js"
import { isRemote, extractId, fetchRecordingText } from "../remote.js"

export interface PlayOptions {
  speed?: string
  json?: boolean
  server?: string
}

export async function playCommand(fileOrId: string, opts: PlayOptions): Promise<void> {
  const jsonMode = opts.json || false
  const speed = parseFloat(opts.speed || "1")
  const server = opts.server || getDefaultServer()

  let cast: CastFile
  if (isRemote(fileOrId)) {
    const id = extractId(fileOrId)
    info(`Fetching recording ${id}...`, jsonMode)
    cast = parseCastString(await fetchRecordingText(id, server))
    info(`Playing ${id}`, jsonMode)
  } else {
    cast = await parseCastFile(fileOrId)
    info(`Playing ${fileOrId}`, jsonMode)
  }

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
}
