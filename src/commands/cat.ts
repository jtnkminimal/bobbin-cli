import { parseCastFile, parseCastString } from "../cast/reader.js"
import { castToText } from "../cast/text.js"
import type { CastFile } from "../cast/types.js"
import { getDefaultServer } from "../config.js"
import { output, info } from "../output.js"
import { isRemote, extractId, fetchRecordingText } from "../remote.js"

export interface CatOptions {
  json?: boolean
  server?: string
}

export async function catCommand(fileOrId: string, opts: CatOptions): Promise<void> {
  const jsonMode = opts.json || false
  const server = opts.server || getDefaultServer()

  let cast: CastFile
  let source: string
  if (isRemote(fileOrId)) {
    const id = extractId(fileOrId)
    info(`Fetching recording ${id}...`, jsonMode)
    cast = parseCastString(await fetchRecordingText(id, server))
    source = id
  } else {
    cast = await parseCastFile(fileOrId)
    source = fileOrId
  }

  const text = castToText(cast)

  if (jsonMode) {
    const events = cast.events
    const duration = events.length > 0 ? events[events.length - 1][0] : 0
    output({
      source,
      title: cast.header.title,
      command: cast.header.bobbin?.command,
      duration: Math.round(duration * 10) / 10,
      exit_code: cast.header.bobbin?.exit_code,
      git_repo: cast.header.bobbin?.git_repo,
      git_branch: cast.header.bobbin?.git_branch,
      git_sha: cast.header.bobbin?.git_sha,
      text,
    }, true)
  } else {
    process.stdout.write(text.endsWith("\n") ? text : text + "\n")
  }
}
