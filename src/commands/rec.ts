import { join } from "node:path"
import { record } from "../recorder/index.js"
import { getRecordingsDir } from "../config.js"
import { output, info } from "../output.js"

export interface RecOptions {
  output?: string
  title?: string
  json?: boolean
}

export async function recCommand(commandArgs: string[], opts: RecOptions): Promise<void> {
  const jsonMode = opts.json || false
  const recordingsDir = await getRecordingsDir()
  const timestamp = Date.now()
  const outputFile = opts.output || join(recordingsDir, `bobbin-${timestamp}.cast`)

  const command = commandArgs.length > 0 ? commandArgs[0] : undefined
  const args = commandArgs.length > 1 ? commandArgs.slice(1) : undefined

  info(`Recording to ${outputFile}`, jsonMode)
  if (command) {
    info(`Command: ${command} ${(args || []).join(" ")}`, jsonMode)
  } else {
    info(`Interactive session. Type 'exit' to stop recording.`, jsonMode)
  }

  if (jsonMode) {
    output({ status: "recording", file: outputFile }, true)
  }

  const result = await record({
    outputFile,
    command,
    args,
    title: opts.title,
  })

  if (jsonMode) {
    output({
      status: "complete",
      file: result.file,
      duration: Math.round(result.duration * 10) / 10,
      exitCode: result.exitCode,
    }, true)
  } else {
    console.log("")
    console.log(`Recording saved to ${result.file}`)
    console.log(`Duration: ${Math.round(result.duration * 10) / 10}s`)
    if (result.exitCode !== 0) {
      console.log(`Exit code: ${result.exitCode}`)
    }
  }

  process.exit(result.exitCode)
}
